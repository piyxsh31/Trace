import React, { useState } from 'react';
import { StatusBadge } from './status-badge';
import { NotesEditor } from './notes-editor';
import { DifficultyPopover } from './difficulty-popover';
import { TopicsPopover } from './topics-popover';
import type { Problem } from '@/types/sheet';

interface ProblemTableProps {
  problems: Problem[];
  onStatusChange: (id: string, newStatus: Problem['status']) => void;
  onUpdateProblem: (id: string, updates: Partial<Problem>) => void;
}

export function ProblemTable({ problems, onStatusChange, onUpdateProblem }: ProblemTableProps) {
  const [expandedRowId, setExpandedRowId] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 50;

  React.useEffect(() => {
    setCurrentPage(1);
  }, [problems]);

  if (problems.length === 0) {
    return (
      <div className="glass-card p-12 text-center text-text-muted">
        No problems found matching your filters.
      </div>
    );
  }

  const cycleStatus = (current: Problem['status']) => {
    if (current === 'solved') return 'unsolved';
    if (current === 'attempted') return 'solved';
    return 'attempted';
  };

  const toggleRow = (id: string) => {
    setExpandedRowId(prev => prev === id ? null : id);
  };

  return (
    <div className="glass-card overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left">
          <thead className="text-xs uppercase bg-surface text-text-muted border-b border-border">
            <tr>
              <th scope="col" className="px-6 py-4 font-semibold w-12"></th>
              <th scope="col" className="px-6 py-4 font-semibold">Status</th>
              <th scope="col" className="px-6 py-4 font-semibold">Problem</th>
              <th scope="col" className="px-6 py-4 font-semibold">Difficulty</th>
              <th scope="col" className="px-6 py-4 font-semibold">Topics</th>
              <th scope="col" className="px-6 py-4 font-semibold text-right">Link</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/50">
            {problems.slice((currentPage - 1) * pageSize, currentPage * pageSize).map((problem) => {
              const diffId = `diff-popover-${problem.id}`;
              const topicId = `topic-popover-${problem.id}`;
              const isExpanded = expandedRowId === problem.id;

              return (
                <React.Fragment key={problem.id}>
                  {/* Main Row */}
                  <tr className={`hover:bg-surface-raised transition-colors ${isExpanded ? 'bg-surface-raised/50' : ''}`}>
                    <td className="pl-6 pr-2 py-4">
                      <button 
                        onClick={() => toggleRow(problem.id!)}
                        className="p-1 rounded hover:bg-surface-raised text-text-muted hover:text-text-primary transition-all"
                        aria-expanded={isExpanded}
                      >
                        <svg className={`w-4 h-4 transition-transform duration-300 ${isExpanded ? 'rotate-90 text-indigo-400' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </button>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <StatusBadge 
                        status={problem.status || 'unsolved'} 
                        onClick={() => onStatusChange(problem.id!, cycleStatus(problem.status || 'unsolved'))} 
                      />
                    </td>
                    <td className="px-6 py-4 font-medium text-text-primary cursor-pointer" onClick={() => toggleRow(problem.id!)}>
                      {problem.name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap relative">
                      {/* @ts-ignore */}
                      <button
                        popoverTarget={diffId}
                        className={`group inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-xs font-medium border transition-all cursor-pointer hover:shadow-md
                          ${problem.difficulty === 'easy' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20 hover:bg-emerald-500/20 hover:border-emerald-500/40' : 
                            problem.difficulty === 'medium' ? 'bg-amber-500/10 text-amber-400 border-amber-500/20 hover:bg-amber-500/20 hover:border-amber-500/40' : 
                            problem.difficulty === 'hard' ? 'bg-rose-500/10 text-rose-400 border-rose-500/20 hover:bg-rose-500/20 hover:border-rose-500/40' : 
                            'bg-surface text-text-muted border-border hover:bg-surface-raised hover:border-text-muted'}
                        `}
                      >
                        {problem.difficulty ? problem.difficulty.charAt(0).toUpperCase() + problem.difficulty.slice(1) : 'Set difficulty'}
                        <svg className="w-3 h-3 opacity-0 group-hover:opacity-60 transition-opacity flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                        </svg>
                      </button>
                      <DifficultyPopover 
                        id={diffId} 
                        currentDifficulty={problem.difficulty} 
                        onSelect={(diff) => onUpdateProblem(problem.id!, { difficulty: diff })}
                      />
                    </td>
                    <td className="px-6 py-4 relative">
                      {/* @ts-ignore */}
                      <button
                        popoverTarget={topicId}
                        className="group flex flex-wrap items-center gap-1.5 cursor-pointer p-1 -m-1 rounded hover:bg-surface-raised/50 transition-colors w-full text-left"
                      >
                        {problem.topics.slice(0, 3).map((topic, i) => (
                          <span key={i} className="px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-400 text-xs border border-indigo-500/20">
                            {topic}
                          </span>
                        ))}
                        {problem.topics.length > 3 && (
                          <span className="px-2 py-0.5 rounded bg-surface-raised text-text-muted text-xs">
                            +{problem.topics.length - 3}
                          </span>
                        )}
                        {problem.topics.length === 0 && (
                          <span className="text-text-muted text-xs italic group-hover:text-accent">Add topics...</span>
                        )}
                        <svg className="w-3 h-3 text-text-muted opacity-0 group-hover:opacity-100 transition-opacity ml-auto flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                        </svg>
                      </button>
                      <TopicsPopover 
                        id={topicId}
                        currentTopics={problem.topics}
                        onSave={(topics) => onUpdateProblem(problem.id!, { topics })}
                      />
                    </td>
                    <td className="px-6 py-4 text-right">
                      <a 
                        href={problem.link} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="inline-flex items-center p-2 rounded-lg text-indigo-400 hover:bg-indigo-500/10 hover:text-indigo-300 transition-colors"
                      >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                        </svg>
                      </a>
                    </td>
                  </tr>

                  {/* Expanded Row for Notes (interpolate-size animated) */}
                  <tr>
                    <td colSpan={6} className="p-0 border-0">
                      <div className={`expandable-row-content ${isExpanded ? 'expanded' : ''}`}>
                        <div className="px-10 pb-6 pt-2">
                          <NotesEditor 
                            initialNotes={problem.notes || ''} 
                            onSave={(notes) => onUpdateProblem(problem.id!, { notes })} 
                          />
                        </div>
                      </div>
                    </td>
                  </tr>
                </React.Fragment>
              );
            })}
          </tbody>
        </table>
      </div>
      {Math.ceil(problems.length / pageSize) > 1 && (
        <div className="flex items-center justify-between px-6 py-3 border-t border-border bg-surface">
          <div className="text-sm text-text-muted">
            Showing <span className="font-medium text-white">{((currentPage - 1) * pageSize) + 1}</span> to{' '}
            <span className="font-medium text-white">{Math.min(currentPage * pageSize, problems.length)}</span> of{' '}
            <span className="font-medium text-white">{problems.length}</span> problems
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="px-3 py-1.5 rounded-lg border border-border text-text-primary disabled:opacity-50 disabled:cursor-not-allowed hover:bg-surface-raised transition-colors text-sm font-medium"
            >
              Previous
            </button>
            <button
              onClick={() => setCurrentPage(p => Math.min(Math.ceil(problems.length / pageSize), p + 1))}
              disabled={currentPage === Math.ceil(problems.length / pageSize)}
              className="px-3 py-1.5 rounded-lg border border-border text-text-primary disabled:opacity-50 disabled:cursor-not-allowed hover:bg-surface-raised transition-colors text-sm font-medium"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
