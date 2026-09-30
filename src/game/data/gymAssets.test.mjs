// Node-only asset inventory test; keep filesystem tooling outside the browser TS contract.
import { readFileSync, readdirSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const cardinal = ['front', 'back', 'left', 'right'];
const views = {
  'squat-rack': [...cardinal, 'front-left', 'front-right', 'back-left', 'back-right'],
  bench: cardinal,
  'dumbbell-rack': cardinal,
  boombox: cardinal,
  'steel-plates': ['front'],
  'bumper-plates': ['front'],
  'boxing-bag': ['front-three-quarter'],
};

describe('gym asset delivery inventory', () => {
  const selected = {
    'squat-rack': 'front-right', bench: 'front', 'dumbbell-rack': 'front', boombox: 'front',
    'steel-plates': 'front', 'bumper-plates': 'front', 'boxing-bag': 'front-three-quarter',
  };

  it.each(Object.entries(views))('deploys only the selected %s view and archives alternatives', (id, directions) => {
    const runtime = new URL(`../../../public/assets/sprites/gym-${id}/`, import.meta.url);
    expect(readdirSync(runtime).filter((file) => file.endsWith('.png')).sort())
      .toEqual([`${selected[id]}.png`]);
    for (const view of directions) {
      const folder = view === selected[id] || directions.length === 1
        ? runtime
        : new URL(`../../../output/assets/review-archive/sprites/gym-${id}/`, import.meta.url);
      const png = readFileSync(new URL(`${view}.png`, folder));
      expect(png.subarray(0, 8).toString('hex')).toBe('89504e470d0a1a0a');
      expect(png.readUInt32BE(16)).toBeGreaterThan(0);
      expect(png.readUInt32BE(20)).toBeGreaterThan(0);
      expect(png[25]).toBe(6); // PNG truecolour + alpha; visual/alpha quality reviewed separately.
    }
  });

  it('retains the measured room backdrop dimensions without assuming requested output size', () => {
    const png = readFileSync(new URL('../../../public/assets/backgrounds/gym/background.png', import.meta.url));
    expect([png.readUInt32BE(16), png.readUInt32BE(20)]).toEqual([1341, 1173]);
  });
});
