import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Check, Download } from 'lucide-react';
import useDebounce from '../hooks/useDebounce';
import { useSteps } from '../hooks/useSteps';

export interface NotesJournalProps {
  stepKey: string;
  initialNotes?: string;
  onSaveNotes: (stepKey: string, notes: string) => void;
}

const NotesJournal = React.memo(({ stepKey, initialNotes: initialNotesProp, onSaveNotes }: NotesJournalProps): React.JSX.Element => {
  const initialNotes = initialNotesProp || '';
  const { exportStudyGuide } = useSteps();
  const [notes, setNotes] = useState<string>(initialNotes);
  const [saveStatus, setSaveStatus] = useState<'saved' | 'saving'>('saved');
  const debouncedNotes = useDebounce<string>(notes, 500);

  const notesRef = useRef<string>(notes);
  useEffect(() => {
    notesRef.current = notes;
  }, [notes]);
  const lastSavedRef = useRef<string>(initialNotes);

  const flushNotes = useCallback((textToSave: string) => {
    if (textToSave !== lastSavedRef.current) {
      lastSavedRef.current = textToSave;
      setSaveStatus('saving');
      onSaveNotes(stepKey, textToSave);
      const timer = setTimeout(() => setSaveStatus('saved'), 400);
      return () => clearTimeout(timer);
    }
  }, [stepKey, onSaveNotes]);

  // Handle auto-saving debounced notes
  useEffect(() => {
    flushNotes(debouncedNotes);
  }, [debouncedNotes, flushNotes]);

  // Flush pending edits immediately on unmount, pagehide (mobile), or browser tab close
  useEffect(() => {
    const handleTeardown = () => {
      if (notesRef.current !== lastSavedRef.current) {
        lastSavedRef.current = notesRef.current;
        onSaveNotes(stepKey, notesRef.current);
      }
    };
    window.addEventListener('beforeunload', handleTeardown);
    window.addEventListener('pagehide', handleTeardown);
    return () => {
      window.removeEventListener('beforeunload', handleTeardown);
      window.removeEventListener('pagehide', handleTeardown);
      if (notesRef.current !== lastSavedRef.current) {
        lastSavedRef.current = notesRef.current;
        onSaveNotes(stepKey, notesRef.current);
      }
    };
  }, [stepKey, onSaveNotes]);

  return (
    <div className="mt-14 pt-8 border-t border-border/80">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center space-x-2">
          <h3 id={`notes-heading-${stepKey}`} className="text-lg font-bold text-foreground">Your Notes & Code Log</h3>
          <span className="text-xs text-muted-foreground">(Persisted locally)</span>
        </div>
        <div className="flex items-center space-x-3 text-xs">
          <button
            onClick={exportStudyGuide}
            type="button"
            title="Download personal Markdown study guide with notes & progress"
            aria-label="Download personal Markdown study guide with notes & progress"
            className="flex items-center space-x-1.5 px-2.5 py-1 rounded-md bg-secondary/50 hover:bg-secondary text-muted-foreground hover:text-foreground border border-border/70 transition-colors cursor-pointer group"
          >
            <Download className="w-3.5 h-3.5 text-muted-foreground group-hover:text-primary transition-colors" aria-hidden="true" />
            <span className="hidden sm:inline font-medium">Export Notes</span>
          </button>

          <div
            role="status"
            aria-live="polite"
            aria-atomic="true"
            className="text-muted-foreground flex items-center space-x-1"
          >
            {saveStatus === 'saving' ? (
              <span className="text-amber-400">Saving...</span>
            ) : (
              <span className="text-emerald-400 flex items-center space-x-1">
                <Check className="w-3 h-3" aria-hidden="true" />
                <span>Saved</span>
              </span>
            )}
          </div>
        </div>
      </div>
      <label htmlFor={`notes-input-${stepKey}`} className="sr-only">
        Notes and code log for this step
      </label>
      <textarea
        id={`notes-input-${stepKey}`}
        value={notes}
        onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setNotes(e.target.value)}
        onBlur={() => flushNotes(notes)}
        placeholder="Log key insights, terminal outputs, or design decisions for this step..."
        className="w-full h-36 p-3.5 bg-secondary/40 text-foreground placeholder:text-muted-foreground/60 rounded-lg border border-border focus:ring-2 focus:ring-primary focus:border-transparent focus:outline-none transition-all text-sm font-sans"
      />
    </div>
  );
});

export default NotesJournal;
