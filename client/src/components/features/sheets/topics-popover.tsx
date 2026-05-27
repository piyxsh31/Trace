import React, { useState, useEffect } from 'react';

interface TopicsPopoverProps {
  id: string; // unique ID for popover target
  currentTopics: string[];
  onSave: (topics: string[]) => void;
}

export function TopicsPopover({ id, currentTopics, onSave }: TopicsPopoverProps) {
  const [topics, setTopics] = useState<string[]>(currentTopics);
  const [input, setInput] = useState('');

  // Sync local state when the problem changes (e.g. navigating in flow mode)
  useEffect(() => {
    setTopics(currentTopics);
    setInput('');
  }, [currentTopics]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addTopic();
    }
  };

  const addTopic = () => {
    const trimmed = input.trim().toLowerCase();
    if (trimmed && !topics.includes(trimmed) && topics.length < 10) {
      setTopics([...topics, trimmed]);
      setInput('');
    }
  };

  const removeTopic = (topic: string) => {
    setTopics(topics.filter(t => t !== topic));
  };

  const handleSave = () => {
    onSave(topics);
    const popover = document.getElementById(id);
    if (popover) {
      // @ts-ignore
      popover.hidePopover();
    }
  };

  const anchorName = `--anchor-${id}`;

  return (
    <>
      {/* Inject real CSS for anchor positioning — React inline styles don't support these new properties */}
      <style>{`
        [popovertarget="${id}"] { anchor-name: ${anchorName}; }
        #${id} {
          position-anchor: ${anchorName};
          position-area: block-end span-inline-end;
          position-try-fallbacks: flip-block, flip-inline, flip-block flip-inline;
          margin-top: 6px;
        }
      `}</style>
      <div
        id={id}
        // @ts-ignore
        popover="auto"
        className="bg-zinc-900 border border-zinc-700/50 rounded-xl shadow-xl shadow-black/50 p-4 backdrop-blur-md min-w-[280px]"
      >
      <div className="mb-4">
        <label className="block text-xs font-medium text-zinc-400 mb-1">Add Topic</label>
        <div className="flex gap-2">
          <input 
            type="text" 
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="e.g. dynamic programming"
            className="flex-1 bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-1.5 text-sm text-white focus:outline-none focus:border-indigo-500"
          />
          <button 
            onClick={addTopic}
            disabled={topics.length >= 10 || !input.trim()}
            className="bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white rounded-lg px-3 py-1.5 text-sm font-medium transition-colors"
          >
            Add
          </button>
        </div>
        {topics.length >= 10 && <p className="text-xs text-rose-400 mt-1">Maximum 10 topics allowed.</p>}
      </div>

      <div className="flex flex-wrap gap-1.5 mb-4 max-h-[150px] overflow-y-auto pr-1">
        {topics.map(t => (
          <span key={t} className="inline-flex items-center px-2 py-1 rounded bg-indigo-500/10 text-indigo-400 text-xs border border-indigo-500/20 group">
            {t}
            <button 
              onClick={() => removeTopic(t)}
              className="ml-1 opacity-50 hover:opacity-100 hover:text-white transition-opacity"
            >
              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </span>
        ))}
        {topics.length === 0 && (
          <span className="text-xs text-zinc-500 italic">No topics added.</span>
        )}
      </div>

      <div className="flex justify-end gap-2 pt-3 border-t border-zinc-800/50">
        <button 
          onClick={handleSave}
          className="bg-zinc-100 hover:bg-white text-zinc-900 rounded-lg px-4 py-1.5 text-sm font-semibold transition-colors w-full"
        >
          Save Topics
        </button>
      </div>
      </div>
    </>
  );
}
