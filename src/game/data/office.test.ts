import { describe, expect, it } from 'vitest';
import { optionalTexturePaths } from '../../app/assetManifest';
import { contentById } from '../../content/contentRegistry';
import { houseLayout, houseDoorways } from './houseLayout';
import { office, officeWorkstationOutline } from './office';
import { validateHouseLayout } from './layoutValidation';
import { InteractionSystem } from '../systems/InteractionSystem';
import { getRoomLocalCollisionRects } from '../systems/collisionGeometry';

/** True only if the real 16×1px foot strip intersects an authored office obstacle. */
function blocked(x: number, y: number): boolean {
  return getRoomLocalCollisionRects(office).some(r => x + 0.5 > r.x && x - 0.5 < r.x + r.width &&
    y > r.y && y - 1 / 16 < r.y + r.height);
}

describe('office presentation and navigation', () => {
  it('blocks desk supports and chair feet but leaves raised chair art non-solid', () => {
    const covered = (x: number, y: number) => officeWorkstationOutline.some(r =>
      x >= r.x && x <= r.x + r.width && y >= r.y && y <= r.y + r.height);
    for (const [x, y] of [[2, 4.75], [2.2, 5.8], [3.8, 5.3], [4.3, 5.65], [3.5, 6.2]]) {
      expect(covered(x!, y!)).toBe(true);
      expect(blocked(x!, y!)).toBe(true);
    }
    // Monitor-only art is above the tabletop; room walls still apply independently.
    for (const [x, y] of [[2, 2.75], [3, 3.25], [3.8, 3.5]]) {
      expect(covered(x!, y!)).toBe(false);
    }
    expect(blocked(3.8, 3.5)).toBe(false);
    expect(covered(3.8, 3.7)).toBe(false);
    expect(blocked(3.8, 3.7)).toBe(false);
    // The former top post no longer traps the foot strip against the upper wall.
    for (let x = 1; x <= 4.125; x += 0.125) expect(blocked(x, 3.625)).toBe(false);
    expect(blocked(3, 3.375)).toBe(true); // Upper wall still blocks.
    expect(blocked(5.875, 5)).toBe(false); // Reachable working side.
    expect(blocked(4.5, 4.25)).toBe(false); // Backrest is visual, not floor footprint.
    expect(blocked(4.75, 5)).toBe(false); // Walk behind the raised chair seat.
    expect(blocked(5.25, 5.75)).toBe(false); // Compact art opens the old chair's right edge.
    const chairBase = officeWorkstationOutline.at(-1)!;
    expect(chairBase.y + chairBase.height).toBe(6.625); // Flush with the desk-foot bottom.
    expect(blocked(3.75, 6.625)).toBe(true);
    expect(blocked(3.75, 6.625 + 1 / 16)).toBe(false);
  });
  it('aligns both doorways and the painted office passage on the corridor centerline', () => {
    const corridor = houseLayout.corridors.find(c => c.id === 'living-room-office-corridor')!;
    const center = corridor.origin.x + corridor.widthTiles / 2;
    for (const id of ['living-room-to-office', 'office-to-living-room']) {
      const door = houseDoorways.find(d => d.id === id)!;
      const room = houseLayout.rooms.find(r => r.id === door.fromRoomId)!;
      expect(room.origin.x + door.opening.x + door.opening.width / 2).toBe(center);
    }
    const [leftWall, rightWall] = office.collisionRects;
    expect(office.origin.x + (leftWall!.width + rightWall!.x) / 2).toBe(center);
  });
  it('matches the shorter backdrop without distorting it and registers every selected asset', () => {
    expect(office.widthTiles / office.heightTiles).toBeCloseTo(1634 / 962, 2);
    expect(validateHouseLayout(houseLayout)).toEqual([]);
    expect(optionalTexturePaths[office.visualAssetId as keyof typeof optionalTexturePaths]).toBe('backgrounds/office/three-plants-removed-v1.png');
    expect(optionalTexturePaths[office.visualBundle!.fallbackAssetId as keyof typeof optionalTexturePaths]).toBe('backgrounds/office/sample-v5.png');
    const sprites = [...office.interactables, ...office.decorations!];
    expect(sprites).toHaveLength(10);
    for (const sprite of sprites) {
      expect(optionalTexturePaths).toHaveProperty(sprite.assetId!);
      expect(sprite.displayHeightTiles).toBeGreaterThan(0);
    }
  });

  it('keeps the desk left, dog below, bookcase beside it, seating right and robots south', () => {
    const sprites = new Map([...office.interactables, ...office.decorations!].map(s => [s.id, s]));
    const desk = sprites.get('office-workstation')!, dog = sprites.get('office-dog-bed')!;
    const sofa = sprites.get('office-sofa')!, table = sprites.get('office-coffee-table')!;
    expect(desk.assetId).toBe('office-workstation-right-facing');
    expect(desk.position.x).toBeLessThan(office.widthTiles / 2);
    expect(dog.position.x).toBe(desk.position.x);
    expect(dog.position.y).toBeGreaterThan(desk.position.y);
    expect(sprites.get('office-bookcase')!.position.x).toBeGreaterThan(desk.position.x);
    expect(sofa.position.x).toBeGreaterThan(table.position.x);
    expect(table.position.x).toBeGreaterThan(office.widthTiles / 2);
    for (const id of ['office-robot-standing', 'office-robot-seated']) {
      expect(sprites.get(id)!.position.y).toBeGreaterThan(sofa.position.y);
      expect(sprites.get(id)!.displayHeightTiles! * 16).toBeLessThan(51);
    }
  });

  it('reuses the CV and reading records without creating room-specific UI', () => {
    expect(office.interactables.map(i => i.contentId)).toEqual(['office-dog-photo', 'office-cv', 'livingroom-books']);
    expect(office.interactables.find(i => i.id === 'office-dog-bed')!.interactionRadiusTiles).toBe(1.3125);
    expect(contentById.get('office-cv')!.eyebrow).toContain('PLACEHOLDER');
    const books = houseLayout.rooms[0]!.interactables.find(i => i.id === 'living-room-bookcase')!;
    expect(office.interactables.find(i => i.id === 'office-bookcase')!.contentId).toBe(books.contentId);
  });

  it('connects the doorway to both interactions and routes around the furniture at foot width', () => {
    const queue = [{ x: 8.5, y: 0.5 }], reached = new Set<string>();
    for (let index = 0; index < queue.length; index++) {
      const { x, y } = queue[index]!;
      const key = `${x},${y}`;
      if (reached.has(key) || x < 0.5 || x > 16.5 || y < 0.25 || y > 9.25 || blocked(x, y)) continue;
      reached.add(key);
      queue.push({ x: x + 0.25, y }, { x: x - 0.25, y }, { x, y: y + 0.25 }, { x, y: y - 0.25 });
    }
    const interaction = new InteractionSystem(houseLayout);
    for (const [x, y, id] of [[3, 7, 'office-workstation'], [6, 4.25, 'office-bookcase'], [3, 9, 'office-dog-bed']] as const) {
      expect(reached.has(`${x},${y}`)).toBe(true);
      interaction.update({ position: { x: office.origin.x + x - 0.5, y: office.origin.y + y - 1.5 } });
      expect(interaction.getCurrentTarget()?.id).toBe(id);
    }
    for (const [x, y] of [[houseLayout.initialSpawn.x - office.origin.x + 0.5, houseLayout.initialSpawn.y - office.origin.y + 1.5], [8.5, 8.75], [11.75, 7.5], [15.5, 6], [6, 8], [4.75, 4.25], [4.75, 5]]) {
      expect(reached.has(`${x},${y}`)).toBe(true);
    }
    interaction.destroy();
    const door = houseDoorways.find(d => d.fromRoomId === 'office')!;
    expect(office.origin.x + door.opening.x).toBeGreaterThanOrEqual(10);
    expect(office.origin.x + door.opening.x + door.opening.width).toBeLessThanOrEqual(14);
  });

  it('blocks furniture bases but leaves their immediate front approach clear', () => {
    const bases = [
      { x: 1.4375, y: 6.125, width: 1.625, height: 0.5 },
      { x: 4.625, y: 3.375, width: 1.95, height: 0.375 },
      { x: 1.8484375, y: 7.4921875, width: 2.321875, height: 1.3234375 },
      { x: 12.875, y: 7.1875 - 4.6 * (1226 / 1536) * 0.8, width: 1.875, height: 4.6 * (1226 / 1536) * 0.8 },
      { x: 10.0625, y: 6.9375 - 3.4 * (1198 / 1536) * 0.8, width: 1.375, height: 3.4 * (1198 / 1536) * 0.8 },
      { x: 12.25, y: 8.4375, width: 1, height: 0.375 },
      { x: 14, y: 8.375, width: 1, height: 0.375 },
    ];
    for (const r of bases) {
      expect(getRoomLocalCollisionRects(office)).toContainEqual(r);
      expect(blocked(r.x + r.width / 2, r.y + r.height)).toBe(true);
      expect(blocked(r.x + r.width / 2, r.y + r.height + 1 / 16)).toBe(false);
    }
  });
  it('resizes only the three unobstructed baked pots while retaining their widths and bottom edges', () => {
    // Visually estimated half-plant heights; the plants are baked, not alpha sprites.
    for (const [x, y, height, bottom] of [
      [15.375, 3.0625, 0.9375, 4],
      [0.625, 7.9375, 0.8125, 8.75],
      [15.5, 7.9375, 0.8125, 8.75],
    ] as const) {
      expect(getRoomLocalCollisionRects(office)).toContainEqual({ x, y, width: 0.875, height });
      expect(office.collisionRects).not.toContainEqual({ x, y, width: 0.875, height });
      expect(y + height).toBe(bottom);
      expect(blocked(x + 0.4375, bottom)).toBe(true);
      expect(blocked(x + 0.4375, bottom + 1 / 16)).toBe(false);
    }
    expect(office.collisionRects).toContainEqual({ x: 1.5, y: 3.6875, width: 1, height: 0.375 });
  });
  it('keeps full-foot passage between desk and bed and below the bed before the south wall', () => {
    const bed = office.interactables.find(sprite => sprite.id === 'office-dog-bed')!.footprints![0]!;
    expect(bed.y - 6.625).toBe(0.8671875);
    expect(9.125 - (bed.y + bed.height)).toBeGreaterThan(1 / 16);
    for (let x = 1.5; x <= 5.5; x += 1 / 16) expect(blocked(x, 7)).toBe(false);
    for (let x = 2; x <= 5.5; x += 1 / 16) expect(blocked(x, 9)).toBe(false);
    expect(blocked(3, 9.1875)).toBe(true);
  });
});
