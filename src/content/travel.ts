import type { ContentRecord } from './types';

/** Add any number of pictures below. Files live under public/assets/photos/travel. */
export const travelContent: ContentRecord = {
  id: 'livingroom-travel',
  roomId: 'living-room',
  roomLabel: 'Living room',
  label: 'Globe and travel pictures',
  title: 'Around the world',
  eyebrow: 'TRAVEL GALLERY',
  description: 'Scroll through the pictures. These AI-generated placeholders can be replaced with my own travel photos.',
  sections: [],
  gallery: [
    { assetPath: 'photos/travel/japan-placeholder.png', alt: 'A wooden bridge and red maple trees beside a Japanese garden pond.', caption: 'Japan-inspired garden — AI-generated placeholder' },
    { assetPath: 'photos/travel/iceland-placeholder.png', alt: 'Green coastal cliffs above black sand and Atlantic waves.', caption: 'Iceland-inspired coast — AI-generated placeholder' },
    { assetPath: 'photos/travel/peru-placeholder.png', alt: 'Terraced green slopes below snow-capped mountains in the Andes.', caption: 'Peruvian Andes-inspired landscape — AI-generated placeholder' },
  ],
};
