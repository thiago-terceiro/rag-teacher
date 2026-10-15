import React, { useState, useEffect } from 'react';
import { Check } from 'lucide-react';
import useDebounce from '../hooks/useDebounce';

const NotesJournal = React.memo(({ stepKey, initialNotes = '', onSaveNotes }) => {
  const [notes, setNotes] = useState(initialNotes);
  const [saveStatus, setSaveStatus] = useState('saved'); // 'saved' | 'saving'
  const debouncedNotes = useDebounce(notes, 500);

  // Sync internal state if user switched to another step
  useEffect(() => {
    setNotes(initialNotes || '');
    setSaveStatus('saved');
  }, [stepKey, initialNotes]);

  // Handle auto-saving debounced notes
  useEffect(() => {
    if (debouncedNotes !== (initialNotes || '')) {
      setSaveStatus('saving');
      onSaveNotes(stepKey, debouncedNotes);
      const timer = setTimeout(() => setSaveStatus('saved'), 500);
      return () => clearTimeout(timer);
    }
  }, [debouncedNotes, stepKey, onSaveNotes, initialNotes]);

  return (
    <div className="mt-14 pt-8 border-t border-border/80">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center space-x-2">
          <h3 className="text-lg font-bold text-foreground">Your Notes & Code Log</h3>
          <span className="text-xs text-muted-foreground">(Persisted locally)</span>
        </div>
        <div className="text-xs text-muted-foreground flex items-center space-x-1">
          {saveStatus === 'saving' ? (
            <span className="text-amber-400">Saving...</span>
          ) : (
            <span className="text-emerald-400 flex items-center space-x-1">
              <Check className="w-3 h-3" />
              <span>Saved</span>
            </span>
          )}
        </div>
      </div>
      <textarea
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
        placeholder="Log key insights, terminal outputs, or design decisions for this step..."
        className="w-full h-36 p-3.5 bg-secondary/40 text-foreground placeholder:text-muted-foreground/60 rounded-lg border border-border focus:ring-2 focus:ring-primary focus:border-transparent focus:outline-none transition-all text-sm font-sans"
      />
    </div>
  );
});

export default NotesJournal;
