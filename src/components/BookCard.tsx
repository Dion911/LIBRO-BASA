import React, { useState, useEffect, useRef } from 'react';
import { Book, BookStatus } from '../types';
import { Star, Edit2, Trash2, Circle, MessageSquare, ChevronDown, ChevronUp, CheckCircle2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export interface BookCardProps {
  book: Book;
  onEdit: (book: Book) => void;
  onDelete: (id: string) => void;
  onStatusChange: (id: string, status: BookStatus) => void;
  onQuickLog?: (bookId: string) => void;
  onAddNote: (bookId: string, content: string, page: number) => void;
}

export const BookCard: React.FC<BookCardProps> = ({ book, onEdit, onDelete, onStatusChange, onQuickLog, onAddNote }) => {
  const [isNotesExpanded, setIsNotesExpanded] = useState(false);
  const [isAddingNote, setIsAddingNote] = useState(false);
  const [newNoteContent, setNewNoteContent] = useState('');
  const [newNotePage, setNewNotePage] = useState<number>(book.currentPage || 0);
  const [justFinished, setJustFinished] = useState(false);
  const prevStatusRef = useRef(book.status);

  useEffect(() => {
    if (prevStatusRef.current !== 'finished' && book.status === 'finished') {
      setJustFinished(true);
      const timer = setTimeout(() => setJustFinished(false), 2500);
      return () => clearTimeout(timer);
    }
    prevStatusRef.current = book.status;
  }, [book.status]);

  const handleSaveNote = () => {
    if (newNoteContent.trim()) {
      onAddNote(book.id, newNoteContent, newNotePage);
      setNewNoteContent('');
      setIsAddingNote(false);
    }
  };

  const progress = book.totalPages && book.currentPage 
    ? (book.currentPage / book.totalPages) * 100 
    : 0;

  return (
    <motion.div 
      layout
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      className="bg-braun-bg border border-braun-panel p-6 flex flex-col gap-6 relative group transition-all duration-300 hover:shadow-xl hover:border-braun-accent/20"
    >
      {/* Subtle Finished Glow */}
      <AnimatePresence>
        {justFinished && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: [0, 1, 0] }}
            transition={{ duration: 2, ease: "easeInOut" }}
            className="absolute inset-0 pointer-events-none border-2 border-green-500/40 shadow-[0_0_20px_rgba(34,197,94,0.15)] z-20"
          />
        )}
      </AnimatePresence>

      {/* Top Info Section */}
      <div className="flex gap-6">
        <div className="w-24 h-32 bg-braun-panel/20 border border-braun-panel flex-shrink-0 overflow-hidden relative analog-inset">
          {book.coverUrl ? (
            <img 
              src={book.coverUrl} 
              alt={book.title} 
              className="w-full h-full object-cover grayscale hover:grayscale-0 transition-all duration-500 hover:scale-110"
              referrerPolicy="no-referrer"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center opacity-10">
              <Circle className="w-8 h-8" />
            </div>
          )}
          <div className="absolute top-0 left-0 w-full h-full pointer-events-none dot-pattern opacity-10" />
        </div>
        
        <div className="flex-1 flex flex-col justify-between">
          <div className="flex justify-between items-start">
            <div>
              <div className="flex items-center gap-2 mb-2 relative">
                <div className={`w-2 h-2 rounded-full transition-colors duration-500 ${book.status === 'reading' ? 'bg-braun-accent orange-glow' : book.status === 'finished' ? 'bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)]' : 'bg-braun-ink/20'}`} />
                <AnimatePresence mode="wait">
                  <motion.span 
                    key={book.status}
                    initial={{ opacity: 0, y: 2 }}
                    animate={{ opacity: 0.4, y: 0 }}
                    exit={{ opacity: 0, y: -2 }}
                    transition={{ duration: 0.2, ease: "easeOut" }}
                    className="text-[9px] font-mono uppercase tracking-widest"
                  >
                    {book.status.replace('-', '_')}
                  </motion.span>
                </AnimatePresence>
                
                <AnimatePresence>
                  {justFinished && (
                    <motion.div
                      initial={{ opacity: 0, y: 0, scale: 0.8 }}
                      animate={{ opacity: 1, y: -20, scale: 1 }}
                      exit={{ opacity: 0, y: -30 }}
                      transition={{ duration: 1.5, ease: "easeOut" }}
                      className="absolute left-0 -top-2 text-green-500 flex items-center gap-1 whitespace-nowrap z-10 bg-braun-bg px-2 py-1 rounded-sm border border-green-500/20 shadow-sm"
                    >
                      <CheckCircle2 className="w-3 h-3" />
                      <span className="text-[8px] font-mono uppercase tracking-widest font-bold">Completed!</span>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
              <h3 className="text-lg font-bold leading-tight mb-1 uppercase tracking-tight">
                {book.title}
              </h3>
              <p className="text-[11px] font-mono opacity-60 uppercase">BY {book.author}</p>
            </div>
            
            {(book.status === 'reading' || book.status === 'to-read') && onQuickLog && (
              <motion.button 
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => onQuickLog(book.id)}
                className="bg-braun-accent text-white px-3 py-1.5 rounded-sm text-[9px] font-bold uppercase tracking-widest hover:brightness-110 transition-all orange-glow"
              >
                {book.status === 'reading' ? 'Log' : 'Start'}
              </motion.button>
            )}
          </div>

          <div className="flex items-center justify-between">
            <motion.div 
              whileHover={{ x: 2 }}
              className="flex gap-1"
            >
              {[...Array(5)].map((_, i) => (
                <div 
                  key={i} 
                  className={`w-1.5 h-1.5 rounded-full transition-all duration-300 ${i < (book.rating || 0) ? 'bg-braun-accent orange-glow' : 'bg-braun-ink/10'}`} 
                />
              ))}
            </motion.div>

            {((book.notes && book.notes.length > 0) || true) && (
              <button 
                onClick={() => setIsNotesExpanded(!isNotesExpanded)}
                className="flex items-center gap-1.5 text-[9px] font-mono uppercase tracking-widest opacity-40 hover:opacity-100 transition-opacity"
              >
                <MessageSquare className="w-3 h-3" />
                {book.notes?.length || 0}
                {isNotesExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Analog Slider for Progress */}
      {(book.status === 'reading' || book.status === 'finished') && (
        <div className="space-y-3">
          <div className="flex justify-between text-[9px] font-mono uppercase opacity-40">
            <span>Progress_Tape</span>
            <span>{book.currentPage} / {book.totalPages || '???'} pp ({Math.round(progress)}%)</span>
          </div>
          <div className="relative h-6 bg-braun-panel/20 rounded-full analog-inset flex items-center px-4">
            <div className="w-full h-[2px] bg-braun-ink/10 rounded-full relative">
              <motion.div 
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
                transition={{ type: 'spring', stiffness: 50, damping: 15 }}
                className="absolute h-full bg-braun-accent orange-glow"
              />
              <motion.div 
                initial={{ left: 0 }}
                animate={{ left: `${progress}%` }}
                transition={{ type: 'spring', stiffness: 50, damping: 15 }}
                className="absolute top-1/2 -translate-y-1/2 w-4 h-4 bg-braun-accent rounded-full shadow-md z-10 -translate-x-1/2 orange-glow border-2 border-braun-bg"
              />
            </div>
          </div>
        </div>
      )}

      {/* Notes Section */}
      <AnimatePresence>
        {isNotesExpanded && (
          <motion.div 
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="space-y-3 pt-2 border-t border-braun-ink/5">
              <div className="flex justify-between items-center">
                <p className="text-[8px] font-mono uppercase tracking-widest opacity-40">Notes_Database</p>
                <button 
                  onClick={() => setIsAddingNote(!isAddingNote)}
                  className="text-[8px] font-mono uppercase tracking-widest text-braun-accent hover:underline"
                >
                  {isAddingNote ? '[ Cancel ]' : '[ + Add Note ]'}
                </button>
              </div>

              {isAddingNote && (
                <motion.div 
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-braun-panel/20 p-3 rounded-sm space-y-3 border border-braun-accent/20"
                >
                  <div className="flex gap-2">
                    <div className="flex-1">
                      <label className="text-[7px] font-mono uppercase opacity-40 block mb-1">Content</label>
                      <textarea 
                        value={newNoteContent}
                        onChange={(e) => setNewNoteContent(e.target.value)}
                        placeholder="Type your note..."
                        className="w-full bg-braun-bg border border-braun-panel p-2 text-[10px] outline-none focus:border-braun-accent rounded-sm resize-none h-16"
                      />
                    </div>
                    <div className="w-16">
                      <label className="text-[7px] font-mono uppercase opacity-40 block mb-1">Page</label>
                      <input 
                        type="number"
                        value={newNotePage}
                        onChange={(e) => setNewNotePage(parseInt(e.target.value) || 0)}
                        className="w-full bg-braun-bg border border-braun-panel p-2 text-[10px] outline-none focus:border-braun-accent rounded-sm"
                      />
                    </div>
                  </div>
                  <button 
                    onClick={handleSaveNote}
                    disabled={!newNoteContent.trim()}
                    className="w-full bg-braun-accent text-white py-1.5 rounded-sm text-[9px] font-bold uppercase tracking-widest disabled:opacity-50"
                  >
                    Save Note
                  </button>
                </motion.div>
              )}

              <div className="space-y-2 max-h-40 overflow-y-auto pr-2 scrollbar-thin">
                {Array.isArray(book.notes) && book.notes.length > 0 ? (
                  book.notes.map((note) => (
                    <div key={note.id} className="bg-braun-panel/10 p-3 rounded-sm border-l-2 border-braun-accent space-y-1">
                      <div className="flex justify-between text-[7px] font-mono uppercase opacity-40">
                        <span>P. {note.page}</span>
                        <span>{new Date(note.date).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}</span>
                      </div>
                      <p className="text-[10px] leading-relaxed opacity-80 italic">"{note.content}"</p>
                    </div>
                  ))
                ) : !isAddingNote && (
                  <p className="text-[9px] font-mono opacity-30 text-center py-4 italic">No notes recorded for this entry.</p>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Controls */}
      <div className="flex items-center justify-between pt-4 border-t border-braun-ink/5">
        <div className="flex gap-2">
          <motion.button 
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => onEdit(book)}
            className="w-8 h-8 analog-button flex items-center justify-center rounded-sm opacity-0 group-hover:opacity-100 -translate-x-2 group-hover:translate-x-0 transition-all duration-300 hover:border-braun-accent hover:text-braun-accent"
          >
            <Edit2 className="w-3.5 h-3.5" />
          </motion.button>
          <motion.button 
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => onDelete(book.id)}
            className="w-8 h-8 analog-button flex items-center justify-center rounded-sm opacity-0 group-hover:opacity-100 -translate-x-2 group-hover:translate-x-0 transition-all duration-300 delay-75 hover:border-rose-500 hover:text-rose-500"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </motion.button>
        </div>
        
        <div className="relative">
          <select 
            value={book.status}
            onChange={(e) => onStatusChange(book.id, e.target.value as BookStatus)}
            className="text-[10px] font-mono bg-braun-panel/20 px-3 py-1.5 rounded-sm border-none focus:ring-1 focus:ring-braun-accent outline-none cursor-pointer uppercase tracking-tighter"
          >
            <option value="to-read">QUEUE</option>
            <option value="reading">ACTIVE</option>
            <option value="finished">DONE</option>
            <option value="dropped">VOID</option>
          </select>
        </div>
      </div>
    </motion.div>
  );
};
