import Phaser from 'phaser';
import type { Direction } from '../systems/InputController';
import type { Velocity } from './playerMotion';
import {
  PLAYER_ANIMATION_SEQUENCES,
  PLAYER_DIRECTIONS,
  PLAYER_DISPLAY_HEIGHT,
  PLAYER_FRAME_SIZE,
  PLAYER_WALK_REPAIRS,
  playerAnimationKey,
  playerAnimationSource,
} from './playerAnimation';

/**
 * Presentation only: the original 32px sprite remains the physics/camera anchor.
 * Artwork follows it after physics has stepped, so frame dimensions cannot
 * resize the collider, shift interaction coordinates, or introduce camera lag.
 */
export class PlayerVisual {
  private readonly sprite: Phaser.GameObjects.Sprite;
  private source = playerAnimationSource('down', 'idle');

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
    this.syncPosition();
    this.update('down', { x: 0, y: 0 });
    scene.events.on(Phaser.Scenes.Events.POST_UPDATE, this.syncPosition, this);
    scene.events.once(Phaser.Scenes.Events.SHUTDOWN, this.destroy, this);
  }

  public update(facing: Direction, velocity: Velocity): void {
    const state = velocity.x === 0 && velocity.y === 0 ? 'idle' : 'walk';
    this.source = playerAnimationSource(facing, state);
    // ignoreIfPlaying prevents restarting the cycle on every game update.
    this.sprite.play(playerAnimationKey(facing, velocity), true);
  }

  private syncPosition(): void {
    const [x, y] = this.source.anchors[Number(this.sprite.frame.name)];
    this.sprite.setOrigin(x / this.source.frameWidth, y / this.source.frameHeight);
    this.sprite.setPosition(this.anchor.x, this.anchor.y + this.anchor.height / 2);
  }

  private destroy(): void {
    this.scene.events.off(Phaser.Scenes.Events.POST_UPDATE, this.syncPosition, this);
    this.anchor.setVisible(true);
    this.sprite.destroy();
  }
}
