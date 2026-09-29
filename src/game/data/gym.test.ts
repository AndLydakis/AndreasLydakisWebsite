import { describe, expect, it } from 'vitest';

import { optionalTexturePaths } from '../../app/assetManifest';
import { houseLayout, houseDoorways } from './houseLayout';
import { validateHouseLayout } from './layoutValidation';
import { InteractionSystem } from '../systems/InteractionSystem';
import { PLAYER_DISPLAY_HEIGHT } from '../entities/playerAnimation';
import { getRoomLocalCollisionRects } from '../systems/collisionGeometry';

const gym = houseLayout.rooms.find((room) => room.id === 'gym')!;

/** Match the real 16px-wide, 1px-high foot strip; inputs are local sole-center tile coordinates. */
function blocked(x: number, y: number): boolean {
  return getRoomLocalCollisionRects(gym).some((rect) =>
    x + 0.5 > rect.x && x - 0.5 < rect.x + rect.width &&
    y > rect.y && y - 1 / houseLayout.tileSize < rect.y + rect.height,
  );
}

describe('gym artwork and navigation', () => {
  it('uses eight independent sprites, with the squat rack and boombox interactive', () => {
    expect(gym.visualAssetId).toBe('gym-background');
    expect(gym.interactables.map((item) => item.contentId)).toEqual(['gym-personal-records', 'livingroom-vinyl']);
    expect(gym.decorations).toHaveLength(6);
    expect(gym.interactables[0]!.assetId).toBe('gym-squat-rack-front-right');
    for (const item of [...gym.interactables, ...gym.decorations!]) {
      expect(item.assetId).toBeTruthy();
      expect(optionalTexturePaths).toHaveProperty(item.assetId!);
      expect(item.displayHeightTiles).toBeGreaterThan(0);
    }
    expect(validateHouseLayout(houseLayout)).toEqual([]);
  });

  it('has a connected foot-width route between both doors and the rack approaches', () => {
    // Quarter-tile flood fill catches narrow passages that room-graph reachability cannot.
    const pending = [{ x: 0.5, y: 8 }], reached = new Set<string>();
    for (let index = 0; index < pending.length; index++) {
      const { x, y } = pending[index]!;
      const key = `${x},${y}`;
      if (reached.has(key) || x < 0.5 || y < 0.25 || x > 15.5 || y > 14 || blocked(x, y)) continue;
      reached.add(key);
      pending.push({ x: x + 0.25, y }, { x: x - 0.25, y }, { x, y: y + 0.25 }, { x, y: y - 0.25 });
    }
    for (const door of houseDoorways.filter((item) => item.fromRoomId === gym.id)) {
      expect(reached.has(`${door.opening.x + door.opening.width / 2},${door.opening.y + door.opening.height / 2}`)).toBe(true);
    }
    // Side and front approaches are reachable without going through either rack foot.
    const interaction = new InteractionSystem(houseLayout);
    for (const [x, y] of [[12.25, 6.75], [9.75, 5.25], [14.5, 5.25], [8, 4.5], [2.5, 4.25]]) {
      expect(reached.has(`${x},${y}`)).toBe(true);
      interaction.update({ position: { x: gym.origin.x + x! - 0.5, y: gym.origin.y + y! - 1.5 } });
      // The front approach is in range; the outer side paths remain available to walk around.
      if (x === 12.25) expect(interaction.getCurrentTarget()?.contentId).toBe('gym-personal-records');
      if (x === 8) expect(interaction.getCurrentTarget()?.contentId).toBe('livingroom-vinyl');
    }
    interaction.destroy();
    expect(blocked(12.25, 5.75)).toBe(false); // Open space between the rack feet.
    expect(blocked(10.625, 5.75)).toBe(true);
    expect(blocked(13.875, 5.75)).toBe(true);
  });

  it('keeps the half-size dumbbells near the back-left wall and the boombox beneath the window', () => {
    expect(gym.interactables[0]!.position).toEqual({ x: 11.75, y: 3.5 });
    const dumbbells = gym.decorations!.find((item) => item.id === 'gym-dumbbell-rack')!;
    expect(dumbbells.position).toEqual({ x: 2, y: 2.5 });
    expect(dumbbells.displayHeightTiles).toBe(4.5 * 0.5);
    const boombox = gym.interactables.find((item) => item.id === 'gym-boombox')!;
    expect(boombox.position).toEqual({ x: 7.5, y: 3 });
    expect(boombox.promptLabel).toBe('boombox');
    const vinyl = houseLayout.rooms.flatMap((room) => room.interactables)
      .find((item) => item.id !== boombox.id && item.contentId === 'livingroom-vinyl')!;
    expect(boombox.contentId).toBe(vinyl.contentId);
    expect(boombox.interactionRadiusTiles).toBe(vinyl.interactionRadiusTiles);
  });

  it('does not create interaction targets at decorative equipment', () => {
    const interaction = new InteractionSystem(houseLayout);
    for (const object of gym.decorations!) {
      interaction.update({ position: { x: gym.origin.x + object.position.x, y: gym.origin.y + object.position.y } });
      expect(interaction.getCurrentTarget()).toBeNull();
    }
    interaction.destroy();
  });

  it('keeps the soles within a pixel of the visible equipment base when approaching from below', () => {
    // Measured selected-sprite alpha bounds (threshold128), transformed with the actual renderer scale.
    const measured = [
      ['gym-squat-rack', 1289, 1271, 6.4375],
      ['gym-dumbbell-rack', 1289, 1191, 3.96875],
      ['gym-bench', 1182, 1011, 8.3125],
      ['gym-boxing-bag', 1536, 1512, 11.6875],
      ['gym-steel-plates', 1254, 1231, 8.625],
      ['gym-bumper-plates', 1289, 1187, 10.5],
      ['gym-bumper-plates-extra', 1289, 1187, 10.5],
      ['gym-boombox', 1024, 962, 4.1875],
    ] as const;
    for (const [id, sourceHeight, visibleBottom, collisionBottom] of measured) {
      const sprite = [...gym.interactables, ...gym.decorations!].find((item) => item.id === id)!;
      const artBottom = sprite.position.y + 0.5 + sprite.displayHeightTiles! * (visibleBottom / sourceHeight - 0.5);
      // Compare footprint edge to art base. The 1px foot strip adds its own contact thickness.
      expect(Math.abs(collisionBottom - artBottom) * houseLayout.tileSize).toBeLessThanOrEqual(1);
      expect(getRoomLocalCollisionRects(gym).some((rect) => rect.y + rect.height === collisionBottom)).toBe(true);
    }
  });

  it.each([
    ['dumbbell rack', 1.625, 3.5, 1.75, 0.15625 * 3],
    ['boombox', 7.25, 3.625, 1.5, 0.1875 * 3],
  ] as const)('blocks the moved %s base while keeping its floor approach clear', (_name, x, y, width, height) => {
    expect(getRoomLocalCollisionRects(gym)).toContainEqual({ x, y, width, height });
    const bottom = y + height;
    // The taller footprint extends upward, retaining the existing foot-contact edge.
    expect(blocked(x + width / 2, y + 1 / 16)).toBe(true);
    expect(blocked(x + width / 2, bottom)).toBe(true);
    expect(blocked(x + width / 2, bottom + 1 / 16)).toBe(false);
    // The left rack-to-wall gap is intentionally narrower than the player;
    // approach the rack from the clear front/right instead.
    expect(blocked(x - 0.5, bottom)).toBe(_name === 'dumbbell rack');
    expect(blocked(x + width + 0.5, bottom)).toBe(false);
    if (_name === 'boombox') {
      const interaction = new InteractionSystem(houseLayout);
      interaction.update({ position: { x: gym.origin.x + x + width / 2 - 0.5, y: gym.origin.y + bottom + 1 / 16 - 1.5 } });
      expect(interaction.getCurrentTarget()?.id).toBe('gym-boombox');
      interaction.destroy();
    }
  });

  it('uses two separated copies of the coloured stack and one cast-iron stack', () => {
    const coloured = gym.decorations!.filter((item) => item.assetId === 'gym-bumper-plates-front');
    expect(coloured).toHaveLength(2);
    expect(coloured[0]!.id).not.toBe(coloured[1]!.id);
    expect(coloured[0]!.displayHeightTiles).toBe(coloured[1]!.displayHeightTiles);
    expect(Math.abs(coloured[0]!.position.x - coloured[1]!.position.x)).toBe(2);
    expect(gym.decorations!.filter((item) => item.assetId === 'gym-steel-plates-front')).toHaveLength(1);
    for (const id of ['gym-dumbbell-rack', 'gym-boombox']) {
      expect([...gym.interactables, ...gym.decorations!].find((item) => item.id === id)!.assetId).toBe(`${id}-front`);
    }
  });

  it('moves the cast-iron stack right of the squat-rack nameplate with matching physics', () => {
    const steel = gym.decorations!.find((item) => item.id === 'gym-steel-plates')!;
    expect(steel.position).toEqual({ x: 13.375, y: 7.125 });
    expect(steel.groundAnchor).toEqual({ x: 13.875, y: 8.625 });
    expect(steel.footprints).toEqual([{ x: 13.25, y: 8.25, width: 1.25, height: 0.375 }]);
    expect(steel.footprints![0]!.x + steel.footprints![0]!.width).toBeLessThan(15);
    expect(getRoomLocalCollisionRects(gym)).toContainEqual(steel.footprints![0]);
  });

  it('halves bench height and reduces its length to two-thirds with matching base contact', () => {
    const bench = gym.decorations!.find((item) => item.id === 'gym-bench')!;
    expect(bench.position).toEqual({ x: 9, y: 7.125 });
    expect(bench.displayHeightTiles).toBe(3.75 / 2);
    expect(bench.displayWidthTiles).toBeCloseTo(3.75 * 1330 / 1182 * 2 / 3);
    expect(blocked(9.5, 8.3125)).toBe(true);
    expect(blocked(9.5, 8.375)).toBe(false);
    expect(blocked(3.125, 10.375)).toBe(false); // Old base must no longer block.
  });

  it('places the boxing bag in the bottom-left at 125% player display height', () => {
    const bag = gym.decorations!.find((item) => item.id === 'gym-boxing-bag')!;
    expect(bag.position).toEqual({ x: 2.5, y: 9.25 });
    expect(bag.displayHeightTiles! * houseLayout.tileSize).toBe(PLAYER_DISPLAY_HEIGHT * 1.25);
    expect(blocked(3, 11.6875)).toBe(true);
    expect(blocked(3, 11.75)).toBe(false);
  });

  it.each([0, -1, Number.NaN, Infinity])('rejects invalid decorative width %s', (width) => {
    const changed = { ...gym, decorations: [{ ...gym.decorations![0]!, displayWidthTiles: width }] };
    expect(validateHouseLayout({ ...houseLayout, rooms: houseLayout.rooms.map((room) => room.id === gym.id ? changed : room) }))
      .toContain('Artwork gym-bench must have a positive finite display width and an explicit height.');
  });

  it('requires a height for independent width sizing', () => {
    const changed = { ...gym, decorations: [{ ...gym.decorations![0]!, displayHeightTiles: undefined }] };
    expect(validateHouseLayout({ ...houseLayout, rooms: houseLayout.rooms.map((room) => room.id === gym.id ? changed : room) }))
      .toContain('Artwork gym-bench must have a positive finite display width and an explicit height.');
  });

  it.each([0, -1, Number.NaN, Infinity])('rejects invalid decorative height %s', (height) => {
    const changed = { ...gym, decorations: [{ ...gym.decorations![0]!, displayHeightTiles: height }] };
    expect(validateHouseLayout({ ...houseLayout, rooms: houseLayout.rooms.map((room) => room.id === gym.id ? changed : room) }))
      .toContain('Artwork gym-bench must have a positive finite display height.');
  });

  it('rejects invalid decoration coordinates and duplicate artwork IDs', () => {
    const changed = { ...gym, decorations: [{ ...gym.decorations![0]!, id: gym.interactables[0]!.id, position: { x: Number.NaN, y: 5 } }] };
    const errors = validateHouseLayout({ ...houseLayout, rooms: houseLayout.rooms.map((room) => room.id === gym.id ? changed : room) });
    expect(errors).toContain('Room gym artwork IDs must be non-empty and unique: gym-squat-rack');
    expect(errors).toContain('Artwork gym-squat-rack is outside room gym bounds.');
  });
});
