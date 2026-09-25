import { describe, expect, it } from 'vitest';
import { houseLayout } from './houseLayout';
import { validateHouseLayout } from './layoutValidation';

function fixture(bundleChanges: Partial<{ fallbackAssetId: string; foregroundIds: string[] }> = {}) {
  const room = {
    ...houseLayout.rooms[0],
    visualAssetId: 'restored-fixture',
    visualBundle: { fallbackAssetId: 'original-fixture', foregroundIds: ['decor-fixture', 'interactive-fixture'], ...bundleChanges },
    decorations: [{ id: 'decor-fixture', position: { x: 4, y: 6 }, assetId: 'decor-art' }],
    interactables: [{ ...houseLayout.rooms[0].interactables[0], id: 'interactive-fixture', assetId: 'interactive-art' }],
  };
  return { ...houseLayout, rooms: [room, ...houseLayout.rooms.slice(1)] };
}

describe('generic visual bundle validation', () => {
  const assetError = 'Room living-room visualBundle requires distinct non-empty primary and fallback asset IDs.';
  const memberError = 'Room living-room visualBundle foreground IDs must be non-empty, unique separate textured artwork IDs.';

  it('accepts decorative and interactive members with arbitrary asset IDs', () => {
    expect(validateHouseLayout(fixture())).toEqual([]);
  });

  it.each(['', '   ', 'restored-fixture'])('rejects empty or primary-identical fallback %j', fallbackAssetId => {
    expect(validateHouseLayout(fixture({ fallbackAssetId }))).toContain(assetError);
  });

  it.each([undefined, '', '   '])('rejects missing or blank primary background %j', visualAssetId => {
    const layout = fixture();
    expect(validateHouseLayout({ ...layout, rooms: [
      { ...layout.rooms[0], visualAssetId }, ...layout.rooms.slice(1),
    ] })).toContain(assetError);
  });

  it.each([[], ['decor-fixture', 'decor-fixture'], ['missing-object'], [''], ['   '], ['decor-art']].map(foregroundIds => ({ foregroundIds })))('rejects invalid member list $foregroundIds', ({ foregroundIds }) => {
    expect(validateHouseLayout(fixture({ foregroundIds }))).toContain(memberError);
  });

  it.each(['decoration', 'interactable'])('rejects a %s member without art or baked into the backdrop', kind => {
    for (const change of [{ assetId: undefined }, { assetId: '' }, { assetId: '   ' }, { artworkInBackground: true }]) {
      const layout = fixture();
      const room = layout.rooms[0];
      const changed = kind === 'decoration'
        ? { ...room, decorations: room.decorations!.map(sprite => ({ ...sprite, ...change })) }
        : { ...room, interactables: room.interactables.map(sprite => ({ ...sprite, ...change })) };
      expect(validateHouseLayout({ ...layout, rooms: [changed, ...layout.rooms.slice(1)] })).toContain(memberError);
    }
  });
});
