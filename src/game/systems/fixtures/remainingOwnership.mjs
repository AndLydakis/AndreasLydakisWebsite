import { readFileSync } from 'node:fs';
import { expect } from 'vitest';

export const beforeRemaining = JSON.parse(readFileSync(new URL('./port18f-j-before.json', import.meta.url), 'utf8'));
const oldRoom = id => beforeRemaining.layout.rooms.find(room => room.id === id);
const office = oldRoom('office');
const gym = oldRoom('gym');
export const approvedSteelMove = {
  id: 'gym-steel-plates',
  oldPosition: { x: 12.125, y: 7.125 }, position: { x: 13.375, y: 7.125 },
  oldAnchor: { x: 12.625, y: 8.625 }, anchor: { x: 13.875, y: 8.625 },
  oldRect: { x: 12, y: 8.25, width: 1.25, height: 0.375 },
  rect: { x: 13.25, y: 8.25, width: 1.25, height: 0.375 },
};
export const approvedKitchenLabels = [
  { id: 'kitchen-stove', oldLabel: 'Kitchen stove', label: 'Food Log' },
  { id: 'kitchen-fridge', oldLabel: 'Kitchen shopping list', label: 'Shopping list' },
];
export const removedDeskPost = { x: 2, y: 3.5625, width: 2.0625, height: 0.3125 };
const originalWorkstationRects = [office.collisionRects[5], ...office.collisionRects.slice(17, 24)];
export const compactWorkstation = {
  oldAnchor: { x: 3, y: 6.625 }, anchor: { x: 3.75, y: 6.625 },
  oldRects: originalWorkstationRects,
  rects: originalWorkstationRects.slice(0, -2).concat([
    { x: 3.9375, y: 5.1875, width: 0.6875, height: 0.9375 },
    { x: 2.8125, y: 5.625, width: 1.875, height: 1 },
  ]),
};
// Baked-art visual estimates (15/13/13px), not alpha-derived sprite bounds.
export const approvedPotResizes = [
  { id: 'top-right pot', old: { x: 15.375, y: 3.625, width: 0.875, height: 0.375 },
    rect: { x: 15.375, y: 3.0625, width: 0.875, height: 0.9375 } },
  { id: 'bottom-left pot', old: { x: 0.625, y: 8.375, width: 0.875, height: 0.375 },
    rect: { x: 0.625, y: 7.9375, width: 0.875, height: 0.8125 } },
  { id: 'bottom-right pot', old: { x: 15.5, y: 8.375, width: 0.875, height: 0.375 },
    rect: { x: 15.5, y: 7.9375, width: 0.875, height: 0.8125 } },
];
export const approvedPlants = [
  { id: 'office-plant-top-right', position: { x: 15.279510, y: 2.569582 }, displayHeightTiles: 2.066169,
    groundAnchor: { x: 15.8125, y: 4 } },
  { id: 'office-plant-bottom-left', position: { x: 0.500647, y: 7.401282 }, displayHeightTiles: 2.182908,
    groundAnchor: { x: 1.0625, y: 8.75 } },
  { id: 'office-plant-bottom-right', position: { x: 15.484272, y: 7.401211 }, displayHeightTiles: 1.962774,
    groundAnchor: { x: 15.9375, y: 8.75 } },
].map((plant, index) => ({ ...plant, assetId: plant.id, footprints: [approvedPotResizes[index].rect] }));
export const approvedPlantBundle = { fallbackAssetId: 'office-background', foregroundIds: approvedPlants.map(plant => plant.id) };
export const approvedDogChange = {
  id: 'office-dog-bed', old: office.collisionRects[7],
  position: { x: 2.5, y: 7.625 }, anchor: { x: 3, y: 8.8125 },
  rect: { x: 1.8484375, y: 7.4921875, width: 2.321875, height: 1.3234375 },
};
export const approvedOfficeResizes = [
  { id: 'office-sofa', old: office.collisionRects[8], height: 4.6 * (1226 / 1536) * 0.8, bottom: 7.1875 },
  { id: 'office-coffee-table', old: office.collisionRects[9], height: 3.4 * (1198 / 1536) * 0.8, bottom: 6.9375 },
].map(item => ({ ...item, rect: { ...item.old, y: item.bottom - item.height, height: item.height } })).concat([approvedDogChange]);

export function withApprovedGeometryChanges(worldRects) {
  const removed = { ...removedDeskPost, x: office.origin.x + removedDeskPost.x, y: office.origin.y + removedDeskPost.y };
  const key = rectKeys([removed])[0];
  expect(worldRects.filter(rect => rectKeys([rect])[0] === key)).toHaveLength(1);
  let result = worldRects.filter(rect => rectKeys([rect])[0] !== key);
  for (const resize of [...approvedOfficeResizes, ...approvedPotResizes]) {
    const toWorld = rect => ({ ...rect, x: office.origin.x + rect.x, y: office.origin.y + rect.y });
    const oldKey = rectKeys([toWorld(resize.old)])[0];
    expect(result.filter(rect => rectKeys([rect])[0] === oldKey)).toHaveLength(1);
    result = result.map(rect => rectKeys([rect])[0] === oldKey ? toWorld(resize.rect) : rect);
  }
  for (let index = compactWorkstation.oldRects.length - 2; index < compactWorkstation.oldRects.length; index++) {
    const toWorld = rect => ({ ...rect, x: office.origin.x + rect.x, y: office.origin.y + rect.y });
    const oldKey = rectKeys([toWorld(compactWorkstation.oldRects[index])])[0];
    expect(result.filter(rect => rectKeys([rect])[0] === oldKey)).toHaveLength(1);
    result = result.map(rect => rectKeys([rect])[0] === oldKey ? toWorld(compactWorkstation.rects[index]) : rect);
  }
  const toGymWorld = rect => ({ ...rect, x: gym.origin.x + rect.x, y: gym.origin.y + rect.y });
  const oldSteelKey = rectKeys([toGymWorld(approvedSteelMove.oldRect)])[0];
  expect(result.filter(rect => rectKeys([rect])[0] === oldSteelKey)).toHaveLength(1);
  result = result.map(rect => rectKeys([rect])[0] === oldSteelKey
    ? toGymWorld(approvedSteelMove.rect) : rect);
  return result;
}
export const remainingOwners = [
  { roomId: 'gym', id: 'gym-boombox', anchor: { x: 8, y: 4.1875 }, rects: oldRoom('gym').collisionRects.filter(rect => rect.x === 7.25 && rect.y === 3.625) },
  { roomId: 'kitchen', id: 'kitchen-dining-set', anchor: { x: 8.5, y: 8.3125 }, rects: oldRoom('kitchen').collisionRects.slice(9, 12) },
  { roomId: 'office', id: 'office-workstation', anchor: compactWorkstation.anchor, rects: compactWorkstation.rects },
  ...[['office-bookcase', 6, 5.6, 3.75], ['office-dog-bed', 7, 3, 8.8125],
    ['office-sofa', 8, 13.75, 7.1875], ['office-coffee-table', 9, 10.75, 6.9375],
    ['office-robot-standing', 10, 12.75, 8.8125], ['office-robot-seated', 11, 14.5, 8.75]]
    .map(([id, index, x, y]) => ({ roomId: 'office', id, anchor: { x, y },
      rects: [approvedOfficeResizes.find(resize => resize.id === id)?.rect ?? office.collisionRects[index]] })),
];
export const rectKeys = rects => rects.map(({ x, y, width, height }) => JSON.stringify([x, y, width, height])).sort();

/** Undo ONLY the nine named ownership additions, three extracted plants and approved office geometry deltas.
 * Assert their exact geometry and remaining room rectangles before restoring order.
 * Preserve every other object/room field so the older tests still detect drift.
 */
export function undoRemainingOwnership(layout) {
  return { ...layout, rooms: layout.rooms.map(room => {
    const owners = remainingOwners.filter(owner => owner.roomId === room.id);
    if (!owners.length) return room;
    const source = oldRoom(room.id);
    if (room.id === 'gym') {
      const sourceSteel = source.decorations.find(sprite => sprite.id === approvedSteelMove.id);
      const currentSteel = room.decorations.find(sprite => sprite.id === approvedSteelMove.id);
      expect(currentSteel).toEqual({ ...sourceSteel, position: approvedSteelMove.position,
        groundAnchor: approvedSteelMove.anchor, footprints: [approvedSteelMove.rect] });
      room = { ...room, decorations: room.decorations.map(sprite =>
        sprite.id === approvedSteelMove.id ? sourceSteel : sprite) };
    }
    if (room.id === 'kitchen') {
      room = { ...room, interactables: room.interactables.map(sprite => {
        const change = approvedKitchenLabels.find(item => item.id === sprite.id);
        if (!change) return sprite;
        const sourceSprite = source.interactables.find(item => item.id === sprite.id);
        expect(sourceSprite.label).toBe(change.oldLabel);
        expect(sprite).toEqual({ ...sourceSprite, label: change.label });
        return sourceSprite;
      }) };
    }
    if (room.id === 'office') {
      expect(room.visualAssetId).toBe('office-background-plants-removed');
      expect(room.visualBundle).toEqual(approvedPlantBundle);
      expect(room.decorations.filter(sprite => approvedPlantBundle.foregroundIds.includes(sprite.id))).toEqual(approvedPlants);
      const { visualBundle, ...rest } = room;
      room = { ...rest, visualAssetId: source.visualAssetId,
        decorations: room.decorations.filter(sprite => !approvedPlantBundle.foregroundIds.includes(sprite.id)) };
    }
    // Restore old ownership, the deleted post and the approved original base sizes only
    // for snapshot comparison; validate exact current pieces before stripping them.
    const moved = new Set(rectKeys([...owners.flatMap(owner => owner.rects),
      ...(room.id === 'office' ? [removedDeskPost, ...approvedOfficeResizes.map(resize => resize.old),
        ...approvedPotResizes.map(resize => resize.old), ...compactWorkstation.oldRects.slice(-2)] : [])]));
    const expectedRoomRects = source.collisionRects.filter(rect => !moved.has(rectKeys([rect])[0]));
    expect(room.collisionRects).toEqual(expectedRoomRects);
    const strip = sprite => {
      const owner = owners.find(owner => owner.id === sprite.id);
      if (!owner) return sprite;
      expect(rectKeys(sprite.footprints ?? [])).toEqual(rectKeys(owner.rects));
      expect(sprite.groundAnchor).toEqual(owner.anchor);
      const { groundAnchor, footprints, ...rest } = sprite;
      if (sprite.id === approvedDogChange.id) {
        expect(sprite.position).toEqual(approvedDogChange.position);
        const original = source.interactables.find(item => item.id === sprite.id);
        // Normalize only the approved y shift; x and all other fields remain checked.
        return { ...rest, position: { ...rest.position, y: original.position.y } };
      }
      return rest;
    };
    return { ...room, collisionRects: source.collisionRects,
      interactables: room.interactables.map(strip), decorations: room.decorations?.map(strip) };
  }) };
}
