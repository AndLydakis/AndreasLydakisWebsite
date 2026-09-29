import Phaser from 'phaser';

import {
  roomRectToWorld,
  roomGroundAnchorToWorldPixel,
  worldRectToWorldPixel,
} from '../data/coordinates';
import type { HouseLayout } from '../data/types';
import type { PlayerState } from '../entities/Player';

const ROOM_COLOR = 0x62e6ff;
const WORLD_COLOR = 0xffe29a;

/** Development-only world diagnostics for layout and player placement. */
export class DebugOverlay {
  private readonly geometry: Phaser.GameObjects.Graphics;
  private readonly groundAnchors: Phaser.GameObjects.Graphics;
  private readonly roomBounds: Phaser.GameObjects.Graphics;
  private readonly status: Phaser.GameObjects.Text;
  private readonly groundAnchorsVisible: boolean;
  private readonly roomBoundsVisible: boolean;

  public constructor(
    scene: Phaser.Scene,
    private readonly layout: HouseLayout,
    options: {
      readonly groundAnchorsVisible?: boolean;
      readonly roomBoundsVisible?: boolean;
    } = {},
  ) {
    this.geometry = scene.add.graphics().setDepth(8);
    this.groundAnchors = scene.add.graphics().setDepth(8);
    this.roomBounds = scene.add.graphics().setDepth(8);
    this.groundAnchorsVisible = options.groundAnchorsVisible ?? false;
    this.roomBoundsVisible = options.roomBoundsVisible ?? false;
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
    this.groundAnchors.destroy();
    this.roomBounds.destroy();
    this.status.destroy();
  }

  public setVisible(visible: boolean): void {
    this.geometry.setVisible(visible);
    this.groundAnchors.setVisible(visible && this.groundAnchorsVisible);
    this.roomBounds.setVisible(visible && this.roomBoundsVisible);
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

      this.roomBounds.lineStyle(1, ROOM_COLOR, 0.65);
      this.roomBounds.strokeRect(
        roomPixels.x,
        roomPixels.y,
        roomPixels.width,
        roomPixels.height,
      );

      for (const object of [...room.interactables, ...(room.decorations ?? [])]) {
        if (!object.groundAnchor) continue;
        const anchor = roomGroundAnchorToWorldPixel(room, object.groundAnchor, this.layout.tileSize);
        this.groundAnchors.lineStyle(1, WORLD_COLOR, 1);
        this.groundAnchors.strokeCircle(anchor.x, anchor.y, 2);
      }

    });
  }

  private interactableCount(): number {
    return this.layout.rooms.reduce((count, room) => count + room.interactables.length, 0);
  }
}
