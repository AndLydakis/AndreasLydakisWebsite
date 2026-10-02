import { describe, expect, it } from 'vitest';

import { televisionContent } from '../content/television';
import { dogContent } from '../content/dog';
import { officeContent } from '../content/office';
import { toDialogContent } from './contentAdapter';

describe('toDialogContent', () => {
  it('maps every gallery picture and preserves empty galleries', () => {
    const record = { ...dogContent, gallery: Array.from({ length: 150 }, (_, index) => ({ assetPath: `photos/${index}.png`, alt: `View ${index}`, caption: `Place ${index}` })) };
    expect(toDialogContent(record).gallery).toHaveLength(150);
    expect(toDialogContent(record).gallery![149]).toEqual({ src: '/assets/photos/149.png', alt: 'View 149', caption: 'Place 149' });
    expect(toDialogContent({ ...dogContent, gallery: [] }).gallery).toEqual([]);
    expect(toDialogContent(dogContent).gallery).toBeUndefined();
  });
  it('maps the dog picture through the asset URL boundary with accessible alt text', () => {
    const dialog = toDialogContent(dogContent);
    expect(dialog.image).toEqual({
      src: '/assets/photos/dog/stella.jpg',
      alt: 'Stella, a black-and-white dog, looking to the right outdoors.',
    });
    expect(dialog.sections).toEqual([]);
    expect(dialog.description).toBeUndefined();
    expect(dialog.actions).toBeUndefined();
    expect(toDialogContent(televisionContent).image).toBeUndefined();
  });
  it('keeps television content data and removes room metadata', () => {
    expect(toDialogContent(televisionContent)).toEqual({
      id: 'livingroom-media',
      title: 'Games and movies',
      eyebrow: televisionContent.eyebrow,
      description: televisionContent.description,
      layout: 'tabs',
      sections: televisionContent.sections,
    });
  });

  it('maps the current CV download to a base-path-aware dialog link', () => {
    expect(toDialogContent(officeContent).headerActions).toEqual([
      {
        label: 'Legacy Portfolio',
        href: 'https://andlydakis.github.io/',
        download: undefined,
        openInNewTab: true,
      },
    ]);
    expect(toDialogContent(officeContent).actions).toEqual([
      {
        label: 'Download CV (PDF)',
        href: '/assets/lydakis_cv_nolink.pdf',
        download: 'lydakis-cv.pdf',
        openInNewTab: undefined,
      },
    ]);
  });
});
