'use client';

import { use, useState, useMemo, useEffect } from 'react';
import { useSheet } from '@/hooks/use-sheet';
import { SheetHeader } from '@/components/features/sheets/sheet-header';
import { ProblemFilters, type FilterState } from '@/components/features/sheets/problem-filters';
import { ProblemTable } from '@/components/features/sheets/problem-table';
import { LoadingSpinner } from '@/components/ui/loading-spinner';

export default function SheetDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const { sheet, problems, isLoading, error, updateProblem } = useSheet(resolvedParams.id);

  useEffect(() => {
    if (sheet?.name) {
      document.title = `${sheet.name} | Trace`;
    } else {
      document.title = 'Trace — DSA Progress Tracker';
    }
    return () => {
      document.title = 'Trace — DSA Progress Tracker';
    };
  }, [sheet?.name]);

  const [filters, setFilters] = useState<FilterState>({
    search: '',
    difficulty: '',
    topic: '',
    status: '',
  });

  const topics = useMemo(() => {
    const allTopics = new Set<string>();
    problems.forEach(p => p.topics.forEach(t => allTopics.add(t)));
    return Array.from(allTopics).sort();
  }, [problems]);

  const filteredProblems = useMemo(() => {
    return problems.filter((p) => {
      if (filters.search && !p.name.toLowerCase().includes(filters.search.toLowerCase())) return false;
      if (filters.difficulty && p.difficulty !== filters.difficulty) return false;
      if (filters.topic && !p.topics.includes(filters.topic)) return false;
      if (filters.status) {
        const pStatus = p.status || 'unsolved';
        if (pStatus !== filters.status) return false;
      }
      return true;
    });
  }, [problems, filters]);

  const handleStatusChange = (id: string, newStatus: any) => {
    updateProblem(id, { status: newStatus }).catch((err) => {
      console.error('Failed to update status', err);
    });
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <LoadingSpinner className="w-8 h-8 text-indigo-500" />
      </div>
    );
  }

  if (error || !sheet) {
    return (
      <div className="glass-card p-12 text-center">
        <h2 className="text-xl text-rose-400 mb-2">Error</h2>
        <p className="text-zinc-400">{error || 'Sheet not found'}</p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8 animate-fade-in">
      <SheetHeader sheet={sheet} problems={problems} />
      
      <ProblemFilters 
        filters={filters} 
        setFilters={setFilters} 
        topics={topics} 
      />
      
      <ProblemTable 
        problems={filteredProblems} 
        onStatusChange={handleStatusChange} 
        onUpdateProblem={updateProblem}
      />
    </div>
  );
}
