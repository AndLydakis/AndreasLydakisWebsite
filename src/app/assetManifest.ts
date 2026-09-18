import { assetUrl } from './assetUrl';

export const placeholderAssetPaths = {
  player: 'sprites/player/placeholder.svg',
  floor: 'tiles/floor-placeholder.svg',
  wall: 'tiles/wall-placeholder.svg',
  furniture: 'placeholders/furniture-placeholder.svg',
  interactableMarker: 'placeholders/interactable-marker-placeholder.svg',
} as const;

export const requiredPlaceholderAssetPaths = Object.values(placeholderAssetPaths);

/** Optional artwork can fail to load without preventing the generic house from starting. */
export const optionalTexturePaths = {
  'living-room-background': 'backgrounds/living-room/sample.png',
  'television-console-front': 'sprites/television-console/front.png',
  'record-player-front': 'sprites/record-player/front.png',
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
