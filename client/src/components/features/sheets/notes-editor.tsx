import React, { useState, useEffect, useRef } from 'react';

interface NotesEditorProps {
  initialNotes: string;
  onSave: (notes: string) => void;
}

export function NotesEditor({ initialNotes, onSave }: NotesEditorProps) {
  const [notes, setNotes] = useState(initialNotes || '');
  const [isSaving, setIsSaving] = useState(false);
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Sync initial notes if it changes from outside
  useEffect(() => {
    setNotes(initialNotes || '');
  }, [initialNotes]);

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value;
    setNotes(val);
    setIsSaving(true);

    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    saveTimeoutRef.current = setTimeout(() => {
      onSave(val);
      setIsSaving(false);
    }, 1000); // 1-second debounce
  };

  return (
    <div className="flex flex-col h-full w-full bg-zinc-900/30 rounded-xl overflow-hidden relative border border-zinc-800/50">
      <div className="flex items-center justify-between px-4 py-2 border-b border-zinc-800/50 bg-zinc-900/50">
        <h3 className="text-sm font-medium text-zinc-300 flex items-center gap-2">
          <svg className="w-4 h-4 text-zinc-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
          </svg>
          Notes
        </h3>
        <span className="text-xs text-zinc-500">
          {isSaving ? 'Saving...' : 'Saved'}
        </span>
      </div>
      <textarea
        value={notes}
        onChange={handleChange}
        placeholder="Write down your approach, time complexity, and takeaways here. Supports basic markdown format."
        className="flex-1 w-full p-4 bg-transparent text-sm text-zinc-300 resize-y min-h-[150px] focus:outline-none focus:ring-0 leading-relaxed placeholder:text-zinc-600"
      />
    </div>
  );
}
