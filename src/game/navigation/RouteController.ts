import { RoutePlanner, isRegionGoal, type Point } from './RoutePlanner';
import { PLAYER_SPEED } from '../entities/playerMotion';

export const ROUTE_SPEED = PLAYER_SPEED;
const zero = () => ({ x: 0, y: 0 });

/** One request at a time. Dropping its generator cancels all future work;
 * there are no timers, retries, promises or late completion callbacks. */
export class RouteController {
  private search?: ReturnType<RoutePlanner['find']>;
  private path: Point[] = [];
  private index = 0;
  private targetId?: string;
  private arrival?: { targetId?: string };
  private started = 0;
  private progressAt = 0;
  private bestDistance = Infinity;
  private contains?: (point: Point) => boolean;
  public velocity = zero();

  constructor(private readonly planner: RoutePlanner, private readonly report: (message: string) => void,
    private readonly now: () => number = () => performance.now()) {}

  get active(): boolean { return !!this.search || this.index < this.path.length; }
  get selectedId(): string | undefined { return this.targetId; }

  cancel(): void {
    this.search = undefined; this.path = []; this.index = 0;
    this.targetId = undefined; this.arrival = undefined; this.velocity = zero();
    this.contains = undefined;
  }

  request(start: Point, goal: Parameters<RoutePlanner['find']>[1], targetId?: string): void {
    this.cancel();
    this.targetId = targetId; this.started = this.now();
    if (isRegionGoal(goal)) {
      this.contains = goal.contains;
      if (goal.contains(start)) { this.arrival = { targetId }; this.targetId = undefined; return; }
    }
    this.search = this.planner.find(start, goal);
    this.report('Finding a route…');
  }

  /** Called once per render frame, bounded even for sealed/unreachable regions. */
  plan(point: Point, stepSeconds: number): void {
    if (!this.search) return;
    if (this.now() - this.started > 2000) return this.fail('Route search timed out. Try a closer point.');
    const slice = this.now();
    for (let count = 0; count < 128 && this.now() - slice < 4; count++) {
      let result: ReturnType<ReturnType<RoutePlanner['find']>['next']>;
      try { result = this.search.next(); }
      catch (error) {
        console.warn('Navigation search failed:', error);
        return this.fail('Navigation failed. Please use the movement controls.');
      }
      if (!result.done) continue;
      this.search = undefined;
      if (result.value.status !== 'found') return this.fail(result.value.status === 'budget-exceeded'
        ? 'Route search limit reached. Try a closer point.' : 'Cannot reach that point.');
      this.path = result.value.path; this.index = 0;
      this.progressAt = this.now(); this.bestDistance = Infinity;
      this.report('Walking…'); this.step(point, stepSeconds); return;
    }
  }

  /** Run after EACH fixed physics step, not just each render frame. */
  step(point: Point, seconds: number): void {
    if (this.search || !this.active) return;
    if (!(seconds > 0) || !Number.isFinite(seconds)) return this.fail('Navigation stopped.');
    if (this.now() - this.started > 30000) return this.fail('Navigation timed out.');
    while (this.index < this.path.length && Math.hypot(this.path[this.index].x - point.x, this.path[this.index].y - point.y) <= .01 &&
      (this.index < this.path.length - 1 || !this.contains || this.contains(point))) {
      this.index++; this.bestDistance = Infinity; this.progressAt = this.now();
    }
    if (this.index === this.path.length) {
      const targetId = this.targetId;
      this.cancel(); this.arrival = { targetId }; this.report('Arrived.'); return;
    }
    const next = this.path[this.index], dx = next.x - point.x, dy = next.y - point.y;
    const distance = Math.hypot(dx, dy);
    if (!this.planner.segmentClear(point, next)) return this.fail('The route is blocked.');
    if (distance < this.bestDistance - .1) { this.bestDistance = distance; this.progressAt = this.now(); }
    if (this.now() - this.progressAt > 750) return this.fail('The route is blocked.');
    const speed = Math.min(ROUTE_SPEED, distance / seconds);
    this.velocity = { x: dx / distance * speed, y: dy / distance * speed };
  }

  /** Consume before calling UI: a synchronous dialog callback may cancel us. */
  takeArrival(): { targetId?: string } | undefined {
    const value = this.arrival; this.arrival = undefined; return value;
  }

  private fail(message: string): void { this.cancel(); this.report(message); }
}
