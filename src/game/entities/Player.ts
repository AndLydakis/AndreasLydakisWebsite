import Phaser from 'phaser';

import type { WorldTilePoint, WorldTileRect } from '../data/types';
import { InputController } from '../systems/InputController';
import type { Direction } from '../systems/InputController';
import { PLAYER_SPEED, facingFromDisplacement, facingFromMovement, movementSnapshotToVelocity } from './playerMotion';
import type { PlayerVisual } from './PlayerVisual';
import type { Velocity } from './playerMotion';
import type { Point } from '../navigation/RoutePlanner';
import type { NavigationShape } from '../navigation/interactionGoals';

export { PLAYER_SPEED } from './playerMotion';

export interface PlayerState {
  readonly position: WorldTilePoint;
  readonly facing: Direction;
}

export interface PlayerOptions {
  readonly tileSize: number;
  readonly speed?: number;
  readonly visual?: PlayerVisual;
}

/** Wraps the player sprite and exposes only the state later game systems need. */
export class Player {
  private readonly body: Phaser.Physics.Arcade.Body;
  private readonly speed: number;
  private facing: Direction = 'down';

  public constructor(
    scene: Phaser.Scene,
    private readonly sprite: Phaser.GameObjects.Sprite,
    private readonly inputController: InputController,
    private readonly options: PlayerOptions,
  ) {
    scene.physics.add.existing(sprite);

    if (!(sprite.body instanceof Phaser.Physics.Arcade.Body)) {
      throw new Error('Player sprite did not receive a dynamic Arcade Physics body.');
    }

    this.body = sprite.body;
    // Only the ground-contact strip collides, so the torso can overlap painted
    // walls while the sprite's bottom reaches the floor boundary (within 1px).
    this.body.setSize(sprite.width / 2, 1, false);
    this.body.setOffset(sprite.width / 4, sprite.height - 1);
    this.speed = options.speed ?? PLAYER_SPEED;
    this.body.setAllowGravity(false);
    this.body.setCollideWorldBounds(true);
    this.body.setVelocity(0, 0);
    // Public Arcade pre-update synchronizes offsets AND previous-frame history.
    // No physics step is run; this also prevents first-frame position correction.
    this.body.preUpdate(false, 0);
  }

  public update(): void {
    const movement = this.inputController.getMovementSnapshot();
    const velocity = movementSnapshotToVelocity(movement, this.speed);
    this.facing = facingFromMovement(movement, this.facing);

    this.body.setVelocity(velocity.x, velocity.y);
    this.options.visual?.update(this.facing, velocity);
  }

  public stop(): void {
    this.body.setVelocity(0, 0);
    this.options.visual?.update(this.facing, { x: 0, y: 0 });
  }

  /** Steering for the NEXT physics step must not animate that future motion. */
  public prepareAutomaticVelocity(velocity: Velocity): void { this.body.setVelocity(velocity.x, velocity.y); }

  public recordAutomaticStep(dx: number, dy: number): void {
    this.facing = facingFromDisplacement({ x: dx, y: dy }, this.facing);
    this.options.visual?.recordAutomaticStep(this.facing, Math.hypot(dx, dy));
  }

  public getFootCenter(): Point { return { x: this.body.x + this.body.width / 2, y: this.body.y + this.body.height / 2 }; }

  public getNavigationShape(): NavigationShape {
    return { width: this.body.width, height: this.body.height,
      offsetX: this.body.offset.x + this.body.width / 2 - this.sprite.width / 2,
      offsetY: this.body.offset.y + this.body.height / 2 - this.sprite.height / 2,
      tileSize: this.options.tileSize };
  }

  public getState(): PlayerState {
    return {
      position: {
        x: this.sprite.x / this.options.tileSize - 0.5,
        y: this.sprite.y / this.options.tileSize - 0.5,
      },
      facing: this.facing,
    };
  }

  /** Returns the live foot collider in the same logical tile space used by interaction targets. */
  public getInteractionBounds(): WorldTileRect {
    return {
      x: this.body.x / this.options.tileSize - 0.5,
      y: this.body.y / this.options.tileSize - 0.5,
      width: this.body.width / this.options.tileSize,
      height: this.body.height / this.options.tileSize,
    };
  }

  /** Reset physics history and queued input as well as the visible anchor.
   * Feet use world tile-edge coordinates, independent of animation frame size.
   */
  public teleportTo(feet: WorldTilePoint): void {
    this.inputController.resetMovement();
    this.inputController.consumeInteractionRequest();
    this.body.reset(feet.x * this.options.tileSize,
      feet.y * this.options.tileSize - this.sprite.height / 2);
    // reset() alone initially ignores the foot offset in Phaser 3.90.
    this.body.preUpdate(false, 0);
    this.facing = 'down';
    this.options.visual?.update(this.facing, { x: 0, y: 0 });
    this.synchronizePresentation(true);
  }

  public getGroundY(): number { return this.body.bottom; }

  public getDisplayObject(): Phaser.GameObjects.Sprite {
    return this.options.visual?.getDisplayObject() ?? this.sprite;
  }

  public synchronizePresentation(reset = false): void {
    this.options.visual?.synchronize(reset);
  }
}
