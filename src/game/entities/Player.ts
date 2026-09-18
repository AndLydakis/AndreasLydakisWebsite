import Phaser from 'phaser';

import type { WorldTilePoint } from '../data/types';
import { InputController } from '../systems/InputController';
import type { Direction } from '../systems/InputController';
import { PLAYER_SPEED, facingFromMovement, movementSnapshotToVelocity } from './playerMotion';
import type { PlayerVisual } from './PlayerVisual';

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
  }

  public update(): void {
    const movement = this.inputController.getMovementSnapshot();
    this.facing = facingFromMovement(movement, this.facing);

    const velocity = movementSnapshotToVelocity(movement, this.speed);
    this.body.setVelocity(velocity.x, velocity.y);
    this.options.visual?.update(this.facing, velocity);
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
}
