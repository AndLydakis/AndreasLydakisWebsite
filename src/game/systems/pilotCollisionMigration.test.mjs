import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { houseLayout } from '../data/houseLayout';
import { quickTravelDestinations, resolveQuickTravel } from '../data/quickTravel';
import { getAllCollisionRects, getRoomLocalCollisionRects } from './collisionGeometry';
import { withApprovedGeometryChanges } from './fixtures/remainingOwnership.mjs';

const baseline = JSON.parse(readFileSync(new URL('../../../output/qa/port18a/baseline.json', import.meta.url), 'utf8')).layout;
// Later owner-approved sofa/table resizes: keep snapshots immutable and permit only these deltas.
const oldCouchBase = { x: 6.625, y: 10.6875, width: 6.5, height: 0.4375 };
const reviewedCouchBase = { x: 6.625, y: 9.375, width: 6.5, height: 1.75 };
const oldTableBase = { x: 8, y: 7.9375, width: 3.75, height: 0.5 };
const reviewedTableBase = { x: 8, y: 6.9375, width: 3.75, height: 1.5 };
// Isolate the historical ownership migration from later owner-approved room moves.
const migratedBaseline = { ...baseline, rooms: baseline.rooms.map(room => room.id === 'living-room'
  ? houseLayout.rooms.find(current => current.id === room.id) : room) };
const multiset = rects => rects.map(({ x, y, width, height }) => JSON.stringify([x, y, width, height])).sort();
const applyApprovedResize = rect => {
  if (multiset([rect])[0] === multiset([oldCouchBase])[0]) return reviewedCouchBase;
  if (multiset([rect])[0] === multiset([oldTableBase])[0]) return reviewedTableBase;
  return rect;
};

describe('PORT-18D baseline-preserving ownership migration', () => {
  it('PORT-19C1 transfers the table base exactly once to its decoration', () => {
    const room = houseLayout.rooms.find(room => room.id === 'living-room');
    const rect = reviewedTableBase;
    const table = room.decorations?.find(object => object.id === 'living-room-coffee-table');
    expect(table).toBeDefined();
    expect(table.footprints).toEqual([rect]);
    expect(rect.height).toBe(oldTableBase.height * 3);
    expect(rect.y + rect.height).toBe(oldTableBase.y + oldTableBase.height);
    expect(table.groundAnchor.y).toBe(rect.y + rect.height);
    expect(room.collisionRects).not.toContainEqual(rect);
    expect(multiset(getRoomLocalCollisionRects(room)).filter(key => key === multiset([rect])[0])).toHaveLength(1);
  });

  it('PORT-19C1 preserves the current whole-world geometry except the approved sofa/table resizes', () => {
    const beforeCouch = JSON.parse(readFileSync(new URL('../../../output/qa/port19b/preintegration-geometry.json', import.meta.url), 'utf8')).layout;
    // That snapshot includes the newer room alignment. Apply only the subsequent
    // approved sofa/table deltas; do not substitute current rooms and hide other drift.
    const approved = { ...beforeCouch, rooms: beforeCouch.rooms.map(room => room.id !== 'living-room' ? room : {
      ...room, collisionRects: room.collisionRects.map(applyApprovedResize),
    }) };
    expect(multiset(getAllCollisionRects(houseLayout))).toEqual(multiset(withApprovedGeometryChanges(getAllCollisionRects(approved))));
    for (const { id } of quickTravelDestinations) {
      expect(resolveQuickTravel(houseLayout, id)).toEqual(resolveQuickTravel(approved, id));
    }
  });

  it('keeps the reviewed couch base owned exactly once without adding an interaction', () => {
    const room = houseLayout.rooms.find(room => room.id === 'living-room');
    const rect = reviewedCouchBase;
    const couch = room.decorations?.find(object => object.id === 'living-room-couch');
    expect(couch).toBeDefined();
    expect(couch.footprints).toEqual([rect]);
    expect(rect.height).toBe(oldCouchBase.height * 4);
    expect(rect.y + rect.height).toBe(oldCouchBase.y + oldCouchBase.height);
    expect(couch.groundAnchor.y).toBe(rect.y + rect.height);
    expect(room.collisionRects).not.toContainEqual(rect);
    expect(room.interactables.some(object => object.id === couch.id)).toBe(false);
    expect(multiset(getRoomLocalCollisionRects(room)).filter(key => key === multiset([rect])[0])).toHaveLength(1);
    // The full-world multiset assertion below also covers this fourth ownership transfer.
  });

  it('preserves the complete world multiset except the explicitly approved sofa/table resizes', () => {
    // Freeze the old room-only source independently of the new room collector.
    const oldRooms = baseline.rooms.flatMap(room => room.collisionRects.map(rect =>
      room.id === 'living-room' ? applyApprovedResize(rect) : rect).map(rect => ({
      ...rect, x: room.origin.x + rect.x, y: room.origin.y + rect.y,
    })));
    const oldNonRoom = getAllCollisionRects(baseline).slice(oldRooms.length);
    expect(multiset(getAllCollisionRects(migratedBaseline))).toEqual(multiset([...oldRooms, ...oldNonRoom]));
  });

  it.each([
    ['living-room-television', { x: 9, y: 5.25, width: 2, height: 0.3125 }],
    ['living-room-record-player', { x: 16.375, y: 7.4375, width: 2.25, height: 0.3125 }],
    ['living-room-globe', { x: 3.375, y: 7.75, width: 1.25, height: 0.375 }],
  ])('moves %s exact base to its owner once', (id, rect) => {
    const room = houseLayout.rooms.find(room => room.id === 'living-room');
    expect(room.interactables.find(object => object.id === id).footprints).toEqual([rect]);
    expect(room.collisionRects).not.toContainEqual(rect);
    expect(multiset(getRoomLocalCollisionRects(room)).filter(key => key === multiset([rect])[0])).toHaveLength(1);
  });

  it.each(quickTravelDestinations)('preserves $id destination resolution after migration', ({ id }) => {
    expect(resolveQuickTravel(migratedBaseline, id)).toEqual(resolveQuickTravel(baseline, id));
    expect(resolveQuickTravel(migratedBaseline, id)).toBeDefined();
  });
});
