import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { optionalTexturePaths } from '../../app/assetManifest';

describe('selected office artwork inventory', () => {
  it.each(Object.entries(optionalTexturePaths).filter(([id]) => id.startsWith('office-')))(
    '%s is an existing PNG with the expected colour format', (id, path) => {
      const png = readFileSync(new URL(`../../../public/assets/${path}`, import.meta.url));
      expect(png.subarray(0, 8).toString('hex')).toBe('89504e470d0a1a0a');
      expect(png.readUInt32BE(16)).toBeGreaterThan(0);
      expect(png.readUInt32BE(20)).toBeGreaterThan(0);
      expect(png[25]).toBe(id === 'office-background' ? 2 : 6);
    },
  );
});
