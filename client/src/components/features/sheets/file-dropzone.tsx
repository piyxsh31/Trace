'use client';

import React, { useRef, useState, useCallback } from 'react';
import { validateFile } from '@/lib/file-parser';

interface FileDropzoneProps {
  onFileSelect: (file: File) => void;
  error?: string | null;
  isLoading?: boolean;
}

export const FileDropzone: React.FC<FileDropzoneProps> = ({
  onFileSelect,
  error,
  isLoading = false,
}) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);

  const displayError = error ?? localError;

  const handleFile = useCallback(
    (file: File) => {
      setLocalError(null);
      try {
        validateFile(file);
        onFileSelect(file);
      } catch (err) {
        setLocalError(err instanceof Error ? err.message : 'Invalid file.');
      }
    },
    [onFileSelect]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      setIsDragOver(false);
      const file = e.dataTransfer.files[0];
      if (file) handleFile(file);
    },
    [handleFile]
  );

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) handleFile(file);
      // Reset so same file can be re-selected after an error
      e.target.value = '';
    },
    [handleFile]
  );

  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      inputRef.current?.click();
    }
  }, []);

  return (
    <div className="w-full">
      {/* Hidden file input */}
      <input
        ref={inputRef}
        type="file"
        accept=".csv,.json"
        className="sr-only"
        onChange={handleInputChange}
        aria-hidden="true"
        tabIndex={-1}
      />

      {/* Dropzone */}
      <div
        role="button"
        tabIndex={0}
        aria-label="Upload a CSV or JSON file. Click or drag and drop."
        onClick={() => !isLoading && inputRef.current?.click()}
        onKeyDown={handleKeyDown}
        onDragOver={(e) => { e.preventDefault(); if (!isLoading) setIsDragOver(true); }}
        onDragEnter={(e) => { e.preventDefault(); if (!isLoading) setIsDragOver(true); }}
        onDragLeave={() => setIsDragOver(false)}
        onDrop={handleDrop}
        className={[
          'relative flex flex-col items-center justify-center gap-3',
          'w-full min-h-[220px] rounded-xl border-2 border-dashed',
          'transition-all duration-200 cursor-pointer select-none',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-950',
          isLoading
            ? 'border-zinc-700 bg-zinc-900/30 cursor-not-allowed opacity-60'
            : displayError
            ? 'border-red-500/40 bg-red-500/5 hover:border-red-500/60'
            : isDragOver
            ? 'border-indigo-500/60 bg-indigo-500/8 scale-[1.01]'
            : 'border-zinc-700 bg-zinc-900/40 hover:border-zinc-600 hover:bg-zinc-900/60',
        ].join(' ')}
      >
        {/* Loading overlay */}
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center rounded-xl bg-zinc-950/40">
            <div
              className="w-6 h-6 rounded-full border-2 border-indigo-500/30 border-t-indigo-500"
              style={{ animation: 'spin 1s linear infinite' }}
            />
          </div>
        )}

        {/* Upload icon */}
        <div
          className={[
            'w-14 h-14 rounded-2xl flex items-center justify-center transition-colors duration-200',
            isDragOver ? 'bg-indigo-500/20' : 'bg-zinc-800/80',
          ].join(' ')}
        >
          <svg
            width="26"
            height="26"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            className={isDragOver ? 'text-indigo-400' : 'text-zinc-400'}
            aria-hidden="true"
          >
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
            <polyline points="17 8 12 3 7 8" />
            <line x1="12" y1="3" x2="12" y2="15" />
          </svg>
        </div>

        {/* Text */}
        <div className="text-center px-4">
          <p className={['text-sm font-medium', isDragOver ? 'text-indigo-300' : 'text-zinc-300'].join(' ')}>
            {isDragOver ? 'Drop it here' : 'Drag & drop or click to upload'}
          </p>
          <p className="text-xs text-zinc-500 mt-1">CSV or JSON · up to 1 MB</p>
        </div>
      </div>

      {/* Error message */}
      {displayError && (
        <p role="alert" className="mt-2.5 text-xs text-red-400 flex items-center gap-1.5">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z" />
          </svg>
          {displayError}
        </p>
      )}
    </div>
  );
};
