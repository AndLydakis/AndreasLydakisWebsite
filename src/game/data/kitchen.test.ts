import { describe, expect, it } from 'vitest';
import { kitchen, kitchenEntrance, kitchenFurnitureCollisions } from './kitchen';
import { houseLayout } from './houseLayout';
import { validateHouseLayout } from './layoutValidation';
import { kitchenShoppingContent } from '../../content/kitchen';
import { InteractionSystem } from '../systems/InteractionSystem';

const blocked = (x: number, y: number) => kitchen.collisionRects.some(r =>
  x + 0.5 > r.x && x - 0.5 < r.x + r.width && y > r.y && y - 1 / 16 < r.y + r.height);

describe('kitchen layout and content', () => {
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
