import React from 'react';
import type { Problem } from '@/types/sheet';

interface DifficultyPopoverProps {
  id: string; // unique ID for popover target
  currentDifficulty: Problem['difficulty'];
  onSelect: (newDifficulty: Problem['difficulty']) => void;
}

export function DifficultyPopover({ id, currentDifficulty, onSelect }: DifficultyPopoverProps) {
  const anchorName = `--anchor-${id}`;

  const options: { label: string; value: Problem['difficulty']; colorClasses: string }[] = [
    { label: 'None', value: '', colorClasses: 'text-zinc-400 hover:bg-zinc-800' },
    { label: 'Easy', value: 'easy', colorClasses: 'text-emerald-400 hover:bg-emerald-500/10' },
    { label: 'Medium', value: 'medium', colorClasses: 'text-amber-400 hover:bg-amber-500/10' },
    { label: 'Hard', value: 'hard', colorClasses: 'text-rose-400 hover:bg-rose-500/10' },
  ];

  return (
    <>
      {/* Inject real CSS for anchor positioning — React inline styles don't support these new properties */}
      <style>{`
        [popovertarget="${id}"] { anchor-name: ${anchorName}; }
        #${id} {
          position-anchor: ${anchorName};
          position-area: block-end span-inline-end;
          position-try-fallbacks: flip-block;
          margin-top: 6px;
        }
      `}</style>
      <div
        id={id}
        // @ts-ignore
        popover="auto"
        className="bg-zinc-900 border border-zinc-700/50 rounded-xl shadow-xl shadow-black/50 p-1 backdrop-blur-md"
      >
        <div className="flex flex-col gap-0.5 min-w-[120px]">
          {options.map((opt) => (
            <button
              key={opt.value}
              type="button"
              className={`flex items-center justify-between px-3 py-2 rounded-lg text-sm font-medium transition-colors ${opt.colorClasses} ${currentDifficulty === opt.value ? 'bg-zinc-800/50' : ''}`}
              onClick={() => {
                onSelect(opt.value);
                const popover = document.getElementById(id);
                if (popover) {
                  // @ts-ignore - hidePopover is a native method on HTML element for popovers
                  popover.hidePopover();
                }
              }}
            >
              {opt.label}
              {currentDifficulty === opt.value && (
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              )}
            </button>
          ))}
        </div>
      </div>
    </>
  );
}
