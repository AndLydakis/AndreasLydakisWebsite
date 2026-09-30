import { assetUrl } from './assetUrl';

export const placeholderAssetPaths = {
  player: 'sprites/player/placeholder.svg',
  floor: 'tiles/floor-placeholder.svg',
  wall: 'tiles/wall-placeholder.svg',
  furniture: 'placeholders/furniture-placeholder.svg',
  interactableMarker: 'placeholders/interactable-marker-placeholder.svg',
} as const;

export const requiredPlaceholderAssetPaths = Object.values(placeholderAssetPaths);

/** Small shared scene textures that are needed before any optional room is entered. */
export const sharedTexturePaths = {
  'corridor-wood': 'tiles/corridor-wood.webp',
} as const;

/** Optional artwork can fail to load without preventing the generic house from starting. */
export const optionalTexturePaths = {
  'kitchen-background': 'backgrounds/kitchen/sample-v3.png',
  'kitchen-dining-set': 'sprites/kitchen-dining-set/front-v1.png',
  'office-background': 'backgrounds/office/sample-v5.png',
  'office-background-plants-removed': 'backgrounds/office/three-plants-removed-v1.png',
  'office-plant-top-right': 'sprites/office-plant-top-right/front-v1.png',
  'office-plant-bottom-left': 'sprites/office-plant-bottom-left/front-v1.png',
  'office-plant-bottom-right': 'sprites/office-plant-bottom-right/front-v1.png',
  // Source names denote camera viewpoint: this view's working side faces screen-right.
  'office-workstation-right-facing': 'sprites/office-workstation/left-review-compact-chair.png',
  'office-bookcase-front': 'sprites/office-bookcase/front.png',
  'office-dog-bed-front': 'sprites/office-dog-bed/front-three-quarter.png',
  'office-sofa-left': 'sprites/office-sofa/left.png',
  'office-coffee-table-front': 'sprites/office-coffee-table/front.png',
  'office-robot-standing': 'sprites/office-robot/front-three-quarter.png',
  'office-robot-seated': 'sprites/office-robot/seated-front-three-quarter.png',
  'living-room-background': 'backgrounds/living-room/sample.png',
  'living-room-couch': 'sprites/living-room-couch/front.png',
  'living-room-background-couch-table-removed': 'backgrounds/living-room/couch-table-removed.png',
  'living-room-coffee-table': 'sprites/living-room-coffee-table/front.png',
  'television-console-front': 'sprites/television-console/front.png',
  'record-player-front': 'sprites/record-player/front.png',
  'globe-stand-front': 'sprites/globe-stand/front-v1.png',
  'gym-background': 'backgrounds/gym/background.png',
  'gym-squat-rack-front-right': 'sprites/gym-squat-rack/front-right.png',
  'gym-bench-front': 'sprites/gym-bench/front.png',
  'gym-dumbbell-rack-front': 'sprites/gym-dumbbell-rack/front.png',
  'gym-steel-plates-front': 'sprites/gym-steel-plates/front.png',
  'gym-bumper-plates-front': 'sprites/gym-bumper-plates/front.png',
  'gym-boombox-front': 'sprites/gym-boombox/front.png',
  'gym-boxing-bag-front-three-quarter': 'sprites/gym-boxing-bag/front-three-quarter.png',
} as const;

export async function validatePlaceholderAssets(): Promise<string[]> {
  if (!import.meta.env.DEV) {
    return [];
  }

  const checks = await Promise.all(
    requiredPlaceholderAssetPaths.map(async (path) => {
      try {
        const response = await fetch(assetUrl(path), { method: 'HEAD' });
        return response.ok ? null : `${path} returned HTTP ${response.status}`;
      } catch (error) {
        return `${path} could not be loaded: ${String(error)}`;
      }
    }),
  );

  return checks.filter((error): error is string => error !== null);
}
