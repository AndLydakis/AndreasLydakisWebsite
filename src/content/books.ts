import type { ContentRecord } from './types';

/** Replace these clearly labeled entries with real reading notes when supplied. */
export const booksContent: ContentRecord = {
  id: 'livingroom-books',
  label: 'Bookcase and recent reading',
  roomId: 'living-room',
  roomLabel: 'Living room',
  title: 'Recently read books',
  eyebrow: 'PLACEHOLDER CONTENT',
  description: 'These sample entries are not the owner\'s actual reading history.',
  sections: [
    {
      heading: 'Recent reading',
      items: ['PLACEHOLDER BOOK — replace with title and author.'],
    },
    {
      heading: 'Reading notes',
      paragraphs: ['PLACEHOLDER READING NOTE — replace with personal thoughts on the book.'],
    },
  ],
};
