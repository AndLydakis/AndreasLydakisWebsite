import { roomTileToWorld } from '../data/coordinates';
import type {
  HouseLayout,
  InteractableDefinition,
  WorldTilePoint,
  WorldTileRect,
} from '../data/types';
import type { PlayerState } from '../entities/Player';

export const DEFAULT_INTERACTION_RADIUS_TILES = 2;

export interface InteractionTarget {
  readonly id: string;
  readonly roomId: string;
  readonly contentId: string;
  readonly label: string;
  readonly promptLabel: string;
  readonly position: WorldTilePoint;
  readonly interactionRadiusTiles: number;
  readonly bounds?: WorldTileRect;
  /** Padded rendered nameplate rectangle; supplements, but never replaces, the original radius. */
  readonly labelActivationBounds?: WorldTileRect;
}

export interface InteractionSystemCallbacks {
  readonly onTargetChanged?: (target: InteractionTarget | null) => void;
}

export interface InteractionSystemOptions extends InteractionSystemCallbacks {
  readonly gameplayEnabled?: boolean;
  readonly labelActivationBounds?: ReadonlyMap<string, WorldTileRect>;
}

export interface InteractionPlayerState extends Pick<PlayerState, 'position'> {
  /** Live foot collider, expressed in the same logical tile coordinates as the player position. */
  readonly interactionBounds?: WorldTileRect;
}

/**
 * Selects the closest target from a data-only target list.
 * A current target wins an exact-distance tie so overlapping ranges do not
 * make the prompt oscillate between objects from frame to frame.
 */
export function selectInteractionTarget(
  playerPosition: WorldTilePoint,
  targets: readonly InteractionTarget[],
  currentTargetId?: string,
  playerInteractionBounds?: WorldTileRect,
): InteractionTarget | null {
  // A visible label is an explicit target. It must not be stolen by a nearby object's
  // ordinary radius merely because that object's center happens to be closer.
  const labelCandidates = targets.filter((target) =>
    isLabelInRange(playerPosition, playerInteractionBounds, target));
  if (labelCandidates.length > 0) {
    return selectClosestTarget(playerPosition, labelCandidates, currentTargetId, distanceToLabelCenter);
  }

  const candidates = targets.filter((target) =>
    distanceToTarget(playerPosition, target) <= target.interactionRadiusTiles);

  if (candidates.length === 0) {
    return null;
  }

  return selectClosestTarget(playerPosition, candidates, currentTargetId, distanceToTarget);
}

function selectClosestTarget(
  playerPosition: WorldTilePoint,
  candidates: readonly InteractionTarget[],
  currentTargetId: string | undefined,
  distance: (point: WorldTilePoint, target: InteractionTarget) => number,
): InteractionTarget | null {
  return candidates.reduce<InteractionTarget | null>((closest, candidate) => {
    if (!closest) {
      return candidate;
    }

    const candidateDistance = distance(playerPosition, candidate);
    const closestDistance = distance(playerPosition, closest);

    if (candidateDistance < closestDistance) {
      return candidate;
    }

    if (candidateDistance > closestDistance) {
      return closest;
    }

    if (candidate.id === currentTargetId) {
      return candidate;
    }

    if (closest.id === currentTargetId) {
      return closest;
    }

    return candidate.id.localeCompare(closest.id) < 0 ? candidate : closest;
  }, null);
}

export function isTargetInRange(
  playerPosition: WorldTilePoint,
  target: InteractionTarget,
  playerInteractionBounds?: WorldTileRect,
): boolean {
  return distanceToTarget(playerPosition, target) <= target.interactionRadiusTiles ||
    isLabelInRange(playerPosition, playerInteractionBounds, target);
}

function isLabelInRange(
  playerPosition: WorldTilePoint,
  playerInteractionBounds: WorldTileRect | undefined,
  target: InteractionTarget,
): boolean {
  if (!target.labelActivationBounds) return false;
  return playerInteractionBounds
    ? rectsOverlap(playerInteractionBounds, target.labelActivationBounds)
    : pointInRect(playerPosition, target.labelActivationBounds);
}

function distanceToLabelCenter(point: WorldTilePoint, target: InteractionTarget): number {
  const bounds = target.labelActivationBounds;
  if (!bounds) return Number.POSITIVE_INFINITY;
  return Math.hypot(
    point.x - (bounds.x + bounds.width / 2),
    point.y - (bounds.y + bounds.height / 2),
  );
}

export function distanceToTarget(
  playerPosition: WorldTilePoint,
  target: InteractionTarget,
): number {
  if (target.bounds) {
    return distanceToRect(playerPosition, target.bounds);
  }

  return Math.hypot(
    playerPosition.x - target.position.x,
    playerPosition.y - target.position.y,
  );
}

/** Tracks the current target and emits only availability changes. */
export class InteractionSystem {
  private readonly interactables = new Map<string, InteractionTarget>();
  private readonly callbacks: InteractionSystemCallbacks;
  private currentTarget: InteractionTarget | null = null;
  private gameplayEnabled: boolean;
  private destroyed = false;
  private readonly labelActivationBounds: ReadonlyMap<string, WorldTileRect>;

  public constructor(
    private readonly layout: HouseLayout,
    options: InteractionSystemOptions = {},
  ) {
    this.callbacks = options;
    this.gameplayEnabled = options.gameplayEnabled ?? true;
    this.labelActivationBounds = options.labelActivationBounds ?? new Map();

    layout.rooms.forEach((room) => {
      room.interactables.forEach((interactable) => {
        this.createInteractable(interactable);
      });
    });
  }

  public createInteractable(definition: InteractableDefinition): InteractionTarget {
    if (this.destroyed) {
      throw new Error('Cannot create an interactable after the interaction system is destroyed.');
    }

    const room = this.layout.rooms.find((candidate) => candidate.id === definition.roomId);

    if (!room) {
      throw new Error(
        `Interactable ${definition.id} references unknown room ${definition.roomId}.`,
      );
    }

    const labelActivationBounds = this.labelActivationBounds.get(definition.id);
    const target: InteractionTarget = {
      id: definition.id,
      roomId: definition.roomId,
      contentId: definition.contentId,
      label: definition.label,
      promptLabel: definition.promptLabel,
      position: roomTileToWorld(room, definition.position),
      interactionRadiusTiles:
        definition.interactionRadiusTiles ?? DEFAULT_INTERACTION_RADIUS_TILES,
      ...(labelActivationBounds ? { labelActivationBounds } : {}),
      ...(definition.bounds
        ? {
            bounds: {
              x: room.origin.x + definition.bounds.x,
              y: room.origin.y + definition.bounds.y,
              width: definition.bounds.width,
              height: definition.bounds.height,
            },
          }
        : {}),
    };

    this.interactables.set(target.id, target);
    return target;
  }

  public update(playerState: InteractionPlayerState): void {
    if (this.destroyed || !this.gameplayEnabled) {
      return;
    }

    const nextTarget = selectInteractionTarget(
      playerState.position,
      [...this.interactables.values()],
      this.currentTarget?.id,
      playerState.interactionBounds,
    );

    this.setCurrentTarget(nextTarget);
  }

  public setGameplayEnabled(enabled: boolean): void {
    if (this.destroyed || this.gameplayEnabled === enabled) {
      return;
    }

    this.gameplayEnabled = enabled;

    if (!enabled) {
      this.setCurrentTarget(null);
    }
  }

  public getCurrentTarget(): InteractionTarget | null {
    return this.currentTarget;
  }

  public getTargets(): readonly InteractionTarget[] { return [...this.interactables.values()]; }

  public destroy(): void {
    if (this.destroyed) {
      return;
    }

    this.destroyed = true;
    this.currentTarget = null;
    this.interactables.clear();
  }

  private setCurrentTarget(target: InteractionTarget | null): void {
    if (this.currentTarget?.id === target?.id) {
      return;
    }

    this.currentTarget = target;
    this.callbacks.onTargetChanged?.(target);
  }
}

function distanceToRect(point: WorldTilePoint, rect: WorldTileRect): number {
  const horizontalDistance = Math.max(rect.x - point.x, 0, point.x - (rect.x + rect.width));
  const verticalDistance = Math.max(rect.y - point.y, 0, point.y - (rect.y + rect.height));

  return Math.hypot(horizontalDistance, verticalDistance);
}

function pointInRect(point: WorldTilePoint, rect: WorldTileRect): boolean {
  return point.x >= rect.x && point.x <= rect.x + rect.width &&
    point.y >= rect.y && point.y <= rect.y + rect.height;
}

function rectsOverlap(first: WorldTileRect, second: WorldTileRect): boolean {
  return first.x <= second.x + second.width && first.x + first.width >= second.x &&
    first.y <= second.y + second.height && first.y + first.height >= second.y;
}
