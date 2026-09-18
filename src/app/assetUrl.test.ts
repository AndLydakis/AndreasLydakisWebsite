import { describe, expect, it } from 'vitest';

import { assetUrl } from './assetUrl';

describe('assetUrl', () => {
  it('resolves manifest paths beneath the public assets directory', () => {
    expect(assetUrl('sprites/player/placeholder.svg')).toBe(
      '/assets/sprites/player/placeholder.svg',
    );
  });

  it('does not duplicate the assets directory when given a rooted asset path', () => {
    expect(assetUrl('/assets/cv.pdf')).toBe('/assets/cv.pdf');
  });
});
