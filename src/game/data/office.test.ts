import { describe, expect, it } from 'vitest';
import { optionalTexturePaths } from '../../app/assetManifest';
import { contentById } from '../../content/contentRegistry';
import { houseLayout, houseDoorways } from './houseLayout';
import { office } from './office';
import { validateHouseLayout } from './layoutValidation';
import { InteractionSystem } from '../systems/InteractionSystem';

/** True only if the real 16×1px foot strip intersects an authored office obstacle. */
function blocked(x: number, y: number): boolean {
  return office.collisionRects.some(r => x + 0.5 > r.x && x - 0.5 < r.x + r.width &&
    y > r.y && y - 1 / 16 < r.y + r.height);
}

describe('office presentation and navigation', () => {
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
    expect(optionalTexturePaths[office.visualAssetId as keyof typeof optionalTexturePaths]).toContain('sample-v5.png');
    const sprites = [...office.interactables, ...office.decorations!];
    expect(sprites).toHaveLength(7);
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
    expect(office.interactables.map(i => i.contentId)).toEqual(['office-cv', 'livingroom-books']);
    expect(contentById.get('office-cv')!.eyebrow).toContain('PLACEHOLDER');
    const books = houseLayout.rooms[0]!.interactables.find(i => i.id === 'living-room-bookcase')!;
    expect(office.interactables[1]!.contentId).toBe(books.contentId);
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
    for (const [x, y, id] of [[3, 7, 'office-workstation'], [5.5, 4.25, 'office-bookcase']] as const) {
      expect(reached.has(`${x},${y}`)).toBe(true);
      interaction.update({ position: { x: office.origin.x + x - 0.5, y: office.origin.y + y - 1.5 } });
      expect(interaction.getCurrentTarget()?.id).toBe(id);
    }
    for (const [x, y] of [[8.5, 8.75], [11.75, 7.5], [15.5, 6], [6, 8]]) {
      expect(reached.has(`${x},${y}`)).toBe(true);
    }
    interaction.destroy();
    const door = houseDoorways.find(d => d.fromRoomId === 'office')!;
    expect(office.origin.x + door.opening.x).toBeGreaterThanOrEqual(10);
    expect(office.origin.x + door.opening.x + door.opening.width).toBeLessThanOrEqual(14);
  });

  it('blocks furniture bases but leaves their immediate front approach clear', () => {
    for (const r of office.collisionRects.slice(5, 12)) {
      expect(blocked(r.x + r.width / 2, r.y + r.height)).toBe(true);
      expect(blocked(r.x + r.width / 2, r.y + r.height + 1 / 16)).toBe(false);
    }
  });
});
