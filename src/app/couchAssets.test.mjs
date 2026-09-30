import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { optionalTexturePaths } from './assetManifest';
import { houseLayout } from '../game/data/houseLayout';

// Pin the selected PORT-19A package, excluding rejected generated candidates.
// Intentional art revisions must review and update these identities explicitly.
const assets = [
  { key: 'living-room-background', path: 'backgrounds/living-room/sample.png', width: 1499, height: 1049,
    sha256: 'a12a6a3be2b0818d2335694e802bf318916cf753341d017a820fbb4b8c5d7096' },
  { key: 'living-room-background-couch-removed', path: 'backgrounds/living-room/couch-removed.png', width: 1499, height: 1049,
    sha256: '0e1b232f2bd9b8a1154f3be667100c3b1d30a4e094addd6dcf060c889bcedfc7' },
  { key: 'living-room-couch', path: 'sprites/living-room-couch/front.png', width: 503, height: 204,
    sha256: '4b3024a572e7659a08b50abf4d176cc2343a7b67e8f77f548ed41c9c8e7ee315' },
];

function expectSelectedPng(asset) {
    const root = asset.key === 'living-room-background-couch-removed'
      ? '../../output/assets/review-archive/' : '../../public/assets/';
    const bytes = readFileSync(new URL(`${root}${asset.path}`, import.meta.url));
    expect(bytes.subarray(0, 8)).toEqual(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]));
    expect(bytes.toString('ascii', 12, 16)).toBe('IHDR');
    expect(bytes.readUInt32BE(16)).toBe(asset.width);
    expect(bytes.readUInt32BE(20)).toBe(asset.height);
    expect(createHash('sha256').update(bytes).digest('hex')).toBe(asset.sha256);
    if (asset.key === 'living-room-couch') expect(bytes[25]).toBe(6); // RGBA cutout.
}

describe('PORT-19B couch asset identities and archive', () => {
  it.each([assets[0], assets[2]])('loads selected $key PNG bytes through the manifest', asset => {
    expect(optionalTexturePaths[asset.key]).toBe(asset.path);
    expectSelectedPng(asset);
  });

  it('retains the intermediate backdrop archive without eagerly loading it', () => {
    const archived = assets[1];
    expectSelectedPng(archived);
    expect(optionalTexturePaths).not.toHaveProperty(archived.key);
    expect(Object.values(optionalTexturePaths)).not.toContain(archived.path);
  });

  it('connects live bundle references to the selected manifest entries', () => {
    const room = houseLayout.rooms.find(room => room.id === 'living-room');
    const couch = room.decorations.find(sprite => sprite.id === 'living-room-couch');
    expect(room.visualAssetId).toBe('living-room-background-couch-table-removed');
    expect(room.visualBundle).toEqual({ fallbackAssetId: assets[0].key,
      foregroundIds: [couch.id, 'living-room-coffee-table'] });
    expect(couch.assetId).toBe(assets[2].key);
  });
});
