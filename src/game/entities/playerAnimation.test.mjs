// Node-only asset checks stay outside the browser TypeScript compilation.
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { describe, expect, it } from 'vitest';
import {
  PLAYER_ANIMATION_SEQUENCES, PLAYER_DIRECTIONS, PLAYER_ANIMATION_SOURCES,
  PLAYER_FRAME_SIZE, PLAYER_DISPLAY_HEIGHT, playerAnimationSource, playerFrameRect,
} from './playerAnimation';

describe('player animation contract', () => {
  it('preserves every approved idle/walk crop, anchor and asset byte through cleanup', () => {
    const approved = JSON.parse(readFileSync(new URL('./fixtures/player-animation-approved.json', import.meta.url), 'utf8'));
    for (const direction of PLAYER_DIRECTIONS) {
      for (const state of ['idle', 'walk']) {
        const source = playerAnimationSource(direction, state);
        expect({
          rects: source.anchors.map((_, index) => playerFrameRect(source, index)),
          anchors: source.anchors,
          sha256: createHash('sha256').update(readFileSync(`public/assets/${source.path}`)).digest('hex'),
        }).toEqual(approved[direction][state]);
      }
    }
    expect(new Set(PLAYER_ANIMATION_SOURCES.map(source => source.textureKey)).size).toBe(8);
  });
  it('uses idle-matched walking sources while retaining all original idle textures', () => {
    for (const direction of PLAYER_DIRECTIONS) {
      expect(playerAnimationSource(direction, 'idle').textureKey).toBe(`player-${direction}`);
      expect(playerAnimationSource(direction, 'walk').textureKey).toBe(`player-${direction}-walk-idle-matched-v2`);
    }
  });

  it('preserves the accepted source artwork byte for byte outside the deployment tree', () => {
    const expected = {
      'down-walk-v3': '3aba7ed262c46882cfbc13aa8ae4d2db92e31a2ef811b00503ced7766cdcd83b',
      down: '856ee738aa8f711d7e71694756e60059af2836902045062825d4433702595496',
      right: '43ed2316f8a0d1e07a43b18a75ff617780edb7b51bbea852a96d375a85d81914',
      left: '058a9d8e7dfff7ea4d94cfc6d04f6f37e05c72d85e98e85432719ebac6401bdf',
      up: 'd5ee38666bd57cbb4aee425e8c1e2c2868b0c5cd8d8fb9ac36607f186768cbf3',
    };
    for (const [direction, hash] of Object.entries(expected)) {
      const data=readFileSync(`output/assets/player-animation-sources/animations/${direction}.png`);
      expect(createHash('sha256').update(data).digest('hex')).toBe(hash);
    }
  });

  it.each(PLAYER_DIRECTIONS)('loads eight walking phase slots for %s', direction => {
    const source = playerAnimationSource(direction, 'walk');
    const webp=readFileSync(`public/assets/${source.path}`);
    expect(webp.toString('ascii', 0, 4)).toBe('RIFF');
    expect(webp.toString('ascii', 8, 12)).toBe('WEBP');
    expect(webp.toString('ascii', 12, 16)).toBe('VP8L');
    const dimensions = webp.readUInt32LE(21);
    expect((dimensions & 0x3fff) + 1).toBe(PLAYER_FRAME_SIZE * 4);
    expect(((dimensions >>> 14) & 0x3fff) + 1).toBe(PLAYER_FRAME_SIZE * 2);
    expect(source.anchors).toHaveLength(8);
    for (const [index,[x,y]] of source.anchors.entries()) {
      const [sx,sy,w,h]=playerFrameRect(source,index);
      expect(sx).toBeGreaterThanOrEqual(0); expect(sy).toBeGreaterThanOrEqual(0);
      expect(sx + w).toBeLessThanOrEqual(PLAYER_FRAME_SIZE * 4);
      expect(sy + h).toBeLessThanOrEqual(PLAYER_FRAME_SIZE * 2);
      expect(x).toBeGreaterThan(0); expect(x).toBeLessThan(w);
      // Projected ground can fall below the image when the shoes lift.
      expect(y).toBeGreaterThan(0); expect(y).toBeLessThanOrEqual(h + 32);
    }
  });
  it('enlarges player artwork by 50% independently of physics', () => {
    expect(PLAYER_DISPLAY_HEIGHT).toBe(34 * 1.5);
  });
  it('registers four idle frames and eight distance-driven walking phase slots', () => {
    expect(PLAYER_ANIMATION_SEQUENCES.map((sequence) => sequence.frameRate)).toEqual([4, 8]);
    expect(PLAYER_ANIMATION_SEQUENCES.map(({ start, end }) => [start, end])).toEqual([[0, 3], [0, 7]]);
  });

  it.each(PLAYER_DIRECTIONS)('ships a compact lossless WebP idle strip for %s', (direction) => {
    const source = playerAnimationSource(direction, 'idle');
    const file = readFileSync(`public/assets/${source.path}`);
    expect(file.toString('ascii', 0, 4)).toBe('RIFF');
    expect(file.toString('ascii', 8, 12)).toBe('WEBP');
    expect(file.toString('ascii', 12, 16)).toBe('VP8L');
    const dimensions = file.readUInt32LE(21);
    expect((dimensions & 0x3fff) + 1).toBe(PLAYER_FRAME_SIZE * 4);
    expect(((dimensions >>> 14) & 0x3fff) + 1).toBe(PLAYER_FRAME_SIZE);
    expect(source.anchors).toHaveLength(4);
    for (const [x, y] of source.anchors) {
      expect(x).toBeGreaterThan(0);
      expect(x).toBeLessThan(PLAYER_FRAME_SIZE);
      expect(y).toBeGreaterThan(0);
      expect(y).toBeLessThanOrEqual(PLAYER_FRAME_SIZE);
    }
  });
});
