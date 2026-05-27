'use client';

import React, { useState } from 'react';
import { Search } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import { useSheets } from '@/hooks/use-sheets';
import { ImportSheetModal } from '@/components/features/sheets/import-sheet-modal';
import { DeleteSheetModal } from '@/components/features/sheets/delete-sheet-modal';
import { SheetCard } from '@/components/features/sheets/sheet-card';
import { Button } from '@/components/ui/button';
import toast from 'react-hot-toast';
import { api } from '@/lib/api';
import type { Sheet } from '@/types/sheet';

// ── Skeleton loader ───────────────────────────────────────────────────────────

function SheetCardSkeleton() {
  return (
    <div className="flex flex-col gap-3 p-5 rounded-xl border border-border bg-surface animate-pulse">
      <div className="flex items-start gap-3">
        <div className="w-9 h-9 rounded-lg bg-surface-raised shrink-0" />
        <div className="flex-1 flex flex-col gap-2">
          <div className="h-3.5 bg-surface-raised rounded w-2/3" />
          <div className="h-3 bg-surface-raised rounded w-1/2" />
        </div>
      </div>
      <div className="mt-4 flex flex-col gap-2">
        <div className="h-3 bg-surface-raised rounded w-1/3" />
        <div className="h-3 bg-surface-raised rounded w-1/4" />
      </div>
    </div>
  );
}

// ── Empty state ───────────────────────────────────────────────────────────────

function EmptyState({ onImport }: { onImport: () => void }) {
  return (
    <div className="rounded-2xl border border-dashed border-border bg-surface p-16 text-center flex flex-col items-center">
      <div className="text-5xl mb-4">📂</div>
      <h2 className="text-lg font-semibold text-text-primary mb-2">No sheets yet</h2>
      <p className="text-sm text-text-muted max-w-sm mx-auto mb-10">
        Import a sheet (CSV or JSON) to start tracking your personal progress.
      </p>

      <div className="relative inline-block">
        <div className="absolute -inset-1.5 rounded-xl bg-indigo-500/30 animate-pulse pointer-events-none" />
        
        {/* Tooltip arrow pointing down */}
        <div className="absolute -top-12 left-1/2 -translate-x-1/2 flex flex-col items-center animate-bounce pointer-events-none">
          <span className="bg-indigo-500 text-white text-xs font-bold px-3 py-1.5 rounded-lg whitespace-nowrap shadow-lg">Start here!</span>
          <div className="w-0 h-0 border-l-[6px] border-r-[6px] border-t-[8px] border-l-transparent border-r-transparent border-t-indigo-500" />
        </div>

        <Button
          id="import-sheet-btn"
          onClick={onImport}
          className="relative shadow-lg shadow-indigo-500/20"
          size="md"
        >
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
            <polyline points="17 8 12 3 7 8" />
            <line x1="12" y1="3" x2="12" y2="15" />
          </svg>
          Import Sheet
        </Button>
      </div>
    </div>
  );
}

// ── Sheets header ─────────────────────────────────────────────────────────────

function SheetsHeader({ 
  count, 
  searchQuery,
  onSearchChange,
  onImport 
}: { 
  count: number; 
  searchQuery: string;
  onSearchChange: (value: string) => void;
  onImport: () => void;
}) {
  return (
    <div className="mb-6 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
      <div>
        <h2 className="text-base font-semibold text-text-primary">Your Sheets</h2>
        <p className="text-xs text-text-muted mt-0.5">{count} {count === 1 ? 'sheet' : 'sheets'} imported</p>
      </div>
      
      <div className="flex flex-1 items-center justify-end gap-3">
        <div className="relative w-full max-w-xs">
          <Search 
            size={16} 
            className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted"
          />
          <input
            type="text"
            placeholder="Search sheets..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full bg-surface border border-border rounded-lg py-1.5 pl-9 pr-3 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-1 focus:ring-accent focus:border-accent transition-colors"
          />
        </div>
        <Button
          id="import-sheet-header-btn"
          onClick={onImport}
          size="sm"
          variant="secondary"
          className="shrink-0"
        >
        <svg
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <line x1="12" y1="5" x2="12" y2="19" />
          <line x1="5" y1="12" x2="19" y2="12" />
        </svg>
        Import Sheet
      </Button>
      </div>
    </div>
  );
}

// ── Dashboard page ────────────────────────────────────────────────────────────

export default function DashboardPage() {
  const { user } = useAuth();
  const { sheets, isLoading, error, addSheet, removeSheet } = useSheets();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [sheetToDelete, setSheetToDelete] = useState<Sheet | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const totalProblems = sheets.reduce((sum, s) => sum + s.problemCount, 0);
  const totalSolved = sheets.reduce((sum, s) => sum + (s.solvedCount || 0), 0);

  const filteredSheets = sheets.filter(sheet =>
    sheet.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleImportSuccess = (sheet: Sheet) => {
    addSheet(sheet);
    setIsModalOpen(false);
  };

  const handleDeleteConfirm = async () => {
    if (!sheetToDelete) return;
    setIsDeleting(true);
    try {
      await api.delete(`/sheets/${sheetToDelete.id}`);
      removeSheet(sheetToDelete.id);
      setSheetToDelete(null);
      toast.success(`"${sheetToDelete.name}" has been permanently deleted.`);
    } catch (err) {
      console.error('Failed to delete sheet:', err);
      toast.error('Failed to delete the sheet. Please try again.');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12">
      {/* Welcome banner */}
      <div
        className="relative overflow-hidden rounded-2xl border border-border bg-surface p-8 mb-10"
        style={{ animation: 'slide-up 0.4s cubic-bezier(0.16, 1, 0.3, 1)' }}
      >
        {/* Ambient glow */}
        <div
          className="absolute pointer-events-none"
          style={{
            top: '-40%',
            right: '-10%',
            width: '300px',
            height: '300px',
            background: 'radial-gradient(ellipse, rgba(16,185,129,0.1) 0%, transparent 70%)',
            filter: 'blur(40px)',
          }}
          aria-hidden="true"
        />
        <div className="relative z-10">
          <h1 className="text-3xl font-bold text-text-primary mb-2">
            Welcome back, {user?.name?.split(' ')[0] ?? 'there'} 👋
          </h1>
          <p className="text-text-secondary max-w-lg">
            {sheets.length > 0
              ? `Tracking ${totalProblems} problems across ${sheets.length} ${sheets.length === 1 ? 'sheet' : 'sheets'}.`
              : "Your personal sheet tracker is ready. Import a sheet to start tracking your progress."}
          </p>
        </div>
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-10">
        {[
          {
            label: 'Total Problems',
            value: isLoading ? '—' : totalProblems.toString(),
          },
          {
            label: 'Solved',
            value: isLoading ? '—' : totalSolved.toString(),
          },
          {
            label: 'Sheets',
            value: isLoading ? '—' : sheets.length.toString(),
          },
        ].map((stat, index) => (
          <div
            key={index}
            className="rounded-xl border border-border bg-surface p-6"
          >
            <div className="text-2xl font-bold text-text-primary mb-1">{stat.value}</div>
            <div className="text-sm text-text-muted">{stat.label}</div>
          </div>
        ))}
      </div>

      {/* Sheets section */}
      {isLoading ? (
        // Skeleton loading state
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <SheetCardSkeleton key={i} />
          ))}
        </div>
      ) : error ? (
        // Error state
        <div className="rounded-2xl border border-red-500/20 bg-red-500/5 p-8 text-center">
          <p className="text-text-primary font-medium mb-1">Failed to load sheets</p>
          <p className="text-xs text-text-muted">Refresh the page to try again.</p>
        </div>
      ) : sheets.length === 0 ? (
        // Empty state
        <EmptyState onImport={() => setIsModalOpen(true)} />
      ) : (
        // Sheets grid
        <>
          <SheetsHeader 
            count={sheets.length} 
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            onImport={() => setIsModalOpen(true)} 
          />
          {filteredSheets.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-border bg-surface p-12 text-center mt-4">
              <p className="text-text-muted">No sheets found matching "{searchQuery}"</p>
              <button 
                onClick={() => setSearchQuery('')}
                className="text-sm text-indigo-400 hover:text-indigo-300 mt-2 transition-colors"
              >
                Clear search
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredSheets.map((sheet) => (
                <SheetCard key={sheet.id} sheet={sheet} onDelete={setSheetToDelete} />
              ))}
            </div>
          )}
        </>
      )}

      {/* Import modal — rendered via portal to document.body */}
      <ImportSheetModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={handleImportSuccess}
      />

      {/* Delete confirmation modal */}
      <DeleteSheetModal
        sheet={sheetToDelete}
        onClose={() => setSheetToDelete(null)}
        onConfirm={handleDeleteConfirm}
        isDeleting={isDeleting}
      />
    </div>
  );
}
