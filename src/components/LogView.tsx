import React, { useState, useEffect, useRef } from 'react';
import { Book, ReadingSession, BookStatus } from '../types';
import { RotateCcw, Play, Pause, Save, Pencil, Trash2, ChevronDown, CheckCircle2, PlayCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface LogViewProps {
  books: Book[];
  sessions: ReadingSession[];
  onAddSession: (sessionId: string, bookId: string, pages: number, notes?: string) => void;
  onDeleteSession: (sessionId: string) => void;
  onUpdateSession: (sessionId: string, pages: number, notes?: string) => void;
  onUpdateBookStatus: (bookId: string, status: BookStatus) => void;
}

export const LogView: React.FC<LogViewProps> = ({ 
  books, 
  sessions, 
  onAddSession,
  onDeleteSession,
  onUpdateSession,
  onUpdateBookStatus
}) => {
  const [selectedBookId, setSelectedBookId] = useState('');
  const [pages, setPages] = useState('');
  const [notes, setNotes] = useState('');
  const [isActive, setIsActive] = useState(false);
  const [time, setTime] = useState(0);
  const [editingSessionId, setEditingSessionId] = useState<string | null>(null);
  const [editPages, setEditPages] = useState('');
  const [editNotes, setEditNotes] = useState('');
  const [deletingSessionId, setDeletingSessionId] = useState<string | null>(null);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const availableBooks = books.filter(b => b.status === 'reading' || b.status === 'to-read');
  const currentBook = books.find(b => b.id === selectedBookId) || availableBooks[0];

  useEffect(() => {
    if (availableBooks.length > 0 && !selectedBookId) {
      setSelectedBookId(availableBooks[0].id);
    }
  }, [availableBooks, selectedBookId]);

  useEffect(() => {
    if (isActive) {
      timerRef.current = setInterval(() => {
        setTime(prev => prev + 1);
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isActive]);

  const formatTime = (seconds: number) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleToggleSession = () => {
    setIsActive(!isActive);
  };

  const handleReset = () => {
    setIsActive(false);
    setTime(0);
  };

  const handleSave = () => {
    if (!selectedBookId || !pages) return;
    onAddSession(crypto.randomUUID(), selectedBookId, parseInt(pages), notes);
    setPages('');
    setNotes('');
    handleReset();
  };

  // Stats calculations
  const today = new Date().toISOString().split('T')[0];
  const todaySessions = sessions.filter(s => s.date.startsWith(today));
  const todayPages = todaySessions.reduce((acc, s) => acc + s.pagesRead, 0);

  const oneWeekAgo = new Date();
  oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
  const weekSessions = sessions.filter(s => new Date(s.date) >= oneWeekAgo);
  const weekPages = weekSessions.reduce((acc, s) => acc + s.pagesRead, 0);
  
  // Estimate pages/hr based on last session or average
  const pagesHr = time > 0 ? Math.round((parseInt(pages) || 0) / (time / 3600)) : '-';

  return (
    <div className="max-w-md mx-auto space-y-8 pb-12">
      {/* Now Reading Header - Interactive */}
      <button 
        onClick={handleToggleSession}
        className={`w-full bg-[#D8D6D2] p-4 flex items-center justify-between border-b border-braun-panel shadow-sm transition-all active:brightness-95 text-left group/header ${
          isActive ? 'ring-1 ring-inset ring-braun-accent/20' : ''
        }`}
      >
        <div className="flex items-center gap-4">
          <div className="w-10 h-12 bg-braun-ink/80 rounded-sm overflow-hidden relative">
            {currentBook?.coverUrl ? (
              <img src={currentBook.coverUrl} className="w-full h-full object-cover grayscale group-hover/header:grayscale-0 transition-all" referrerPolicy="no-referrer" />
            ) : (
              <div className="w-full h-full bg-braun-ink/20" />
            )}
            <div className={`absolute bottom-0 left-0 right-0 h-1 transition-all ${isActive ? 'bg-braun-accent orange-glow' : 'bg-braun-ink/20'}`} />
          </div>
          <div>
            <p className="text-[8px] font-mono uppercase tracking-widest opacity-60">Now Reading</p>
            <h3 className="text-sm font-bold uppercase tracking-tight leading-tight">{currentBook?.title || 'No Active Book'}</h3>
            <p className="text-[10px] opacity-60">{currentBook?.author || 'Select a book below'}</p>
          </div>
        </div>
        <div className={`border px-3 py-1 text-[9px] font-bold uppercase tracking-widest rounded-sm transition-all ${
          isActive 
            ? 'bg-braun-accent text-white border-braun-accent orange-glow' 
            : 'text-braun-accent border-braun-accent/40 group-hover/header:bg-braun-accent/10'
        }`}>
          {isActive ? 'Active' : 'Ready'}
        </div>
      </button>

      {/* Braun Clock Visual */}
      <div className="flex flex-col items-center justify-center py-8 space-y-8">
        <div className="relative w-64 h-64 rounded-full bg-[#E6E5E2] shadow-inner flex items-center justify-center border-[12px] border-[#D1D0CC]">
          {/* Clock Face Markings */}
          <div className="absolute inset-4 rounded-full border border-braun-ink/5" />
          
          {/* Clock Hands (Minimalist Braun Style) */}
          <motion.div 
            animate={{ rotate: time * 6 }}
            transition={{ type: 'spring', stiffness: 50, damping: 20 }}
            style={{ width: '9.3px' }}
            className="absolute h-24 bg-braun-accent rounded-full origin-bottom -translate-y-12"
          />
          <div className="absolute w-4 h-4 rounded-full bg-braun-accent -translate-x-12 -translate-y-4" />
          
          {/* Center Pin */}
          <div className="w-2 h-2 rounded-full bg-braun-ink/20 z-10" />
        </div>

        {/* Digital Timer */}
        <div className="text-center space-y-2">
          <p className="text-[9px] font-mono uppercase tracking-[0.3em] opacity-40">Elapsed</p>
          <div className="bg-[#ECEBE9] px-8 py-4 rounded-sm shadow-inner border border-braun-panel/20">
            <span className="text-6xl font-space font-medium tracking-tighter text-braun-ink">
              {formatTime(time)}
            </span>
          </div>
          <p className="text-[9px] font-mono uppercase tracking-widest opacity-40 pt-2">
            {isActive ? 'Session in progress' : 'Tap start to begin'}
          </p>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-3 gap-1 px-4">
        <div className="bg-[#E9E8E6] p-4 border border-braun-panel/30">
          <p className="text-[8px] font-mono uppercase opacity-40 mb-1">Today</p>
          <p className="text-sm font-bold">{todayPages}p</p>
        </div>
        <div className="bg-[#E9E8E6] p-4 border border-braun-panel/30">
          <p className="text-[8px] font-mono uppercase opacity-40 mb-1">This Week</p>
          <p className="text-sm font-bold">{weekPages}p</p>
        </div>
        <div className="bg-[#E9E8E6] p-4 border border-braun-panel/30">
          <p className="text-[8px] font-mono uppercase opacity-40 mb-1">Reading Pace</p>
          <p className="text-sm font-bold">{pagesHr} p/h</p>
        </div>
      </div>

      {/* Input Section */}
      <div className="px-4 space-y-6">
        <div className="space-y-4">
          <div className="flex items-center justify-between gap-4">
            <span className="text-[9px] font-mono uppercase tracking-widest opacity-40">Pages Read</span>
            <div className="flex items-center gap-2">
              <button 
                onClick={() => setPages(p => Math.max(0, (parseInt(p) || 0) - 1).toString())}
                className="w-8 h-12 bg-[#E9E8E6] border border-braun-panel/30 flex items-center justify-center hover:bg-braun-panel/10 transition-colors font-mono"
              >
                -
              </button>
              <input 
                type="number"
                value={pages || ''}
                onChange={(e) => setPages(e.target.value)}
                placeholder="0"
                className="w-16 bg-[#E9E8E6] border border-braun-panel/50 px-2 py-3 text-center font-mono font-bold text-lg focus:border-braun-accent outline-none"
              />
              <button 
                onClick={() => setPages(p => ((parseInt(p) || 0) + 1).toString())}
                className="w-8 h-12 bg-[#E9E8E6] border border-braun-panel/30 flex items-center justify-center hover:bg-braun-panel/10 transition-colors font-mono"
              >
                +
              </button>
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[9px] font-mono uppercase tracking-widest opacity-40">Field Notes</span>
              <span className="text-[8px] font-mono opacity-20 uppercase">Observations & Thoughts</span>
            </div>
            <textarea 
              value={notes || ''}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="What did you discover in these pages?"
              className="w-full bg-[#E9E8E6] border border-braun-panel/30 p-4 text-xs font-sans min-h-[100px] focus:border-braun-accent outline-none resize-none placeholder:opacity-20"
            />
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2">
          <button 
            onClick={handleToggleSession}
            className={`flex-1 flex items-center justify-center gap-3 font-bold py-5 uppercase tracking-[0.2em] text-[11px] transition-all orange-glow ${
              isActive ? 'bg-braun-ink text-white' : 'bg-braun-accent text-white'
            }`}
          >
            {isActive ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
            {isActive ? 'Pause Session' : 'Start Session'}
          </button>
          <button 
            onClick={handleReset}
            className="bg-[#E9E8E6] border border-braun-panel p-5 hover:bg-braun-panel/20 transition-colors"
          >
            <RotateCcw className="w-5 h-5 opacity-60" />
          </button>
        </div>

        <button 
          onClick={handleSave}
          disabled={!pages || !selectedBookId}
          className="w-full border border-braun-panel py-4 text-[10px] font-bold uppercase tracking-[0.3em] opacity-40 hover:opacity-100 hover:bg-braun-panel/10 transition-all flex items-center justify-center gap-2"
        >
          <Save className="w-4 h-4" /> Save Session
        </button>
      </div>

      {/* Recent Sessions List */}
      <div className="px-4 space-y-4">
        <div className="flex items-center justify-between border-b border-braun-panel pb-2">
          <h3 className="text-[10px] font-mono uppercase tracking-widest opacity-40">Recent_Activity</h3>
          <span className="text-[8px] font-mono opacity-20 uppercase">Last 5 entries</span>
        </div>
        
        <div className="space-y-1">
          {sessions.length > 0 ? (
            sessions.slice(0, 5).map((session) => {
              const book = books.find(b => b.id === session.bookId);
              const isEditing = editingSessionId === session.id;
              const isDeleting = deletingSessionId === session.id;

              return (
                <div key={session.id} className="group bg-[#E9E8E6]/50 p-3 flex flex-col border border-braun-panel/10 hover:border-braun-accent/20 transition-all">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-6 h-8 bg-braun-ink/10 rounded-sm overflow-hidden flex-shrink-0">
                        {book?.coverUrl && <img src={book.coverUrl} className="w-full h-full object-cover grayscale" referrerPolicy="no-referrer" />}
                      </div>
                      <div>
                        <p className="text-[10px] font-bold uppercase truncate max-w-[100px]">{book?.title || 'Unknown'}</p>
                        <p className="text-[8px] font-mono opacity-40">{new Date(session.date).toLocaleDateString()}</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-4">
                      {isEditing ? (
                        <div className="flex flex-col items-end gap-2">
                          <div className="flex items-center gap-2">
                            <input 
                              type="number"
                              value={editPages || ''}
                              onChange={(e) => setEditPages(e.target.value)}
                              className="w-12 bg-white border border-braun-panel/50 px-1 py-1 text-center font-mono font-bold text-xs outline-none"
                              autoFocus
                            />
                            <button 
                              onClick={() => {
                                if (editPages && !isNaN(parseInt(editPages))) {
                                  onUpdateSession(session.id, parseInt(editPages), editNotes);
                                  setEditingSessionId(null);
                                }
                              }}
                              className="text-[8px] font-bold uppercase text-braun-accent"
                            >
                              OK
                            </button>
                            <button 
                              onClick={() => setEditingSessionId(null)}
                              className="text-[8px] font-bold uppercase opacity-40"
                            >
                              X
                            </button>
                          </div>
                          <textarea 
                            value={editNotes || ''}
                            onChange={(e) => setEditNotes(e.target.value)}
                            className="w-48 bg-white border border-braun-panel/30 p-2 text-[10px] min-h-[60px] outline-none resize-none"
                            placeholder="Edit notes..."
                          />
                        </div>
                      ) : isDeleting ? (
                        <div className="flex items-center gap-2">
                          <span className="text-[8px] font-bold uppercase text-red-500">Confirm?</span>
                          <button 
                            onClick={() => {
                              onDeleteSession(session.id);
                              setDeletingSessionId(null);
                            }}
                            className="text-[8px] font-bold uppercase text-red-500"
                          >
                            Yes
                          </button>
                          <button 
                            onClick={() => setDeletingSessionId(null)}
                            className="text-[8px] font-bold uppercase opacity-40"
                          >
                            No
                          </button>
                        </div>
                      ) : (
                        <>
                          <div className="text-right">
                            <p className="text-xs font-mono font-bold text-braun-accent">+{session.pagesRead}p</p>
                            <p className="text-[8px] font-mono opacity-40 uppercase">Logged</p>
                          </div>
                          
                          <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button 
                              onClick={() => {
                                setEditingSessionId(session.id);
                                setEditPages(session.pagesRead.toString());
                                setEditNotes(session.notes || '');
                                setDeletingSessionId(null);
                              }}
                              className="p-1.5 hover:bg-braun-accent/10 text-braun-ink/40 hover:text-braun-accent rounded-sm transition-colors"
                            >
                              <Pencil className="w-3 h-3" />
                            </button>
                            <button 
                              onClick={() => {
                                setDeletingSessionId(session.id);
                                setEditingSessionId(null);
                              }}
                              className="p-1.5 hover:bg-red-500/10 text-braun-ink/40 hover:text-red-500 rounded-sm transition-colors"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                  
                  {session.notes && !isEditing && (
                    <div className="mt-2 pl-9">
                      <p className="text-[10px] leading-relaxed opacity-60 italic border-l border-braun-accent/30 pl-2">
                        {session.notes}
                      </p>
                    </div>
                  )}
                </div>
              );
            })
          ) : (
            <div className="py-8 text-center border border-dashed border-braun-panel/30 rounded-sm">
              <p className="text-[9px] font-mono uppercase opacity-20 tracking-widest">No_History_Found</p>
            </div>
          )}
        </div>
      </div>

      {/* Book Selector (Custom Dropdown with Status Actions) */}
      <div className="px-4 relative">
        <button 
          onClick={() => setIsDropdownOpen(!isDropdownOpen)}
          className="w-full bg-transparent border-b border-braun-panel py-2 text-[9px] font-mono uppercase opacity-60 hover:opacity-100 outline-none flex items-center justify-between transition-opacity"
        >
          <span>Switch Book: {currentBook?.title || 'Select a book'}</span>
          <ChevronDown className={`w-3 h-3 transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`} />
        </button>
        
        <AnimatePresence>
          {isDropdownOpen && (
            <motion.div 
              initial={{ opacity: 0, y: -5 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -5 }}
              className="absolute bottom-full left-4 right-4 mb-2 bg-braun-bg border border-braun-panel shadow-xl max-h-60 overflow-y-auto z-50 rounded-sm"
            >
              {availableBooks.length > 0 ? (
                availableBooks.map(b => (
                  <div 
                    key={b.id} 
                    className={`flex items-center justify-between p-3 border-b border-braun-panel/10 last:border-0 hover:bg-braun-panel/5 transition-colors ${selectedBookId === b.id ? 'bg-braun-panel/10' : ''}`}
                  >
                    <button 
                      onClick={() => {
                        setSelectedBookId(b.id);
                        setIsDropdownOpen(false);
                      }}
                      className="flex-1 text-left text-[10px] font-bold uppercase truncate pr-4"
                    >
                      {b.title}
                      <span className="block text-[8px] font-mono opacity-40 mt-0.5">{b.author}</span>
                    </button>
                    
                    <div className="flex items-center gap-2">
                      {b.status === 'to-read' && (
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            onUpdateBookStatus(b.id, 'reading');
                            setSelectedBookId(b.id);
                          }}
                          className="flex items-center gap-1 bg-braun-accent/10 text-braun-accent hover:bg-braun-accent hover:text-white px-2 py-1 rounded-sm text-[8px] font-bold uppercase tracking-widest transition-colors"
                        >
                          <PlayCircle className="w-3 h-3" /> Start
                        </button>
                      )}
                      {b.status === 'reading' && (
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            onUpdateBookStatus(b.id, 'finished');
                            if (selectedBookId === b.id) {
                              // If we finish the currently selected book, try to select another one
                              const nextBook = availableBooks.find(other => other.id !== b.id);
                              if (nextBook) setSelectedBookId(nextBook.id);
                            }
                          }}
                          className="flex items-center gap-1 bg-green-500/10 text-green-600 hover:bg-green-500 hover:text-white px-2 py-1 rounded-sm text-[8px] font-bold uppercase tracking-widest transition-colors"
                        >
                          <CheckCircle2 className="w-3 h-3" /> Finish
                        </button>
                      )}
                    </div>
                  </div>
                ))
              ) : (
                <div className="p-4 text-center text-[9px] font-mono uppercase opacity-40">
                  No active or queued books
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};
