import type { ContentRecord } from './types';

export const gymContent: ContentRecord = {
  id: 'gym-personal-records',
  label: 'Training',
  roomId: 'gym',
  roomLabel: 'Gym',
  title: 'Personal records',
  eyebrow: 'Training Log',
  description: 'I find training to be a great way to offset 8hrs a day sitting in a chair. I\'ve trained in amateur grade powerlifting and tried different combat sports.',
  sections: [
    {
      heading: 'Recent PRs',
      items: [
        'Squat — 200kg x 1, 180x5 (Summer 2026) - This made me happy.',
        'Bench press — 140kg x 1 (Fall 2026) - This made me happier.',
        'Deadlift — 230kg x 1. (Fall 2024) - Good form is for cowards',
      ],
    },
    {
      heading: 'Training notes',
      paragraphs: ['Currently trying to improve GPP and V20 max. Screw assault bikes.'],
    },
  ],
};
