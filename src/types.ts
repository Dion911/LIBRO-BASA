export type BookStatus = 'reading' | 'finished' | 'to-read' | 'dropped';

export interface ReadingSession {
  id: string;
  userId: string;
  bookId: string;
  date: string;
  pagesRead: number;
  durationMinutes?: number;
  notes?: string;
  createdAt: number;
}

export interface BookNote {
  id: string;
  page: number;
  date: string;
  content: string;
}

export interface Book {
  id: string;
  userId: string;
  title: string;
  author: string;
  genre?: string;
  status: BookStatus;
  rating?: number;
  notes: BookNote[];
  coverUrl?: string;
  totalPages?: number;
  currentPage: number;
  dateAdded: string;
  dateStarted?: string;
  dateFinished?: string;
  estimatedFinishDate?: string;
  publicationDate?: string;
  isbn?: string;
  publisher?: string;
  createdAt: number;
  updatedAt: number;
}

export interface BookList {
  id: string;
  title: string;
  bookIds: string[];
  isPinned: boolean;
  dateCreated: string;
}

export interface UserStats {
  totalBooks: number;
  booksFinished: number;
  pagesRead: number;
}

export interface UserSettings {
  readingReminders: boolean;
  reminderFrequency: 'daily' | 'weekly';
  pushEnabled: boolean;
}
