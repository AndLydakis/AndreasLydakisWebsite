// Design baseline only: isolated Chrome, actual keyboard routes, restored by reload.
import assert from 'node:assert/strict';
import { mkdirSync, writeFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
const revision = execFileSync('git', ['rev-parse', 'HEAD'], { encoding: 'utf8' }).trim();
const output = 'output/qa/port18a';
mkdirSync(output, { recursive: true });
const tabs = await (await fetch('http://127.0.0.1:9333/json')).json();
const ws = new WebSocket(tabs.find(t => t.type === 'page').webSocketDebuggerUrl);
await new Promise(resolve => ws.addEventListener('open', resolve, { once: true }));
let id = 0;
const pending = new Map(), exceptions = [];
ws.addEventListener('message', ({ data }) => {
  const message = JSON.parse(data);
  if (message.method === 'Runtime.exceptionThrown') exceptions.push(message.params.exceptionDetails);
  if (message.id) { const p = pending.get(message.id); pending.delete(message.id); message.error ? p.reject(message.error) : p.resolve(message.result); }
});
const send = (method, params = {}) => new Promise((resolve, reject) => {
  const next = ++id; pending.set(next, { resolve, reject }); ws.send(JSON.stringify({ id: next, method, params }));
});
const evaluate = async expression => {
  const response = await send('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true });
  if (response.exceptionDetails) throw Error(JSON.stringify(response.exceptionDetails));
  return response.result.value;
};
const pause = ms => new Promise(resolve => setTimeout(resolve, ms));
const keys = { ArrowLeft: 37, ArrowUp: 38, ArrowRight: 39, ArrowDown: 40 };
const keyEvent = (key, type) => send('Input.dispatchKeyEvent', { type, key, code: key, windowsVirtualKeyCode: keys[key] });
const capture = async name => {
  const shot = await send('Page.captureScreenshot', { format: 'png', captureBeyondViewport: true });
  writeFileSync(`${output}/${name}.png`, Buffer.from(shot.data, 'base64'));
};
const sole = () => evaluate('({x:s.playerSprite.body.center.x,y:s.playerSprite.body.bottom})');
const results = [];
try {
  await send('Runtime.enable'); await send('Page.enable');
  await send('Network.enable'); await send('Network.setCacheDisabled', { cacheDisabled: true });
  await send('Emulation.setCPUThrottlingRate', { rate: 1 });
  await send('Emulation.setDeviceMetricsOverride', { width: 1280, height: 900, deviceScaleFactor: 1, mobile: false });
  await send('Emulation.setTouchEmulationEnabled', { enabled: false });
  await send('Page.navigate', { url: 'http://127.0.0.1:5173' }); await pause(2500);
  const proto = await send('Runtime.evaluate', { expression: 'Phaser.Game.prototype' });
  const games = await send('Runtime.queryObjects', { prototypeObjectId: proto.result.objectId });
  await send('Runtime.callFunctionOn', { objectId: games.objects.objectId, functionDeclaration: 'function(){window.s=this[0].scene.getScene("HouseScene")}' });
  const baseline = await evaluate(`({layout:s.layout, canvas:{width:s.game.canvas.width,height:s.game.canvas.height},zoom:s.cameras.main.zoom,
    images:s.children.list.filter(o=>o.type==='Image'||o.type==='Sprite').map(o=>({texture:o.texture.key,x:o.x,y:o.y,depth:o.depth})),
    transfer:performance.getEntriesByType('resource').filter(r=>r.name.includes('/assets/')).map(r=>({url:r.name,bytes:r.transferSize,duration:r.duration}))})`);
  writeFileSync(`${output}/baseline.json`, JSON.stringify(baseline, null, 2));
  const inventory = baseline.layout.rooms.flatMap(room => [...room.interactables, ...(room.decorations ?? [])]
    .filter(item => !item.artworkInBackground)
    .map(item => ({ roomId: room.id, id: item.id, assetId: item.assetId, position: item.position, displayHeightTiles: item.displayHeightTiles })));
  assert.equal(inventory.length, 19, 'Refresh coverage deliberately if shipped inventory changes');
  writeFileSync(`${output}/inventory.json`, JSON.stringify({ revision, count: inventory.length, inventory }, null, 2));
  const timing = await evaluate(`new Promise(resolve=>{const samples=[];let previous=performance.now();function frame(now){samples.push(now-previous);previous=now;if(samples.length<120)requestAnimationFrame(frame);else resolve({samples,userAgent:navigator.userAgent,dpr:devicePixelRatio,viewport:{width:innerWidth,height:innerHeight},cpuThrottle:1,cacheDisabled:true,build:'Vite development at ${revision}, no runtime edits',renderer:s.game.renderer.type})}requestAnimationFrame(frame)})`);
  writeFileSync(`${output}/timing.json`, JSON.stringify(timing, null, 2));
  const room = baseline.layout.rooms.find(r => r.id === 'living-room');
  const world = ([x, y]) => ({ x: (room.origin.x + x) * 16, y: (room.origin.y + y) * 16 });
  const reset = async point => { await evaluate(`s.playerSprite.body.reset(${point.x},${point.y - 16});document.querySelector('#game-shell').focus();void 0`); await pause(150); };
  for (const speed of [144, 72]) {
    await evaluate(`s.player.speed=${speed};s.debugOverlay.geometry.setVisible(${speed === 144});s.debugOverlay.status.setVisible(${speed === 144});void 0`);
    await evaluate(`s.children.list.filter(o=>o.type==='Graphics'&&o.depth>=2&&o.depth<=4).forEach(o=>o.setVisible(${speed === 144}));void 0`);
    for (const [name, points] of [
      ['tv', [[10,4.75],[8.25,4.75],[8.25,6.25],[10,6.25],[8.25,6.25],[8.25,4.75],[10,4.75]]],
      ['vinyl', [[17.5,6.75],[15.5,6.75],[15.5,8.5],[17.5,8.5],[15.5,8.5],[15.5,6.75],[17.5,6.75]]],
      ['globe', [[4,7],[2.5,7],[2.5,9],[4,9],[2.5,9],[2.5,7],[4,7]]],
    ]) {
      await reset(world(points[0])); await capture(`${name}-${speed}-behind`);
      for (let index = 1; index < points.length; index++) {
        const target = world(points[index]), before = await sole();
        const horizontal = points[index][0] !== points[index - 1][0];
        const delta = horizontal ? target.x - before.x : target.y - before.y;
        const key = horizontal ? (delta > 0 ? 'ArrowRight' : 'ArrowLeft') : (delta > 0 ? 'ArrowDown' : 'ArrowUp');
        await keyEvent(key, 'keyDown');
        // Stop from observed physics progress, not wall-clock sleeps that can
        // overshoot when browser/tool scheduling is delayed during a build.
        await evaluate(`new Promise((resolve,reject)=>{const timer=setTimeout(()=>{s.events.off(Phaser.Scenes.Events.POST_UPDATE,check);reject(Error('route timeout'))},3000);function check(){const remaining=(${horizontal ? target.x : target.y} - ${horizontal ? 's.playerSprite.body.center.x' : 's.playerSprite.body.bottom'})*${Math.sign(delta)};if(remaining<=${speed / 60}){clearTimeout(timer);s.events.off(Phaser.Scenes.Events.POST_UPDATE,check);resolve()}}s.events.on(Phaser.Scenes.Events.POST_UPDATE,check)})`);
        await keyEvent(key, 'keyUp'); await pause(120);
        const after = await sole();
        assert.ok(Math.abs(after.x - target.x) < 6 && Math.abs(after.y - target.y) < 6, `${name}/${speed}/${index}: ${JSON.stringify({target,after})}`);
        results.push({ name, speed, index, target, after });
        if (index === 3) {
          await capture(`${name}-${speed}-front`);
          const expected = { tv: 'living-room-television', vinyl: 'living-room-record-player', globe: 'living-room-globe' }[name];
          assert.equal(await evaluate('s.interactionSystem.getCurrentTarget()?.id'), expected, `${name}: front interaction reachable`);
        }
      }
    }
  }
  const controls = [];
  for (const [name, point, baseBottom] of [['couch',[10,11.75],11.125],['table',[10,9],8.4375],['bookcase',[15.5,5.25],4.5625]]) {
    await reset(world(point)); await capture(`${name}-control`);
    await keyEvent('ArrowUp', 'keyDown'); await pause(450); await keyEvent('ArrowUp', 'keyUp'); await pause(120);
    const stopped = await sole();
    assert.ok(Math.abs(stopped.y - (room.origin.y + baseBottom) * 16 - 1) < 2, `${name} active base`);
    controls.push({ name, stopped, baseBottom });
  }
  assert.deepEqual(exceptions, []);
  const travel = [];
  for (const destination of ['cv','media','training','food-log']) {
    // Record the pre-physics transition as evidence, not a claim that a visible
    // frame renders it. Future depth integration must handle this reset boundary.
    const immediate = await evaluate(`(()=>{document.querySelector('[data-destination="${destination}"]').click();
      return {sole:{x:s.playerSprite.body.center.x,y:s.playerSprite.body.bottom},
      expectedSole:{x:s.playerSprite.x,y:s.playerSprite.y+16}}})()`);
    await pause(150);
    const state = await evaluate(`({sole:{x:s.playerSprite.body.center.x,y:s.playerSprite.body.bottom},
      anchorSole:s.playerSprite.y+16,visible:s.cameras.main.worldView.contains(s.playerSprite.x,s.playerSprite.y),
      velocity:{x:s.playerSprite.body.velocity.x,y:s.playerSprite.body.velocity.y},dialog:document.querySelector('dialog').open})`);
    assert.equal(state.sole.y, state.anchorSole);
    assert.equal(state.visible, true); assert.equal(state.dialog, false);
    assert.deepEqual(state.velocity, { x:0, y:0 });
    travel.push({ destination, immediate, ...state });
  }
  writeFileSync(`${output}/routes.json`, JSON.stringify({ revision, results, controls, travel, exceptions }, null, 2));
  console.log('PASS: TV/vinyl/globe routes forward/reverse at 144 and 72px/s; debug on/off captures; reachable interactions; baked-object controls; four quick-travel baselines; no exceptions');
} finally {
  for (const key of Object.keys(keys)) await keyEvent(key, 'keyUp');
  await send('Network.setCacheDisabled', { cacheDisabled: false });
  await send('Page.reload'); ws.close();
}
