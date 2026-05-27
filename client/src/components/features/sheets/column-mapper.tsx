'use client';

import React, { useCallback } from 'react';
import type { ColumnMapping, TraceField } from '@/types/sheet';

interface ColumnMapperProps {
  columns: string[];
  mappings: ColumnMapping[];
  onMappingsChange: (mappings: ColumnMapping[]) => void;
  sampleData: Record<string, string | string[]>[];
}

type MappingOption = TraceField | 'skip';

const TRACE_FIELD_LABELS: Record<MappingOption, string> = {
  name: 'Name',
  link: 'Link',
  topics: 'Topics',
  difficulty: 'Difficulty',
  skip: 'Skip',
};

const REQUIRED_FIELDS: TraceField[] = ['name', 'link'];

/** Truncate a sample value for display in the column preview */
function formatSample(value: string | string[] | undefined): string {
  if (!value) return '—';
  const str = Array.isArray(value) ? value.join(', ') : String(value);
  return str.length > 40 ? str.slice(0, 40) + '…' : str || '—';
}

export const ColumnMapper: React.FC<ColumnMapperProps> = ({
  columns,
  mappings,
  onMappingsChange,
  sampleData,
}) => {
  const sampleRow = sampleData[0] ?? {};

  const handleChange = useCallback(
    (sourceColumn: string, newTarget: MappingOption) => {
      const updated = mappings.map((m) => {
        // If another column is already mapped to this target, reset it to 'skip'
        if (m.targetField === newTarget && newTarget !== 'skip' && m.sourceColumn !== sourceColumn) {
          return { ...m, targetField: 'skip' as MappingOption };
        }
        if (m.sourceColumn === sourceColumn) {
          return { ...m, targetField: newTarget };
        }
        return m;
      });
      onMappingsChange(updated);
    },
    [mappings, onMappingsChange]
  );

  // Compute which required fields are still unmapped
  const mappedTargets = new Set(mappings.filter((m) => m.targetField !== 'skip').map((m) => m.targetField));
  const missingRequired = REQUIRED_FIELDS.filter((f) => !mappedTargets.has(f));

  return (
    <div className="w-full space-y-2">
      {/* Column header row */}
      <div className="grid grid-cols-[1fr_auto_1fr] gap-3 px-3 mb-1">
        <span className="text-xs font-medium text-zinc-500 uppercase tracking-wide">Your Column</span>
        <span className="w-6" />
        <span className="text-xs font-medium text-zinc-500 uppercase tracking-wide">Maps To</span>
      </div>

      {/* Mapping rows */}
      <div className="space-y-2 max-h-[320px] overflow-y-auto pr-1">
        {mappings.map((mapping) => {
          const sample = formatSample(sampleRow[mapping.sourceColumn]);
          const isMapped = mapping.targetField !== 'skip';
          const isRequired = REQUIRED_FIELDS.includes(mapping.targetField as TraceField);

          return (
            <div
              key={mapping.sourceColumn}
              className={[
                'grid grid-cols-[1fr_auto_1fr] gap-3 items-center px-3 py-2.5 rounded-lg border transition-colors duration-150',
                isMapped && isRequired
                  ? 'border-indigo-500/25 bg-indigo-500/5'
                  : isMapped
                  ? 'border-zinc-700/60 bg-zinc-900/40'
                  : 'border-zinc-800/50 bg-zinc-900/20',
              ].join(' ')}
            >
              {/* Source column info */}
              <div className="min-w-0">
                <p className="text-sm font-medium text-zinc-200 truncate">{mapping.sourceColumn}</p>
                <p className="text-xs text-zinc-500 truncate mt-0.5">{sample}</p>
              </div>

              {/* Arrow */}
              <div className="flex items-center justify-center">
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className={isMapped ? 'text-indigo-400' : 'text-zinc-600'}
                  aria-hidden="true"
                >
                  <path d="M5 12h14M12 5l7 7-7 7" />
                </svg>
              </div>

              {/* Target field dropdown */}
              <select
                value={mapping.targetField}
                onChange={(e) => handleChange(mapping.sourceColumn, e.target.value as MappingOption)}
                aria-label={`Map "${mapping.sourceColumn}" to Trace field`}
                className="w-full h-9 px-2.5 rounded-lg text-sm bg-zinc-800 border border-zinc-700 text-zinc-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-colors duration-150 cursor-pointer"
              >
                <option value="skip">Skip</option>
                <option value="name">Name {REQUIRED_FIELDS.includes('name') ? '*' : ''}</option>
                <option value="link">Link {REQUIRED_FIELDS.includes('link') ? '*' : ''}</option>
                <option value="topics">Topics</option>
                <option value="difficulty">Difficulty</option>
              </select>
            </div>
          );
        })}
      </div>

      {/* Validation hint */}
      {missingRequired.length > 0 ? (
        <p role="status" className="text-xs text-amber-400 flex items-center gap-1.5 pt-1">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
            <path d="M1 21h22L12 2 1 21zm12-3h-2v-2h2v2zm0-4h-2v-4h2v4z" />
          </svg>
          Please map <strong className="font-semibold">{missingRequired.map((f) => TRACE_FIELD_LABELS[f]).join(' and ')}</strong> before continuing.
        </p>
      ) : (
        <p role="status" className="text-xs text-emerald-400 flex items-center gap-1.5 pt-1">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
            <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" />
          </svg>
          Required fields mapped. You&apos;re good to go.
        </p>
      )}

      <p className="text-xs text-zinc-600">* Required fields</p>
    </div>
  );
};
