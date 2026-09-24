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
      items: ['DEMO: tomato pasta with basil.', 'DEMO: roasted vegetables and rice.'],
    },
    {
      heading: 'Comments',
      paragraphs: ['DEMO RECIPE: simmer tomatoes with garlic, toss with cooked pasta and finish with basil. These are sample entries, not the owner\'s actual meals.'],
    },
  ],
};

/** Display-only content: no checked state, editing controls or persistence. */
export const kitchenShoppingContent: ContentRecord = {
  id: 'kitchen-shopping', label: 'Kitchen shopping list', roomId: 'kitchen', roomLabel: 'Kitchen',
  title: 'Shopping list', eyebrow: 'PLACEHOLDER CONTENT',
  description: 'Read-only demo list; the owner can replace these entries in the content file.',
  sections: [{ heading: 'To buy', items: ['DEMO: tomatoes', 'DEMO: pasta', 'DEMO: basil', 'DEMO: milk'] }],
};
