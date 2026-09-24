// Node-only asset checks stay outside the browser TypeScript compilation.
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { describe, expect, it } from 'vitest';
import {
  PLAYER_ANIMATION_SEQUENCES, PLAYER_DIRECTIONS, PLAYER_FRAME_ANCHORS,
  PLAYER_FRAME_SIZE, PLAYER_DISPLAY_HEIGHT, playerAnimationAssets, playerAnimationKey,
  PLAYER_WALK_REPAIRS, playerAnimationSource, playerFrameRect,
} from './playerAnimation';

describe('player animation contract', () => {
  it('replaces left/right/up walking sources while retaining the accepted down walk and all idles', () => {
    for (const direction of PLAYER_DIRECTIONS) {
      expect(playerAnimationSource(direction, 'idle').textureKey).toBe(`player-${direction}`);
    }
    expect(playerAnimationSource('left', 'walk').textureKey).toBe('player-left-walk-matched-v1');
    expect(playerAnimationSource('up', 'walk').textureKey).toBe('player-up-walk-matched-v1');
    expect(playerAnimationSource('right', 'walk').textureKey).toBe('player-right-walk-matched-v1');
    expect(playerAnimationSource('down', 'walk').textureKey).toBe('player-down-walk-v3');
  });

  it('preserves the accepted down walk and all idle artwork byte for byte', () => {
    const expected = {
      'down-walk-v3': '3aba7ed262c46882cfbc13aa8ae4d2db92e31a2ef811b00503ced7766cdcd83b',
      down: '856ee738aa8f711d7e71694756e60059af2836902045062825d4433702595496',
      right: '43ed2316f8a0d1e07a43b18a75ff617780edb7b51bbea852a96d375a85d81914',
      left: '058a9d8e7dfff7ea4d94cfc6d04f6f37e05c72d85e98e85432719ebac6401bdf',
      up: 'd5ee38666bd57cbb4aee425e8c1e2c2868b0c5cd8d8fb9ac36607f186768cbf3',
    };
    for (const [direction, hash] of Object.entries(expected)) {
      const data=readFileSync(`public/assets/sprites/player/animations/${direction}.png`);
      expect(createHash('sha256').update(data).digest('hex')).toBe(hash);
    }
  });

  it.each(Object.values(PLAYER_WALK_REPAIRS))('loads twelve cells using actual replacement dimensions: $textureKey', (repair) => {
    const png=readFileSync(`public/assets/${repair.path}`);
    expect(Math.floor(png.readUInt32BE(16)/repair.frameWidth)).toBe(4);
    expect(Math.floor(png.readUInt32BE(20)/repair.frameHeight)).toBe(3);
    expect(png[25]).toBe(6);
    expect(repair.anchors).toHaveLength(12);
    for (const [index,[x,y]] of repair.anchors.entries()) {
      const [sx,sy,w,h]=playerFrameRect(repair,index);
      expect(sx).toBeGreaterThanOrEqual(0); expect(sy).toBeGreaterThanOrEqual(0);
      expect(sx+w).toBeLessThanOrEqual(png.readUInt32BE(16)); expect(sy+h).toBeLessThanOrEqual(png.readUInt32BE(20));
      expect(x).toBeGreaterThan(0); expect(x).toBeLessThan(w);
      expect(y).toBeGreaterThan(0); expect(y).toBeLessThanOrEqual(h);
    }
  });
  it('enlarges player artwork by 50% independently of physics', () => {
    expect(PLAYER_DISPLAY_HEIGHT).toBe(34 * 1.5);
  });
  it.each(PLAYER_DIRECTIONS)('selects walk and retained idle facing for %s', (direction) => {
    expect(playerAnimationKey(direction, { x: 0, y: 0 })).toBe(`player-idle-${direction}`);
    expect(playerAnimationKey(direction, { x: 1, y: -1 })).toBe(`player-walk-${direction}`);
  });

  it('has four idle and eight walk frames, with no missing or repeated indices', () => {
    expect(PLAYER_ANIMATION_SEQUENCES.map((sequence) => sequence.frameRate)).toEqual([4, 8]);
    const frames = PLAYER_ANIMATION_SEQUENCES.flatMap(({ start, end }) =>
      Array.from({ length: end - start + 1 }, (_, index) => start + index));
    expect(frames).toEqual(Array.from({ length: 12 }, (_, index) => index));
  });

  it.each(PLAYER_DIRECTIONS)('ships the expected RGBA grid and anchors for %s', (direction) => {
    const file = readFileSync(`public/assets/${playerAnimationAssets[`player-${direction}`]}`);
    expect(file.subarray(1, 4).toString()).toBe('PNG');
    expect(file.readUInt32BE(16)).toBe(PLAYER_FRAME_SIZE * 4);
    expect(file.readUInt32BE(20)).toBe(PLAYER_FRAME_SIZE * 3);
    expect(file[24]).toBe(8);
    expect(file[25]).toBe(6); // RGBA, not an opaque painted transparency pattern.
    expect(PLAYER_FRAME_ANCHORS[direction]).toHaveLength(12);
    for (const [x, y] of PLAYER_FRAME_ANCHORS[direction]) {
      expect(x).toBeGreaterThan(0);
      expect(x).toBeLessThan(PLAYER_FRAME_SIZE);
      expect(y).toBeGreaterThan(0);
      expect(y).toBeLessThanOrEqual(PLAYER_FRAME_SIZE);
    }
  });
});
