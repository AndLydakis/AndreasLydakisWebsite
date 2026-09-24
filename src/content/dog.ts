import type { ContentRecord } from './types';

/** Replace only the asset path and alt text when the owner's real photo is ready. */
export const dogContent: ContentRecord = {
  id: 'office-dog-photo',
  label: 'Office dog',
  roomId: 'office',
  roomLabel: 'Office',
  title: 'Dog — placeholder photo',
  sections: [],
  image: {
    assetPath: 'photos/dog/placeholder.png',
    alt: 'AI-generated placeholder: a black-and-white border collie relaxing in a tan dog bed.',
  },
};
