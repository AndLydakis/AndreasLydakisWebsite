import { describe, expect, it } from 'vitest';
import { houseLayout } from './houseLayout';
import { validateHouseLayout } from './layoutValidation';
import { roomGroundAnchorToWorldPixel, roomRectToWorld, worldRectToWorldPixel } from './coordinates';
import { getAllCollisionRects } from '../systems/collisionGeometry';
import { quickTravelDestinations, resolveQuickTravel } from './quickTravel';
import type { HouseLayout, RoomSpriteDefinition } from './types';

const anchor = { x: 7.5, y: 6.5 };
const base = { x: 7, y: 6, width: 1, height: 0.5 };
const fixture = (patch: Partial<RoomSpriteDefinition> = {}, roomId = 'office'): HouseLayout => ({
  ...houseLayout,
  rooms: houseLayout.rooms.map(room => room.id !== roomId ? room : {
    ...room, decorations: [...(room.decorations ?? []), {
      id: 'spatial-fixture', position: { x: 7, y: 5 }, ...patch,
    }],
  }),
});
const errors = (patch: Partial<RoomSpriteDefinition>) => validateHouseLayout(fixture(patch)).join('\n');

describe('optional sprite spatial metadata', () => {
  it('collects object footprints without mutating delivered records or unrelated destinations', () => {
    const before = structuredClone(houseLayout);
    expect(validateHouseLayout(houseLayout)).toEqual([]);
    const withMetadata = fixture({ groundAnchor: anchor, footprints: [base] });
    const added = { ...base, x: 10.5, y: 26 };
    const combined = getAllCollisionRects(withMetadata);
    expect(combined).toHaveLength(getAllCollisionRects(houseLayout).length + 1);
    expect(combined).toContainEqual(added);
    for (const { id } of quickTravelDestinations) {
      expect(resolveQuickTravel(withMetadata, id)).toEqual(id === 'cv' ? undefined : resolveQuickTravel(houseLayout, id));
    }
    expect(houseLayout).toEqual(before);
  });
  it.each(houseLayout.rooms.map(room => room.id))('accepts a decoration without content in %s', roomId => {
    expect(validateHouseLayout(fixture({ groundAnchor: anchor, footprints: [base] }, roomId))).toEqual([]);
  });
  it.each([{}, { footprints: [] }, { groundAnchor: anchor }, { groundAnchor: anchor, footprints: [] }])(
    'accepts omitted/empty geometry without creating defaults (%j)', patch => {
      const layout = fixture(patch), before = structuredClone(layout);
      expect(validateHouseLayout(layout)).toEqual([]);
      expect(layout).toEqual(before);
    },
  );
  it('accepts spatial metadata on an interactable without changing its content/interaction fields', () => {
    const layout = structuredClone(houseLayout);
    Object.assign(layout.rooms[0]!.interactables[0]!, { groundAnchor: anchor, footprints: [base] });
    expect(validateHouseLayout(layout)).toEqual([]);
  });
  it('preserves distinct compound pieces, including overlapping but nonidentical rectangles', () => {
    const footprints = [base, { ...base, x: 7.5 }, { ...base, width: 0.75 }];
    const layout = fixture({ groundAnchor: anchor, footprints });
    expect(validateHouseLayout(layout)).toEqual([]);
    expect(layout.rooms.find(room => room.id === 'office')!.decorations!.at(-1)!.footprints).toEqual(footprints);
  });
  it('requires an anchor for nonempty footprints and rejects exact duplicates', () => {
    expect(errors({ footprints: [base] })).toMatch(/nonempty footprints require a groundAnchor/);
    expect(errors({ groundAnchor: anchor, footprints: [base, { ...base }] })).toMatch(/footprint 1 duplicates/);
  });
  it.each(['x', 'y'] as const)('rejects nonfinite/negative/outside anchor %s', axis => {
    for (const value of [NaN, Infinity, -Infinity, -0.01, 100]) {
      expect(errors({ groundAnchor: { ...anchor, [axis]: value } })).toMatch(/groundAnchor must be finite/);
    }
  });
  it('accepts inclusive room-edge anchors and footprints exactly touching the boundary', () => {
    for (const groundAnchor of [{ x: 0, y: 0 }, { x: 17, y: 10 }]) {
      expect(errors({ groundAnchor, footprints: [{ x: 16, y: 9, width: 1, height: 1 }] })).toBe('');
    }
  });
  it.each(['x', 'y', 'width', 'height'] as const)('rejects invalid footprint %s', field => {
    for (const value of [NaN, Infinity, -Infinity, -0.01, 100]) {
      expect(errors({ groundAnchor: anchor, footprints: [{ ...base, [field]: value }] })).toMatch(/footprint 0 must have positive finite/);
    }
    if (field === 'width' || field === 'height') {
      expect(errors({ groundAnchor: anchor, footprints: [{ ...base, [field]: 0 }] })).toMatch(/footprint 0 must have positive finite/);
    }
  });
  it.each([{ groundAnchor: anchor }, { footprints: [] }, { groundAnchor: anchor, footprints: [base] }])(
    'rejects spatial fields on background-painted objects (%j)', patch => {
      expect(errors({ artworkInBackground: true, ...patch })).toMatch(/cannot have spatial metadata/);
    },
  );
  it('retains room-local artwork uniqueness while allowing shared decoration IDs across rooms', () => {
    const layout = { ...houseLayout, rooms: houseLayout.rooms.map(room => ({
      ...room, decorations: [...(room.decorations ?? []), {
        id: 'shared-decoration', position: { x: 7, y: 5 }, groundAnchor: anchor,
      }],
    })) };
    expect(validateHouseLayout(layout)).toEqual([]);
    expect(errors({ id: 'office-workstation' })).toMatch(/artwork IDs must be non-empty and unique/);
    expect(errors({ id: ' ' })).toMatch(/artwork IDs must be non-empty and unique/);
  });
  it('still rejects globally duplicate interactable IDs across rooms', () => {
    const layout = structuredClone(houseLayout);
    layout.rooms[1]!.interactables[0]!.id = layout.rooms[0]!.interactables[0]!.id;
    expect(validateHouseLayout(layout).join('\n')).toMatch(/Duplicate interactable ID/);
  });
});

describe('spatial coordinate conversions', () => {
  const room = { origin: { x: 3.5, y: 20 } };
  it('converts fractional nonzero origins/anchors without the artwork half-tile offset', () => {
    expect(roomGroundAnchorToWorldPixel(room, { x: 2.25, y: 6.5 }, 16)).toEqual({ x: 92, y: 424 });
    expect(roomGroundAnchorToWorldPixel(room, { x: 0, y: 0 }, 16)).toEqual({ x: 56, y: 320 });
  });
  it('reuses rectangle conversion without scaling or merging compound footprints', () => {
    const pieces = [base, { x: 8.25, y: 6.25, width: 0.25, height: 1.5 }];
    expect(pieces.map(rect => worldRectToWorldPixel(roomRectToWorld(room, rect), 16))).toEqual([
      { x: 168, y: 416, width: 16, height: 8 }, { x: 188, y: 420, width: 4, height: 24 },
    ]);
  });
  it.each([0, -1, NaN, Infinity])('rejects invalid tile size %s', size => {
    expect(() => roomGroundAnchorToWorldPixel(room, anchor, size)).toThrow(/positive finite/);
  });
  it('keeps spatial and interaction coordinates independent of artwork dimensions', () => {
    const sprite: RoomSpriteDefinition = { id: 'scaled', position: { x: 1, y: 2 }, groundAnchor: anchor, footprints: [base] };
    const snapshot = structuredClone(sprite);
    for (const height of [1, 4, 20]) {
      sprite.displayHeightTiles = height; sprite.displayWidthTiles = height * 2;
      expect(roomGroundAnchorToWorldPixel(room, sprite.groundAnchor!, 16)).toEqual({ x: 176, y: 424 });
      expect(sprite.footprints).toEqual(snapshot.footprints);
      expect(sprite.position).toEqual(snapshot.position);
    }
  });
});
