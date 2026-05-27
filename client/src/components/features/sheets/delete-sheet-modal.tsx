'use client';

import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Button } from '@/components/ui/button';
import type { Sheet } from '@/types/sheet';

interface DeleteSheetModalProps {
  sheet: Sheet | null;
  onClose: () => void;
  onConfirm: () => Promise<void>;
  isDeleting: boolean;
}

export function DeleteSheetModal({
  sheet,
  onClose,
  onConfirm,
  isDeleting,
}: DeleteSheetModalProps) {
  // Lock body scroll when open
  useEffect(() => {
    if (sheet) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [sheet]);

  if (!sheet) return null;

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
        onClick={() => !isDeleting && onClose()}
        aria-hidden="true"
      />

      {/* Modal Card */}
      <div
        className="glass-card relative w-full max-w-md overflow-hidden rounded-2xl bg-zinc-950 p-6 shadow-2xl transition-all"
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
      >
        <div className="mb-6">
          <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-500/10">
            <svg
              className="h-6 w-6 text-red-500"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
              />
            </svg>
          </div>
          <h2 id="modal-title" className="text-xl font-bold text-white mb-2">
            Delete Sheet
          </h2>
          <p className="text-sm text-zinc-400">
            Are you sure you want to delete <span className="font-semibold text-zinc-200">"{sheet.name}"</span>? 
            This will permanently delete the sheet and all its problems. This action cannot be undone.
          </p>
        </div>

        <div className="mt-6 flex flex-col sm:flex-row justify-end gap-3">
          <Button
            type="button"
            variant="secondary"
            onClick={onClose}
            disabled={isDeleting}
            className="w-full sm:w-auto"
          >
            Cancel
          </Button>
          <Button
            type="button"
            onClick={onConfirm}
            disabled={isDeleting}
            className="w-full sm:w-auto bg-red-600 hover:bg-red-500 text-white"
          >
            {isDeleting ? (
              <span className="flex items-center gap-2">
                <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                Deleting...
              </span>
            ) : (
              'Delete Sheet'
            )}
          </Button>
        </div>
      </div>
    </div>,
    document.body
  );
}
