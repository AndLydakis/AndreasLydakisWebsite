import Phaser from 'phaser';

import { worldRectToWorldPixel } from '../data/coordinates';
import type { HouseLayout, WorldTileRect } from '../data/types';
import { getAllCollisionRects } from './collisionGeometry';

/**
 * Owns the static Arcade bodies that make the layout navigable.
 * It intentionally knows nothing about prompts, targets, or content events.
 */
export class CollisionSystem {
  private readonly staticBodies: Phaser.Physics.Arcade.StaticGroup;
  private readonly playerCollider: Phaser.Physics.Arcade.Collider;
  private readonly staticBodyList: Phaser.Physics.Arcade.StaticBody[] = [];
  private readonly physicsWorld: Phaser.Physics.Arcade.World;
  private destroyed = false;

  public constructor(
    scene: Phaser.Scene,
    layout: HouseLayout,
    playerObject: Phaser.GameObjects.GameObject,
  ) {
    this.physicsWorld = scene.physics.world;
    this.staticBodies = scene.physics.add.staticGroup();

    for (const collisionRect of getAllCollisionRects(layout)) {
      this.addStaticBody(scene, layout.tileSize, collisionRect);
    }

    this.playerCollider = scene.physics.add.collider(playerObject, this.staticBodies);
  }

  public destroy(): void {
    if (this.destroyed) {
      return;
    }

    this.destroyed = true;
    this.playerCollider.destroy();

    for (const staticBody of this.staticBodyList) {
      this.physicsWorld.disableBody(staticBody);
    }

    this.staticBodyList.length = 0;
    this.staticBodies.clear(true, true);
  }

  private addStaticBody(
    scene: Phaser.Scene,
    tileSize: number,
    collisionRect: WorldTileRect,
  ): void {
    const pixelRect = worldRectToWorldPixel(collisionRect, tileSize);
    const bodyObject = scene.add
      .rectangle(
        pixelRect.x + pixelRect.width / 2,
        pixelRect.y + pixelRect.height / 2,
        pixelRect.width,
        pixelRect.height,
        0,
        0,
      )
      .setVisible(false);

    this.staticBodies.add(bodyObject);

    const staticBody = (bodyObject as Phaser.GameObjects.GameObject & {
      body?: Phaser.Physics.Arcade.StaticBody;
    }).body;

    if (!(staticBody instanceof Phaser.Physics.Arcade.StaticBody)) {
      throw new Error('Collision body did not receive a static Arcade Physics body.');
    }

    this.staticBodyList.push(staticBody);
  }
}
