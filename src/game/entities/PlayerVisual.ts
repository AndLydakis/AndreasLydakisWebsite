import Phaser from 'phaser';
import type { Direction } from '../systems/InputController';
import type { Velocity } from './playerMotion';
import { advanceWalkCycle, walkFrame } from './walkCycle';
import {
  PLAYER_ANIMATION_SEQUENCES,
  PLAYER_DIRECTIONS,
  PLAYER_DISPLAY_HEIGHT,
  PLAYER_FRAME_SIZE,
  PLAYER_WALK_REPAIRS,
  playerAnimationKey,
  playerAnimationSource,
  playerFrameRect,
} from './playerAnimation';

/**
 * Presentation only: the original 32px sprite remains the physics/camera anchor.
 * Artwork follows it after physics has stepped, so frame dimensions cannot
 * resize the collider, shift interaction coordinates, or introduce camera lag.
 */
export class PlayerVisual {
  private readonly sprite: Phaser.GameObjects.Sprite;
  private source = playerAnimationSource('down', 'idle');
  private facing: Direction = 'down';
  private movementRequested = false;
  private stepped = false;
  private phase = 0;
  private animationKey = '';
  private previousPosition: { x: number; y: number };
  private readonly physicsWorld: Phaser.Physics.Arcade.World;

  public static create(
    scene: Phaser.Scene,
    anchor: Phaser.GameObjects.Sprite,
  ): PlayerVisual | undefined {
    // A failed optional sheet leaves the original visible placeholder usable.
    const requiredKeys = [
      ...PLAYER_DIRECTIONS.map((direction) => `player-${direction}`),
      ...Object.values(PLAYER_WALK_REPAIRS).map((repair) => repair.textureKey),
    ];
    if (!requiredKeys.every((key) => scene.textures.exists(key))) {
      return undefined;
    }
    return new PlayerVisual(scene, anchor);
  }

  private constructor(
    private readonly scene: Phaser.Scene,
    private readonly anchor: Phaser.GameObjects.Sprite,
  ) {
    this.previousPosition = { x: anchor.x, y: anchor.y };
    // The scene's physics.world reference is cleared before visual shutdown.
    this.physicsWorld = scene.physics.world;
    for (const direction of PLAYER_DIRECTIONS) {
      for (const sequence of PLAYER_ANIMATION_SEQUENCES) {
        const texture = playerAnimationSource(direction, sequence.state).textureKey;
        const key = `player-${sequence.state}-${direction}`;
        if (!scene.anims.exists(key)) {
          scene.anims.create({
            key,
            frames: scene.anims.generateFrameNumbers(texture, {
              start: sequence.start,
              end: sequence.end,
            }),
            frameRate: sequence.frameRate,
            repeat: -1,
          });
        }
      }
    }

    this.sprite = scene.add.sprite(anchor.x, anchor.y, 'player-down', 0)
      .setOrigin(0.5, 1)
      .setScale(PLAYER_DISPLAY_HEIGHT / PLAYER_FRAME_SIZE)
      .setDepth(anchor.depth);
    anchor.setVisible(false);
    this.synchronize();
    this.update('down', { x: 0, y: 0 });
    this.physicsWorld.on(Phaser.Physics.Arcade.Events.WORLD_STEP, this.markStep, this);
    scene.events.once(Phaser.Scenes.Events.SHUTDOWN, this.destroy, this);
  }

  public update(facing: Direction, velocity: Velocity): void {
    this.facing = facing;
    this.movementRequested = velocity.x !== 0 || velocity.y !== 0;
    if (!this.movementRequested) this.setPose(false);
  }

  private markStep(): void {
    this.stepped = true;
  }

  private setPose(walking: boolean): void {
    this.source = playerAnimationSource(this.facing, walking ? 'walk' : 'idle');
    const key = playerAnimationKey(this.facing, { x: walking ? 1 : 0, y: 0 });
    if (key !== this.animationKey) {
      this.sprite.play(key, true);
      this.animationKey = key;
      // Idle remains time-driven. Walking frames are selected by distance only.
      if (walking) this.sprite.anims.pause();
    }
    if (walking) this.sprite.setFrame(walkFrame(this.phase));
    else this.phase = 0;
  }

  public getDisplayObject(): Phaser.GameObjects.Sprite { return this.sprite; }

  /** Called by the scene after Arcade's post-update and before sorting/camera.
   * Reset suppresses even short teleport jumps that resemble a walking step.
   */
  public synchronize(reset = false): void {
    if (reset) {
      this.previousPosition = { x: this.anchor.x, y: this.anchor.y };
      this.stepped = false;
      this.phase = 0;
    }
    const distance = Math.hypot(this.anchor.x - this.previousPosition.x, this.anchor.y - this.previousPosition.y);
    // Don't alternate idle/walk on high-refresh render frames without a physics
    // step. Large discontinuities (spawn/debug teleport) must not advance gait.
    if (this.stepped) {
      const walking = this.movementRequested && distance > 1e-6 && distance < PLAYER_DISPLAY_HEIGHT;
      if (walking) this.phase = advanceWalkCycle(this.phase, distance);
      this.setPose(walking);
    }
    this.stepped = false;
    this.previousPosition = { x: this.anchor.x, y: this.anchor.y };
    const frame = Number(this.sprite.frame.name);
    const [x, y] = this.source.anchors[frame];
    const [, , width, height] = playerFrameRect(this.source, frame);
    this.sprite.setOrigin(x / width, y / height);
    this.sprite.setPosition(this.anchor.x, this.anchor.y + this.anchor.height / 2);
  }

  private destroy(): void {
    this.physicsWorld.off(Phaser.Physics.Arcade.Events.WORLD_STEP, this.markStep, this);
    this.anchor.setVisible(true);
    this.sprite.destroy();
  }
}
