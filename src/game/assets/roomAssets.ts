import { optionalTexturePaths } from '../../app/assetManifest';
import type { HouseLayout, RoomDefinition } from '../data/types';

export interface TextureAsset {
  readonly key: keyof typeof optionalTexturePaths;
  readonly path: string;
}

/** Content-level warm-up order. The initial room remains the only startup gate. */
export const ROOM_BACKGROUND_LOAD_ORDER = ['office', 'living-room', 'gym', 'kitchen'] as const;

function assetFor(key: string | undefined): TextureAsset | undefined {
  if (!key || !(key in optionalTexturePaths)) return undefined;
  const typedKey = key as keyof typeof optionalTexturePaths;
  return { key: typedKey, path: optionalTexturePaths[typedKey] };
}

/** Returns exactly the optional textures owned by one room, without cross-room preloading. */
export function textureAssetsForRoom(room: RoomDefinition): readonly TextureAsset[] {
  const keys = [
    room.visualAssetId,
    room.visualBundle?.fallbackAssetId,
    ...room.interactables.map(item => item.assetId),
    ...(room.decorations ?? []).map(item => item.assetId),
  ];
  const unique = new Map<string, TextureAsset>();
  keys.forEach((key) => {
    const asset = assetFor(key);
    if (asset) unique.set(asset.key, asset);
  });
  return [...unique.values()];
}

export function roomAtInitialSpawn(layout: HouseLayout): RoomDefinition | undefined {
  return layout.rooms.find(room =>
    layout.initialSpawn.x >= room.origin.x &&
    layout.initialSpawn.x <= room.origin.x + room.widthTiles &&
    layout.initialSpawn.y >= room.origin.y &&
    layout.initialSpawn.y <= room.origin.y + room.heightTiles);
}

export function roomsForSequentialBackgroundLoad(layout: HouseLayout): readonly RoomDefinition[] {
  const initial = roomAtInitialSpawn(layout);
  const rank = new Map<string, number>(ROOM_BACKGROUND_LOAD_ORDER.map((id, index) => [id, index]));
  return layout.rooms
    .filter(room => room.id !== initial?.id)
    .map((room, index) => ({ room, index }))
    .sort((a, b) => (rank.get(a.room.id) ?? Number.MAX_SAFE_INTEGER) -
      (rank.get(b.room.id) ?? Number.MAX_SAFE_INTEGER) || a.index - b.index)
    .map(item => item.room);
}
