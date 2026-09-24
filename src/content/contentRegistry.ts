import { gymContent } from './gym';
import { booksContent } from './books';
import { kitchenContent } from './kitchen';
import { officeContent } from './office';
import { dogContent } from './dog';
import { televisionContent } from './television';
import { vinylContent } from './vinyl';
import type { ContentRecord } from './types';
import { roomRegistry, type RoomReference } from '../game/data/rooms';
import type { InteractableDefinition } from '../game/data/types';

export const contentRegistry = [
  televisionContent,
  vinylContent,
  booksContent,
  gymContent,
  officeContent,
  dogContent,
  kitchenContent,
] as const satisfies readonly ContentRecord[];

// Beginner workflow: add a typed content module, import it above, and include it
// in this registry. Game systems should only consume this registry by content ID.

export const contentById = new Map<string, ContentRecord>(
  contentRegistry.map((content) => [content.id, content]),
);

export function validateRoomRegistry(rooms: readonly RoomReference[]): string[] {
  const errors: string[] = [];
  const seenIds = new Set<string>();

  rooms.forEach((room) => {
    if (!room.id.trim()) {
      errors.push('Room IDs must not be empty.');
    }

    if (seenIds.has(room.id)) {
      errors.push(`Duplicate room ID: ${room.id}`);
    }

    seenIds.add(room.id);
  });

  return errors;
}

export function validateContentRegistry(
  contents: readonly ContentRecord[],
  rooms: readonly RoomReference[] = roomRegistry,
): string[] {
  const errors = validateRoomRegistry(rooms);
  const roomIds = new Set(rooms.map((room) => room.id));
  const seenIds = new Set<string>();

  contents.forEach((content) => {
    if (!content.id.trim()) {
      errors.push('Content IDs must not be empty.');
    }

    if (seenIds.has(content.id)) {
      errors.push(`Duplicate content ID: ${content.id}`);
    }

    if (!roomIds.has(content.roomId)) {
      errors.push(`Content ${content.id} references unknown room: ${content.roomId}`);
    }

    seenIds.add(content.id);
  });

  return errors;
}

export function validateInteractableReferences(
  interactables: readonly Pick<InteractableDefinition, 'id' | 'roomId' | 'contentId'>[],
  contents: readonly ContentRecord[] = contentRegistry,
  rooms: readonly RoomReference[] = roomRegistry,
): string[] {
  const errors = validateContentRegistry(contents, rooms);
  const contentIds = new Set(contents.map((content) => content.id));
  const roomIds = new Set(rooms.map((room) => room.id));
  const seenIds = new Set<string>();

  interactables.forEach((interactable) => {
    if (seenIds.has(interactable.id)) {
      errors.push(`Duplicate interactable ID: ${interactable.id}`);
    }

    if (!roomIds.has(interactable.roomId)) {
      errors.push(`Interactable ${interactable.id} references unknown room: ${interactable.roomId}`);
    }

    if (!contentIds.has(interactable.contentId)) {
      errors.push(`Interactable ${interactable.id} references unknown content: ${interactable.contentId}`);
    }

    seenIds.add(interactable.id);
  });

  return errors;
}

export function assertValidContentRegistry(): void {
  const errors = validateContentRegistry(contentRegistry);

  if (errors.length) {
    throw new Error(`Invalid content or room registry:\n${errors.join('\n')}`);
  }
}
