import type { ContentRecord } from './types';

export const vinylContent: ContentRecord = {
  id: 'livingroom-vinyl',
  label: 'Music',
  roomId: 'living-room',
  roomLabel: 'Living room',
  title: 'Music collection',
  eyebrow: 'PLACEHOLDER CONTENT',
  description: 'Dummy listening notes will be replaced with the owner\'s music reviews later.',
  sections: [
    {
      heading: 'Recently listened',
      items: ['PLACEHOLDER ALBUM - replace with a real entry.'],
    },
    {
      heading: 'Personal comments',
      paragraphs: ['PLACEHOLDER MUSIC COMMENT - replace with a real note.'],
    },
  ],
};
