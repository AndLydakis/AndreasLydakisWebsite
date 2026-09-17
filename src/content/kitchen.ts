import type { ContentRecord } from './types';

export const kitchenContent: ContentRecord = {
  id: 'kitchen-meals',
  label: 'Kitchen stove',
  roomId: 'kitchen',
  roomLabel: 'Kitchen',
  title: 'Recently cooked',
  eyebrow: 'PLACEHOLDER CONTENT',
  description: 'Dummy meal notes will be replaced with the owner\'s cooking journal later.',
  sections: [
    {
      heading: 'Recent dishes',
      items: ['PLACEHOLDER DISH - replace with a real entry.'],
    },
    {
      heading: 'Comments',
      paragraphs: ['PLACEHOLDER MEAL COMMENT - replace with a real note.'],
    },
  ],
};
