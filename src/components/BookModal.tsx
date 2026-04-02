import React, { useState, useEffect } from 'react';
import { Book, BookStatus, BookNote } from '../types';
import { X, Save, BookOpen, User, Image as ImageIcon, Hash, Tag, Star, Plus, MessageSquare, Upload, Calendar, Barcode, Building2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface BookModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (book: Partial<Book>) => void;
  initialBook?: Book | null;
}

export const BookModal = ({ isOpen, onClose, onSave, initialBook }: BookModalProps) => {
  const [formData, setFormData] = useState<Partial<Book>>({
    title: '',
    author: '',
    status: 'to-read',
    rating: 0,
    coverUrl: '',
    totalPages: 0,
    currentPage: 0,
    genre: '',
    notes: [],
    publicationDate: '',
    isbn: '',
    publisher: '',
  });

  const [newNote, setNewNote] = useState('');
  const [notePage, setNotePage] = useState('');
  const [isDragging, setIsDragging] = useState(false);

  const handleFileUpload = (file: File) => {
    if (!file.type.startsWith('image/')) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      setFormData(prev => ({ ...prev, coverUrl: e.target?.result as string }));
    };
    reader.readAsDataURL(file);
  };

  const onDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const onDragLeave = () => {
    setIsDragging(false);
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFileUpload(file);
  };

  useEffect(() => {
    if (initialBook) {
      setFormData({
        ...initialBook,
        notes: Array.isArray(initialBook.notes) ? initialBook.notes : []
      });
    } else {
      setFormData({
        title: '',
        author: '',
        status: 'to-read',
        rating: 0,
        coverUrl: '',
        totalPages: 0,
        currentPage: 0,
        genre: '',
        notes: [],
        publicationDate: '',
        isbn: '',
        publisher: '',
      });
    }
  }, [initialBook, isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
    onClose();
  };

  const addNote = () => {
    if (!newNote) return;
    const note: BookNote = {
      id: crypto.randomUUID(),
      content: newNote,
      page: parseInt(notePage) || 0,
      date: new Date().toISOString(),
    };
    setFormData(prev => ({
      ...prev,
      notes: [...(prev.notes || []), note]
    }));
    setNewNote('');
    setNotePage('');
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-6">
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-braun-ink/40 backdrop-blur-sm"
          />
          
          <motion.div 
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="relative w-full max-w-2xl bg-braun-bg border-2 border-braun-panel shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
          >
            {/* Modal Header */}
            <div className="bg-braun-panel/10 border-b border-braun-panel px-6 py-4 flex justify-between items-center">
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 bg-braun-accent rounded-full orange-glow" />
                <h2 className="text-sm font-mono font-bold uppercase tracking-widest">
                  {initialBook ? 'EDIT_ENTRY_MODE' : 'NEW_ENTRY_MODE'}
                </h2>
              </div>
              <button 
                onClick={onClose}
                className="w-8 h-8 analog-button flex items-center justify-center rounded-full hover:text-braun-accent"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-8 space-y-10 scrollbar-hide">
              {/* Core Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-6">
                  <div className="space-y-2">
                    <label className="flex items-center gap-2 text-[10px] font-mono uppercase tracking-widest opacity-40">
                      <BookOpen className="w-3 h-3" /> Title
                    </label>
                    <input 
                      required
                      type="text"
                      value={formData.title || ''}
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                      placeholder="INPUT_TITLE"
                      className="w-full bg-braun-panel/20 border-b-2 border-braun-ink/10 px-4 py-3 text-xs font-mono focus:border-braun-accent outline-none"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="flex items-center gap-2 text-[10px] font-mono uppercase tracking-widest opacity-40">
                      <User className="w-3 h-3" /> Author
                    </label>
                    <input 
                      required
                      type="text"
                      value={formData.author || ''}
                      onChange={(e) => setFormData({ ...formData, author: e.target.value })}
                      placeholder="INPUT_AUTHOR"
                      className="w-full bg-braun-panel/20 border-b-2 border-braun-ink/10 px-4 py-3 text-xs font-mono focus:border-braun-accent outline-none"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="flex items-center gap-2 text-[10px] font-mono uppercase tracking-widest opacity-40">
                      <Tag className="w-3 h-3" /> Genre
                    </label>
                    <input 
                      type="text"
                      value={formData.genre || ''}
                      onChange={(e) => setFormData({ ...formData, genre: e.target.value })}
                      placeholder="INPUT_GENRE"
                      className="w-full bg-braun-panel/20 border-b-2 border-braun-ink/10 px-4 py-3 text-xs font-mono focus:border-braun-accent outline-none"
                    />
                  </div>
                </div>

                <div className="space-y-6">
                  <div className="space-y-4">
                    <label className="flex items-center gap-2 text-[10px] font-mono uppercase tracking-widest opacity-40">
                      <ImageIcon className="w-3 h-3" /> Cover_Image
                    </label>
                    
                    <div 
                      onDragOver={onDragOver}
                      onDragLeave={onDragLeave}
                      onDrop={onDrop}
                      className={`relative h-48 border-2 border-dashed rounded-sm transition-all flex flex-col items-center justify-center gap-2 group cursor-pointer overflow-hidden ${
                        isDragging 
                          ? 'border-braun-accent bg-braun-accent/10' 
                          : 'border-braun-panel bg-braun-panel/5 hover:border-braun-ink/40'
                      }`}
                      onClick={() => document.getElementById('cover-upload')?.click()}
                    >
                      <input 
                        id="cover-upload"
                        type="file" 
                        accept="image/*" 
                        className="hidden" 
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) handleFileUpload(file);
                        }}
                      />
                      
                      {formData.coverUrl ? (
                        <>
                          <img 
                            src={formData.coverUrl} 
                            alt="Cover Preview" 
                            className="absolute inset-0 w-full h-full object-contain p-4 grayscale group-hover:grayscale-0 transition-all"
                            referrerPolicy="no-referrer"
                          />
                          <div className="absolute inset-0 bg-braun-bg/80 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                            <p className="text-[10px] font-mono uppercase tracking-widest font-bold">Change_Image</p>
                          </div>
                          <button 
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setFormData({ ...formData, coverUrl: '' });
                            }}
                            className="absolute top-2 right-2 w-6 h-6 bg-braun-ink text-white rounded-full flex items-center justify-center z-10 hover:bg-braun-accent transition-colors"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </>
                      ) : (
                        <>
                          <Upload className={`w-8 h-8 mb-1 ${isDragging ? 'text-braun-accent' : 'opacity-20'}`} />
                          <p className="text-[10px] font-mono uppercase tracking-widest opacity-40">Drop_Image_Here</p>
                          <p className="text-[8px] font-mono uppercase tracking-tighter opacity-20">Or_Click_To_Browse</p>
                        </>
                      )}
                    </div>

                    <div className="space-y-2">
                      <label className="text-[9px] font-mono uppercase tracking-widest opacity-30">Or_Provide_URL</label>
                      <input 
                        type="url"
                        value={formData.coverUrl || ''}
                        onChange={(e) => setFormData({ ...formData, coverUrl: e.target.value })}
                        placeholder="HTTPS://IMAGE_LINK"
                        className="w-full bg-braun-panel/20 border-b-2 border-braun-ink/10 px-4 py-3 text-xs font-mono focus:border-braun-accent outline-none"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="flex items-center gap-2 text-[10px] font-mono uppercase tracking-widest opacity-40">
                        <Hash className="w-3 h-3" /> Total_PP
                      </label>
                      <input 
                        type="number"
                        value={formData.totalPages || ''}
                        onChange={(e) => setFormData({ ...formData, totalPages: e.target.value ? parseInt(e.target.value) : 0 })}
                        placeholder="000"
                        className="w-full bg-braun-panel/20 border-b-2 border-braun-ink/10 px-4 py-3 text-xs font-mono focus:border-braun-accent outline-none"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="flex items-center gap-2 text-[10px] font-mono uppercase tracking-widest opacity-40">
                        <Hash className="w-3 h-3" /> Current_PP
                      </label>
                      <input 
                        type="number"
                        value={formData.currentPage || ''}
                        onChange={(e) => setFormData({ ...formData, currentPage: e.target.value ? parseInt(e.target.value) : 0 })}
                        placeholder="000"
                        className="w-full bg-braun-panel/20 border-b-2 border-braun-ink/10 px-4 py-3 text-xs font-mono focus:border-braun-accent outline-none"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="flex items-center gap-2 text-[10px] font-mono uppercase tracking-widest opacity-40">
                      <Star className="w-3 h-3" /> Rating
                    </label>
                    <div className="flex gap-4 items-center h-10">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          key={star}
                          type="button"
                          onClick={() => setFormData({ ...formData, rating: star })}
                          className={`w-4 h-4 rounded-full transition-all ${
                            (formData.rating || 0) >= star 
                              ? 'bg-braun-accent orange-glow scale-125' 
                              : 'bg-braun-ink/10 hover:bg-braun-ink/20'
                          }`}
                        />
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Status Selector */}
              <div className="space-y-4">
                <label className="block text-[10px] font-mono uppercase tracking-widest opacity-40">System_Status</label>
                <div className="flex flex-wrap gap-3">
                  {(['to-read', 'reading', 'finished', 'dropped'] as BookStatus[]).map((status) => (
                    <button
                      key={status}
                      type="button"
                      onClick={() => setFormData({ ...formData, status })}
                      className={`px-4 py-2 text-[10px] font-mono uppercase tracking-widest border transition-all ${
                        formData.status === status 
                          ? 'bg-braun-ink text-white border-braun-ink' 
                          : 'bg-transparent border-braun-panel opacity-40 hover:opacity-100'
                      }`}
                    >
                      {status.replace('-', '_')}
                    </button>
                  ))}
                </div>
              </div>

              {/* Metadata Section */}
              <div className="space-y-6 pt-6 border-t border-braun-panel">
                <label className="block text-[10px] font-mono uppercase tracking-widest opacity-40">Metadata_Database</label>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="space-y-2">
                    <label className="flex items-center gap-2 text-[10px] font-mono uppercase tracking-widest opacity-40">
                      <Calendar className="w-3 h-3" /> Published
                    </label>
                    <input 
                      type="text"
                      value={formData.publicationDate || ''}
                      onChange={(e) => setFormData({ ...formData, publicationDate: e.target.value })}
                      placeholder="YYYY-MM-DD"
                      className="w-full bg-braun-panel/20 border-b-2 border-braun-ink/10 px-4 py-3 text-xs font-mono focus:border-braun-accent outline-none"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="flex items-center gap-2 text-[10px] font-mono uppercase tracking-widest opacity-40">
                      <Barcode className="w-3 h-3" /> ISBN
                    </label>
                    <input 
                      type="text"
                      value={formData.isbn || ''}
                      onChange={(e) => setFormData({ ...formData, isbn: e.target.value })}
                      placeholder="000-0000000000"
                      className="w-full bg-braun-panel/20 border-b-2 border-braun-ink/10 px-4 py-3 text-xs font-mono focus:border-braun-accent outline-none"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="flex items-center gap-2 text-[10px] font-mono uppercase tracking-widest opacity-40">
                      <Building2 className="w-3 h-3" /> Publisher
                    </label>
                    <input 
                      type="text"
                      value={formData.publisher || ''}
                      onChange={(e) => setFormData({ ...formData, publisher: e.target.value })}
                      placeholder="INPUT_PUBLISHER"
                      className="w-full bg-braun-panel/20 border-b-2 border-braun-ink/10 px-4 py-3 text-xs font-mono focus:border-braun-accent outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* Notes Section */}
              <div className="space-y-6 pt-6 border-t border-braun-panel">
                <div className="flex justify-between items-center">
                  <label className="flex items-center gap-2 text-[10px] font-mono uppercase tracking-widest opacity-40">
                    <MessageSquare className="w-3 h-3" /> Notes_Database
                  </label>
                </div>
                
                <div className="space-y-4">
                  {Array.isArray(formData.notes) && formData.notes.map((note) => (
                    <div key={note.id} className="bg-braun-panel/5 border-l-2 border-braun-accent p-4 space-y-1">
                      <div className="flex justify-between text-[8px] font-mono uppercase opacity-40">
                        <span>P. {note.page}</span>
                        <span>{new Date(note.date).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}</span>
                      </div>
                      <p className="text-xs italic opacity-80">"{note.content}"</p>
                    </div>
                  ))}
                </div>

                <div className="bg-braun-panel/10 p-4 rounded-sm space-y-4">
                  <div className="flex gap-4">
                    <input 
                      type="number"
                      value={notePage}
                      onChange={(e) => setNotePage(e.target.value)}
                      placeholder="PAGE"
                      className="w-20 bg-white/50 border-b border-braun-ink/10 px-2 py-2 text-[10px] font-mono outline-none focus:border-braun-accent"
                    />
                    <input 
                      type="text"
                      value={newNote}
                      onChange={(e) => setNewNote(e.target.value)}
                      placeholder="ADD_NEW_NOTE_CONTENT..."
                      className="flex-1 bg-white/50 border-b border-braun-ink/10 px-2 py-2 text-[10px] font-mono outline-none focus:border-braun-accent"
                    />
                    <button 
                      type="button"
                      onClick={addNote}
                      className="analog-button w-10 h-10 flex items-center justify-center rounded-sm"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Submit Button */}
              <div className="pt-8 pb-4">
                <button 
                  type="submit"
                  className="w-full bg-braun-accent text-white font-bold py-5 uppercase tracking-[0.3em] text-xs hover:brightness-110 transition-all flex items-center justify-center gap-3 orange-glow"
                >
                  <Save className="w-4 h-4" />
                  Commit_To_Database
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
