import type { ContentRecord } from './types';

export const televisionContent: ContentRecord = {
  id: 'livingroom-media',
  label: 'Television and game console',
  roomId: 'living-room',
  roomLabel: 'Living room',
  title: 'Games and movies',
  eyebrow: 'PLACEHOLDER CONTENT',
  description: 'Dummy media notes will be replaced with the owner\'s reviews later.',
  sections: [
    {
      heading: 'Game reviews',
      items: ['PLACEHOLDER GAME REVIEW - replace with a real entry.'],
    },
    {
      heading: 'Movie reviews',
      items: ['PLACEHOLDER MOVIE REVIEW - replace with a real entry.'],
    },
    {
      heading: 'Future watch and play list',
      items: ['PLACEHOLDER FUTURE ITEM - replace with a real entry.'],
    },
  ],
};
