import React from 'react';

export interface FilterState {
  search: string;
  difficulty: string;
  topic: string;
  status: string;
}

interface ProblemFiltersProps {
  filters: FilterState;
  setFilters: React.Dispatch<React.SetStateAction<FilterState>>;
  topics: string[];
}

export function ProblemFilters({ filters, setFilters, topics }: ProblemFiltersProps) {
  const handleFilterChange = (key: keyof FilterState, value: string) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  return (
    <div className="flex flex-col md:flex-row gap-4 mb-6">
      <div className="flex-1 relative">
        <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
        <input
          type="text"
          placeholder="Search problems..."
          value={filters.search}
          onChange={(e) => handleFilterChange('search', e.target.value)}
          className="w-full bg-zinc-900/50 border border-zinc-800 rounded-lg pl-10 pr-4 py-2 text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors"
        />
      </div>

      <div className="flex gap-4">
        <select
          value={filters.status}
          onChange={(e) => handleFilterChange('status', e.target.value)}
          className="bg-zinc-900/50 border border-zinc-800 rounded-lg px-4 py-2 text-sm text-zinc-100 focus:outline-none focus:border-indigo-500 transition-colors"
        >
          <option value="">All Statuses</option>
          <option value="unsolved">Unsolved</option>
          <option value="attempted">Attempted</option>
          <option value="solved">Solved</option>
        </select>

        <select
          value={filters.difficulty}
          onChange={(e) => handleFilterChange('difficulty', e.target.value)}
          className="bg-zinc-900/50 border border-zinc-800 rounded-lg px-4 py-2 text-sm text-zinc-100 focus:outline-none focus:border-indigo-500 transition-colors"
        >
          <option value="">All Difficulties</option>
          <option value="easy">Easy</option>
          <option value="medium">Medium</option>
          <option value="hard">Hard</option>
        </select>

        <select
          value={filters.topic}
          onChange={(e) => handleFilterChange('topic', e.target.value)}
          className="bg-zinc-900/50 border border-zinc-800 rounded-lg px-4 py-2 text-sm text-zinc-100 focus:outline-none focus:border-indigo-500 transition-colors"
        >
          <option value="">All Topics</option>
          {topics.map((t) => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}
