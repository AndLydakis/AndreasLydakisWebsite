import type { ContentRecord } from './types';

/** Replace only the asset path and alt text when the owner's real photo is ready. */
export const dogContent: ContentRecord = {
  id: 'office-dog-photo',
  label: 'Stella',
  roomId: 'office',
  roomLabel: 'Office',
  title: 'Dog — placeholder photo',
  sections: [],
  image: {
    assetPath: 'photos/dog/placeholder.png',
    alt: 'Our dog, Stella.',
  },
};
