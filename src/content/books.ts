import type { ContentRecord } from './types';

/** Replace these clearly labeled entries with real reading notes when supplied. */
export const booksContent: ContentRecord = {
  id: 'livingroom-books',
  label: 'Books',
  roomId: 'living-room',
  roomLabel: 'Living room',
  title: 'Recently read books',
  eyebrow: 'Reading List',
  description: 'I am a science fiction and horror fan, but I try to diversify once in a while',
  sections: [
    {
      heading: 'Currently Reading through the Horus Heresy Series, currently at:',
      items: [
        {
          label: 'Warhawk, by Chris Wraight.',
          href: 'http://gaming.kylebb.com/hhtimeline/',
          openInNewTab: true,
          notes: ['Good change after the slogs that were Saturnine and Mortis, not as many setpieces but more Deathguard and White Scars beef is always good.'],
        },
      ],
    },
    {
      heading: 'Recently Read',
      items: [
        {
          label: 'When We Cease to Understand the World — Benjamin Labatut.',
          href: 'https://en.wikipedia.org/wiki/When_We_Cease_to_Understand_the_World',
          openInNewTab: true,
          notes: ['Kinda historic, kinda fiction easy read that goes through the lives of world changing scientists, easy reccomendation.'],
        },
      ],
    },
  ],
};
