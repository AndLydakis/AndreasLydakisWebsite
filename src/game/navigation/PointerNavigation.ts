/** Native pointer events avoid touch-generated click duplication. No pointer
 * capture: document release cleanup plus canvas hit-testing rejects outside UI. */
export class PointerNavigation {
  private ids = new Set<number>();
  private gesture?: { id: number; x: number; y: number; started: number };
  private readonly abort = new AbortController();

  constructor(private readonly canvas: HTMLCanvasElement, private readonly enabled: () => boolean,
    private readonly tap: (x: number, y: number) => void) {
    const options = { signal: this.abort.signal, capture: true };
    document.addEventListener('pointerdown', this.down, options);
    document.addEventListener('pointermove', this.move, options);
    document.addEventListener('pointerup', this.up, options);
    document.addEventListener('pointercancel', this.cancelPointer, options);
    window.addEventListener('blur', this.reset, options);
    window.addEventListener('resize', this.reset, options);
    document.addEventListener('visibilitychange', this.reset, options);
  }
  clear = (): void => { this.gesture = undefined; };
  private reset = (): void => { this.clear(); this.ids.clear(); };
  destroy(): void { this.abort.abort(); this.reset(); }
  private down = (e: PointerEvent): void => {
    this.ids.add(e.pointerId);
    if (this.ids.size !== 1) return this.clear();
    if (e.target !== this.canvas || e.button !== 0 || !e.isPrimary || !this.enabled()) return;
    this.gesture = { id: e.pointerId, x: e.clientX, y: e.clientY, started: e.timeStamp };
  };
  private move = (e: PointerEvent): void => {
    const g = this.gesture;
    if (g?.id === e.pointerId && Math.hypot(e.clientX - g.x, e.clientY - g.y) > 8) this.clear();
  };
  private up = (e: PointerEvent): void => {
    const g = this.gesture; this.ids.delete(e.pointerId);
    if (!g || g.id !== e.pointerId) return;
    this.clear();
    if (e.timeStamp - g.started > 600 || Math.hypot(e.clientX - g.x, e.clientY - g.y) > 8 || !this.enabled() ||
      document.elementFromPoint(e.clientX, e.clientY) !== this.canvas) return;
    this.tap(e.clientX, e.clientY);
  };
  private cancelPointer = (e: PointerEvent): void => { this.ids.delete(e.pointerId); this.clear(); };
}
