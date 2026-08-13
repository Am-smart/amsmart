/**
 * ProctorEngine — media-based proctoring, ported from the legacy
 * `js/proctor-engine.js` to TypeScript.
 *
 * Capabilities: webcam stills, screen recording chunks, ambient audio
 * chunks, face-presence and noise heuristics, fullscreen enforcement,
 * connection monitoring, pause/resume, and graceful teardown with a final
 * evidence flush.
 *
 * Boundaries:
 * - Browser-only. Guarded so an SSR import is inert until `start()`.
 * - Zero direct provider access: events go through `ViolationBuffer`
 *   (API -> service -> data seam) and media through `EvidenceQueue`
 *   (versioned upload endpoint).
 * - Fails soft: any unsupported or denied capability degrades to an
 *   informational event instead of breaking the assessment.
 */

import { EvidenceQueue } from './evidence-queue';
import { ViolationBuffer } from './violation-buffer';
import { PROCTOR_DEFAULTS, type ProctorConfig, type ProctorEvent, type ProctorFeature, type ProctorStats } from './types';

type Status = ProctorStats['status'];

export class ProctorEngine {
  private readonly config: Required<Pick<ProctorConfig, 'sessionId'>> & ProctorConfig;
  private readonly buffer: ViolationBuffer;
  private readonly evidence: EvidenceQueue;

  private status: Status = 'idle';
  private startedAt: string | null = null;
  private snapshots = 0;
  private chunks = 0;

  private webcamStream: MediaStream | null = null;
  private screenStream: MediaStream | null = null;
  private audioStream: MediaStream | null = null;
  private video: HTMLVideoElement | null = null;
  private screenRecorder: MediaRecorder | null = null;
  private audioRecorder: MediaRecorder | null = null;

  private audioContext: AudioContext | null = null;
  private analyser: AnalyserNode | null = null;
  private analyserData: Uint8Array | null = null;

  private snapshotTimer: ReturnType<typeof setInterval> | null = null;
  private analysisTimer: ReturnType<typeof setInterval> | null = null;
  private lastFrame: Uint8ClampedArray | null = null;
  private faceMissingStreak = 0;
  private listeners: Array<() => void> = [];

  constructor(config: ProctorConfig) {
    this.config = { ...config };
    this.buffer = new ViolationBuffer(this.config);
    this.evidence = new EvidenceQueue({
      category: `proctoring-evidence/${config.sessionId}`,
      onUploaded: (path, url) => {
        this.report({
          kind: path.includes('snapshot') ? 'snapshot_captured' : 'chunk_recorded',
          severity: 'INFO',
          payload: { path },
          evidenceUrl: url,
        });
      },
      onDropped: (item, reason) =>
        this.report({ kind: 'evidence_dropped', severity: 'LOW', message: reason, payload: { path: item.path } }),
    });
  }

  // ---------------------------------------------------------------- lifecycle

  async start(webcamElement?: HTMLVideoElement | null): Promise<ProctorStats> {
    if (typeof window === 'undefined' || this.status === 'running') return this.getStats();
    this.status = 'starting';
    this.startedAt = new Date().toISOString();
    this.buffer.start();

    this.report({
      kind: 'session_start',
      severity: 'INFO',
      payload: { device: this.deviceInfo(), features: this.supportedFeatures() },
    });

    if (this.config.webcam) await this.startWebcam(webcamElement ?? null);
    if (this.config.screen) await this.startScreenRecording();
    if (this.config.audio || this.config.noiseDetection) await this.startAudio();
    if (this.config.fullscreen) this.enforceFullscreen();

    if (this.config.webcam) this.startSnapshots();
    if (this.config.faceDetection || this.config.noiseDetection) this.startAnalysis();
    this.monitorConnection();

    this.status = 'running';
    return this.getStats();
  }

  pause(): void {
    if (this.status !== 'running') return;
    this.status = 'paused';
    this.stopTimers();
    try { this.screenRecorder?.pause(); } catch { /* unsupported */ }
    try { this.audioRecorder?.pause(); } catch { /* unsupported */ }
    this.report({ kind: 'proctor_paused', severity: 'INFO' });
  }

  resume(): void {
    if (this.status !== 'paused') return;
    this.status = 'running';
    try { this.screenRecorder?.resume(); } catch { /* unsupported */ }
    try { this.audioRecorder?.resume(); } catch { /* unsupported */ }
    if (this.config.webcam) this.startSnapshots();
    if (this.config.faceDetection || this.config.noiseDetection) this.startAnalysis();
    this.report({ kind: 'proctor_resumed', severity: 'INFO' });
  }

  async stop(): Promise<ProctorStats> {
    if (this.status === 'idle' || this.status === 'stopped') return this.getStats();
    this.status = 'stopped';
    this.stopTimers();
    this.stopRecorders();
    this.stopStreams();
    this.listeners.forEach((off) => off());
    this.listeners = [];

    this.report({
      kind: 'session_end',
      severity: 'INFO',
      payload: { snapshots: this.snapshots, chunks: this.chunks },
    });

    await this.evidence.flush();
    await this.buffer.dispose();
    const stats = this.getStats();
    this.evidence.dispose();
    if (this.audioContext) { void this.audioContext.close().catch(() => undefined); this.audioContext = null; }
    return stats;
  }

  // ------------------------------------------------------------------- public

  /** Records an externally detected violation (e.g. from `useAntiCheat`). */
  report(event: ProctorEvent): void {
    this.buffer.push(event);
  }

  async captureSnapshot(): Promise<void> {
    await this.captureAndQueueSnapshot('manual');
  }

  getStats(): ProctorStats {
    return {
      status: this.status,
      startedAt: this.startedAt,
      events: this.buffer.total,
      pendingEvents: this.buffer.pending,
      snapshots: this.snapshots,
      chunks: this.chunks,
      pendingUploads: this.evidence.size,
      failedUploads: this.evidence.failures,
      features: this.supportedFeatures(),
    };
  }

  static isSupported(feature: ProctorFeature): boolean {
    if (typeof window === 'undefined') return false;
    const md = navigator.mediaDevices as MediaDevices | undefined;
    switch (feature) {
      case 'webcam':
      case 'face':
        return Boolean(md?.getUserMedia);
      case 'audio':
      case 'noise':
        return Boolean(md?.getUserMedia) && typeof window.AudioContext !== 'undefined';
      case 'screen':
        return Boolean(md && 'getDisplayMedia' in md) && typeof window.MediaRecorder !== 'undefined';
      case 'fullscreen':
        return typeof document.documentElement.requestFullscreen === 'function';
      default:
        return false;
    }
  }

  supportedFeatures(): ProctorFeature[] {
    const wanted: Array<[ProctorFeature, boolean | undefined]> = [
      ['webcam', this.config.webcam],
      ['screen', this.config.screen],
      ['audio', this.config.audio],
      ['face', this.config.faceDetection],
      ['noise', this.config.noiseDetection],
      ['fullscreen', this.config.fullscreen],
    ];
    return wanted.filter(([f, on]) => on && ProctorEngine.isSupported(f)).map(([f]) => f);
  }

  // ------------------------------------------------------------------ capture

  private async startWebcam(element: HTMLVideoElement | null): Promise<void> {
    if (!ProctorEngine.isSupported('webcam')) {
      this.report({ kind: 'capability_missing', severity: 'LOW', message: 'webcam' });
      return;
    }
    try {
      this.webcamStream = await navigator.mediaDevices.getUserMedia({
        video: { width: { ideal: 640 }, height: { ideal: 480 }, facingMode: 'user' },
        audio: false,
      });
      const video = element ?? document.createElement('video');
      video.muted = true;
      video.playsInline = true;
      video.srcObject = this.webcamStream;
      if (!element) {
        video.style.position = 'fixed';
        video.style.width = '1px';
        video.style.height = '1px';
        video.style.opacity = '0';
        video.style.pointerEvents = 'none';
        document.body.appendChild(video);
      }
      await video.play().catch(() => undefined);
      this.video = video;
    } catch (error) {
      this.report({ kind: 'permission_denied', severity: 'HIGH', message: 'webcam', payload: { error: String(error) } });
    }
  }

  private async startScreenRecording(): Promise<void> {
    if (!ProctorEngine.isSupported('screen')) {
      this.report({ kind: 'capability_missing', severity: 'LOW', message: 'screen' });
      return;
    }
    try {
      this.screenStream = await (navigator.mediaDevices as MediaDevices & {
        getDisplayMedia: (c: MediaStreamConstraints) => Promise<MediaStream>;
      }).getDisplayMedia({ video: true, audio: false });

      const track = this.screenStream.getVideoTracks()[0];
      track?.addEventListener('ended', () => {
        this.report({ kind: 'screen_share_stopped', severity: 'HIGH' });
      });

      this.screenRecorder = new MediaRecorder(this.screenStream, { mimeType: pickMime(['video/webm;codecs=vp9', 'video/webm']) });
      this.screenRecorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) {
          this.chunks += 1;
          this.evidence.add(`screen_${Date.now()}.webm`, e.data, e.data.type || 'video/webm');
        }
      };
      this.screenRecorder.start(this.config.chunkInterval ?? PROCTOR_DEFAULTS.chunkInterval);
    } catch (error) {
      this.report({ kind: 'permission_denied', severity: 'HIGH', message: 'screen', payload: { error: String(error) } });
    }
  }

  private async startAudio(): Promise<void> {
    if (!ProctorEngine.isSupported('audio')) {
      this.report({ kind: 'capability_missing', severity: 'LOW', message: 'audio' });
      return;
    }
    try {
      this.audioStream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });

      if (this.config.audio && typeof window.MediaRecorder !== 'undefined') {
        this.audioRecorder = new MediaRecorder(this.audioStream, { mimeType: pickMime(['audio/webm;codecs=opus', 'audio/webm']) });
        this.audioRecorder.ondataavailable = (e) => {
          if (e.data && e.data.size > 0) {
            this.chunks += 1;
            this.evidence.add(`audio_${Date.now()}.webm`, e.data, e.data.type || 'audio/webm');
          }
        };
        this.audioRecorder.start(this.config.chunkInterval ?? PROCTOR_DEFAULTS.chunkInterval);
      }

      if (this.config.noiseDetection) {
        this.audioContext = new AudioContext();
        const source = this.audioContext.createMediaStreamSource(this.audioStream);
        this.analyser = this.audioContext.createAnalyser();
        this.analyser.fftSize = 512;
        source.connect(this.analyser);
        this.analyserData = new Uint8Array(this.analyser.frequencyBinCount);
      }
    } catch (error) {
      this.report({ kind: 'permission_denied', severity: 'MEDIUM', message: 'audio', payload: { error: String(error) } });
    }
  }

  // ----------------------------------------------------------------- analysis

  private startSnapshots(): void {
    if (this.snapshotTimer || !this.video) return;
    const interval = this.config.snapshotInterval ?? PROCTOR_DEFAULTS.snapshotInterval;
    this.snapshotTimer = setInterval(() => void this.captureAndQueueSnapshot('interval'), interval);
  }

  private startAnalysis(): void {
    if (this.analysisTimer) return;
    const interval = this.config.analysisInterval ?? PROCTOR_DEFAULTS.analysisInterval;
    this.analysisTimer = setInterval(() => {
      if (this.config.faceDetection) this.tickFacePresence();
      if (this.config.noiseDetection) this.tickNoise();
    }, interval);
  }

  private async captureAndQueueSnapshot(trigger: string): Promise<void> {
    const canvas = this.drawFrame();
    if (!canvas) return;
    const quality = this.config.snapshotQuality ?? PROCTOR_DEFAULTS.snapshotQuality;
    const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/jpeg', quality));
    if (!blob) return;
    this.snapshots += 1;
    this.evidence.add(`snapshot_${trigger}_${Date.now()}.jpg`, blob, 'image/jpeg');
  }

  /**
   * Face-presence heuristic (the legacy canvas fallback): compares frame
   * luminance and inter-frame motion in the central region. No model
   * download, so it stays edge/offline safe; a real detector can replace
   * this method without touching any caller.
   */
  private tickFacePresence(): void {
    const canvas = this.drawFrame(160);
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const { data } = ctx.getImageData(0, 0, canvas.width, canvas.height);

    let luma = 0;
    for (let i = 0; i < data.length; i += 4) {
      luma += 0.299 * data[i]! + 0.587 * data[i + 1]! + 0.114 * data[i + 2]!;
    }
    luma /= data.length / 4;

    let motion = 0;
    if (this.lastFrame && this.lastFrame.length === data.length) {
      let diff = 0;
      for (let i = 0; i < data.length; i += 16) diff += Math.abs(data[i]! - this.lastFrame[i]!);
      motion = diff / (data.length / 16);
    }
    this.lastFrame = data;

    const present = luma > 18 && luma < 245;
    if (!present) {
      this.faceMissingStreak += 1;
      if (this.faceMissingStreak === 3) {
        this.report({ kind: 'face_missing', payload: { luma: Math.round(luma), motion: Math.round(motion) } });
      }
    } else {
      this.faceMissingStreak = 0;
    }
  }

  private tickNoise(): void {
    if (!this.analyser || !this.analyserData) return;
    this.analyser.getByteTimeDomainData(this.analyserData as Uint8Array<ArrayBuffer>);
    let sum = 0;
    for (let i = 0; i < this.analyserData.length; i += 1) {
      const v = (this.analyserData[i]! - 128) / 128;
      sum += v * v;
    }
    const rms = Math.sqrt(sum / this.analyserData.length);
    const threshold = this.config.noiseThreshold ?? PROCTOR_DEFAULTS.noiseThreshold;
    if (rms > threshold) {
      this.report({ kind: 'noise_detected', severity: 'LOW', payload: { rms: Number(rms.toFixed(3)) } });
    }
  }

  private drawFrame(maxEdge?: number): HTMLCanvasElement | null {
    const video = this.video;
    if (!video || !video.videoWidth) return null;
    const limit = maxEdge ?? this.config.snapshotMaxEdge ?? PROCTOR_DEFAULTS.snapshotMaxEdge;
    const scale = Math.min(1, limit / Math.max(video.videoWidth, video.videoHeight));
    const canvas = document.createElement('canvas');
    canvas.width = Math.max(1, Math.round(video.videoWidth * scale));
    canvas.height = Math.max(1, Math.round(video.videoHeight * scale));
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) return null;
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    return canvas;
  }

  // ------------------------------------------------------------- environment

  private enforceFullscreen(): void {
    if (!ProctorEngine.isSupported('fullscreen')) return;
    void document.documentElement.requestFullscreen?.().catch(() => undefined);
    const onChange = () => {
      if (!document.fullscreenElement) {
        this.report({ kind: 'fullscreen_exit' });
      }
    };
    document.addEventListener('fullscreenchange', onChange);
    this.listeners.push(() => document.removeEventListener('fullscreenchange', onChange));
  }

  private monitorConnection(): void {
    const onOffline = () => this.report({ kind: 'network_offline' });
    const onOnline = () => {
      this.report({ kind: 'network_online', severity: 'INFO' });
      void this.evidence.drain();
      void this.buffer.flush();
    };
    const onHide = () => {
      if (document.visibilityState === 'hidden') void this.buffer.flush();
    };
    window.addEventListener('offline', onOffline);
    window.addEventListener('online', onOnline);
    document.addEventListener('visibilitychange', onHide);
    this.listeners.push(() => {
      window.removeEventListener('offline', onOffline);
      window.removeEventListener('online', onOnline);
      document.removeEventListener('visibilitychange', onHide);
    });
  }

  // ------------------------------------------------------------------ cleanup

  private stopTimers(): void {
    if (this.snapshotTimer) clearInterval(this.snapshotTimer);
    if (this.analysisTimer) clearInterval(this.analysisTimer);
    this.snapshotTimer = null;
    this.analysisTimer = null;
  }

  private stopRecorders(): void {
    for (const recorder of [this.screenRecorder, this.audioRecorder]) {
      try { if (recorder && recorder.state !== 'inactive') recorder.stop(); } catch { /* already stopped */ }
    }
    this.screenRecorder = null;
    this.audioRecorder = null;
  }

  private stopStreams(): void {
    for (const stream of [this.webcamStream, this.screenStream, this.audioStream]) {
      stream?.getTracks().forEach((t) => t.stop());
    }
    this.webcamStream = null;
    this.screenStream = null;
    this.audioStream = null;
    if (this.video && this.video.parentElement === document.body) this.video.remove();
    this.video = null;
    this.lastFrame = null;
  }

  private deviceInfo(): Record<string, unknown> {
    if (typeof window === 'undefined') return {};
    return {
      userAgent: navigator.userAgent,
      language: navigator.language,
      screen: `${window.screen.width}x${window.screen.height}`,
      displays: (window.screen as Screen & { isExtended?: boolean }).isExtended ? 'multiple' : 'single',
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    };
  }
}

function pickMime(candidates: string[]): string {
  const supported = typeof MediaRecorder !== 'undefined' && MediaRecorder.isTypeSupported;
  if (!supported) return candidates[candidates.length - 1]!;
  return candidates.find((c) => MediaRecorder.isTypeSupported(c)) ?? candidates[candidates.length - 1]!;
}
