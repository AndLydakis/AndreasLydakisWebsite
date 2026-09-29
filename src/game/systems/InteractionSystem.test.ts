import { describe, expect, it } from 'vitest';

import { houseLayout } from '../data/houseLayout';
import type { PlayerState } from '../entities/Player';
import {
  DEFAULT_INTERACTION_RADIUS_TILES,
  InteractionSystem,
  type InteractionTarget,
  selectInteractionTarget,
} from './InteractionSystem';

const playerState = (x: number, y: number): PlayerState => ({
  position: { x, y },
  facing: 'down',
});

const target = (
  id: string,
  x: number,
  y: number,
  interactionRadiusTiles = DEFAULT_INTERACTION_RADIUS_TILES,
): InteractionTarget => ({
  id,
  roomId: 'test-room',
  contentId: `${id}-content`,
  label: id,
  promptLabel: id,
  position: { x, y },
  interactionRadiusTiles,
});

describe('selectInteractionTarget', () => {
  it('returns no target when every interactable is outside its range', () => {
    expect(selectInteractionTarget({ x: 0, y: 0 }, [target('far-away', 3, 0)])).toBeNull();
  });

  it('accepts the interaction-radius boundary and rejects positions beyond it', () => {
    const interactable = target('television', 2, 0, 2);

    expect(selectInteractionTarget({ x: 0, y: 0 }, [interactable])).toEqual(interactable);
    expect(selectInteractionTarget({ x: -0.01, y: 0 }, [interactable])).toBeNull();
  });

  it('selects the closest valid target when ranges overlap', () => {
    const near = target('near', 1, 0);
    const far = target('far', 2, 0);

    expect(selectInteractionTarget({ x: 0, y: 0 }, [far, near])).toEqual(near);
  });

  it('resolves equal-distance ties deterministically and preserves the current target', () => {
    const alpha = target('alpha', -1, 0);
    const beta = target('beta', 1, 0);

    expect(selectInteractionTarget({ x: 0, y: 0 }, [beta, alpha])).toEqual(alpha);
    expect(selectInteractionTarget({ x: 0, y: 0 }, [alpha, beta], beta.id)).toEqual(beta);
  });

  it('uses an optional rectangular target bounds for range checks', () => {
    const interactable: InteractionTarget = {
      ...target('desk', 5, 5, 1),
      bounds: { x: 4, y: 4, width: 2, height: 2 },
    };

    expect(selectInteractionTarget({ x: 3, y: 5 }, [interactable])).toEqual(interactable);
    expect(selectInteractionTarget({ x: 2.9, y: 5 }, [interactable])).toBeNull();
  });

  it('retains circular proximity and also accepts the padded label rectangle', () => {
    const interactable: InteractionTarget = {
      ...target('desk', 8, 8, 1),
      labelActivationBounds: { x: 3, y: 4, width: 2, height: 1 },
    };
    expect(selectInteractionTarget({ x: 8, y: 9 }, [interactable])).toEqual(interactable);
    expect(selectInteractionTarget({ x: 4, y: 4.5 }, [interactable])).toEqual(interactable);
    expect(selectInteractionTarget({ x: 2.99, y: 4.5 }, [interactable])).toBeNull();
  });

  it('prioritizes the label being touched over a neighboring radius-only candidate', () => {
    const labelled: InteractionTarget = {
      ...target('workstation', 8, 2, 1),
      labelActivationBounds: { x: 3, y: 4, width: 2, height: 1 },
    };
    const nearby = target('dog', 4, 4.5, 2);

    expect(selectInteractionTarget({ x: 4, y: 4.5 }, [nearby, labelled])).toEqual(labelled);
  });

  it('activates a label when the foot collider touches it before the anchor center enters', () => {
    const labelled: InteractionTarget = {
      ...target('bookcase', 8, 2, 1),
      labelActivationBounds: { x: 3, y: 4, width: 2, height: 1 },
    };
    const anchorCenter = { x: 4, y: 3 };
    const footCollider = { x: 3.5, y: 4, width: 1, height: 0.0625 };

    expect(selectInteractionTarget(anchorCenter, [labelled], undefined, footCollider)).toEqual(labelled);
  });
});

describe('InteractionSystem', () => {
  it('selects the bookcase from clear floor and switches cleanly to vinyl and TV', () => {
    const system = new InteractionSystem(houseLayout);
    for (const [x, y, expected] of [
      [17.25, 7.125, 'livingroom-books'],
      [17.25, 7.7, 'livingroom-books'],
      [17.25, 7.76, null],
      [19, 8.5, 'livingroom-vinyl'],
      [19, 10, 'livingroom-vinyl'],
      [11.5, 8, 'livingroom-media'],
      [13, 11, null],
    ] as const) {
      system.update(playerState(x, y));
      expect(system.getCurrentTarget()?.contentId ?? null).toBe(expected);
    }
    system.destroy();
  });

  it.each([[1.5, 0], [-1.5, 0], [0, 1.5], [0, -1.5]])('selects vinyl when approached with offset (%s, %s), without changing TV selection', (dx, dy) => {
    const system = new InteractionSystem(houseLayout);
    const room = houseLayout.rooms[0]!;
    const vinyl = room.interactables.find((item) => item.contentId === 'livingroom-vinyl')!;
    const x = room.origin.x + vinyl.position.x;
    const y = room.origin.y + vinyl.position.y;
    system.update(playerState(x + dx, y + dy));
    expect(system.getCurrentTarget()).toMatchObject({
      id: 'living-room-record-player', contentId: 'livingroom-vinyl', promptLabel: 'vinyl and record player',
    });
    system.update(playerState(x, y + 1.51));
    expect(system.getCurrentTarget()).toBeNull();
    system.update(playerState(11.5, 8));
    expect(system.getCurrentTarget()?.contentId).toBe('livingroom-media');
    system.destroy();
  });

  it('creates generic world-space targets from all room-local interactables', () => {
    const system = new InteractionSystem(houseLayout);
    const target = system.getCurrentTarget();

    expect(target).toBeNull();
    expect(system.createInteractable(houseLayout.rooms[0]!.interactables[0]!)).toMatchObject({
      id: 'living-room-television',
      position: { x: 11.5, y: 7.5 },
    });
  });

  it('attaches renderer-authored label activation bounds by stable interactable ID', () => {
    const bounds = { x: 10, y: 11, width: 3, height: 1 };
    const system = new InteractionSystem(houseLayout, {
      labelActivationBounds: new Map([['living-room-television', bounds]]),
    });
    expect(system.createInteractable(houseLayout.rooms[0]!.interactables[0]!))
      .toMatchObject({ labelActivationBounds: bounds });
  });

  it('emits only when the selected target changes', () => {
    const changes: Array<string | null> = [];
    const system = new InteractionSystem(houseLayout, {
      onTargetChanged: (nextTarget) => changes.push(nextTarget?.id ?? null),
    });

    system.update(playerState(11.5, 8));
    system.update(playerState(12, 8));
    system.update(playerState(14, 8));

    expect(changes).toEqual(['living-room-television', null]);
  });

  it('clears the target while gameplay is disabled and resumes selection when enabled', () => {
    const changes: Array<string | null> = [];
    const system = new InteractionSystem(houseLayout, {
      onTargetChanged: (nextTarget) => changes.push(nextTarget?.id ?? null),
    });

    system.update(playerState(11.5, 8));
    system.setGameplayEnabled(false);
    system.update(playerState(11.5, 8));
    system.setGameplayEnabled(true);
    system.update(playerState(11.5, 8));

    expect(changes).toEqual(['living-room-television', null, 'living-room-television']);
  });

  it('does not emit or update after destroy', () => {
    const changes: Array<string | null> = [];
    const system = new InteractionSystem(houseLayout, {
      onTargetChanged: (nextTarget) => changes.push(nextTarget?.id ?? null),
    });

    system.destroy();
    system.update(playerState(5, 5));

    expect(system.getCurrentTarget()).toBeNull();
    expect(changes).toEqual([]);
  });
});
