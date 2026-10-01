import type { ContentRecord } from './types';

export const gymContent: ContentRecord = {
  id: 'gym-personal-records',
  label: 'Training',
  roomId: 'gym',
  roomLabel: 'Gym',
  title: 'Personal records',
  eyebrow: 'PLACEHOLDER CONTENT',
  description: 'Dummy gym records will be replaced with the owner\'s real entries later.',
  sections: [
    {
      heading: 'Recent PRs',
      items: [
        'Squat — PLACEHOLDER: add weight, repetitions and date.',
        'Bench press — PLACEHOLDER: add weight, repetitions and date.',
        'Deadlift — PLACEHOLDER: add weight, repetitions and date.',
      ],
    },
    {
      heading: 'Training note',
      paragraphs: ['PLACEHOLDER TRAINING NOTE - replace with a real note.'],
    },
  ],
};
