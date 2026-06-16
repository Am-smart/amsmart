"use client";

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Clock } from 'lucide-react';
import { useTimer } from '@/context/TimerContext';

interface CountdownProps {
  targetDate: string | Date;
  onEnd?: () => void;
  className?: string;
  showIcon?: boolean;
  compact?: boolean;
  endLabel?: string | null;
}

const CountdownComponent: React.FC<CountdownProps> = ({
  targetDate,
  onEnd,
  className = "",
  showIcon = true,
  compact = false,
  endLabel = "Ended"
}) => {
  const { currentTime } = useTimer();
  const [mounted, setMounted] = useState(false);
  const hasEndedCalled = useRef(false);

  // Handle mounting to prevent hydration mismatch
  useEffect(() => {
    setMounted(true);
  }, []);

  // Memoize target timestamp and handle invalid dates
  const targetTimestamp = useMemo(() => {
    const date = new Date(targetDate);
    const ts = date.getTime();
    if (isNaN(ts)) {
      console.warn(`Countdown: Invalid targetDate provided: ${targetDate}`);
      return null;
    }
    return ts;
  }, [targetDate]);

  // Calculate time left based on shared currentTime
  const timeLeft = useMemo(() => {
    if (!targetTimestamp) return null;

    const difference = targetTimestamp - currentTime;

    if (difference <= 0) {
      return { days: 0, hours: 0, minutes: 0, seconds: 0, total: 0 };
    }

    return {
      days: Math.floor(difference / (1000 * 60 * 60 * 24)),
      hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
      minutes: Math.floor((difference / 1000 / 60) % 60),
      seconds: Math.floor((difference / 1000) % 60),
      total: difference,
      isSoon: difference > 0 && difference < 60 * 60 * 1000
    };
  }, [targetTimestamp, currentTime]);

  // Trigger onEnd only once for a given target timestamp
  useEffect(() => {
    hasEndedCalled.current = false;
  }, [targetTimestamp]);

  useEffect(() => {
    if (mounted && timeLeft && timeLeft.total <= 0 && !hasEndedCalled.current) {
      hasEndedCalled.current = true;
      onEnd?.();
    }
  }, [timeLeft?.total, onEnd, mounted]);

  // Don't render until mounted to avoid hydration mismatch
  if (!mounted || !timeLeft) return null;

  const isSoon = timeLeft.isSoon;
  const isPast = timeLeft.total <= 0;

  if (isPast) {
    if (endLabel === null) return null;
    return (
      <span className={`inline-flex items-center gap-1 text-slate-400 font-bold uppercase text-[10px] ${className}`}>
        {showIcon && <Clock size={12} />}
        {endLabel}
      </span>
    );
  }

  return (
    <div className={`inline-flex items-center gap-2 ${isSoon ? 'text-red-600 animate-pulse' : 'text-slate-600'} ${className}`}>
      {showIcon && <Clock size={compact ? 14 : 18} />}
      <div className="flex gap-1 font-mono font-bold text-sm md:text-base">
        {timeLeft.days > 0 && (
          <div className="flex flex-col items-center">
            <span>{timeLeft.days}d</span>
            {!compact && <span className="text-[8px] uppercase tracking-tighter -mt-1 opacity-60">Days</span>}
          </div>
        )}
        {(timeLeft.days > 0 || timeLeft.hours > 0) && (
          <div className="flex flex-col items-center">
            <span>{timeLeft.hours.toString().padStart(2, '0')}h</span>
            {!compact && <span className="text-[8px] uppercase tracking-tighter -mt-1 opacity-60">Hrs</span>}
          </div>
        )}
        <div className="flex flex-col items-center">
          <span>{timeLeft.minutes.toString().padStart(2, '0')}m</span>
          {!compact && <span className="text-[8px] uppercase tracking-tighter -mt-1 opacity-60">Min</span>}
        </div>
        <div className="flex flex-col items-center">
          <span>{timeLeft.seconds.toString().padStart(2, '0')}s</span>
          {!compact && <span className="text-[8px] uppercase tracking-tighter -mt-1 opacity-60">Sec</span>}
        </div>
      </div>
    </div>
  );
};

export const Countdown = React.memo(CountdownComponent);
