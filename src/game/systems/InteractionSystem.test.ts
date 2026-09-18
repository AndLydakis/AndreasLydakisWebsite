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
});

describe('InteractionSystem', () => {
  it('creates generic world-space targets from all room-local interactables', () => {
    const system = new InteractionSystem(houseLayout);
    const target = system.getCurrentTarget();

    expect(target).toBeNull();
    expect(system.createInteractable(houseLayout.rooms[0]!.interactables[0]!)).toMatchObject({
      id: 'living-room-television',
      position: { x: 11.5, y: 8 },
    });
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
