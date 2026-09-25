/** Minimal structural view keeps ordering tests independent of Phaser/DOM. */
export interface DepthView {
  readonly depth: number;
  setDepth(value: number): unknown;
}

interface Entry {
  readonly roomId: string;
  readonly id: string;
  readonly kind: 0 | 1;
  readonly view: DepthView;
  readonly groundY: () => number;
}

/** Compare Unicode code points, not UTF-16 code units or locale collation. */
function compareText(a: string, b: string): number {
  const left = Array.from(a), right = Array.from(b);
  for (let i = 0; i < Math.min(left.length, right.length); i++) {
    const difference = left[i]!.codePointAt(0)! - right[i]!.codePointAt(0)!;
    if (difference) return difference;
  }
  return left.length - right.length;
}

/** One scene owns this registry. Sorting never reads visual bounds or physics
 * ownership, and bounded ranks keep arbitrarily large worlds below overlays.
 */
export class DepthRegistry {
  private readonly entries: Entry[] = [];

  public registerObject(roomId: string, id: string, view: DepthView, groundY: number): void {
    if (!Number.isFinite(groundY)) throw new Error('Object ground Y must be finite.');
    this.add({ roomId, id, kind: 0, view, groundY: () => groundY });
  }

  public registerPlayer(view: DepthView, groundY: () => number): void {
    this.add({ roomId: '', id: '', kind: 1, view, groundY });
  }

  public sort(): void {
    const ordered = this.entries.map(entry => ({ ...entry, y: entry.groundY() }));
    if (ordered.some(entry => !Number.isFinite(entry.y))) throw new Error('Sort ground Y must be finite.');
    ordered.sort((a, b) => a.y - b.y || a.kind - b.kind ||
      compareText(a.roomId, b.roomId) || compareText(a.id, b.id));
    ordered.forEach(({ view }, index) => {
      const depth = 3 + (index + 1) / (ordered.length + 1);
      if (view.depth !== depth) view.setDepth(depth);
    });
  }

  public clear(): void { this.entries.length = 0; }

  private add(entry: Entry): void {
    if (this.entries.some(other => other.kind === entry.kind &&
      other.roomId === entry.roomId && other.id === entry.id)) {
      throw new Error(`Duplicate depth identity: ${entry.kind}/${entry.roomId}/${entry.id}`);
    }
    this.entries.push(entry);
  }
}
