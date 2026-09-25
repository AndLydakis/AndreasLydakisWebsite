import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { optionalTexturePaths } from './assetManifest';
import { houseLayout } from '../game/data/houseLayout';

// Identities measured from the owner-selected PORT-19C package, before integration.
const assets = [
  { key: 'living-room-coffee-table', path: 'sprites/living-room-coffee-table/front.png', width: 308, height: 185,
    sha256: 'f0dc22f73da8b36f09576bea9cf99c8ce3c7f4bd521a5791f7c9ee9b69c1cdef' },
  { key: 'living-room-background-couch-table-removed', path: 'backgrounds/living-room/couch-table-removed.png', width: 1499, height: 1049,
    sha256: 'a2ccd24621061b5a85fb25a819da7b71432801c4604e29dceaf6f049f22ec265' },
];

describe('PORT-19C1 selected table asset package', () => {
  it.each(assets)('ships exact $key PNG bytes through the manifest', asset => {
    expect(optionalTexturePaths[asset.key]).toBe(asset.path);
    const bytes = readFileSync(new URL(`../../public/assets/${optionalTexturePaths[asset.key]}`, import.meta.url));
    expect(bytes.subarray(0, 8)).toEqual(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]));
    expect(bytes.toString('ascii', 12, 16)).toBe('IHDR');
    expect(bytes.readUInt32BE(16)).toBe(asset.width);
    expect(bytes.readUInt32BE(20)).toBe(asset.height);
    expect(createHash('sha256').update(bytes).digest('hex')).toBe(asset.sha256);
    if (asset.key === 'living-room-coffee-table') expect(bytes[25]).toBe(6);
  });

  it('registers source crop [587,446,895,631) without moving the front-edge anchor', () => {
    const room = houseLayout.rooms.find(room => room.id === 'living-room');
    const table = room.decorations?.find(sprite => sprite.id === 'living-room-coffee-table');
    expect(table).toBeDefined();
    expect(table.assetId).toBe(assets[0].key);
    expect(table.artworkInBackground).not.toBe(true);
    expect(table.displayWidthTiles * 16).toBeCloseTo(308 / 1499 * 320, 8);
    expect(table.displayHeightTiles * 16).toBeCloseTo(185 / 1049 * 224, 8);
    expect((table.position.x + 0.5) * 16).toBeCloseTo(741 / 1499 * 320, 8);
    expect((table.position.y + 0.5) * 16).toBeCloseTo(538.5 / 1049 * 224, 8);
    expect(table.groundAnchor).toEqual({ x: 9.875, y: 8.4375 });
    expect(room.visualAssetId).toBe(assets[1].key);
    expect(room.visualBundle).toEqual({ fallbackAssetId: 'living-room-background',
      foregroundIds: ['living-room-couch', table.id] });
    expect(room.interactables.some(sprite => sprite.id === table.id)).toBe(false);
  });
});
