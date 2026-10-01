import { readdirSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { optionalTexturePaths, placeholderAssetPaths, sharedTexturePaths } from './assetManifest';
import { PLAYER_ANIMATION_SOURCES } from '../game/entities/playerAnimation';

function filesBelow(path, prefix = '') {
  return readdirSync(path, { withFileTypes: true }).flatMap(entry => {
    const relative = prefix ? `${prefix}/${entry.name}` : entry.name;
    return entry.isDirectory() ? filesBelow(`${path}/${entry.name}`, relative) : [relative];
  });
}

describe('published asset inventory', () => {
  it('contains runtime assets only; review/source artwork stays outside public', () => {
    const generated = [
      ...Object.values(optionalTexturePaths),
      ...Object.values(placeholderAssetPaths),
      ...Object.values(sharedTexturePaths),
      ...PLAYER_ANIMATION_SOURCES.map(asset => asset.path),
    ];
    const fixed = [
      'fonts/tiny5/OFL.txt', 'fonts/tiny5/Tiny5-Regular.ttf',
      'lydakis_cv_nolink.pdf', 'photos/dog/stella.jpg',
      'photos/travel/iceland-placeholder.png', 'photos/travel/japan-placeholder.png',
      'photos/travel/peru-placeholder.png', 'ui/glove-pointer-original.png',
    ];
    const expected = [...new Set([...generated, ...fixed])].sort();
    expect(filesBelow('public/assets').sort()).toEqual(expected);
    expect(expected.some(path => path.includes('/animations/'))).toBe(false);
    expect(expected.every(path => !path.endsWith('.md'))).toBe(true);
  });
});
