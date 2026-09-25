import { describe, expect, it, vi } from 'vitest';
import { DepthRegistry } from './DepthRegistry';

const view = () => {
  const result = { depth: 2, setDepth: vi.fn((depth: number) => { result.depth = depth; }) };
  return result;
};

describe('generic foot-based ordering', () => {
  it('orders behind/equal/front by sole, including immediate teleport reversals', () => {
    const registry = new DepthRegistry(), object = view(), player = view(); let sole = 99;
    registry.registerObject('any-room', 'object', object, 100);
    registry.registerPlayer(player, () => sole);
    registry.sort(); expect(player.depth).toBeLessThan(object.depth);
    for (const y of [100, 500, 100]) { sole = y; registry.sort(); expect(player.depth).toBeGreaterThan(object.depth); }
    sole = -1000; registry.sort(); expect(player.depth).toBeLessThan(object.depth);
  });
  it('uses deterministic tuple/code-point order regardless of registration order', () => {
    const ids = [['a:b', 'c'], ['a', 'b:c'], ['other-room', 'c'], ['a', 'Z'], ['a', 'a']];
    const sort = (pairs: string[][]) => {
      const registry = new DepthRegistry();
      const entries = pairs.map(([room,id]) => { const v = view(); registry.registerObject(room!, id!, v, 42); return { room, id, v }; });
      registry.sort(); return entries.sort((a,b) => a.v.depth-b.v.depth).map(({room,id}) => [room,id]);
    };
    expect(sort(ids)).toEqual([['a','Z'], ['a','a'], ['a','b:c'], ['a:b','c'], ['other-room','c']]);
    expect(sort([...ids].reverse())).toEqual(sort(ids));
  });
  it('keeps all ranks strictly between 3 and 4 for huge world offsets and many objects', () => {
    const registry = new DepthRegistry(), views = Array.from({length:1000}, view);
    views.forEach((v,i) => registry.registerObject('room', String(i), v, 1e12 + i));
    registry.sort(); expect(views.every(v => v.depth>3 && v.depth<4)).toBe(true);
    expect(new Set(views.map(v => v.depth)).size).toBe(1000);
  });
  it('compares supplementary Unicode characters by code point in both tuple fields', () => {
    const registry = new DepthRegistry();
    const ids = [['\u{10000}', 'a'], ['\uE000', '\u{10000}'], ['\uE000', '\uE000']];
    const views = ids.map(([room, id]) => {
      const v = view(); registry.registerObject(room!, id!, v, 0); return v;
    });
    registry.sort();
    expect(views[2]!.depth).toBeLessThan(views[1]!.depth);
    expect(views[1]!.depth).toBeLessThan(views[0]!.depth);
  });
  it('avoids redundant writes, clears references and allows clean registration after restart', () => {
    const registry = new DepthRegistry(), v = view();
    registry.registerObject('r','x',v,10); registry.sort(); registry.sort();
    expect(v.setDepth).toHaveBeenCalledOnce();
    registry.clear(); registry.sort(); expect(v.setDepth).toHaveBeenCalledOnce();
    registry.registerObject('r','x',v,10); registry.sort();
    expect(v.setDepth).toHaveBeenCalledOnce();
  });
  it('rejects duplicate identity but not shared IDs in different rooms or player/object namespaces', () => {
    const registry = new DepthRegistry();
    registry.registerObject('r','x',view(),10);
    expect(() => registry.registerObject('r','x',view(),20)).toThrow(/Duplicate/);
    expect(() => registry.registerObject('s','x',view(),20)).not.toThrow();
    registry.registerObject('','',view(),0); registry.registerPlayer(view(),()=>0);
    expect(() => registry.registerPlayer(view(),()=>1)).toThrow(/Duplicate/);
  });
  it('rejects nonfinite sort keys instead of assigning corrupt ranks', () => {
    const registry = new DepthRegistry();
    expect(() => registry.registerObject('r','x',view(),NaN)).toThrow(/finite/);
    registry.registerPlayer(view(),()=>Infinity);
    expect(() => registry.sort()).toThrow(/finite/);
  });
});
