import React, { useMemo } from 'react';
import Link from 'next/link';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import type { Sheet, Problem } from '@/types/sheet';

interface SheetHeaderProps {
  sheet: Sheet;
  problems: Problem[];
}

export function SheetHeader({ sheet, problems }: SheetHeaderProps) {
  const { solvedCount, progress } = useMemo(() => {
    if (problems.length === 0) return { solvedCount: 0, progress: 0 };
    const solved = problems.filter((p) => p.status === 'solved').length;
    return {
      solvedCount: solved,
      progress: Math.round((solved / problems.length) * 100),
    };
  }, [problems]);

  return (
    <div className="glass-card flex flex-col md:flex-row items-start md:items-center justify-between gap-6 p-6 mb-8">
      <div className="flex-1 w-full">
        <h1 className="text-2xl font-bold text-white mb-2">{sheet.name}</h1>
        {sheet.description && (
          <p className="text-zinc-400 text-sm mb-4">{sheet.description}</p>
        )}
        
        <div className="flex items-center gap-4 text-sm text-zinc-300">
          <div className="w-48">
            <Progress value={progress} />
          </div>
          <span>
            {solvedCount} / {problems.length} Solved ({progress}%)
          </span>
        </div>
      </div>

      <Link href={`/dashboard/sheets/${sheet.id}/practice`}>
        <Button variant="primary" className="whitespace-nowrap">
          <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          Enter Flow State
        </Button>
      </Link>
    </div>
  );
}
