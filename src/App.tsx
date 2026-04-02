import { useState, useEffect, useMemo } from 'react';
import { Book, BookStatus, ReadingSession, UserStats, BookList } from './types';
import { BookCard } from './components/BookCard';
import { BookModal } from './components/BookModal';
import { StatsView } from './components/StatsView';
import { LogView } from './components/LogView';
import { ListsView } from './components/ListsView';
import { ProgressIndicator } from './components/ProgressIndicator';
import { Plus, Search, Library, LayoutGrid, ListTodo, BarChart3, History, X, Moon, Sun, LogOut, LogIn } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { auth, db, loginWithGoogle, logout, handleFirestoreError, OperationType } from './firebase';
import { onAuthStateChanged, User } from 'firebase/auth';
import { collection, onSnapshot, doc, setDoc, deleteDoc, query, orderBy } from 'firebase/firestore';

type NavTab = 'shelf' | 'log' | 'stats' | 'lists';

import { Logo } from './components/Logo';

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [isAuthReady, setIsAuthReady] = useState(false);
  const [books, setBooks] = useState<Book[]>([]);
  const [sessions, setSessions] = useState<ReadingSession[]>([]);

  const [lists, setLists] = useState<BookList[]>(() => {
    const saved = localStorage.getItem('libro-lists');
    if (saved) return JSON.parse(saved);
    
    // Initial sample lists
    return [
      { id: '1', title: '2026 reading goals', bookIds: [], isPinned: true, dateCreated: new Date().toISOString() },
      { id: '2', title: 'Business & design', bookIds: [], isPinned: true, dateCreated: new Date().toISOString() },
      { id: '3', title: 'Gifted to me', bookIds: [], isPinned: false, dateCreated: new Date().toISOString() },
      { id: '4', title: 'Re-reads', bookIds: [], isPinned: false, dateCreated: new Date().toISOString() },
      { id: '5', title: 'Love stories', bookIds: [], isPinned: false, dateCreated: new Date().toISOString() },
    ];
  });

  const [navTab, setNavTab] = useState<NavTab>('shelf');
  const [selectedListId, setSelectedListId] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isListModalOpen, setIsListModalOpen] = useState(false);
  const [editingBook, setEditingBook] = useState<Book | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<BookStatus | 'all'>('all');
  const [loginError, setLoginError] = useState<string | null>(null);
  const [isDarkMode, setIsDarkMode] = useState(() => {
    const saved = localStorage.getItem('libro-dark-mode');
    return saved === 'true';
  });

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setIsAuthReady(true);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!isAuthReady || !user) {
      setBooks([]);
      setSessions([]);
      return;
    }

    const booksRef = collection(db, `users/${user.uid}/books`);
    const qBooks = query(booksRef, orderBy('createdAt', 'desc'));
    
    const unsubscribeBooks = onSnapshot(qBooks, (snapshot) => {
      const booksData = snapshot.docs.map(doc => doc.data() as Book);
      setBooks(booksData);
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, `users/${user.uid}/books`);
    });

    const sessionsRef = collection(db, `users/${user.uid}/sessions`);
    const qSessions = query(sessionsRef, orderBy('createdAt', 'desc'));
    
    const unsubscribeSessions = onSnapshot(qSessions, (snapshot) => {
      const sessionsData = snapshot.docs.map(doc => doc.data() as ReadingSession);
      setSessions(sessionsData);
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, `users/${user.uid}/sessions`);
    });

    return () => {
      unsubscribeBooks();
      unsubscribeSessions();
    };
  }, [user, isAuthReady]);

  useEffect(() => {
    localStorage.setItem('libro-dark-mode', isDarkMode.toString());
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);

  useEffect(() => {
    localStorage.setItem('libro-lists', JSON.stringify(lists));
  }, [lists]);

  const filteredBooks = useMemo(() => {
    return books.filter(book => {
      const query = searchQuery.toLowerCase();
      const matchesSearch = 
        book.title.toLowerCase().includes(query) ||
        book.author.toLowerCase().includes(query) ||
        (book.genre && book.genre.toLowerCase().includes(query)) ||
        book.status.toLowerCase().replace('-', '_').includes(query);
      
      const matchesTab = activeTab === 'all' || book.status === activeTab;
      return matchesSearch && matchesTab;
    });
  }, [books, searchQuery, activeTab]);

  const stats = useMemo(() => {
    return {
      total: books.length,
      reading: books.filter(b => b.status === 'reading').length,
      finished: books.filter(b => b.status === 'finished').length,
      toRead: books.filter(b => b.status === 'to-read').length,
    };
  }, [books]);

  const libraryStats = useMemo(() => {
    const totalPages = books.reduce((acc, b) => acc + (b.totalPages || 0), 0);
    const currentPages = books.reduce((acc, b) => acc + (b.currentPage || 0), 0);
    return {
      totalPages,
      currentPages,
      progress: totalPages > 0 ? Math.round((currentPages / totalPages) * 100) : 0
    };
  }, [books]);

  const trend = useMemo(() => {
    const now = new Date();
    const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const twoWeeksAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);

    const thisWeekPages = sessions
      .filter(s => new Date(s.date) >= oneWeekAgo)
      .reduce((acc, s) => acc + s.pagesRead, 0);

    const lastWeekPages = sessions
      .filter(s => new Date(s.date) >= twoWeeksAgo && new Date(s.date) < oneWeekAgo)
      .reduce((acc, s) => acc + s.pagesRead, 0);

    if (lastWeekPages === 0) return thisWeekPages > 0 ? 100 : 0;
    return Math.round(((thisWeekPages - lastWeekPages) / lastWeekPages) * 100);
  }, [sessions]);

  const handleAddBook = async (bookData: Partial<Book>) => {
    if (!user) return;
    try {
      if (editingBook) {
        const updatedBook = { ...editingBook, ...bookData, updatedAt: Date.now() };
        await setDoc(doc(db, `users/${user.uid}/books`, editingBook.id), updatedBook);
      } else {
        const newId = crypto.randomUUID();
        const newBook: Book = {
          id: newId,
          userId: user.uid,
          title: bookData.title || 'Untitled',
          author: bookData.author || 'Unknown',
          status: bookData.status || 'to-read',
          rating: bookData.rating,
          notes: [],
          coverUrl: bookData.coverUrl,
          totalPages: bookData.totalPages,
          currentPage: bookData.currentPage || 0,
          genre: bookData.genre,
          dateAdded: new Date().toISOString(),
          publicationDate: bookData.publicationDate,
          isbn: bookData.isbn,
          publisher: bookData.publisher,
          createdAt: Date.now(),
          updatedAt: Date.now()
        };
        await setDoc(doc(db, `users/${user.uid}/books`, newId), newBook);
      }
      setEditingBook(null);
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, `users/${user.uid}/books`);
    }
  };

  const handleAddSession = async (id: string, bookId: string, pages: number, notes?: string) => {
    if (!user) return;
    try {
      const newSession: ReadingSession = {
        id,
        userId: user.uid,
        bookId,
        date: new Date().toISOString(),
        pagesRead: pages,
        notes,
        createdAt: Date.now()
      };
      await setDoc(doc(db, `users/${user.uid}/sessions`, id), newSession);
      
      // Update book progress
      const book = books.find(b => b.id === bookId);
      if (book) {
        const newPage = book.currentPage + pages;
        const isFinished = book.totalPages ? newPage >= book.totalPages : false;
        const updatedBook = {
          ...book,
          currentPage: newPage,
          status: isFinished ? 'finished' : book.status,
          dateFinished: isFinished ? new Date().toISOString() : book.dateFinished,
          updatedAt: Date.now()
        };
        await setDoc(doc(db, `users/${user.uid}/books`, bookId), updatedBook);
      }
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, `users/${user.uid}/sessions`);
    }
  };

  const handleDeleteSession = async (sessionId: string) => {
    if (!user) return;
    const session = sessions.find(s => s.id === sessionId);
    if (!session) return;

    try {
      await deleteDoc(doc(db, `users/${user.uid}/sessions`, sessionId));

      // Revert book progress
      const book = books.find(b => b.id === session.bookId);
      if (book) {
        const newPage = Math.max(0, book.currentPage - session.pagesRead);
        const updatedBook = {
          ...book,
          currentPage: newPage,
          status: book.status === 'finished' && book.totalPages && newPage < book.totalPages ? 'reading' : book.status,
          updatedAt: Date.now()
        };
        await setDoc(doc(db, `users/${user.uid}/books`, book.id), updatedBook);
      }
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `users/${user.uid}/sessions/${sessionId}`);
    }
  };

  const handleUpdateSession = async (sessionId: string, newPages: number, newNotes?: string) => {
    if (!user) return;
    const session = sessions.find(s => s.id === sessionId);
    if (!session) return;

    const diff = newPages - session.pagesRead;

    try {
      const updatedSession = { ...session, pagesRead: newPages, notes: newNotes };
      await setDoc(doc(db, `users/${user.uid}/sessions`, sessionId), updatedSession);

      // Update book progress
      const book = books.find(b => b.id === session.bookId);
      if (book) {
        const newPage = Math.max(0, book.currentPage + diff);
        const isFinished = book.totalPages ? newPage >= book.totalPages : false;
        const updatedBook = {
          ...book,
          currentPage: newPage,
          status: isFinished ? 'finished' : (book.status === 'finished' ? 'reading' : book.status),
          dateFinished: isFinished ? (book.dateFinished || new Date().toISOString()) : undefined,
          updatedAt: Date.now()
        };
        await setDoc(doc(db, `users/${user.uid}/books`, book.id), updatedBook);
      }
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, `users/${user.uid}/sessions/${sessionId}`);
    }
  };

  const handleDeleteBook = async (id: string) => {
    if (!user) return;
    try {
      await deleteDoc(doc(db, `users/${user.uid}/books`, id));
      // Also delete associated sessions
      const bookSessions = sessions.filter(s => s.bookId === id);
      for (const session of bookSessions) {
        await deleteDoc(doc(db, `users/${user.uid}/sessions`, session.id));
      }
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `users/${user.uid}/books/${id}`);
    }
  };

  const handleStatusChange = async (id: string, status: BookStatus) => {
    if (!user) return;
    const book = books.find(b => b.id === id);
    if (!book) return;
    
    try {
      const updatedBook = { 
        ...book, 
        status,
        dateStarted: status === 'reading' && !book.dateStarted ? new Date().toISOString() : book.dateStarted,
        dateFinished: status === 'finished' ? new Date().toISOString() : book.dateFinished,
        updatedAt: Date.now()
      };
      await setDoc(doc(db, `users/${user.uid}/books`, id), updatedBook);
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, `users/${user.uid}/books/${id}`);
    }
  };

  const handleEditBook = (book: Book) => {
    setEditingBook(book);
    setIsModalOpen(true);
  };

  const handleQuickLog = (bookId: string) => {
    const book = books.find(b => b.id === bookId);
    if (book?.status === 'to-read') {
      handleStatusChange(bookId, 'reading');
    }
    setNavTab('log');
  };

  const handleAddList = (title: string) => {
    const newList: BookList = {
      id: crypto.randomUUID(),
      title,
      bookIds: [],
      isPinned: false,
      dateCreated: new Date().toISOString()
    };
    setLists(prev => [...prev, newList]);
    setIsListModalOpen(false);
  };

  const handleDeleteList = (id: string) => {
    setLists(prev => prev.filter(l => l.id !== id));
    if (selectedListId === id) setSelectedListId(null);
  };

  const handleTogglePinList = (id: string) => {
    setLists(prev => prev.map(l => l.id === id ? { ...l, isPinned: !l.isPinned } : l));
  };

  const handleAddBookToList = (listId: string, bookId: string) => {
    setLists(prev => prev.map(l => {
      if (l.id === listId && !l.bookIds.includes(bookId)) {
        return { ...l, bookIds: [...l.bookIds, bookId] };
      }
      return l;
    }));
  };

  const handleRemoveBookFromList = (listId: string, bookId: string) => {
    setLists(prev => prev.map(l => {
      if (l.id === listId) {
        return { ...l, bookIds: l.bookIds.filter(id => id !== bookId) };
      }
      return l;
    }));
  };

  const handleAddNote = async (bookId: string, content: string, page: number) => {
    if (!user) return;
    const book = books.find(b => b.id === bookId);
    if (!book) return;

    try {
      const newNote = {
        id: crypto.randomUUID(),
        page,
        content,
        date: new Date().toISOString()
      };
      const updatedBook = {
        ...book,
        notes: [newNote, ...(book.notes || [])],
        updatedAt: Date.now()
      };
      await setDoc(doc(db, `users/${user.uid}/books`, bookId), updatedBook);
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, `users/${user.uid}/books/${bookId}`);
    }
  };

  const handleLogin = async () => {
    setLoginError(null);
    try {
      await loginWithGoogle();
    } catch (error: any) {
      console.error("Detailed login error:", error);
      if (error.code === 'auth/popup-blocked') {
        setLoginError('Login popup was blocked. Please open the app in a new tab (using the button in the top right) to sign in.');
      } else if (error.code === 'auth/unauthorized-domain') {
        setLoginError(`Domain not authorized. Please add this URL to your Firebase Console > Authentication > Settings > Authorized domains.`);
      } else if (error.code === 'auth/popup-closed-by-user') {
        setLoginError('Sign in was cancelled. Please try again.');
      } else {
        setLoginError(`Error: ${error.message || error.code || 'Failed to sign in'}`);
      }
    }
  };

  if (!isAuthReady) {
    return (
      <div className="min-h-screen bg-braun-bg text-braun-ink flex items-center justify-center">
        <div className="animate-pulse flex flex-col items-center gap-4">
          <Logo className="w-12 h-12 text-braun-accent" />
          <p className="text-[10px] font-mono uppercase tracking-widest opacity-40">Loading System...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-braun-bg text-braun-ink flex flex-col items-center justify-center p-6">
        <div className="max-w-sm w-full space-y-8 text-center">
          <div className="flex justify-center">
            <Logo className="w-16 h-16 text-braun-accent" />
          </div>
          <div className="space-y-2">
            <h1 className="text-2xl font-bold uppercase tracking-tight">Libro System</h1>
            <p className="text-xs font-mono opacity-60">Please authenticate to access your library.</p>
          </div>
          
          {loginError && (
            <div className="bg-red-500/10 border border-red-500/20 text-red-500 p-4 rounded-sm text-xs text-left">
              <p className="font-bold mb-1">Authentication Error</p>
              <p>{loginError}</p>
            </div>
          )}

          <button
            onClick={handleLogin}
            className="w-full bg-braun-ink text-white py-4 rounded-sm font-bold uppercase tracking-widest text-[10px] hover:bg-braun-accent transition-colors flex items-center justify-center gap-2"
          >
            <LogIn className="w-4 h-4" />
            Sign in with Google
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen bg-braun-bg text-braun-ink pb-32 selection:bg-braun-accent selection:text-white transition-colors duration-500 ${isDarkMode ? 'dark' : ''}`}>
      {/* Device Top Panel */}
      <div className="h-2 bg-braun-accent w-full sticky top-0 z-50" />
      
      <header className="pt-12 pb-6 px-6 max-w-7xl mx-auto">
        <div className="flex flex-col lg:flex-row gap-12 items-start">
          {/* Brand Section */}
          <div className="flex items-center justify-between w-full lg:w-auto gap-12">
            <div className="flex items-center gap-4">
              <Logo className="w-14 h-14 text-braun-accent" />
              <div>
                <h1 className="text-2xl font-bold tracking-tighter uppercase">LIBRO.BASA</h1>
                <p className="text-[10px] font-mono uppercase tracking-[0.2em] opacity-40">System DS-05</p>
              </div>
            </div>
            
            <button 
              onClick={() => setIsDarkMode(!isDarkMode)}
              className="w-10 h-10 analog-button flex items-center justify-center rounded-full hover:text-braun-accent transition-colors"
              title={isDarkMode ? "Switch to Light Mode" : "Switch to Dark Mode"}
            >
              {isDarkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </button>
            <button 
              onClick={logout}
              className="w-10 h-10 analog-button flex items-center justify-center rounded-full hover:text-red-500 transition-colors"
              title="Sign Out"
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>

          {/* Progress & Actions Section */}
          <div className="flex flex-col gap-6 w-full flex-1 items-end">
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="px-6 max-w-7xl mx-auto min-h-[60vh]">
        <AnimatePresence mode="wait">
          {navTab === 'shelf' && (
            <motion.div 
              key="shelf"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-12"
            >
              {/* Video / Grid Pattern Divider */}
              <div className="w-full mb-8">
                <div className="relative w-full h-48 md:h-72 bg-braun-panel/20 overflow-hidden border-y border-braun-ink/10">
                  <video 
                    src="/Animated_Books_Come_to_Life.mp4" 
                    autoPlay 
                    loop 
                    muted 
                    playsInline
                    className="w-full h-full object-cover opacity-90 object-center"
                  />
                  {/* Overlay dot pattern for texture */}
                  <div className="absolute inset-0 dot-pattern opacity-50 pointer-events-none mix-blend-overlay" />
                  
                  {/* Decorative elements */}
                  <div className="absolute bottom-2 right-4 text-[8px] font-mono uppercase tracking-[0.2em] opacity-40">
                    SYS_VISUAL_FEED
                  </div>
                </div>
              </div>

              <div className="w-full space-y-8">
                <ProgressIndicator 
                  progress={libraryStats.progress} 
                  trend={trend} 
                  totalPages={libraryStats.totalPages}
                  currentPage={libraryStats.currentPages}
                  onClick={() => setNavTab('stats')}
                />

                <div className="flex flex-col gap-4 max-w-md">
                  <div className="relative w-full">
                    <input 
                      type="text"
                      placeholder="SEARCH_DB"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full bg-braun-panel/30 border-b-2 border-braun-ink/10 px-4 py-3 text-xs font-mono focus:border-braun-accent outline-none transition-colors"
                    />
                    <Search className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 opacity-20" />
                  </div>
                  <button 
                    onClick={() => { setEditingBook(null); setIsModalOpen(true); }}
                    className="bg-braun-accent text-white px-4 py-2 rounded-sm font-bold uppercase tracking-widest text-[10px] hover:brightness-110 transition-all flex items-center justify-center gap-2 orange-glow whitespace-nowrap w-fit"
                  >
                    <Plus className="w-3 h-3" />
                    Add Entry
                  </button>
                </div>
              </div>

              <nav className="mb-8">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-end border-b border-braun-ink/10 pb-3 gap-4">
                  <div className="flex gap-6 md:gap-8 overflow-x-auto scrollbar-hide w-full md:w-auto pb-2 md:pb-0">
                    {[
                      { id: 'all', label: '00_ALL' },
                      { id: 'reading', label: '01_READING' },
                      { id: 'to-read', label: '02_QUEUE' },
                      { id: 'finished', label: '03_DONE' },
                    ].map((tab) => (
                      <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id as any)}
                        className={`text-[11px] font-mono tracking-widest transition-all relative pb-2 md:pb-4 whitespace-nowrap ${
                          activeTab === tab.id 
                            ? 'text-braun-accent' 
                            : 'text-braun-ink/40 hover:text-braun-ink'
                        }`}
                      >
                        {tab.label}
                        {activeTab === tab.id && (
                          <motion.div 
                            layoutId="activeTab"
                            className="absolute bottom-[-1px] left-0 right-0 h-[2px] bg-braun-accent"
                          />
                        )}
                      </button>
                    ))}
                  </div>
                  
                  <div className="flex items-center gap-6 shrink-0 self-end md:self-auto pb-1 md:pb-3">
                    {searchQuery && (
                      <div className="flex items-center gap-4">
                        <div className="flex flex-col items-end">
                          <span className="text-[10px] font-mono uppercase tracking-widest opacity-40">Search_Results</span>
                          <span className="text-[11px] font-mono font-bold text-braun-accent">
                            {filteredBooks.length.toString().padStart(2, '0')}_MATCHES
                          </span>
                        </div>
                        <button 
                          onClick={() => setSearchQuery('')}
                          className="w-8 h-8 rounded-full bg-braun-panel/10 flex items-center justify-center hover:bg-braun-accent hover:text-white transition-all group"
                        >
                          <X className="w-3 h-3 group-hover:scale-110 transition-transform" />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </nav>

              {filteredBooks.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                  {filteredBooks.map((book) => (
                    <BookCard 
                      key={book.id} 
                      book={book} 
                      onEdit={handleEditBook}
                      onDelete={handleDeleteBook}
                      onStatusChange={handleStatusChange}
                      onQuickLog={handleQuickLog}
                      onAddNote={handleAddNote}
                    />
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-32 opacity-20">
                  <Library className="w-16 h-16 mb-4" />
                  <p className="font-mono text-xs uppercase tracking-[0.3em]">
                    {searchQuery ? 'NO_MATCHES_FOUND' : 'No_Data_Found'}
                  </p>
                  {searchQuery && (
                    <button 
                      onClick={() => setSearchQuery('')}
                      className="mt-6 text-[10px] font-mono uppercase tracking-widest underline hover:text-braun-accent transition-colors"
                    >
                      Clear_Search_Parameters
                    </button>
                  )}
                </div>
              )}
            </motion.div>
          )}

          {navTab === 'log' && (
            <motion.div 
              key="log"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
            >
              <LogView 
                books={books} 
                sessions={sessions} 
                onAddSession={handleAddSession} 
                onDeleteSession={handleDeleteSession}
                onUpdateSession={handleUpdateSession}
                onUpdateBookStatus={handleStatusChange}
              />
            </motion.div>
          )}

          {navTab === 'stats' && (
            <motion.div 
              key="stats"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
            >
              <StatsView books={books} sessions={sessions} />
            </motion.div>
          )}

          {navTab === 'lists' && (
            <motion.div 
              key="lists"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
            >
              <ListsView 
                books={books} 
                lists={lists} 
                onAddList={() => setIsListModalOpen(true)} 
                onSelectList={(list) => setSelectedListId(list.id)}
                selectedListId={selectedListId}
                onBack={() => setSelectedListId(null)}
                onDeleteList={handleDeleteList}
                onTogglePin={handleTogglePinList}
                onRemoveBookFromList={handleRemoveBookFromList}
                onAddBookToList={handleAddBookToList}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Bottom Navigation */}
      <div className="fixed bottom-0 left-0 right-0 bg-[#F0F0F0] border-t border-braun-panel z-40 px-6 py-2 shadow-[0_-10px_40px_rgba(0,0,0,0.05)]">
        <div className="max-w-4xl mx-auto flex justify-between items-center relative">
          <div className="flex flex-1 justify-around items-end max-w-2xl">
            {[
              { id: 'shelf', label: 'Shelf', icon: <LayoutGrid className="w-5 h-5" /> },
              { id: 'log', label: 'Log', icon: <History className="w-5 h-5" /> },
              { id: 'stats', label: 'Stats', icon: <BarChart3 className="w-5 h-5" /> },
              { id: 'lists', label: 'Lists', icon: <ListTodo className="w-5 h-5" /> },
            ].map((item) => (
              <button
                key={item.id}
                onClick={() => setNavTab(item.id as NavTab)}
                className={`group flex flex-col items-center gap-1 transition-all relative pb-1 ${
                  navTab === item.id ? 'text-braun-accent' : 'text-braun-ink/40'
                }`}
              >
                <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300 ${
                  navTab === item.id 
                    ? 'bg-braun-accent/10' 
                    : 'group-hover:bg-braun-ink/5'
                }`}>
                  {item.icon}
                </div>
                <span className={`text-[9px] font-mono uppercase tracking-[0.1em] font-bold transition-colors ${
                  navTab === item.id ? 'text-braun-accent' : 'group-hover:text-braun-ink'
                }`}>
                  {item.label}
                </span>
                {navTab === item.id && (
                  <motion.div 
                    layoutId="navDot"
                    className="absolute -bottom-0.5 w-1 h-1 bg-braun-accent rounded-full orange-glow"
                  />
                )}
              </button>
            ))}
          </div>

          {/* Integrated AI Assistant Button removed */}
        </div>
      </div>

      <BookModal 
        isOpen={isModalOpen} 
        onClose={() => { setIsModalOpen(false); setEditingBook(null); }}
        onSave={handleAddBook}
        initialBook={editingBook}
      />

      {/* List Creation Modal */}
      <AnimatePresence>
        {isListModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsListModalOpen(false)}
              className="absolute inset-0 bg-braun-ink/40 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-sm bg-braun-bg border-2 border-braun-panel p-8 shadow-2xl"
            >
              <h3 className="text-sm font-mono font-bold uppercase tracking-widest mb-6">NEW_LIST_ENTRY</h3>
              <input 
                autoFocus
                type="text"
                placeholder="LIST_TITLE"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    handleAddList((e.target as HTMLInputElement).value);
                  }
                }}
                className="w-full bg-braun-panel/20 border-b-2 border-braun-ink/10 px-4 py-3 text-xs font-mono focus:border-braun-accent outline-none mb-6"
              />
              <div className="flex gap-4">
                <button 
                  onClick={() => setIsListModalOpen(false)}
                  className="flex-1 py-3 text-[10px] font-mono uppercase tracking-widest opacity-40 hover:opacity-100"
                >
                  Cancel
                </button>
                <button 
                  onClick={() => {
                    const input = document.querySelector('input[placeholder="LIST_TITLE"]') as HTMLInputElement;
                    if (input.value) handleAddList(input.value);
                  }}
                  className="flex-1 bg-braun-accent text-white py-3 text-[10px] font-mono uppercase tracking-widest font-bold orange-glow"
                >
                  Create
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
