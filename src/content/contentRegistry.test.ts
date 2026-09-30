import { describe, expect, it } from 'vitest';

import {
  assertValidContentRegistry,
  contentRegistry,
  validateContentRegistry,
  validateInteractableReferences,
  validateRoomRegistry,
} from './contentRegistry';
import type { ContentRecord } from './types';
import { officeContent } from './office';
import { roomRegistry } from '../game/data/rooms';

const contentSourceModules = import.meta.glob('./*.ts', {
  eager: true,
  import: 'default',
  query: '?raw',
}) as Record<string, string>;

describe('content and room registries', () => {
  it('accepts the approved room and content registries', () => {
    expect(validateRoomRegistry(roomRegistry)).toEqual([]);
    expect(validateContentRegistry(contentRegistry)).toEqual([]);
    expect(() => assertValidContentRegistry()).not.toThrow();
  });

  it('reports duplicate room IDs', () => {
    const rooms = [
      ...roomRegistry,
      { id: roomRegistry[0].id, name: 'Duplicate living room' },
    ];

    expect(validateRoomRegistry(rooms)).toContain('Duplicate room ID: living-room');
  });

  it('reports empty room IDs', () => {
    expect(validateRoomRegistry([{ id: '   ', name: 'Unnamed room' }])).toContain(
      'Room IDs must not be empty.',
    );
  });

  it('reports duplicate content IDs', () => {
    const duplicateContent: ContentRecord = {
      ...contentRegistry[0],
      label: 'Duplicate content record',
    };

    expect(validateContentRegistry([...contentRegistry, duplicateContent])).toContain(
      'Duplicate content ID: livingroom-media',
    );
  });

  it('reports content records that reference an unknown room', () => {
    const invalidContent: ContentRecord = {
      ...contentRegistry[0],
      id: 'invalid-room-content',
      roomId: 'missing-room',
    };

    expect(validateContentRegistry([...contentRegistry, invalidContent])).toContain(
      'Content invalid-room-content references unknown room: missing-room',
    );
  });

  it('reports duplicate interactable IDs and missing interactable references', () => {
    const interactables = [
      {
        id: 'television-interactable',
        roomId: 'living-room',
        contentId: 'livingroom-media',
      },
      {
        id: 'television-interactable',
        roomId: 'missing-room',
        contentId: 'missing-content',
      },
    ];

    const errors = validateInteractableReferences(interactables);

    expect(errors).toEqual(
      expect.arrayContaining([
        'Duplicate interactable ID: television-interactable',
        'Interactable television-interactable references unknown room: missing-room',
        'Interactable television-interactable references unknown content: missing-content',
      ]),
    );
  });

  it('accepts interactables whose room and content references exist', () => {
    expect(
      validateInteractableReferences([
        {
          id: 'office-cv-interactable',
          roomId: 'office',
          contentId: 'office-cv',
        },
      ]),
    ).toEqual([]);
  });

  it('keeps the dummy CV download explicit and replaceable', () => {
    expect(officeContent.eyebrow).toContain('PLACEHOLDER');
    expect(officeContent.headerActions).toEqual([
      {
        label: 'Legacy Portfolio',
        href: 'https://andlydakis.github.io/',
        openInNewTab: true,
      },
    ]);
    expect(officeContent.actions).toEqual([
      {
        label: 'Download placeholder CV (PDF)',
        assetPath: 'cv.pdf',
        downloadName: 'placeholder-cv.pdf',
      },
    ]);
  });
});

describe('data-only content modules', () => {
  const contentModuleNames = ['books.ts', 'gym.ts', 'kitchen.ts', 'office.ts', 'television.ts', 'vinyl.ts'];

  it.each(contentModuleNames)('%s has no Phaser or DOM imports', (moduleName) => {
    const source = contentSourceModules[`./${moduleName}`];

    expect(source).toBeTypeOf('string');
    expect(source).not.toMatch(/(?:from|import)\s*["'][^"']*(?:phaser|dom)[^"']*["']/i);
  });
});
