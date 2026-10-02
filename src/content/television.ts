import type { ContentRecord } from './types';

export const televisionContent: ContentRecord = {
  id: 'livingroom-media',
  label: 'Movies and games',
  roomId: 'living-room',
  roomLabel: 'Living room',
  title: 'Games and movies',
  eyebrow: 'Media',
  description: 'Horror movies, and boomer shooter games aplenty, so click links at your own discretion. Ask me about Grim Fandango',
  layout: 'tabs',
  sections: [
    {
      heading: 'Movies',
      items: [
        {
          label: 'Twinless',
          href: 'https://en.wikipedia.org/wiki/Twinless',
          openInNewTab: true,
          notes: ['Drama with a very strange setting but endearing protagonists, probably a 5/10 for an evening you don\t have anything better to do.'],
        },
        {
          label: 'Perfect Days',
          href: 'https://en.wikipedia.org/wiki/Perfect_Days',
          openInNewTab: true,
          notes: ['Must watch.'],
        },
        {
          label: 'Severance',
          href: 'https://en.wikipedia.org/wiki/Severance_(TV_series)',
          openInNewTab: true,
          notes: ['I\'ve stopped watching series, but Serverance keeps pulling me back in. On the off-chance that you are already on the bandwagon, jump on.'],
        },
        {
          label: 'Obsession',
          href: 'https://www.rottentomatoes.com/m/obsession_2025',
          openInNewTab: true,
          notes: ['On the third watch already, must see for horror fans, for *that* scene.'],
        },
        {
          label: 'Hokum',
          href: 'https://www.rottentomatoes.com/m/hokum',
          openInNewTab: true,
          notes: ['I do not understand the love for this movie, I was bored throughout.'],
        },
        {
          label: 'The Sheep Detectives',
          href: 'https://en.wikipedia.org/wiki/The_Sheep_Detectives',
          openInNewTab: true,
          notes: ['Yes, it\'s a movie about CGI sheep solving crimes. Yes, it will make you tear up. Watch it.'],
        },
      ],
    },
    {
      heading: 'Games',
      items: [
        {
          label: 'Space Marine 2.',
          href: 'https://en.wikipedia.org/wiki/Warhammer_40,000:_Space_Marine_2',
          openInNewTab: true,
          notes: ['Brain off kind of game, but they keep pumping out content, and the 40k aesthetic is really well translated to video game format.'],
        },
        {
          label: 'Metal Garden.',
          href: 'https://store.steampowered.com/app/3539440/Metal_Garden/',
          openInNewTab: true,
          notes: ['Minimalist shooter, mostly developed by one person, lovely atmosphere. Play it with developer commentary enabled to get some comments on the mechanics and level design. 2-3 hours of fun.'],
        },
        {
          label: 'The Rootrees are deads.',
          href: 'https://en.wikipedia.org/wiki/The_Roottrees_are_Dead',
          openInNewTab: true,
          notes: ['Deduction game, Obrah Dihn style, fun to play with others in small intervals'],
        },
      ],
    },
    {
      heading: 'Watch/play list',
      items: [
        {
          label: 'Control Resonant.',
          href: 'https://en.wikipedia.org/wiki/Portal:Film',
          openInNewTab: true,
          notes: ['Original Control was a great time, great setting, great presentation all around great'],
        },
        {
          label: 'Mutter',
          href: 'https://www.imdb.com/title/tt37941000/',
          openInNewTab: true,
          notes: [''],
        },
        {
          label: 'Werwulf',
          href: 'https://en.wikipedia.org/wiki/Portal:Film',
          openInNewTab: true,
          notes: [''],
        },
        {
          label: 'Hope',
          href: 'https://www.imdb.com/title/tt27369017/?ref_=nv_sr_srsg_0_tt_8_nm_0_in_0_q_hope%202026',
          openInNewTab: true,
          notes: ['I can guarantee that this has no right to be 160 minutes long, but looks like a decent second monitor movie'],
        },
        {
          label: 'Resident Evil',
          href: 'https://www.imdb.com/title/tt35538033/?ref_=nv_sr_srsg_0_tt_8_nm_0_in_0_q_resident%20evil',
          openInNewTab: true,
          notes: ['People that like the games say it is not good, therefore, it must be decent'],
        },
      ],
    },
  ],
};
