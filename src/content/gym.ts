import type { ContentRecord } from './types';

export const gymContent: ContentRecord = {
  id: 'gym-personal-records',
  label: 'Squat rack',
  roomId: 'gym',
  roomLabel: 'Gym',
  title: 'Personal records',
  eyebrow: 'PLACEHOLDER CONTENT',
  description: 'Dummy gym records will be replaced with the owner\'s real entries later.',
  sections: [
    {
      heading: 'Recent PRs',
      items: ['PLACEHOLDER LIFT - replace with a real record.'],
    },
    {
      heading: 'Training note',
      paragraphs: ['PLACEHOLDER TRAINING NOTE - replace with a real note.'],
    },
  ],
};
