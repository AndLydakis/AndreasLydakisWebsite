import type Phaser from 'phaser';
import type { HouseLayout } from '../data/types';
import type { Player } from '../entities/Player';
import type { InputController } from '../systems/InputController';
import type { InteractionSystem } from '../systems/InteractionSystem';
import { RoutePlanner } from './RoutePlanner';
import type { Point } from './RoutePlanner';
import { RouteController } from './RouteController';
import { PointerNavigation } from './PointerNavigation';
import { interactionGoal, interactionState, pointerTarget } from './interactionGoals';
import { isTargetInRange } from '../systems/InteractionSystem';

/** Thin scene adapter. Geometry and route state stay independent of Phaser/DOM. */
export class HouseNavigation {
  private readonly route: RouteController;
  private readonly pointer: PointerNavigation;
  private readonly unsubscribe: () => void;
  private readonly world: Phaser.Physics.Arcade.World;
  private automatic = false;
  private previous: Point;

  constructor(scene: Phaser.Scene, layout: HouseLayout, private readonly player: Player,
    private readonly input: InputController, private readonly interactions: InteractionSystem,
    labelVisible: (id: string) => boolean, private readonly report: (message: string) => void,
    private readonly open: (contentId: string) => void) {
    this.world = scene.physics.world;
    this.previous = player.getFootCenter();
    if (!this.world.fixedStep) throw new Error('Click navigation requires fixed-step Arcade physics.');
    const shape = player.getNavigationShape();
    this.route = new RouteController(new RoutePlanner(layout, shape), report);
    const canvas = scene.game.canvas;
    this.pointer = new PointerNavigation(canvas, () => input.isGameplayEnabled() && !Object.values(input.getMovementSnapshot()).some(Boolean), (x, y) => this.safely(() => {
      this.cancel();
      const rect = canvas.getBoundingClientRect();
      if (!rect.width || !rect.height) return;
      const point = scene.cameras.main.getWorldPoint((x - rect.left) * scene.scale.width / rect.width,
        (y - rect.top) * scene.scale.height / rect.height);
      const target = pointerTarget({ x: point.x / layout.tileSize - .5, y: point.y / layout.tileSize - .5 }, interactions.getTargets(), labelVisible);
      // Phaser.Vector2 has a project() method unrelated to region projection.
      // Pass plain data across the navigation boundary, never engine objects.
      this.route.request(player.getFootCenter(), target ? interactionGoal(target, shape) : { x: point.x, y: point.y }, target?.id);
      this.automatic = true; this.previous = player.getFootCenter();
    }));
    this.unsubscribe = input.onManualIntent(() => this.cancel());
    this.world.on('worldstep', this.physicsStep, this);
  }

  get selectedId(): string | undefined { return this.route.selectedId; }

  cancel(): void { this.route.cancel(); this.pointer?.clear(); this.automatic = false; this.player.stop(); }

  update(): void {
    this.safely(() => this.updateRoute());
  }

  private updateRoute(): void {
    if (!this.input.isGameplayEnabled()) this.cancel();
    this.route.plan(this.player.getFootCenter(), 1 / this.world.fps);
    if (this.automatic) this.player.prepareAutomaticVelocity(this.route.velocity);
    else this.player.update();
  }

  private physicsStep(): void {
    this.safely(() => this.stepRoute());
  }

  private stepRoute(): void {
    if (!this.automatic) return;
    if (!this.input.isGameplayEnabled()) return this.cancel();
    const point = this.player.getFootCenter();
    this.player.recordAutomaticStep(point.x - this.previous.x, point.y - this.previous.y);
    this.previous = point;
    this.route.step(point, 1 / this.world.fps);
    this.player.prepareAutomaticVelocity(this.route.velocity);
  }

  /** Scene calls after body-to-sprite synchronization, before any UI callback. */
  afterPhysics(): void {
    this.safely(() => this.dispatchArrival());
  }

  private dispatchArrival(): void {
    const arrived = this.route.takeArrival();
    if (!arrived?.targetId || !this.input.isGameplayEnabled()) return;
    const target = this.interactions.getTargets().find(t => t.id === arrived.targetId);
    const state = interactionState(this.player.getFootCenter(), this.player.getNavigationShape());
    if (target && isTargetInRange(state.position, target, state.interactionBounds)) this.open(target.contentId);
    else this.report('Cannot reach that interaction.');
  }

  /** Fault containment at the engine boundary also stops the ACTUAL body.
   * Log the original failure; never retry automatically or break Phaser's loop. */
  private safely(operation: () => void): void {
    try { operation(); }
    catch (error) {
      this.cancel();
      console.warn('Navigation failed:', error);
      this.report('Navigation failed. Please use the movement controls.');
    }
  }

  destroy(): void {
    // PlayerVisual may already be destroyed by its earlier shutdown listener.
    this.route.cancel(); this.unsubscribe(); this.pointer.destroy();
    this.world.off('worldstep', this.physicsStep, this);
  }
}
