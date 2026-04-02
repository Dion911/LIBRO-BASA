import React, { useState } from 'react';
import { Book, BookList } from '../types';
import { Plus, ChevronRight, Pin, ArrowLeft, Trash2, PinOff, Search, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface ListsViewProps {
  books: Book[];
  lists: BookList[];
  onAddList: () => void;
  onSelectList: (list: BookList) => void;
  selectedListId: string | null;
  onBack: () => void;
  onDeleteList: (id: string) => void;
  onTogglePin: (id: string) => void;
  onRemoveBookFromList: (listId: string, bookId: string) => void;
  onAddBookToList: (listId: string, bookId: string) => void;
}

export const ListsView: React.FC<ListsViewProps> = ({ 
  books, 
  lists, 
  onAddList, 
  onSelectList,
  selectedListId,
  onBack,
  onDeleteList,
  onTogglePin,
  onRemoveBookFromList,
  onAddBookToList
}) => {
  const [isAddingBook, setIsAddingBook] = useState(false);
  const [bookSearch, setBookSearch] = useState('');

  const [deletingListId, setDeletingListId] = useState<string | null>(null);

  const pinnedLists = lists.filter(l => l.isPinned);
  const otherLists = lists.filter(l => !l.isPinned);

  const getListStats = (list: BookList) => {
    const listBooks = books.filter(b => list.bookIds.includes(b.id));
    const finished = listBooks.filter(b => b.status === 'finished').length;
    const total = listBooks.length;
    const progress = total > 0 ? Math.round((finished / total) * 100) : 0;
    return { finished, total, progress, listBooks };
  };

  const selectedList = lists.find(l => l.id === selectedListId);
  const { listBooks, progress, total, finished } = selectedList ? getListStats(selectedList) : { listBooks: [], progress: 0, total: 0, finished: 0 };

  const availableBooks = books.filter(b => 
    !selectedList?.bookIds.includes(b.id) && 
    (b.title.toLowerCase().includes(bookSearch.toLowerCase()) || b.author.toLowerCase().includes(bookSearch.toLowerCase()))
  );

  if (selectedList) {
    return (
      <div className="space-y-8 pb-12">
        <div className="flex items-center justify-between">
          <button 
            onClick={onBack}
            className="flex items-center gap-2 text-[10px] font-mono uppercase tracking-widest opacity-40 hover:opacity-100 transition-opacity"
          >
            <ArrowLeft className="w-4 h-4" /> Back_To_Lists
          </button>
          <div className="flex gap-2">
            <button 
              onClick={() => onTogglePin(selectedList.id)}
              className={`p-2 rounded-sm border border-braun-panel transition-colors ${selectedList.isPinned ? 'bg-braun-accent text-white border-braun-accent' : 'hover:bg-braun-panel/10'}`}
            >
              {selectedList.isPinned ? <PinOff className="w-4 h-4" /> : <Pin className="w-4 h-4" />}
            </button>
            {deletingListId === selectedList.id ? (
              <div className="flex items-center gap-2 bg-red-500/10 p-1 rounded-sm border border-red-500/20">
                <span className="text-[8px] font-mono uppercase font-bold text-red-500 px-2">Confirm?</span>
                <button onClick={() => onDeleteList(selectedList.id)} className="bg-red-500 text-white p-1 rounded-sm"><Trash2 className="w-3 h-3" /></button>
                <button onClick={() => setDeletingListId(null)} className="p-1 opacity-40 hover:opacity-100"><X className="w-3 h-3" /></button>
              </div>
            ) : (
              <button 
                onClick={() => setDeletingListId(selectedList.id)}
                className="p-2 rounded-sm border border-braun-panel hover:bg-red-500/10 hover:text-red-500 transition-colors"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        <div className="bg-braun-panel/5 border-l-4 border-braun-accent p-8 space-y-4">
          <h2 className="text-4xl font-bold uppercase tracking-tighter">{selectedList.title}</h2>
          <div className="flex items-center gap-6">
            <div className="flex-1 h-1 bg-braun-panel/30 rounded-full overflow-hidden">
              <motion.div 
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
                className="h-full bg-braun-accent"
              />
            </div>
            <span className="text-xs font-mono font-bold text-braun-accent">{progress}% COMPLETE</span>
          </div>
          <p className="text-[10px] font-mono uppercase opacity-40 tracking-widest">
            {total} Total_Entries // {finished} Completed_Cycles
          </p>
        </div>

        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h3 className="text-[10px] font-mono uppercase tracking-widest opacity-40">List_Contents</h3>
            <button 
              onClick={() => setIsAddingBook(true)}
              className="text-[10px] font-mono uppercase tracking-widest font-bold text-braun-accent hover:underline"
            >
              + Add_Book
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {listBooks.map(book => (
              <div key={book.id} className="bg-braun-bg border border-braun-panel p-4 flex items-center justify-between group">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-14 bg-braun-panel/20 rounded-sm overflow-hidden flex-shrink-0">
                    {book.coverUrl && <img src={book.coverUrl} className="w-full h-full object-cover grayscale" referrerPolicy="no-referrer" />}
                  </div>
                  <div>
                    <h4 className="text-xs font-bold uppercase">{book.title}</h4>
                    <p className="text-[10px] opacity-40 uppercase">{book.author}</p>
                  </div>
                </div>
                <button 
                  onClick={() => onRemoveBookFromList(selectedList.id, book.id)}
                  className="p-2 opacity-0 group-hover:opacity-40 hover:!opacity-100 hover:text-red-500 transition-all"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ))}
            {listBooks.length === 0 && (
              <div className="col-span-full py-12 border border-dashed border-braun-panel text-center opacity-20">
                <p className="text-[10px] font-mono uppercase tracking-widest">List_Is_Empty</p>
              </div>
            )}
          </div>
        </div>

        {/* Add Book Selector */}
        <AnimatePresence>
          {isAddingBook && (
            <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setIsAddingBook(false)}
                className="absolute inset-0 bg-braun-ink/60 backdrop-blur-sm"
              />
              <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="relative w-full max-w-md bg-braun-bg border-2 border-braun-panel flex flex-col max-h-[70vh]"
              >
                <div className="p-6 border-b border-braun-panel flex justify-between items-center bg-braun-panel/10">
                  <h3 className="text-xs font-mono font-bold uppercase tracking-widest">SELECT_BOOK_FOR_LIST</h3>
                  <button onClick={() => setIsAddingBook(false)}><X className="w-4 h-4" /></button>
                </div>
                <div className="p-4 border-b border-braun-panel">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 opacity-20" />
                    <input 
                      type="text"
                      value={bookSearch}
                      onChange={(e) => setBookSearch(e.target.value)}
                      placeholder="SEARCH_LIBRARY..."
                      className="w-full bg-braun-panel/20 border-b border-braun-ink/10 pl-10 pr-4 py-3 text-[10px] font-mono focus:border-braun-accent outline-none"
                    />
                  </div>
                </div>
                <div className="flex-1 overflow-y-auto p-4 space-y-2">
                  {availableBooks.map(book => (
                    <button 
                      key={book.id}
                      onClick={() => {
                        onAddBookToList(selectedList.id, book.id);
                        setIsAddingBook(false);
                      }}
                      className="w-full flex items-center gap-4 p-2 hover:bg-braun-panel/10 transition-colors text-left"
                    >
                      <div className="w-8 h-12 bg-braun-panel/20 rounded-sm overflow-hidden flex-shrink-0">
                        {book.coverUrl && <img src={book.coverUrl} className="w-full h-full object-cover grayscale" referrerPolicy="no-referrer" />}
                      </div>
                      <div>
                        <p className="text-[10px] font-bold uppercase">{book.title}</p>
                        <p className="text-[8px] opacity-40 uppercase">{book.author}</p>
                      </div>
                    </button>
                  ))}
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </div>
    );
  }

  return (
    <div className="space-y-12 pb-12">
      {/* Header */}
      <div className="flex justify-between items-end mb-8">
        <div>
          <p className="text-[10px] font-mono uppercase tracking-[0.2em] opacity-40 mb-1">Collections</p>
          <h2 className="text-3xl font-bold uppercase tracking-tighter">My_Lists</h2>
        </div>
        <button 
          onClick={onAddList}
          className="bg-braun-accent text-white px-4 py-2 rounded-sm font-bold uppercase tracking-widest text-[10px] flex items-center gap-2 orange-glow"
        >
          <Plus className="w-3 h-3" /> New
        </button>
      </div>

      {/* Pinned Section */}
      {pinnedLists.length > 0 && (
        <div className="space-y-6">
          <h3 className="text-[10px] font-mono uppercase tracking-widest opacity-40">Pinned</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {pinnedLists.map(list => {
              const { finished, total, progress, listBooks } = getListStats(list);
              return (
                <motion.div 
                  key={list.id}
                  whileHover={{ y: -2 }}
                  onClick={() => onSelectList(list)}
                  className="bg-braun-bg border border-braun-panel p-6 space-y-6 cursor-pointer group relative"
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="text-lg font-bold uppercase tracking-tight group-hover:text-braun-accent transition-colors">{list.title}</h4>
                      <p className="text-[10px] font-mono opacity-40 uppercase">{total} books · {finished} finished</p>
                    </div>
                    <div className="flex gap-2">
                      <button 
                        onClick={(e) => { e.stopPropagation(); onTogglePin(list.id); }}
                        className="p-1.5 bg-braun-accent text-white rounded-sm orange-glow hover:brightness-110"
                      >
                        <PinOff className="w-3 h-3" />
                      </button>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="h-1 bg-braun-panel/30 rounded-full overflow-hidden">
                      <motion.div 
                        initial={{ width: 0 }}
                        animate={{ width: `${progress}%` }}
                        className="h-full bg-braun-accent"
                      />
                    </div>
                    <div className="flex justify-between text-[9px] font-mono uppercase">
                      <span className="opacity-40">{finished} of {total} complete</span>
                      <span className="text-braun-accent font-bold">{progress}%</span>
                    </div>
                  </div>

                  <div className="flex -space-x-2 overflow-hidden">
                    {listBooks.slice(0, 4).map(book => (
                      <div key={book.id} className="w-10 h-14 bg-braun-panel border border-braun-bg rounded-sm overflow-hidden flex-shrink-0">
                        {book.coverUrl ? (
                          <img src={book.coverUrl} className="w-full h-full object-cover grayscale" referrerPolicy="no-referrer" />
                        ) : (
                          <div className="w-full h-full bg-braun-ink/10" />
                        )}
                      </div>
                    ))}
                    {total > 4 && (
                      <div className="w-10 h-14 bg-braun-panel/20 border border-braun-bg rounded-sm flex items-center justify-center text-[10px] font-mono opacity-40">
                        +{total - 4}
                      </div>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      )}

      {/* All Lists Section */}
      <div className="space-y-6">
        <h3 className="text-[10px] font-mono uppercase tracking-widest opacity-40">All_Lists</h3>
        <div className="space-y-2">
          {otherLists.length > 0 ? otherLists.map(list => {
            const { total, listBooks } = getListStats(list);
            const firstBook = listBooks[0];
            return (
              <div key={list.id} className="group relative">
                <div 
                  onClick={() => onSelectList(list)}
                  className="w-full bg-braun-bg border border-braun-panel p-4 flex items-center justify-between group hover:bg-braun-panel/5 transition-colors cursor-pointer"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-16 bg-braun-panel/20 border border-braun-panel rounded-sm overflow-hidden flex-shrink-0">
                      {firstBook?.coverUrl ? (
                        <img src={firstBook.coverUrl} className="w-full h-full object-cover grayscale" referrerPolicy="no-referrer" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center opacity-10">
                          <Pin className="w-4 h-4" />
                        </div>
                      )}
                    </div>
                    <div className="text-left">
                      <h4 className="text-sm font-bold uppercase tracking-tight group-hover:text-braun-accent transition-colors">{list.title}</h4>
                      <p className="text-[10px] font-mono opacity-40 uppercase">{total} books</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button 
                        onClick={(e) => { e.stopPropagation(); onTogglePin(list.id); }}
                        className="p-2 hover:bg-braun-accent/10 text-braun-ink/40 hover:text-braun-accent rounded-sm transition-colors"
                      >
                        <Pin className="w-4 h-4" />
                      </button>
                      {deletingListId === list.id ? (
                        <div className="flex items-center gap-1 bg-red-500/10 p-1 rounded-sm border border-red-500/20" onClick={e => e.stopPropagation()}>
                          <button onClick={() => onDeleteList(list.id)} className="bg-red-500 text-white p-1 rounded-sm"><Trash2 className="w-3 h-3" /></button>
                          <button onClick={() => setDeletingListId(null)} className="p-1 opacity-40 hover:opacity-100"><X className="w-3 h-3" /></button>
                        </div>
                      ) : (
                        <button 
                          onClick={(e) => { e.stopPropagation(); setDeletingListId(list.id); }}
                          className="p-2 hover:bg-red-500/10 text-braun-ink/40 hover:text-red-500 rounded-sm transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                    <ChevronRight className="w-4 h-4 opacity-20 group-hover:opacity-100 group-hover:text-braun-accent transition-all" />
                  </div>
                </div>
              </div>
            );
          }) : (
            <div className="text-center py-12 border border-dashed border-braun-panel opacity-20">
              <p className="text-[10px] font-mono uppercase tracking-widest">No_Additional_Lists</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
