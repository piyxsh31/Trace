'use client';

import React, {
  useReducer,
  useEffect,
  useRef,
  useCallback,
} from 'react';
import { createPortal } from 'react-dom';
import toast from 'react-hot-toast';
import { api } from '@/lib/api';
import {
  parseCSVFile,
  parseJSONFile,
  detectMappings,
  applyMapping,
} from '@/lib/file-parser';
import { FileDropzone } from './file-dropzone';
import { ColumnMapper } from './column-mapper';
import { ImportPreviewTable } from './import-preview-table';
import type { ApiResponse, ImportSheetResponse } from '@/types/api';
import type {
  ColumnMapping,
  ImportPayload,
  ImportStep,
  ParsedFileData,
  Problem,
  Sheet,
} from '@/types/sheet';

// ── State machine ─────────────────────────────────────────────────────────────

interface ImportState {
  step: ImportStep;
  parsedData: ParsedFileData | null;
  mappings: ColumnMapping[];
  mappedProblems: Problem[];
  sheetName: string;
  sheetDescription: string;
  isImporting: boolean;
  parseError: string | null;
}

type ImportAction =
  | {
      type: 'FILE_PARSED';
      payload: { data: ParsedFileData; mappings: ColumnMapping[] };
    }
  | { type: 'SET_PARSE_ERROR'; payload: string }
  | { type: 'UPDATE_MAPPINGS'; payload: ColumnMapping[] }
  | { type: 'APPLY_MAPPING'; payload: Problem[] }
  | { type: 'SET_SHEET_NAME'; payload: string }
  | { type: 'SET_SHEET_DESCRIPTION'; payload: string }
  | { type: 'IMPORT_START' }
  | { type: 'IMPORT_DONE' }
  | { type: 'GO_BACK' }
  | { type: 'RESET' };

const INITIAL_STATE: ImportState = {
  step: 'upload',
  parsedData: null,
  mappings: [],
  mappedProblems: [],
  sheetName: '',
  sheetDescription: '',
  isImporting: false,
  parseError: null,
};

function reducer(state: ImportState, action: ImportAction): ImportState {
  switch (action.type) {
    case 'FILE_PARSED':
      return {
        ...state,
        step: 'map',
        parsedData: action.payload.data,
        mappings: action.payload.mappings,
        sheetName: action.payload.data.suggestedName ?? state.sheetName,
        sheetDescription: action.payload.data.suggestedDescription ?? state.sheetDescription,
        parseError: null,
      };
    case 'SET_PARSE_ERROR':
      return { ...state, parseError: action.payload };
    case 'UPDATE_MAPPINGS':
      return { ...state, mappings: action.payload };
    case 'APPLY_MAPPING':
      return { ...state, step: 'preview', mappedProblems: action.payload };
    case 'SET_SHEET_NAME':
      return { ...state, sheetName: action.payload };
    case 'SET_SHEET_DESCRIPTION':
      return { ...state, sheetDescription: action.payload };
    case 'IMPORT_START':
      return { ...state, isImporting: true };
    case 'IMPORT_DONE':
      return { ...state, isImporting: false };
    case 'GO_BACK':
      return {
        ...state,
        step: state.step === 'preview' ? 'map' : 'upload',
        parseError: null,
      };
    case 'RESET':
      return INITIAL_STATE;
    default:
      return state;
  }
}

// ── Props ─────────────────────────────────────────────────────────────────────

interface ImportSheetModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (sheet: Sheet) => void;
}

// ── Step indicator ────────────────────────────────────────────────────────────

const STEPS: { id: ImportStep; label: string }[] = [
  { id: 'upload', label: 'Upload' },
  { id: 'map', label: 'Map Columns' },
  { id: 'preview', label: 'Preview & Import' },
];

const STEP_ORDER: ImportStep[] = ['upload', 'map', 'preview'];

function StepIndicator({ current }: { current: ImportStep }) {
  const currentIdx = STEP_ORDER.indexOf(current);

  return (
    <div className="flex items-center justify-center gap-0 mb-6">
      {STEPS.map((step, i) => {
        const isCompleted = i < currentIdx;
        const isActive = i === currentIdx;

        return (
          <React.Fragment key={step.id}>
            <div className="flex flex-col items-center gap-1.5">
              <div
                className={[
                  'w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold border-2 transition-all duration-300',
                  isCompleted
                    ? 'bg-indigo-500 border-indigo-500 text-white'
                    : isActive
                    ? 'bg-transparent border-indigo-500 text-indigo-400'
                    : 'bg-transparent border-zinc-700 text-zinc-600',
                ].join(' ')}
              >
                {isCompleted ? (
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                    <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" />
                  </svg>
                ) : (
                  i + 1
                )}
              </div>
              <span
                className={[
                  'text-xs font-medium transition-colors duration-300',
                  isActive ? 'text-indigo-400' : isCompleted ? 'text-zinc-400' : 'text-zinc-600',
                ].join(' ')}
              >
                {step.label}
              </span>
            </div>

            {/* Connector line */}
            {i < STEPS.length - 1 && (
              <div
                className={[
                  'h-0.5 w-16 mb-5 mx-1 transition-colors duration-300',
                  i < currentIdx ? 'bg-indigo-500' : 'bg-zinc-800',
                ].join(' ')}
              />
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

export const ImportSheetModal: React.FC<ImportSheetModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [state, dispatch] = useReducer(reducer, INITIAL_STATE);
  const [isMounted, setIsMounted] = React.useState(false);
  const [isVisible, setIsVisible] = React.useState(false);
  const modalRef = useRef<HTMLDivElement>(null);
  const firstFocusableRef = useRef<HTMLButtonElement>(null);

  // Track whether required fields are mapped
  const requiredMapped =
    state.mappings.some((m) => m.targetField === 'name') &&
    state.mappings.some((m) => m.targetField === 'link');

  // ── Open / close animations ─────────────────────────────────────────────

  useEffect(() => {
    if (isOpen) {
      setIsMounted(true);
      // Small delay so CSS transition fires after DOM insertion
      requestAnimationFrame(() => {
        requestAnimationFrame(() => setIsVisible(true));
      });
      document.body.style.overflow = 'hidden';
    } else {
      setIsVisible(false);
      const t = setTimeout(() => {
        setIsMounted(false);
        dispatch({ type: 'RESET' });
        document.body.style.overflow = '';
      }, 250);
      return () => clearTimeout(t);
    }
  }, [isOpen]);

  // Focus first interactive element when modal opens
  useEffect(() => {
    if (isVisible) {
      firstFocusableRef.current?.focus();
    }
  }, [isVisible]);

  // ── Keyboard handling ───────────────────────────────────────────────────

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
        return;
      }
      // Focus trap
      if (e.key === 'Tab' && modalRef.current) {
        const focusable = modalRef.current.querySelectorAll<HTMLElement>(
          'button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
        );
        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last?.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first?.focus();
        }
      }
    },
    [onClose]
  );

  // ── File parsing ────────────────────────────────────────────────────────

  const handleFileSelect = useCallback(async (file: File) => {
    try {
      const isCSV = file.name.toLowerCase().endsWith('.csv');
      const data = isCSV ? await parseCSVFile(file) : await parseJSONFile(file);
      const mappings = detectMappings(data.columns);
      dispatch({ type: 'FILE_PARSED', payload: { data, mappings } });
    } catch (err) {
      dispatch({
        type: 'SET_PARSE_ERROR',
        payload: err instanceof Error ? err.message : 'Failed to parse file.',
      });
    }
  }, []);

  // ── Step navigation ─────────────────────────────────────────────────────

  const handleNext = useCallback(() => {
    if (!state.parsedData) return;
    const mapped = applyMapping(state.parsedData.rows, state.mappings);
    dispatch({ type: 'APPLY_MAPPING', payload: mapped });
  }, [state.parsedData, state.mappings]);

  // ── Import ──────────────────────────────────────────────────────────────

  const handleImport = useCallback(async () => {
    if (!state.sheetName.trim()) return;
    dispatch({ type: 'IMPORT_START' });

    const payload: ImportPayload = {
      name: state.sheetName.trim(),
      description: state.sheetDescription.trim() || undefined,
      problems: state.mappedProblems,
    };

    try {
      const { data } = await api.post<ApiResponse<ImportSheetResponse>>(
        '/sheets/import',
        payload
      );
      if (!data.success || !data.data) {
        throw new Error(data.message ?? 'Import failed');
      }
      toast.success(`"${data.data.sheet.name}" imported — ${data.data.sheet.problemCount} problems`);
      onSuccess(data.data.sheet);
      onClose();
    } catch (err: unknown) {
      dispatch({ type: 'IMPORT_DONE' });
      const message =
        err instanceof Error ? err.message : 'Import failed. Please try again.';
      toast.error(message);
    }
  }, [state, onSuccess, onClose]);

  // ── Render ──────────────────────────────────────────────────────────────

  if (!isMounted) return null;

  const modal = (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="import-modal-title"
      onKeyDown={handleKeyDown}
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
    >
      {/* Backdrop */}
      <div
        className={[
          'absolute inset-0 bg-black/70 backdrop-blur-sm transition-opacity duration-250',
          isVisible ? 'opacity-100' : 'opacity-0',
        ].join(' ')}
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal panel */}
      <div
        ref={modalRef}
        className={[
          'relative w-full max-w-2xl max-h-[92vh] flex flex-col rounded-2xl overflow-hidden',
          'bg-zinc-900 border border-zinc-800/80',
          'shadow-2xl shadow-black/60',
          'transition-all duration-250',
          isVisible ? 'opacity-100 scale-100 translate-y-0' : 'opacity-0 scale-95 translate-y-4',
        ].join(' ')}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-6 pb-0 shrink-0">
          <div>
            <h2 id="import-modal-title" className="text-lg font-semibold text-zinc-50">
              Import Sheet
            </h2>
            <p className="text-sm text-zinc-500 mt-0.5">
              {state.step === 'upload' && 'Upload a CSV or JSON file to get started'}
              {state.step === 'map' && 'Match your file\'s columns to Trace fields'}
              {state.step === 'preview' && 'Review and confirm your import'}
            </p>
          </div>
          <button
            ref={firstFocusableRef}
            onClick={onClose}
            aria-label="Close import modal"
            className="w-8 h-8 rounded-lg flex items-center justify-center text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800 transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {/* Step indicator */}
        <div className="px-6 pt-5 shrink-0">
          <StepIndicator current={state.step} />
        </div>

        {/* Scrollable content area */}
        <div className="flex-1 overflow-y-auto px-6 pb-2 min-h-0">
          {/* Step 1: Upload */}
          {state.step === 'upload' && (
            <FileDropzone
              onFileSelect={handleFileSelect}
              error={state.parseError}
            />
          )}

          {/* Step 2: Map */}
          {state.step === 'map' && state.parsedData && (
            <ColumnMapper
              columns={state.parsedData.columns}
              mappings={state.mappings}
              onMappingsChange={(m) => dispatch({ type: 'UPDATE_MAPPINGS', payload: m })}
              sampleData={state.parsedData.rows.slice(0, 3) as Record<string, string | string[]>[]}
            />
          )}

          {/* Step 3: Preview */}
          {state.step === 'preview' && (
            <div className="space-y-5">
              {/* Sheet name */}
              <div className="space-y-1.5">
                <label htmlFor="sheet-name" className="text-sm font-medium text-zinc-300">
                  Sheet Name <span className="text-red-400">*</span>
                </label>
                <input
                  id="sheet-name"
                  type="text"
                  value={state.sheetName}
                  onChange={(e) => dispatch({ type: 'SET_SHEET_NAME', payload: e.target.value })}
                  placeholder="e.g. Striver SDE Sheet"
                  maxLength={100}
                  className="w-full h-10 px-3 rounded-lg bg-zinc-800 border border-zinc-700 text-zinc-200 text-sm placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-colors duration-150"
                />
              </div>

              {/* Sheet description */}
              <div className="space-y-1.5">
                <label htmlFor="sheet-description" className="text-sm font-medium text-zinc-300">
                  Description <span className="text-zinc-600">(optional)</span>
                </label>
                <textarea
                  id="sheet-description"
                  value={state.sheetDescription}
                  onChange={(e) => dispatch({ type: 'SET_SHEET_DESCRIPTION', payload: e.target.value })}
                  placeholder="Add a description for this sheet…"
                  rows={2}
                  maxLength={500}
                  className="w-full px-3 py-2.5 rounded-lg bg-zinc-800 border border-zinc-700 text-zinc-200 text-sm placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-colors duration-150 resize-none"
                />
              </div>

              {/* Preview table */}
              <ImportPreviewTable problems={state.mappedProblems} />
            </div>
          )}
        </div>

        {/* Footer */}
        {(state.step === 'map' || state.step === 'preview') && (
          <div className="flex items-center justify-between gap-3 px-6 py-4 border-t border-zinc-800/60 shrink-0 bg-zinc-900/80">
            <button
              onClick={() => dispatch({ type: 'GO_BACK' })}
              disabled={state.isImporting}
              className="h-9 px-4 rounded-lg text-sm font-medium text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 border border-zinc-800 transition-colors duration-150 disabled:opacity-50 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
            >
              Back
            </button>

            {state.step === 'map' && (
              <button
                onClick={handleNext}
                disabled={!requiredMapped}
                className="h-9 px-5 rounded-lg text-sm font-semibold bg-indigo-500 text-white hover:bg-indigo-400 disabled:opacity-40 disabled:cursor-not-allowed transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-900"
              >
                Preview
              </button>
            )}

            {state.step === 'preview' && (
              <button
                onClick={handleImport}
                disabled={!state.sheetName.trim() || state.isImporting || state.mappedProblems.length === 0}
                className="inline-flex items-center gap-2 h-9 px-5 rounded-lg text-sm font-semibold bg-indigo-500 text-white hover:bg-indigo-400 disabled:opacity-40 disabled:cursor-not-allowed transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-900"
              >
                {state.isImporting && (
                  <span
                    className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white"
                    style={{ animation: 'spin 1s linear infinite' }}
                    aria-hidden="true"
                  />
                )}
                {state.isImporting ? 'Importing…' : `Import ${state.mappedProblems.length} Problems`}
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );

  return createPortal(modal, document.body);
};
