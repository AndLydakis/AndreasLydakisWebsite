import { assetUrl } from '../app/assetUrl';
import type { ContentRecord } from '../content/types';
import type { DialogContent } from './uiTypes';

function toDialogAction(action: NonNullable<ContentRecord['actions']>[number]) {
  return {
    label: action.label,
    href: action.href ?? assetUrl(action.assetPath),
    download: action.downloadName,
    openInNewTab: action.openInNewTab,
  };
}

/**
 * Converts the data-only content contract into the smaller dialog contract.
 *
 * Keeping this boundary outside the content modules lets the game and dialog
 * code share one registry without putting DOM or Phaser concerns into the
 * owner-authored content data.
 */
export function toDialogContent(record: ContentRecord): DialogContent {
  return {
    id: record.id,
    title: record.title,
    eyebrow: record.eyebrow,
    description: record.description,
    layout: record.layout,
    tabbedSectionPlacement: record.tabbedSectionPlacement,
    sections: record.sections,
    ...(record.headerActions?.length
      ? { headerActions: record.headerActions.map(toDialogAction) }
      : {}),
    ...(record.image ? { image: { src: assetUrl(record.image.assetPath), alt: record.image.alt } } : {}),
    ...(record.gallery ? { gallery: record.gallery.map(({ assetPath, ...picture }) => ({ ...picture, src: assetUrl(assetPath) })) } : {}),
    ...(record.actions?.length
      ? {
          actions: record.actions.map(toDialogAction),
        }
      : {}),
  };
}
