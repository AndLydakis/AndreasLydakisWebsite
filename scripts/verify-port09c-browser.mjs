// Isolated Chrome/CDP check. Run: node scripts/verify-port09c-browser.mjs [URL] [port]
// Fixtures reset position; actual traversal and dialog actions use keyboard/touch input.
import { mkdirSync, writeFileSync } from 'node:fs';
import assert from 'node:assert/strict';

const output = `output/qa/port09c/${process.argv[2]?.includes(':4173') ? 'production' : 'development'}`;
mkdirSync(output, { recursive: true });
const targets = await (await fetch(`http://127.0.0.1:${process.argv[3] ?? 9333}/json`)).json();
const ws = new WebSocket(targets.find(t => t.type === 'page').webSocketDebuggerUrl);
await new Promise(resolve => ws.addEventListener('open', resolve, { once: true }));
let sequence = 0;
const pending = new Map(), errors = [];
ws.addEventListener('message', ({ data }) => {
  const message = JSON.parse(data);
  if (message.method === 'Runtime.exceptionThrown') errors.push(message.params.exceptionDetails);
  if (!message.id) return;
  const promise = pending.get(message.id);
  pending.delete(message.id);
  message.error ? promise.reject(message.error) : promise.resolve(message.result);
});
const send = (method, params = {}) => new Promise((resolve, reject) => {
  const id = ++sequence;
  pending.set(id, { resolve, reject });
  ws.send(JSON.stringify({ id, method, params }));
});
const evaluate = async expression => {
  const result = await send('Runtime.evaluate', { expression, awaitPromise: true, returnByValue: true });
  if (result.exceptionDetails) throw Error(JSON.stringify(result.exceptionDetails));
  return result.result.value;
};
const pause = ms => new Promise(resolve => setTimeout(resolve, ms));
const press = async (key, ms = 100) => {
  const fields = { key, code: key.length === 1 ? `Key${key.toUpperCase()}` : key,
    windowsVirtualKeyCode: ({ Escape: 27, ArrowLeft: 37, ArrowUp: 38, ArrowRight: 39, ArrowDown: 40 })[key] ?? key.toUpperCase().charCodeAt(0) };
  await send('Input.dispatchKeyEvent', { type: 'keyDown', ...fields });
  await pause(ms);
  await send('Input.dispatchKeyEvent', { type: 'keyUp', ...fields });
  await pause(120);
};
const sole = async (x, y) => {
  await evaluate(`testScene.playerSprite.body.reset(${x * 16},${y * 16 - 16});document.querySelector('#game-shell').focus()`);
  await pause(180);
};
const state = () => evaluate(`({x:testScene.playerSprite.body.x,y:testScene.playerSprite.body.y,bottom:testScene.playerSprite.body.bottom})`);
const tap = async (selector, hold = 80) => {
  await evaluate(`document.querySelector(${JSON.stringify(selector)}).scrollIntoView({block:'center'})`);
  await pause(100);
  const point = await evaluate(`(()=>{const r=document.querySelector(${JSON.stringify(selector)}).getBoundingClientRect();return {x:r.x+r.width/2,y:r.y+r.height/2}})()`);
  await send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ ...point, id: 1 }] });
  await pause(hold);
  await send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
  await pause(180);
};

try {
  await send('Page.enable');
  await send('Runtime.enable');
  await send('Page.navigate', { url: process.argv[2] ?? 'http://127.0.0.1:5173' });
  await pause(3500);
  const proto = await send('Runtime.evaluate', { expression: 'Phaser.Game.prototype' });
  const games = await send('Runtime.queryObjects', { prototypeObjectId: proto.result.objectId });
  await send('Runtime.callFunctionOn', { objectId: games.objects.objectId,
    functionDeclaration: 'function(){window.testScene=this[0].scene.getScene("HouseScene")}', returnByValue: true });
  for (const [name, width, height, mobile] of [['desktop', 1280, 900, false], ['portrait', 390, 844, true], ['landscape', 844, 390, true]]) {
    await send('Emulation.setDeviceMetricsOverride', { width, height, deviceScaleFactor: 1, mobile });
    await send('Emulation.setTouchEmulationEnabled', { enabled: mobile, maxTouchPoints: 5 });
    await pause(400);
    await sole(12, 28);
    // Full-page evidence includes controls below the fold in landscape orientation.
    const { cssContentSize } = await send('Page.getLayoutMetrics');
    const screenshot = await send('Page.captureScreenshot', {
      format: 'png', captureBeyondViewport: true,
      clip: { x: 0, y: 0, width: cssContentSize.width, height: cssContentSize.height, scale: 1 },
    });
    writeFileSync(`${output}/${name}.png`, Buffer.from(screenshot.data, 'base64'));
    if (process.argv.includes('--capture-only')) continue;
    assert.equal(await evaluate(`document.querySelector('#startup-error').hidden`), true);
    const assets = await evaluate(`testScene.layout.rooms.find(r=>r.id==='office')`);
    for (const key of [assets.visualAssetId, ...assets.interactables.map(i => i.assetId), ...assets.decorations.map(i => i.assetId)]) {
      assert.equal(await evaluate(`testScene.textures.exists(${JSON.stringify(key)})`), true, key);
    }
    // Continuous travel from living-room bottom, through corridor and deep office entrance.
    if (!mobile) {
      await sole(12, 21);
      const junction = await send('Page.captureScreenshot', { format: 'png' });
      writeFileSync(`${output}/corridor-alignment.png`, Buffer.from(junction.data, 'base64'));
    }
    await sole(12, 17);
    await press('ArrowDown', 1050);
    assert.ok((await state()).bottom > 26 * 16, `${name}: office entry`);
    await press('ArrowUp', 1050);
    assert.ok((await state()).bottom < 22 * 16, `${name}: office exit`);
    for (const [id, x, y, title] of [
      ['office-workstation', 6.5, 29, 'Curriculum vitae'],
      ['office-bookcase', 9.1, 26.25, 'Recently read books'],
    ]) {
      await sole(x, y);
      assert.equal(await evaluate('testScene.interactionSystem.getCurrentTarget()?.id'), id);
      for (let cycle = 0; cycle < 2; cycle++) {
        if (mobile) await tap('.mobile-interact'); else await press(cycle ? 'f' : 'e');
        assert.equal(await evaluate(`document.querySelector('dialog').open`), true, `${name} ${id} cycle ${cycle}: ${JSON.stringify(await evaluate('({target:testScene.interactionSystem.getCurrentTarget(),active:document.activeElement?.id,enabled:testScene.inputController.isGameplayEnabled()})'))}`);
        assert.equal(await evaluate(`document.querySelector('#dialog-title').textContent`), title);
        assert.equal(await evaluate('testScene.inputController.isGameplayEnabled()'), false);
        if (mobile) await tap('.dialog-close'); else await press('Escape');
        assert.equal(await evaluate(`document.querySelector('dialog').open`), false);
        assert.equal(await evaluate('testScene.inputController.isGameplayEnabled()'), true);
      }
    }
    // All seven object bases stop sustained movement from immediately below.
    for (const rect of assets.collisionRects.slice(5, 12)) {
      const x = assets.origin.x + rect.x + rect.width / 2;
      const bottom = assets.origin.y + rect.y + rect.height;
      await sole(x, bottom + 0.5);
      await press('ArrowUp', 550);
      assert.ok((await state()).y >= bottom * 16 - 0.01, `${name}: base ${rect.x}`);
    }
    if (mobile) {
      await sole(12.5, 29.5);
      const before = await state();
      await tap('[data-direction="right"]', 220);
      const after = await state();
      assert.ok(after.x > before.x + 10);
      await pause(200);
      assert.ok(Math.abs((await state()).x - after.x) < 0.1);
    }
    console.log(`PASS ${name}: assets, entrance/exit, E/F or touch dialogs twice, seven bases, input reset`);
  }
  assert.deepEqual(errors, []);
  console.log('PASS no uncaught browser exceptions');
} finally { ws.close(); }
