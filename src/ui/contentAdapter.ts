import { assetUrl } from '../app/assetUrl';
import type { ContentRecord } from '../content/types';
import type { DialogContent } from './uiTypes';

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
    sections: record.sections,
    ...(record.actions?.length
      ? {
          actions: record.actions.map((action) => ({
            label: action.label,
            href: assetUrl(action.assetPath),
            download: action.downloadName,
          })),
        }
      : {}),
  };
}
