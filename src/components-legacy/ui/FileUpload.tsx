"use client";

import React, { useState, useCallback } from 'react';
import { Upload, X, FileText, CheckCircle, AlertCircle } from 'lucide-react';

interface FileUploadProps {
  onUploadComplete: (url: string, fileName: string) => void;
  onUploadError?: (error: Error) => void;
  category: 'materials' | 'submissions' | 'thumbnails';
  acceptedTypes?: string[];
  maxSizeMB?: number;
  label?: string;
  className?: string;
  uploadFn: (file: File, category: 'materials' | 'submissions' | 'thumbnails') => Promise<{ url: string }>;
}

export const FileUpload: React.FC<FileUploadProps> = ({
  onUploadComplete,
  onUploadError,
  category,
  acceptedTypes = [],
  maxSizeMB = 10,
  label = "Click or drag file to upload",
  className = "",
  uploadFn
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [uploadedFile, setUploadedFile] = useState<{ name: string; url: string } | null>(null);
  const [error, setError] = useState<string | null>(null);

  const validateFile = useCallback((file: File): string | null => {
    if (acceptedTypes.length > 0) {
      const fileType = file.type;
      const fileExt = `.${file.name.split('.').pop()?.toLowerCase()}`;
      const isAccepted = acceptedTypes.some(type => {
        if (type.startsWith('.')) return type.toLowerCase() === fileExt;
        if (type.includes('/*')) return fileType.startsWith(type.replace('/*', ''));
        return type === fileType;
      });
      if (!isAccepted) return `File type not supported. Accepted: ${acceptedTypes.join(', ')}`;
    }

    if (file.size > maxSizeMB * 1024 * 1024) {
      return `File size exceeds ${maxSizeMB}MB limit.`;
    }

    return null;
  }, [acceptedTypes, maxSizeMB]);

  const handleUpload = useCallback(async (file: File) => {
    const validationError = validateFile(file);
    if (validationError) {
      setError(validationError);
      return;
    }

    setError(null);
    setIsUploading(true);
    setProgress(10); // Initial progress

    let progressInterval: NodeJS.Timeout | null = null;
    try {
      // Simulate progress if the actual uploadFn doesn't support it
      progressInterval = setInterval(() => {
        setProgress(prev => (prev < 90 ? prev + 5 : prev));
      }, 200);

      const result = await uploadFn(file, category);

      if (progressInterval) clearInterval(progressInterval);
      setProgress(100);

      setUploadedFile({ name: file.name, url: result.url });
      onUploadComplete(result.url, file.name);
    } catch (err) {
      if (progressInterval) clearInterval(progressInterval);
      const errorMsg = err instanceof Error ? err.message : 'Upload failed';
      setError(errorMsg);
      onUploadError?.(err instanceof Error ? err : new Error(errorMsg));
    } finally {
      setIsUploading(false);
    }
  }, [category, onUploadComplete, onUploadError, uploadFn, validateFile]);

  const onDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const onDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handleUpload(file);
  }, [handleUpload]);

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleUpload(file);
  };

  const clearUpload = () => {
    setUploadedFile(null);
    setProgress(0);
    setError(null);
  };

  return (
    <div className={`w-full ${className}`}>
      {!uploadedFile ? (
        <label
          className={`
            relative flex flex-col items-center justify-center w-full min-h-[160px]
            border-2 border-dashed rounded-2xl transition-all cursor-pointer
            ${isDragging ? 'border-blue-500 bg-blue-50' : 'border-slate-200 bg-slate-50 hover:bg-slate-100'}
            ${isUploading ? 'pointer-events-none opacity-70' : ''}
            ${error ? 'border-red-300 bg-red-50' : ''}
          `}
          onDragOver={onDragOver}
          onDragLeave={onDragLeave}
          onDrop={onDrop}
        >
          <input
            type="file"
            className="hidden"
            onChange={onFileChange}
            disabled={isUploading}
            accept={acceptedTypes.join(',')}
          />

          <div className="flex flex-col items-center justify-center p-6 text-center">
            {isUploading ? (
              <div className="w-full max-w-[200px] space-y-4">
                <div className="relative w-12 h-12 mx-auto">
                   <div className="absolute inset-0 border-4 border-blue-100 rounded-full"></div>
                   <div
                    className="absolute inset-0 border-4 border-blue-600 rounded-full border-t-transparent animate-spin"
                   ></div>
                </div>
                <div>
                  <p className="text-sm font-bold text-slate-700">Uploading...</p>
                  <div className="w-full bg-slate-200 h-1.5 rounded-full mt-2 overflow-hidden" role="progressbar" aria-valuenow={progress} aria-valuemin={0} aria-valuemax={100} aria-label="Upload progress">
                    <div
                      className="bg-blue-600 h-full transition-all duration-300"
                      style={{ width: `${progress}%` }}
                    ></div>
                  </div>
                  <p className="text-xs text-slate-500 mt-2">{progress}% uploaded</p>
                </div>
              </div>
            ) : (
              <>
                <div className={`p-3 rounded-full mb-3 ${error ? 'bg-red-100 text-red-600' : 'bg-blue-100 text-blue-600'}`}>
                  {error ? <AlertCircle size={24} /> : <Upload size={24} />}
                </div>
                <p className="text-sm font-bold text-slate-900">{error || label}</p>
                <p className="text-xs text-slate-500 mt-1">
                  Max {maxSizeMB}MB {acceptedTypes.length > 0 && `(${acceptedTypes.join(', ')})`}
                </p>
              </>
            )}
          </div>
        </label>
      ) : (
        <div className="flex items-center justify-between p-4 bg-white border border-slate-200 rounded-2xl shadow-sm">
          <div className="flex items-center gap-3 min-w-0">
            <div className="p-2 bg-green-100 text-green-600 rounded-lg shrink-0">
              <CheckCircle size={20} />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-bold text-slate-900 truncate">{uploadedFile.name}</p>
              <p className="text-[10px] text-slate-500 font-medium uppercase">Upload Complete</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <a
              href={uploadedFile.url}
              target="_blank"
              rel="noopener noreferrer"
              className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
            >
              <FileText size={18} />
            </a>
            <button
              onClick={clearUpload}
              className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
            >
              <X size={18} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
