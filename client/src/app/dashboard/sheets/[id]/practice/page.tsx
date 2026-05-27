'use client';

import { use, useState, useEffect, useMemo, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useSheet } from '@/hooks/use-sheet';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { NotesEditor } from '@/components/features/sheets/notes-editor';
import { ProblemTimer } from '@/components/features/sheets/problem-timer';
import { StatusBadge } from '@/components/features/sheets/status-badge';
import { DifficultyPopover } from '@/components/features/sheets/difficulty-popover';
import { TopicsPopover } from '@/components/features/sheets/topics-popover';
import toast from 'react-hot-toast';

export default function PracticePage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const router = useRouter();
  const { sheet, problems, isLoading, error, updateProblem } = useSheet(resolvedParams.id);

  const practiceQueue = useMemo(() => {
    return problems.filter(p => p.status !== 'solved');
  }, [problems]);

  const [currentIndex, setCurrentIndex] = useState(0);
  
  useEffect(() => {
    if (practiceQueue.length > 0 && currentIndex >= practiceQueue.length) {
      setCurrentIndex(Math.max(0, practiceQueue.length - 1));
    }
  }, [practiceQueue.length, currentIndex]);

  const currentProblem = practiceQueue[currentIndex];

  const handleNext = useCallback(() => {
    if (currentIndex < practiceQueue.length - 1) {
      setCurrentIndex(c => c + 1);
    }
  }, [currentIndex, practiceQueue.length]);

  const handlePrev = useCallback(() => {
    if (currentIndex > 0) {
      setCurrentIndex(c => c - 1);
    }
  }, [currentIndex]);

  const handleSolve = useCallback(async () => {
    if (!currentProblem) return;
    createSimpleConfetti();
    try {
      await updateProblem(currentProblem.id!, { status: 'solved' });
      toast.success('Problem solved!');
    } catch (err) {
      toast.error('Failed to update status');
    }
  }, [currentProblem, updateProblem]);

  const handleAttempt = useCallback(async () => {
    if (!currentProblem) return;
    try {
      await updateProblem(currentProblem.id!, { status: 'attempted' });
      handleNext();
    } catch (err) {
      toast.error('Failed to update status');
    }
  }, [currentProblem, updateProblem, handleNext]);

  const handleNotesSave = useCallback((notes: string) => {
    if (!currentProblem) return;
    updateProblem(currentProblem.id!, { notes }).catch(() => {
      toast.error('Failed to save notes');
    });
  }, [currentProblem, updateProblem]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (['TEXTAREA', 'INPUT'].includes((e.target as HTMLElement).tagName)) return;
      switch (e.key) {
        case 'ArrowRight':
          handleNext();
          break;
        case 'ArrowLeft':
          handlePrev();
          break;
        case 's':
        case 'S':
          handleSolve();
          break;
        case 'a':
        case 'A':
          handleAttempt();
          break;
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleNext, handlePrev, handleSolve, handleAttempt]);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-screen bg-zinc-950">
        <LoadingSpinner className="w-8 h-8 text-indigo-500" />
      </div>
    );
  }

  if (error || !sheet) {
    return (
      <div className="flex justify-center items-center h-screen bg-zinc-950 text-rose-400">
        {error || 'Sheet not found'}
      </div>
    );
  }

  if (practiceQueue.length === 0) {
    return (
      <div className="flex justify-center items-center h-screen bg-zinc-950 animate-fade-in px-6">
        <div className="max-w-xl text-center">
          <div className="w-20 h-20 bg-emerald-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg className="w-10 h-10 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="text-3xl font-bold text-white mb-4">You did it!</h2>
          <p className="text-zinc-400 mb-8 text-lg">You have successfully solved all problems in "{sheet.name}".</p>
          <Link href={`/dashboard/sheets/${sheet.id}`} className="px-6 py-3 bg-white hover:bg-zinc-200 text-black rounded-lg transition-colors font-semibold">
            Return to Sheet
          </Link>
        </div>
      </div>
    );
  }

  const diffId = `flow-diff-${currentProblem.id}`;
  const topicId = `flow-topic-${currentProblem.id}`;

  return (
    <div className="fixed inset-0 z-50 bg-zinc-950 flex flex-col text-white">
      {/* Header */}
      <header className="flex-none h-16 px-6 border-b border-zinc-800 flex items-center justify-between bg-zinc-950/80 backdrop-blur-md">
        <div className="flex items-center gap-4">
          <Link href={`/dashboard/sheets/${sheet.id}`} className="text-zinc-400 hover:text-white transition-colors flex items-center gap-2 text-sm font-medium">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Exit Flow
          </Link>
          <div className="w-px h-4 bg-zinc-800 hidden sm:block"></div>
          <span className="text-zinc-500 text-sm font-medium hidden sm:block">{sheet.name}</span>
        </div>
        <div className="flex items-center gap-6">
          <div className="text-zinc-400 text-sm font-medium">
            {currentIndex + 1} <span className="text-zinc-600">/</span> {practiceQueue.length}
          </div>
          <ProblemTimer resetTrigger={currentIndex} />
        </div>
      </header>

      {/* Main Split Layout */}
      <main className="flex-1 flex flex-col lg:flex-row overflow-hidden">
        {/* Left Side: Question Details & Actions */}
        <div className="flex-1 overflow-y-auto p-6 lg:p-12 flex flex-col max-w-4xl mx-auto w-full">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-6">
              <StatusBadge status={currentProblem.status || 'unsolved'} />
              
              {/* Difficulty Popover */}
              <div className="relative">
                {/* @ts-ignore */}
                <button
                  popoverTarget={diffId}
                  className={`group inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold uppercase tracking-wider border transition-all cursor-pointer hover:shadow-md
                    ${currentProblem.difficulty === 'easy' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20 hover:bg-emerald-500/20 hover:border-emerald-500/40' : 
                      currentProblem.difficulty === 'medium' ? 'bg-amber-500/10 text-amber-400 border-amber-500/20 hover:bg-amber-500/20 hover:border-amber-500/40' : 
                      currentProblem.difficulty === 'hard' ? 'bg-rose-500/10 text-rose-400 border-rose-500/20 hover:bg-rose-500/20 hover:border-rose-500/40' : 
                      'bg-zinc-800 text-zinc-400 border-zinc-700 hover:bg-zinc-700 hover:border-zinc-600'}
                  `}
                >
                  {currentProblem.difficulty || 'Set Difficulty'}
                  <svg className="w-3 h-3 opacity-0 group-hover:opacity-60 transition-opacity flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                  </svg>
                </button>
                <DifficultyPopover 
                  id={diffId} 
                  currentDifficulty={currentProblem.difficulty} 
                  onSelect={(diff) => updateProblem(currentProblem.id!, { difficulty: diff })}
                />
              </div>
            </div>

            <h1 className="text-3xl lg:text-4xl font-bold tracking-tight mb-8 text-zinc-100 leading-snug">
              {currentProblem.name}
            </h1>

            {/* Topics Popover */}
            <div className="mb-10">
              <div className="flex items-center gap-2 mb-3">
                <h3 className="text-sm font-medium text-zinc-500">Topics</h3>
              </div>
              <div className="relative">
                {/* @ts-ignore */}
                <button
                  popoverTarget={topicId}
                  className="group flex flex-wrap items-center gap-2 cursor-pointer hover:bg-zinc-800/30 p-2 -m-2 rounded-lg transition-colors w-full text-left"
                >
                  {currentProblem.topics.map(t => (
                    <span key={t} className="px-3 py-1 rounded bg-zinc-800 border border-zinc-700 text-zinc-300 text-sm font-medium">
                      {t}
                    </span>
                  ))}
                  {currentProblem.topics.length === 0 && (
                    <span className="text-zinc-500 text-sm italic group-hover:text-indigo-400">Click to add topics...</span>
                  )}
                  <span className="inline-flex items-center gap-1 ml-1 opacity-0 group-hover:opacity-100 transition-opacity text-zinc-500 text-xs">
                    <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                    </svg>
                    Edit
                  </span>
                </button>
                <TopicsPopover 
                  id={topicId}
                  currentTopics={currentProblem.topics}
                  onSave={(topics) => updateProblem(currentProblem.id!, { topics })}
                />
              </div>
            </div>

            <a 
              href={currentProblem.link} 
              target="_blank" 
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-6 py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg font-medium transition-colors"
            >
              Solve on Platform
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
            </a>
          </div>

          {/* Action Bar */}
          <div className="mt-12 pt-6 border-t border-zinc-800 flex items-center justify-between gap-4">
            <button 
              onClick={handlePrev}
              disabled={currentIndex === 0}
              className="w-12 h-12 rounded-lg bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-400 hover:text-white hover:bg-zinc-800 disabled:opacity-30 disabled:pointer-events-none transition-colors"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>

            <div className="flex-1 flex gap-3 max-w-md">
              <button 
                onClick={handleAttempt}
                className="flex-1 py-3 px-4 rounded-lg font-semibold text-zinc-300 bg-zinc-900 border border-zinc-800 hover:text-amber-400 hover:border-amber-500/30 transition-colors group flex flex-col items-center justify-center relative"
              >
                Attempted
                <span className="text-[10px] text-zinc-500 mt-0.5 group-hover:text-amber-500/70">Press A</span>
              </button>
              <button 
                onClick={handleSolve}
                className="flex-1 py-3 px-4 rounded-lg font-semibold text-zinc-300 bg-zinc-900 border border-zinc-800 hover:text-emerald-400 hover:border-emerald-500/30 transition-colors group flex flex-col items-center justify-center relative"
              >
                Solved
                <span className="text-[10px] text-zinc-500 mt-0.5 group-hover:text-emerald-500/70">Press S</span>
              </button>
            </div>

            <button 
              onClick={handleNext}
              disabled={currentIndex === practiceQueue.length - 1}
              className="w-12 h-12 rounded-lg bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-400 hover:text-white hover:bg-zinc-800 disabled:opacity-30 disabled:pointer-events-none transition-colors"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>
        </div>

        {/* Right Side: Notes */}
        <div className="lg:w-[450px] xl:w-[500px] bg-zinc-900/50 border-t lg:border-t-0 lg:border-l border-zinc-800 p-6 lg:p-8 flex flex-col">
          <NotesEditor 
            initialNotes={currentProblem.notes || ''} 
            onSave={handleNotesSave} 
          />
        </div>
      </main>
    </div>
  );
}

function createSimpleConfetti() {
  const colors = ['#10b981', '#6366f1', '#f59e0b', '#ec4899', '#ffffff'];
  for (let i = 0; i < 70; i++) {
    const el = document.createElement('div');
    el.style.position = 'fixed';
    el.style.left = '50%';
    el.style.top = '50%';
    el.style.width = Math.random() > 0.5 ? '8px' : '5px';
    el.style.height = el.style.width;
    el.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
    el.style.borderRadius = Math.random() > 0.5 ? '50%' : '2px';
    el.style.pointerEvents = 'none';
    el.style.zIndex = '99999';
    
    const angle = Math.random() * Math.PI * 2;
    const velocity = 8 + Math.random() * 15;
    const vx = Math.cos(angle) * velocity;
    const vy = Math.sin(angle) * velocity - 5;
    
    let x = 0;
    let y = 0;
    let rotation = Math.random() * 360;
    let rotationSpeed = (Math.random() - 0.5) * 10;
    
    document.body.appendChild(el);
    
    const animate = () => {
      x += vx;
      y += vy + 3; // gravity
      rotation += rotationSpeed;
      el.style.transform = `translate(${x}px, ${y}px) rotate(${rotation}deg)`;
      el.style.opacity = (1 - (y / window.innerHeight)).toString();
      
      if (y < window.innerHeight) {
        requestAnimationFrame(animate);
      } else {
        el.remove();
      }
    };
    
    requestAnimationFrame(animate);
  }
}
