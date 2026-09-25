import Phaser from 'phaser';

import {
  roomRectToWorld,
  roomGroundAnchorToWorldPixel,
  roomTileToWorld,
  worldRectToWorldPixel,
  worldTileToWorldPixel,
} from '../data/coordinates';
import type { HouseLayout } from '../data/types';
import type { PlayerState } from '../entities/Player';
import { getRoomLocalCollisionRects } from '../systems/collisionGeometry';

const ROOM_COLOR = 0x62e6ff;
const COLLISION_COLOR = 0xff9a9a;
const INTERACTABLE_COLOR = 0xffb84d;
const WORLD_COLOR = 0xffe29a;

/** Development-only world diagnostics for layout and player placement. */
export class DebugOverlay {
  private readonly geometry: Phaser.GameObjects.Graphics;
  private readonly status: Phaser.GameObjects.Text;

  public constructor(
    scene: Phaser.Scene,
    private readonly layout: HouseLayout,
  ) {
    this.geometry = scene.add.graphics().setDepth(8);
    this.status = scene.add
      .text(8, 8, '', {
        color: '#ffe29a',
        fontFamily: 'monospace',
        fontSize: '12px',
        backgroundColor: '#171226cc',
        padding: { x: 6, y: 4 },
      })
      .setScrollFactor(0)
      .setDepth(9);

    this.drawStaticGeometry();
  }

  public update(playerState: PlayerState): void {
    this.status.setText(
      [
        'DEBUG',
        `player: ${playerState.position.x.toFixed(1)}, ${playerState.position.y.toFixed(1)}`,
        `facing: ${playerState.facing}`,
        `rooms: ${this.layout.rooms.length}  interactables: ${this.interactableCount()}`,
      ],
    );
  }

  public destroy(): void {
    this.geometry.destroy();
    this.status.destroy();
  }

  public setVisible(visible: boolean): void {
    this.geometry.setVisible(visible);
    this.status.setVisible(visible);
  }

  private drawStaticGeometry(): void {
    const worldPixels = worldRectToWorldPixel(
      {
        x: 0,
        y: 0,
        width: this.layout.worldWidth,
        height: this.layout.worldHeight,
      },
      this.layout.tileSize,
    );

    this.geometry.lineStyle(1, WORLD_COLOR, 0.9);
    this.geometry.strokeRect(
      worldPixels.x,
      worldPixels.y,
      worldPixels.width,
      worldPixels.height,
    );

    this.layout.rooms.forEach((room) => {
      const roomPixels = worldRectToWorldPixel(
        roomRectToWorld(room, {
          x: 0,
          y: 0,
          width: room.widthTiles,
          height: room.heightTiles,
        }),
        this.layout.tileSize,
      );

      this.geometry.lineStyle(1, ROOM_COLOR, 0.65);
      this.geometry.strokeRect(
        roomPixels.x,
        roomPixels.y,
        roomPixels.width,
        roomPixels.height,
      );

      getRoomLocalCollisionRects(room).forEach((collisionRect) => {
        const collisionPixels = worldRectToWorldPixel(
          roomRectToWorld(room, collisionRect),
          this.layout.tileSize,
        );

        this.geometry.lineStyle(1, COLLISION_COLOR, 0.85);
        this.geometry.strokeRect(
          collisionPixels.x,
          collisionPixels.y,
          collisionPixels.width,
          collisionPixels.height,
        );
      });

      for (const object of [...room.interactables, ...(room.decorations ?? [])]) {
        if (!object.groundAnchor) continue;
        const anchor = roomGroundAnchorToWorldPixel(room, object.groundAnchor, this.layout.tileSize);
        this.geometry.lineStyle(1, WORLD_COLOR, 1);
        this.geometry.strokeCircle(anchor.x, anchor.y, 2);
      }

      room.interactables.forEach((interactable) => {
        const position = worldTileToWorldPixel(
          roomTileToWorld(room, interactable.position),
          this.layout.tileSize,
        );
        const radius = (interactable.interactionRadiusTiles ?? 2) * this.layout.tileSize;

        this.geometry.lineStyle(1, INTERACTABLE_COLOR, 0.85);
        this.geometry.strokeCircle(position.x, position.y, radius);
      });
    });
  }

  private interactableCount(): number {
    return this.layout.rooms.reduce((count, room) => count + room.interactables.length, 0);
  }
}
