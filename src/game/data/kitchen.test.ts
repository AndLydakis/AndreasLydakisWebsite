import { describe, expect, it } from 'vitest';
import { kitchen, kitchenEntrance, kitchenFurnitureCollisions } from './kitchen';
import { houseLayout } from './houseLayout';
import { validateHouseLayout } from './layoutValidation';
import { kitchenShoppingContent } from '../../content/kitchen';
import { InteractionSystem } from '../systems/InteractionSystem';
import { gymKitchenCenterX, gymSouthEntrance } from './gymKitchenConnection';
import { getAllCollisionRects, getRoomLocalCollisionRects } from '../systems/collisionGeometry';

const blocked = (x: number, y: number) => getRoomLocalCollisionRects(kitchen).some(r =>
  x + 0.5 > r.x && x - 0.5 < r.x + r.width && y > r.y && y - 1 / 16 < r.y + r.height);

describe('kitchen layout and content', () => {
  it('aligns measured gym jambs, corridor and kitchen entrance on the same world center', () => {
    const gym = houseLayout.rooms.find(room => room.id === 'gym')!;
    const corridor = houseLayout.corridors.find(item => item.id === 'gym-kitchen-corridor')!;
    expect(gymSouthEntrance).toEqual({ left: 6.4375, right: 10.875 });
    expect([gymSouthEntrance.left * 16, gymSouthEntrance.right * 16]).toEqual([103, 174]);
    expect(gymKitchenCenterX).toBe(33.65625);
    expect(gym.origin.x + (gymSouthEntrance.left + gymSouthEntrance.right) / 2).toBe(gymKitchenCenterX);
    expect(corridor).toEqual({ id: 'gym-kitchen-corridor', origin: { x: 31.4375, y: 18 }, widthTiles: 4.4375, heightTiles: 2 });
    expect(corridor.origin.x + corridor.widthTiles / 2).toBe(gymKitchenCenterX);
    expect(kitchen.origin).toEqual({ x: 24.9375, y: 20 });
    expect(kitchen.origin.x + (kitchenEntrance.left + kitchenEntrance.right) / 2).toBe(gymKitchenCenterX);
    expect(corridor.origin.y).toBe(gym.origin.y + gym.heightTiles);
    expect(corridor.origin.y + corridor.heightTiles).toBe(kitchen.origin.y);
  });

  it('contains precise jambs in the tile doorway envelope and keeps south walls within the gym', () => {
    const gym = houseLayout.rooms.find(room => room.id === 'gym')!;
    const opening = houseLayout.doorways.find(door => door.id === 'gym-to-kitchen')!.opening;
    expect(opening).toEqual({ x: 6, y: 13, width: 5, height: 1 });
    expect(opening.x).toBeLessThanOrEqual(gymSouthEntrance.left);
    expect(opening.x + opening.width).toBeGreaterThanOrEqual(gymSouthEntrance.right);
    expect(opening.y + opening.height).toBe(gym.heightTiles);
    const south = gym.collisionRects.filter(rect => rect.y === 12 && rect.height === 2);
    expect(south).toEqual([
      { x: 0, y: 12, width: 6.4375, height: 2 },
      { x: 10.875, y: 12, width: 5.125, height: 2 },
    ]);
    for (const rect of getRoomLocalCollisionRects(gym)) {
      expect(rect.x).toBeGreaterThanOrEqual(0);
      expect(rect.y).toBeGreaterThanOrEqual(0);
      expect(rect.x + rect.width).toBeLessThanOrEqual(gym.widthTiles);
      expect(rect.y + rect.height).toBeLessThanOrEqual(gym.heightTiles);
    }
  });

  it('leaves a full-width foot strip clear along the connection and blocks both corridor edges', () => {
    const solids = getAllCollisionRects(houseLayout);
    const footBlocked = (x: number, y: number) => solids.some(rect =>
      x + 0.5 > rect.x && x - 0.5 < rect.x + rect.width && y > rect.y && y - 1 / 16 < rect.y + rect.height);
    for (let y = 16; y <= 23.5; y += 1 / 16) {
      expect(footBlocked(33.65625, y)).toBe(false);
    }
    for (const y of [18.25, 19, 19.75]) {
      expect(footBlocked(31.4375 + 0.5, y)).toBe(false);
      expect(footBlocked(35.875 - 0.5, y)).toBe(false);
      expect(footBlocked(31.4375 + 0.5 - 1 / 16, y)).toBe(true);
      expect(footBlocked(35.875 - 0.5 + 1 / 16, y)).toBe(true);
    }
  });
  it('extends the table collision upward by half a tile without moving its bottom', () => {
    const table = kitchenFurnitureCollisions[4]!;
    expect(table).toEqual({ x: 6.4375, y: 6, width: 4.125, height: 1.5625 });
    expect(table.y + table.height).toBe(7.5625);
    expect(blocked(8.5, 6.25)).toBe(true);
    expect(blocked(8.5, 5.75)).toBe(false);
  });
  it('uses the fitted background, two painted hotspots and one combined dining sprite', () => {
    expect(validateHouseLayout(houseLayout)).toEqual([]);
    expect(kitchen.interactables.every(s => s.artworkInBackground && !s.assetId)).toBe(true);
    expect(kitchen.interactables[0]!.position.x).toBeLessThan(2);
    expect(kitchen.interactables[1]!.position.x).toBeGreaterThan(13);
    expect(kitchen.decorations).toHaveLength(1);
    expect(kitchen.decorations![0]!.assetId).toBe('kitchen-dining-set');
    expect(kitchenShoppingContent.sections[0]!.items!.length).toBeGreaterThan(0);
  });
  it('centers the painted opening on the corridor and keeps both jambs solid', () => {
    const corridor = houseLayout.corridors.find(c => c.id === 'gym-kitchen-corridor')!;
    expect(kitchen.origin.x + (kitchenEntrance.left + kitchenEntrance.right) / 2)
      .toBe(corridor.origin.x + corridor.widthTiles / 2);
    expect(blocked((kitchenEntrance.left + kitchenEntrance.right) / 2, 1)).toBe(false);
    expect(blocked(kitchenEntrance.left, 1)).toBe(true);
    expect(blocked(kitchenEntrance.right, 1)).toBe(true);
  });
  it('connects corridor, both interactions and routes around the dining area at full foot width', () => {
    const queue = [{ x: 9, y: 0.5 }], reached = new Set<string>();
    for (let index = 0; index < queue.length; index++) {
      const { x, y } = queue[index]!, key = `${x},${y}`;
      if (reached.has(key) || x < 0.5 || x > 15.5 || y < 0.25 || y > 9.25 || blocked(x, y)) continue;
      reached.add(key);
      queue.push({ x: x + 0.25, y }, { x: x - 0.25, y }, { x, y: y + 0.25 }, { x, y: y - 0.25 });
    }
    const interaction = new InteractionSystem(houseLayout);
    for (const [x, y, id] of [[2.75, 6, 'kitchen-stove'], [14.5, 5.25, 'kitchen-fridge']] as const) {
      expect(reached.has(`${x},${y}`)).toBe(true);
      interaction.update({ position: { x: kitchen.origin.x + x - 0.5, y: kitchen.origin.y + y - 1.5 } });
      expect(interaction.getCurrentTarget()?.id).toBe(id);
    }
    for (const [x, y] of [[5.75, 5], [11.25, 5], [5.75, 8.5], [11.25, 8.5]]) expect(reached.has(`${x},${y}`)).toBe(true);
    interaction.destroy();
  });
});
