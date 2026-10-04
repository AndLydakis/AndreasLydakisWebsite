import type { ContentRecord } from './types';

export const vinylContent: ContentRecord = {
  id: 'livingroom-vinyl',
  label: 'Music',
  roomId: 'living-room',
  roomLabel: 'Living room',
  title: 'Music collection',
  eyebrow: 'Music',
  description: 'Expect things on the heavier side',
  sections: [
    {
      heading: 'Recently listened - Last updated Oct. 26',
      items: [
        {
          label: 'Clutch has a new album out!',
          href: 'https://www.youtube.com/watch?v=Z4kgKBCIGFE',
          openInNewTab: true,
          notes: ['Very traditional Clutch, some will say too safe, I\ll say "good"'],
        },
        {
          label: 'Galibot - Catabase',
          href: 'https://www.youtube.com/watch?v=0bMqc-AgwWE',
          openInNewTab: true,
          notes: ['Themes - Mining history of northern France... what?'],
        },
        {
          label: 'Mgla - Exercises in futility',
          href: 'https://www.youtube.com/watch?v=TvGPAVTYfXI',
          openInNewTab: true,
          notes: ['Swedish winter is prime black metal weather'],
        },
      ]
    },
    {
      heading: 'Personal comments',
      paragraphs: ['Feel free to suggest things to listen to'],
    },
  ],
};
