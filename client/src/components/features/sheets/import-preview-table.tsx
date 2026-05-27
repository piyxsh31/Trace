'use client';

import React from 'react';
import type { Problem } from '@/types/sheet';

interface ImportPreviewTableProps {
  problems: Problem[];
}

const DIFFICULTY_STYLES: Record<string, string> = {
  easy: 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/20',
  medium: 'bg-amber-500/15 text-amber-400 border border-amber-500/20',
  hard: 'bg-rose-500/15 text-rose-400 border border-rose-500/20',
};

/** Extract the hostname from a URL for compact display */
function getHostname(url: string): string {
  try {
    return new URL(url).hostname.replace('www.', '');
  } catch {
    return url.length > 30 ? url.slice(0, 30) + '…' : url;
  }
}

export const ImportPreviewTable: React.FC<ImportPreviewTableProps> = ({ problems }) => {
  if (problems.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 rounded-xl border border-dashed border-zinc-800 bg-zinc-900/30">
        <p className="text-sm text-zinc-400">No problems found after applying the mapping.</p>
        <p className="text-xs text-zinc-600 mt-1">Go back and check your column mapping.</p>
      </div>
    );
  }

  return (
    <div className="w-full space-y-3">
      {/* Count header */}
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-zinc-300">
          <span className="text-indigo-400 font-semibold">{problems.length}</span>{' '}
          {problems.length === 1 ? 'problem' : 'problems'} ready to import
        </p>
        {problems.length > 10 && (
          <p className="text-xs text-zinc-500">Scroll to see all</p>
        )}
      </div>

      {/* Table */}
      <div className="rounded-xl border border-zinc-800 overflow-hidden">
        {/* Sticky header */}
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-zinc-800 bg-zinc-900/80">
                <th className="w-10 px-3 py-2.5 text-left text-xs font-medium text-zinc-500 uppercase tracking-wide">#</th>
                <th className="px-3 py-2.5 text-left text-xs font-medium text-zinc-500 uppercase tracking-wide">Name</th>
                <th className="px-3 py-2.5 text-left text-xs font-medium text-zinc-500 uppercase tracking-wide hidden sm:table-cell">Link</th>
                <th className="px-3 py-2.5 text-left text-xs font-medium text-zinc-500 uppercase tracking-wide hidden md:table-cell">Topics</th>
                <th className="px-3 py-2.5 text-left text-xs font-medium text-zinc-500 uppercase tracking-wide">Level</th>
              </tr>
            </thead>
          </table>
        </div>

        {/* Scrollable body */}
        <div className="overflow-y-auto max-h-[320px] overflow-x-auto">
          <table className="w-full text-sm">
            <tbody>
              {problems.map((problem, i) => (
                <tr
                  key={i}
                  className={[
                    'border-b border-zinc-800/50 last:border-0 transition-colors duration-100',
                    i % 2 === 0 ? 'bg-zinc-900/20' : 'bg-zinc-900/50',
                  ].join(' ')}
                >
                  {/* # */}
                  <td className="w-10 px-3 py-2.5 text-xs text-zinc-600 font-mono">{i + 1}</td>

                  {/* Name */}
                  <td className="px-3 py-2.5">
                    <span className="text-zinc-200 font-medium line-clamp-1">{problem.name}</span>
                  </td>

                  {/* Link */}
                  <td className="px-3 py-2.5 hidden sm:table-cell">
                    {problem.link ? (
                      <a
                        href={problem.link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-indigo-400 hover:text-indigo-300 hover:underline transition-colors duration-150"
                        title={problem.link}
                      >
                        {getHostname(problem.link)}
                      </a>
                    ) : (
                      <span className="text-xs text-zinc-600">—</span>
                    )}
                  </td>

                  {/* Topics */}
                  <td className="px-3 py-2.5 hidden md:table-cell">
                    {problem.topics.length > 0 ? (
                      <div className="flex flex-wrap gap-1">
                        {problem.topics.slice(0, 3).map((topic) => (
                          <span
                            key={topic}
                            className="inline-flex items-center px-1.5 py-0.5 rounded text-xs bg-zinc-800 text-zinc-400 border border-zinc-700/50"
                          >
                            {topic}
                          </span>
                        ))}
                        {problem.topics.length > 3 && (
                          <span className="text-xs text-zinc-600">+{problem.topics.length - 3}</span>
                        )}
                      </div>
                    ) : (
                      <span className="text-xs text-zinc-600">—</span>
                    )}
                  </td>

                  {/* Difficulty */}
                  <td className="px-3 py-2.5">
                    {problem.difficulty ? (
                      <span
                        className={[
                          'inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium capitalize',
                          DIFFICULTY_STYLES[problem.difficulty],
                        ].join(' ')}
                      >
                        {problem.difficulty}
                      </span>
                    ) : (
                      <span className="text-xs text-zinc-600">—</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
