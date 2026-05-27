'use client';

import React from 'react';
import Link from 'next/link';
import type { Sheet } from '@/types/sheet';

interface SheetCardProps {
  sheet: Sheet;
  onDelete?: (sheet: Sheet) => void;
}

/** Converts a createdAt ISO string to a relative time string */
const dateFormatter = new Intl.DateTimeFormat('en-US', {
  month: 'short',
  day: 'numeric',
  year: 'numeric',
});

export const SheetCard: React.FC<SheetCardProps> = ({ sheet, onDelete }) => {
  return (
    <div className="group block h-full">
      <div className="relative glass-card p-6 h-full transition-all duration-300 hover:border-accent hover:shadow-lg hover:shadow-accent/10 rounded-xl flex flex-col justify-between">
        <div className="flex justify-between items-start mb-4">
          <div className="pr-8">
            <h3 className="text-xl font-bold text-text-primary group-hover:text-accent transition-colors">
              <Link href={`/dashboard/sheets/${sheet.id}`} className="after:absolute after:inset-0 focus:outline-none focus:ring-2 focus:ring-indigo-500 rounded-lg">
                {sheet.name}
              </Link>
            </h3>
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-surface-raised text-text-secondary border border-border mt-2">
              {sheet.solvedCount || 0} / {sheet.problemCount} problems
            </span>
          </div>
          {onDelete && (
            <button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onDelete(sheet);
              }}
              className="absolute top-5 right-5 z-20 p-2 text-text-muted hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all rounded-md hover:bg-surface-raised"
              aria-label="Delete sheet"
              title="Delete sheet"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 6h18"></path>
                <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"></path>
                <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"></path>
              </svg>
            </button>
          )}
        </div>
        {sheet.description && (
          <p className="text-text-secondary text-sm mb-6 line-clamp-2">{sheet.description}</p>
        )}
        <div className="mt-6 flex items-center justify-between text-sm">
          <span className="text-text-muted">
            Added {dateFormatter.format(new Date(sheet.createdAt))}
          </span>
          <span className="text-accent font-medium opacity-0 group-hover:opacity-100 transition-opacity flex items-center">
            Open Sheet
            <svg className="w-4 h-4 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </span>
        </div>
      </div>
    </div>
  );
};
