import { describe, expect, it } from 'vitest';

import { televisionContent } from '../content/television';
import type { ContentRecord } from '../content/types';
import { toDialogContent } from './contentAdapter';

describe('toDialogContent', () => {
  it('keeps television content data and removes room metadata', () => {
    expect(toDialogContent(televisionContent)).toEqual({
      id: 'livingroom-media',
      title: 'Games and movies',
      eyebrow: 'PLACEHOLDER CONTENT',
      description: 'Dummy media notes will be replaced with the owner\'s reviews later.',
      sections: televisionContent.sections,
    });
  });

  it('maps future content actions to base-path-aware dialog links', () => {
    const record: ContentRecord = {
      ...televisionContent,
      actions: [
        {
          label: 'Download placeholder',
          assetPath: 'cv.pdf',
          downloadName: 'placeholder-cv.pdf',
        },
      ],
    };

    expect(toDialogContent(record).actions).toEqual([
      {
        label: 'Download placeholder',
        href: '/assets/cv.pdf',
        download: 'placeholder-cv.pdf',
      },
    ]);
  });
});
