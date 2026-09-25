// Isolated Chrome/CDP check. Run: node scripts/verify-port09d-browser.mjs [URL] [port]
// Fixtures reset position; actual traversal and dialog actions use keyboard/touch input.
import { mkdirSync, writeFileSync } from 'node:fs';
import assert from 'node:assert/strict';

const output = process.env.QA_OUTPUT_DIR ?? `output/qa/port09d/${process.argv[2]?.includes(':4173') ? 'production' : 'development'}`;
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
    windowsVirtualKeyCode: ({ Enter: 13, Escape: 27, ArrowLeft: 37, ArrowUp: 38, ArrowRight: 39, ArrowDown: 40 })[key] ?? key.toUpperCase().charCodeAt(0) };
  await send('Input.dispatchKeyEvent', { type: 'keyDown', ...fields });
  if (key === 'Enter') await send('Input.dispatchKeyEvent', { type: 'char', ...fields, text: '\r', unmodifiedText: '\r' });
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
    if (process.env.QA_RENDER_SCALE) {
      const scale = Number(process.env.QA_RENDER_SCALE);
      const render = await evaluate(`(()=>{const c=testScene.cameras.main, canvas=testScene.game.canvas;
        return {width:canvas.width,height:canvas.height,zoom:c.zoom,visibleWidth:c.width/c.zoom,visibleHeight:c.height/c.zoom}})()`);
      assert.deepEqual(render, {width:512*scale,height:288*scale,zoom:1.25*scale,visibleWidth:409.6,visibleHeight:230.4});
      console.log(`PASS ${name}: ${render.width}x${render.height} rendering, unchanged world framing`);
    }
    const corridors = await evaluate('testScene.layout.corridors');
    for (const corridor of corridors) {
      const { x, y } = corridor.origin, w = corridor.widthTiles, h = corridor.heightTiles;
      // Direction comes from connections, not aspect ratio: a short hall can be wider than long.
      const horizontal = await evaluate(`testScene.layout.rooms.some(r => r.origin.x + r.widthTiles === ${x} && r.origin.y <= ${y} && r.origin.y + r.heightTiles >= ${y + h})`);
      // Push into each exposed side using real input, not a geometry-only predicate.
      for (const key of horizontal ? ['ArrowUp', 'ArrowDown'] : ['ArrowLeft', 'ArrowRight']) {
        await sole(x + w / 2, y + h / 2);
        await press(key, 450);
        const body = await state();
        if (horizontal) {
          assert.ok(body.y >= y * 16 - 0.01 && body.bottom <= (y + h) * 16 + 0.01, `${corridor.id}: ${key} contained`);
        } else {
          assert.ok(body.x >= x * 16 - 0.01 && body.x + 16 <= (x + w) * 16 + 0.01, `${corridor.id}: ${key} contained`);
        }
      }
      // Cross both end seams to prove the new walls have not sealed entrances.
      await sole(horizontal ? x - 0.25 : x + w / 2, horizontal ? y + h / 2 : y - 0.25);
      const duration = ((horizontal ? w : h) + 0.75) * 16 / 144 * 1000;
      await press(horizontal ? 'ArrowRight' : 'ArrowDown', duration);
      let body = await state();
      assert.ok(horizontal ? body.x + 8 > (x + w) * 16 : body.bottom > (y + h) * 16, `${corridor.id}: forward entrance open`);
      await press(horizontal ? 'ArrowLeft' : 'ArrowUp', duration);
      body = await state();
      assert.ok(horizontal ? body.x + 8 < x * 16 : body.bottom < y * 16, `${corridor.id}: reverse entrance open`);
    }
    console.log(`PASS ${name}: all corridor sides contain movement; all end seams traversable both ways`);
    const room = await evaluate("testScene.layout.rooms.find(r=>r.id==='kitchen')");
    assert.equal(await evaluate("document.querySelector('#startup-error').hidden"), true);
    for (const sprite of [...room.interactables, ...room.decorations]) {
      if (!sprite.artworkInBackground) assert.equal(await evaluate(`testScene.textures.exists('${sprite.assetId}')`), true);
    }
    const kitchenHall = corridors.find(c => c.id === 'gym-kitchen-corridor');
    const centerX = kitchenHall.origin.x + kitchenHall.widthTiles / 2;
    assert.equal(room.origin.x + (7.5625 + 9.875) / 2, centerX);
    // Phaser may use a blob URL for the texture image; inspect the fetched asset instead.
    assert.equal(await evaluate("performance.getEntriesByType('resource').some(r=>r.name.endsWith('/backgrounds/kitchen/sample-v3.png'))"), true);
    await sole(centerX + 2.75, room.origin.y + 6);
    const capture = async suffix => {
      const { cssContentSize } = await send('Page.getLayoutMetrics');
      const shot = await send('Page.captureScreenshot', { format: 'png', captureBeyondViewport: true,
        clip: { x: 0, y: 0, width: cssContentSize.width, height: cssContentSize.height, scale: 1 } });
      writeFileSync(`${output}/${name}-${suffix}.png`, Buffer.from(shot.data, 'base64'));
    };
    await capture('kitchen');
    await sole(centerX, room.origin.y - 0.5);
    await capture('gym-kitchen-connection');
    if (process.argv.includes('--capture-only')) continue;
    // Use actual keyboard movement through the new painted doorway in both directions.
    await sole(centerX, room.origin.y - 1);
    await press('ArrowDown', 750);
    assert.ok((await state()).bottom > (room.origin.y + 3) * 16, 'enter kitchen through corridor');
    await press('ArrowUp', 750);
    assert.ok((await state()).bottom < room.origin.y * 16, 'exit kitchen to corridor');
    for (const [id, x, y, title] of [
      ['kitchen-stove', room.origin.x + 2.75, room.origin.y + 6, 'Recently cooked'],
      ['kitchen-fridge', room.origin.x + 14.5, room.origin.y + 5.25, 'Shopping list'],
    ]) {
      for (let cycle = 0; cycle < 2; cycle++) {
        await sole(x, y);
        assert.equal(await evaluate('testScene.interactionSystem.getCurrentTarget()?.id'), id);
        if (mobile) await tap('.mobile-interact'); else await press(cycle ? 'f' : 'e');
        assert.equal(await evaluate("document.querySelector('dialog').open"), true);
        assert.equal(await evaluate("document.querySelector('#dialog-title').textContent"), title);
        assert.equal(await evaluate('testScene.inputController.isGameplayEnabled()'), false);
        assert.equal(await evaluate("document.querySelectorAll('dialog input, dialog textarea, dialog select').length"), 0);
        if (!await evaluate("document.querySelector('.dialog-reveal').hidden")) await tap('.dialog-reveal');
        if (!cycle) await capture(id);
        if (mobile) await tap('.dialog-close'); else await press('Escape');
        assert.equal(await evaluate("document.querySelector('dialog').open"), false);
        assert.equal(await evaluate('testScene.inputController.isGameplayEnabled()'), true);
      }
    }
    for (const rect of room.collisionRects.slice(6)) {
      const x = room.origin.x + rect.x + rect.width / 2;
      const bottom = room.origin.y + rect.y + rect.height;
      // A stepped dining footprint can have another band directly below it.
      if (room.collisionRects.some(other => other !== rect && x - room.origin.x > other.x && x - room.origin.x < other.x + other.width && bottom + 0.125 - room.origin.y > other.y && bottom + 0.125 - room.origin.y < other.y + other.height)) continue;
      await sole(x, bottom + 0.125);
      await press('ArrowUp', 400);
      assert.ok((await state()).y >= bottom * 16 - 0.01, `${name}: furniture base ${rect.x},${rect.y}`);
    }
    if (mobile) {
      await sole(centerX + 2.75, room.origin.y + 8);
      const before = await state();
      await tap('[data-direction="right"]', 150);
      assert.ok((await state()).x > before.x + 5);
    }
    // Left run reaches the bottom wall, so approach it horizontally from clear floor.
    await sole(room.origin.x + 2.6, room.origin.y + 8);
    await press('ArrowLeft', 400);
    assert.ok((await state()).x >= (room.origin.x + 1.9375) * 16 - 0.01, 'left fitted counter');
    console.log(`PASS ${name}: fitted artwork, centered corridor, both dialogs twice, read-only content, furniture bases, controls`);
  }
  assert.deepEqual(errors, []);
  console.log('PASS no uncaught browser exceptions');
} finally {
  ws.close();
}
