import { describe, expect, it } from 'vitest';

import { GameUiBridge } from './uiBridge';

describe('GameUiBridge', () => {
  it('routes typed availability, unavailability, and content events', () => {
    const bridge = new GameUiBridge();
    const availability: string[] = [];
    const contentRequests: Array<{ contentId: string; triggerSource: string }> = [];

    bridge.on('interactionAvailable', ({ contentId, label }) => {
      availability.push(`${contentId}:${label}`);
    });
    bridge.on('interactionUnavailable', () => {
      availability.push('none');
    });
    bridge.on('contentRequested', ({ contentId, triggerSource }) => {
      contentRequests.push({ contentId, triggerSource });
    });

    bridge.emit('interactionAvailable', {
      contentId: 'livingroom-media',
      label: 'television and game console',
    });
    bridge.emit('interactionUnavailable', undefined);
    bridge.emit('contentRequested', {
      contentId: 'livingroom-media',
      triggerSource: 'mobile',
    });

    expect(availability).toEqual([
      'livingroom-media:television and game console',
      'none',
    ]);
    expect(contentRequests).toEqual([
      { contentId: 'livingroom-media', triggerSource: 'mobile' },
    ]);
  });

  it('unsubscribes listeners and clears them on destroy', () => {
    const bridge = new GameUiBridge();
    const calls: string[] = [];
    const unsubscribe = bridge.on('gameReady', () => calls.push('ready'));

    bridge.emit('gameReady', undefined);
    unsubscribe();
    bridge.emit('gameReady', undefined);
    bridge.destroy();
    bridge.emit('gameReady', undefined);

    expect(calls).toEqual(['ready']);
  });
});
