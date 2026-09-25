// Isolated CDP browser only. Owns PORT-19C1 evidence; never edits runtime data on disk.
import assert from 'node:assert/strict';
import { mkdirSync, readFileSync, writeFileSync, existsSync } from 'node:fs';
const url = process.argv[2] ?? 'http://127.0.0.1:5173';
const port = process.argv[3] ?? '9333';
const capture = process.argv.includes('--capture-baseline');
const interactionsOnly = process.argv.includes('--interactions-only');
assert.ok(!(capture && interactionsOnly), 'Choose baseline capture or interactions-only, not both.');
const output = `output/qa/port19c1-table-bounds/${url.includes(':4173') ? 'production' : 'development'}`;
const baselinePath = 'output/qa/port19c1/preintegration-geometry.json';
mkdirSync(output, { recursive: true });
const tabs = await (await fetch(`http://127.0.0.1:${port}/json`)).json();
const tab = tabs.find(item => item.type === 'page' && item.url.startsWith(url))
  ?? (!capture && tabs.find(item => item.type === 'page' && /^http:\/\/127\.0\.0\.1:(5173|4173)\//.test(item.url)));
assert.ok(tab, `Open the isolated QA page at ${url} first; no unrelated tab will be used.`);
const ws = new WebSocket(tab.webSocketDebuggerUrl);
await new Promise((resolve, reject) => {
  ws.addEventListener('open', resolve, { once: true });
  ws.addEventListener('error', reject, { once: true });
});
let sequence = 0;
const pending = new Map(), exceptions = [], results = [];
const interactionResults = [];
ws.addEventListener('message', ({ data }) => {
  const message = JSON.parse(data);
  if (message.method === 'Runtime.exceptionThrown') exceptions.push(message.params.exceptionDetails);
  if (message.id) {
    const request = pending.get(message.id);
    if (!request) return;
    pending.delete(message.id); clearTimeout(request.timer);
    if (message.error) request.reject(Error(JSON.stringify(message.error)));
    else request.resolve(message.result);
  }
});
const send = (method, params = {}) => new Promise((resolve, reject) => {
  const id = ++sequence;
  const timer = setTimeout(() => { pending.delete(id); reject(Error(`CDP timeout: ${method}`)); }, 20000);
  pending.set(id, { resolve, reject, timer });
  ws.send(JSON.stringify({ id, method, params }));
});
const evaluate = async expression => {
  const response = await send('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true });
  if (response.exceptionDetails) throw Error(JSON.stringify(response.exceptionDetails));
  return response.result.value;
};
const pause = ms => new Promise(resolve => setTimeout(resolve, ms));
async function attach() {
  for (let attempt = 0; attempt < 100; attempt++) {
    if (await evaluate('typeof Phaser !== "undefined" && !!document.querySelector("canvas")')) break;
    await pause(100);
  }
  const proto = await send('Runtime.evaluate', { expression: 'Phaser.Game.prototype' });
  const games = await send('Runtime.queryObjects', { prototypeObjectId: proto.result.objectId });
  await send('Runtime.callFunctionOn', { objectId: games.objects.objectId,
    functionDeclaration: 'function(){window.s=this.find(g=>g.scene?.getScene("HouseScene")?.player)?.scene.getScene("HouseScene")}' });
  for (let attempt = 0; attempt < 100; attempt++) {
    if (await evaluate('!!window.s?.player && !!s.collisionSystem')) return;
    await pause(100);
    await send('Runtime.callFunctionOn', { objectId: games.objects.objectId,
      functionDeclaration: 'function(){window.s=this.find(g=>g.scene?.getScene("HouseScene")?.player)?.scene.getScene("HouseScene")}' });
  }
  throw Error('Scene did not become ready');
}
const bodies = () => evaluate('s.collisionSystem.staticBodyList.map(b=>({x:b.x,y:b.y,width:b.width,height:b.height}))');
const multiset = rectangles => rectangles.map(({ x, y, width, height }) => JSON.stringify([x, y, width, height])).sort();
// Owner-approved expansion only; preserve the historical baseline and every other collider.
function expectedBodies(baseline) {
  assert.equal(baseline.bodies.length, 80);
  const isOldTable = b => b.x === 160 && b.y === 191 && b.width === 60 && b.height === 8;
  assert.equal(baseline.bodies.filter(isOldTable).length, 1, 'Exactly one historical table base');
  return baseline.bodies.map(b => isOldTable(b) ? { x: 160, y: 175, width: 60, height: 24 } : b);
}
async function checkVisibleBounds() {
  const state = await evaluate(`(()=>{const g=s.renderLayers.collisionPreview;return {
    visible:g.visible,alpha:g.alpha,depth:g.depth,commands:g.commandBuffer.length,buffer:[...g.commandBuffer],
    doorwayVisible:s.renderLayers.doorwayPreview.visible,worldVisible:s.renderLayers.worldBounds.visible
  }})()`);
  assert.equal(state.visible, true, 'Owner collision outlines visible even with diagnostics disabled');
  assert.ok(state.alpha > 0 && state.depth > 4 && state.commands > 0);
  assert.equal(state.doorwayVisible, false);
  assert.equal(state.worldVisible, false);
  // Phaser Graphics.strokeRect emits four stroked segments (Graphics.js / Commands.js).
  // Decode rather than trusting visibility: reject extra decorative room outlines as well as missing colliders.
  const paths = [];
  let path = [], lineWidth = 0;
  for (let i = 0; i < state.buffer.length;) {
    const command = state.buffer[i++];
    if (command === 6) { lineWidth = state.buffer[i]; i += 3; }
    else if (command === 7) i += 2;
    else if (command === 1) path = [];
    else if (command === 4 || command === 5) { path.push([state.buffer[i], state.buffer[i + 1]]); i += 2; }
    else if (command === 9) { assert.equal(path.length, 2); paths.push({ points: path, lineWidth }); }
    else assert.fail(`Unexpected collision outline graphics command ${command}`);
  }
  assert.equal(paths.length % 4, 0);
  const rectangles = [];
  for (let i = 0; i < paths.length; i += 4) {
    const [left, right, top, bottom] = paths.slice(i, i + 4);
    const [[x, y], [leftX, bottomY]] = left.points;
    const width = right.points[0][0] - x, height = bottomY - y, half = left.lineWidth / 2;
    assert.equal(leftX, x);
    assert.deepEqual(right.points, [[x + width, y], [x + width, y + height]]);
    assert.deepEqual(top.points, [[x - half, y], [x + width + half, y]]);
    assert.deepEqual(bottom.points, [[x - half, y + height], [x + width + half, y + height]]);
    rectangles.push({ x, y, width, height });
  }
  // Compare edges to avoid cancellation from reconstructing fractional widths (e.g. 161.2 - 130).
  const edges = rs => rs.map(r => JSON.stringify([r.x, r.y, r.x + r.width, r.y + r.height])).sort();
  assert.deepEqual(edges(rectangles), edges(await bodies()), 'Outlines must match every actual collider exactly once');
  delete state.buffer;
  state.rectangles = rectangles;
  return state;
}
const TABLE = 'living-room-coffee-table', COUCH = 'living-room-couch';
const OLD = 'living-room-background', NEW = 'living-room-background-couch-table-removed';
const keys = { ArrowUp: 38, ArrowDown: 40, ArrowLeft: 37, ArrowRight: 39 };
const held = new Set();
async function key(name, down) {
  await send('Input.dispatchKeyEvent', { type: down ? 'keyDown' : 'keyUp', key: name, code: name, windowsVirtualKeyCode: keys[name] });
  if (down) held.add(name); else held.delete(name);
}
async function release() {
  for (const name of [...held]) await key(name, false);
}
async function readyAfterRestart() {
  await evaluate(`new Promise((resolve,reject)=>{
    const timer=setTimeout(()=>reject(Error('restart timed out')),10000);
    const original=s.callbacks.onSceneReady;
    s.callbacks.onSceneReady=(...args)=>{s.callbacks.onSceneReady=original;original?.(...args);clearTimeout(timer);resolve(true)};
    s.scene.restart();
  })`);
  await evaluate('s.setDiagnosticsEnabled(false);void 0');
}
async function load() {
  await send('Page.navigate', { url }); await pause(1000); await attach();
  await evaluate('s.setDiagnosticsEnabled(false);document.querySelector("#game-shell").focus();void 0');
}
async function position(x, y) {
  await release();
  await evaluate(`s.player.teleportTo({x:${x / 16},y:${y / 16}});s.synchronizePresentation();document.querySelector('#game-shell').focus();void 0`);
}
async function screenshot(name) {
  // Hide only status/prompt panels for unobstructed QA captures; restore immediately.
  await evaluate(`window.qaHidden=Array.from(document.querySelectorAll('[role="status"],#game-status,.interaction-prompt')).map(e=>[e,e.style.visibility]);qaHidden.forEach(([e])=>e.style.visibility='hidden');void 0`);
  try {
    const capture = await send('Page.captureScreenshot', { format: 'png', captureBeyondViewport: true });
    writeFileSync(`${output}/${name}.png`, Buffer.from(capture.data, 'base64'));
  } finally {
    await evaluate('qaHidden.forEach(([e,v])=>e.style.visibility=v);delete window.qaHidden;void 0');
  }
}
async function checkDepth(front) {
  const state = await evaluate(`(()=>{const e=s.depths.entries.find(e=>e.id==='${TABLE}');
    const p=s.player.getDisplayObject();return {sole:s.player.getGroundY(),visual:p.y,playerDepth:p.depth,tableDepth:e?.view.depth,plane:e?.groundY()}})()`);
  assert.equal(state.plane, 199);
  assert.equal(state.visual, state.sole);
  assert.equal(state.playerDepth > state.tableDepth, front, JSON.stringify(state));
  return state;
}
async function walkTo(x, y, speed) {
  const before = await evaluate('({x:s.playerSprite.body.center.x,y:s.player.getGroundY()})');
  const horizontal = Math.abs(x - before.x) > 3;
  const target = horizontal ? x : y;
  const sign = Math.sign(target - (horizontal ? before.x : before.y));
  const direction = horizontal ? (sign > 0 ? 'ArrowRight' : 'ArrowLeft') : (sign > 0 ? 'ArrowDown' : 'ArrowUp');
  await key(direction, true);
  try {
    await evaluate(`new Promise((resolve,reject)=>{
      const done=(error)=>{clearTimeout(timer);s.events.off('postupdate',check);s.inputController.resetMovement();error?reject(Error(error)):resolve(true)};
      const check=()=>{if((${target}-${horizontal ? 's.playerSprite.body.center.x' : 's.player.getGroundY()'})*${sign}<=${speed / 60})done()};
      const timer=setTimeout(()=>done('route waypoint timed out'),5000);s.events.on('postupdate',check);
    })`);
  } finally { await release(); }
  await pause(50);
  const after = await evaluate('({x:s.playerSprite.body.center.x,y:s.player.getGroundY()})');
  assert.ok(Math.abs(after.x - x) <= 4 && Math.abs(after.y - y) <= 4, JSON.stringify({ x, y, after }));
  return after;
}
async function contact(label, x, y, directions, speed) {
  await position(x, y);
  await evaluate(`s.player.speed=${speed};window.qaContact=new Promise(resolve=>{
    let samples=0;const finish=(result)=>{clearTimeout(timer);s.events.off('postupdate',check);s.inputController.resetMovement();resolve(result)};
    function check(){const b=s.playerSprite.body;samples++;
      const overlapX=Math.min(b.right,220)-Math.max(b.left,160),overlapY=Math.min(b.bottom,199)-Math.max(b.top,175);
      const state={left:b.left,right:b.right,top:b.top,bottom:b.bottom,samples};
      if(overlapX>1e-6&&overlapY>1e-6)return finish({...state,error:'penetrated table base'});
      const vertical=overlapX>0&&(Math.abs(b.bottom-175)<.05||Math.abs(b.top-199)<.05);
      const horizontal=overlapY>0&&(Math.abs(b.right-160)<.05||Math.abs(b.left-220)<.05);
      if(vertical||horizontal)finish({...state,contact:true});
    }
    const timer=setTimeout(()=>finish({error:'no table contact',samples}),3000);s.events.on('postupdate',check);
  });void 0`);
  try {
    for (const direction of directions) await key(direction, true);
    const state = await evaluate('qaContact');
    assert.equal(state.error, undefined, `${label}: ${JSON.stringify(state)}`);
    assert.equal(state.contact, true);
    results.push({ collision: label, speed, directions, state });
  } finally { await release(); }
}
async function verifyIntegration(baseline) {
  const state = await evaluate(`(()=>{const r=s.layout.rooms.find(r=>r.id==='living-room');
    const o=[...r.interactables,...(r.decorations??[])].find(o=>o.id==='${TABLE}');
    const e=s.depths.entries.find(e=>e.id==='${TABLE}');return {object:o,ground:e?.groundY(),viewX:e?.view.x,
    textures:s.children.list.filter(o=>o.depth===1&&o.texture).map(o=>o.texture.key),count:s.depths.entries.length,
    backdrop:s.children.list.filter(o=>o.depth===1&&o.texture?.key==='${NEW}').map(o=>({frame:o.frame.name,width:o.frame.realWidth,height:o.frame.realHeight})),
    frame:e?{width:e.view.frame.realWidth,height:e.view.frame.realHeight}:null,
    bundle:r.visualBundle,
    couchCount:s.children.list.filter(o=>o.texture?.key==='${COUCH}').length,
    frontCount:s.children.list.filter(o=>o.texture?.key==='${TABLE}').length}})()`);
  assert.ok(state.object, 'Table runtime integration is not ready.');
  assert.deepEqual(state.object.groundAnchor, { x: 9.875, y: 8.4375 });
  assert.deepEqual(state.object.footprints, [{ x: 8, y: 6.9375, width: 3.75, height: 1.5 }]);
  assert.equal(state.ground, 199);
  assert.deepEqual(state.object.position, { x: 741 * 20 / 1499 - 0.5, y: 538.5 * 14 / 1049 - 0.5 });
  assert.equal(state.object.displayWidthTiles, 308 * 20 / 1499);
  assert.equal(state.object.displayHeightTiles, 185 * 14 / 1049);
  assert.ok(state.textures.includes(NEW)); assert.ok(!state.textures.includes(OLD));
  assert.deepEqual(state.backdrop, [{ frame: '__BASE', width: 1499, height: 1049 }]);
  assert.equal(state.frontCount, 1);
  assert.equal(state.couchCount, 1);
  assert.deepEqual(state.frame, { width: 308, height: 185 });
  assert.equal(state.bundle.fallbackAssetId, OLD);
  assert.deepEqual([...state.bundle.foregroundIds].sort(), [COUCH, TABLE].sort());
  assert.deepEqual(multiset(await bodies()), multiset(expectedBodies(baseline)));
  state.collisionBounds = await checkVisibleBounds();
  const current = await evaluate('s.layout');
  assert.deepEqual(current.corridors, baseline.layout.corridors);
  assert.deepEqual(current.doorways, baseline.layout.doorways);
  for (const room of current.rooms) {
    const previous = baseline.layout.rooms.find(old => old.id === room.id);
    assert.deepEqual(room.origin, previous.origin);
    assert.deepEqual(room.interactables, previous.interactables);
    assert.deepEqual((room.decorations ?? []).filter(o => o.id !== TABLE), previous.decorations ?? []);
    assert.deepEqual(room.collisionRects, room.id === 'living-room'
      ? previous.collisionRects.filter(r => !(r.x === 8 && r.y === 7.9375 && r.width === 3.75 && r.height === 0.5))
      : previous.collisionRects);
  }
  return state;
}
async function passage(speed, reverse) {
  const start = reverse ? 232 : 148, end = reverse ? 148 : 232;
  await position(start, 205);
  await evaluate(`s.player.speed=${speed};window.qaPassage={samples:0,penetrations:0,minTop:Infinity,maxBottom:-Infinity};
    window.qaPassageCheck=()=>{const b=s.playerSprite.body,q=qaPassage;q.samples++;
      q.minTop=Math.min(q.minTop,b.top);q.maxBottom=Math.max(q.maxBottom,b.bottom);
      for(const r of [{x:160,y:175,width:60,height:24},{x:138,y:214,width:104,height:28}]){
        if(Math.min(b.right,r.x+r.width)-Math.max(b.left,r.x)>1e-6&&
           Math.min(b.bottom,r.y+r.height)-Math.max(b.top,r.y)>1e-6)q.penetrations++;
      }};s.events.on('postupdate',qaPassageCheck);void 0`);
  let actual, state;
  try {
    actual = await walkTo(end, 205, speed);
    state = await evaluate('qaPassage');
  } finally { await evaluate("s.events.off('postupdate',qaPassageCheck);delete window.qaPassageCheck;void 0"); }
  assert.ok(state.samples > 0);
  assert.equal(state.penetrations, 0);
  assert.ok(state.minTop >= 199 && state.maxBottom <= 214, 'Entire body stays in the 15px passage');
  results.push({ passage: reverse ? 'right-to-left' : 'left-to-right', speed, gap: 15, actual, state, depth: await checkDepth(true) });
}
async function runInteractions() {
  await load();
  const waitFor = async (expression, description) => {
    for (let attempt = 0; attempt < 100; attempt++) {
      if (await evaluate(expression)) return;
      await pause(50);
    }
    throw Error(`Timed out: ${description}`);
  };
  const press = async name => {
    const fields = { key: name, code: name.length === 1 ? `Key${name.toUpperCase()}` : name,
      windowsVirtualKeyCode: { e: 69, f: 70, Enter: 13, Escape: 27 }[name] };
    await send('Input.dispatchKeyEvent', { type: 'keyDown', ...fields });
    try { await pause(80); }
    finally { await send('Input.dispatchKeyEvent', { type: 'keyUp', ...fields }); }
  };
  const tap = async selector => {
    await evaluate(`document.querySelector(${JSON.stringify(selector)}).scrollIntoView({block:'center'});void 0`);
    await pause(100);
    const point = await evaluate(`(()=>{const e=document.querySelector(${JSON.stringify(selector)}),r=e.getBoundingClientRect();
      return {x:r.x+r.width/2,y:r.y+r.height/2,width:r.width,height:r.height,disabled:e.disabled}})()`);
    assert.ok(point.width > 0 && point.height > 0 && !point.disabled, `Touchable ${selector}`);
    await send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: point.x, y: point.y, id: 1 }] });
    await send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
  };
  for (const [viewport, width, height, mobile] of [['desktop', 1280, 900, false], ['portrait', 390, 844, true], ['landscape', 844, 390, true]]) {
    await send('Emulation.setDeviceMetricsOverride', { width, height, deviceScaleFactor: 1, mobile });
    await send('Emulation.setTouchEmulationEnabled', { enabled: mobile });
    await pause(200);
    // PORT-18D room-local tile positions converted to world pixels: origin (2,4), tile size 16.
    for (const [id, x, y, title] of [
      ['living-room-television', 192, 164, 'Games and movies'],
      ['living-room-record-player', 312, 200, 'Music collection'],
    ]) {
      for (const input of ['e', 'f', 'Enter', ...(mobile ? ['touch'] : [])]) {
        await position(x, y);
        await waitFor(`s.interactionSystem.getCurrentTarget()?.id===${JSON.stringify(id)}`, `${id} target`);
        assert.equal(await evaluate("document.querySelector('dialog').open"), false);
        if (input === 'touch') await tap('.mobile-interact');
        else await press(input);
        await waitFor("document.querySelector('dialog').open", `${input} opens ${id}`);
        const opened = await evaluate(`({title:document.querySelector('#dialog-title').textContent,
          gameplay:s.inputController.isGameplayEnabled(),target:s.interactionSystem.getCurrentTarget()?.id,
          position:{x:s.playerSprite.body.center.x,y:s.player.getGroundY()}})`);
        assert.equal(opened.title, title);
        assert.equal(opened.gameplay, false);
        const shot = `interaction-${viewport}-${id}-${input}`;
        await screenshot(shot);
        if (input === 'touch') await tap('.dialog-close');
        else await press('Escape');
        await waitFor("!document.querySelector('dialog').open && s.inputController.isGameplayEnabled()", 'dialog closes and gameplay resumes');
        const closed = await evaluate(`({open:document.querySelector('dialog').open,
          gameplay:s.inputController.isGameplayEnabled(),position:{x:s.playerSprite.body.center.x,y:s.player.getGroundY()}})`);
        assert.deepEqual(closed.position, opened.position, 'Interaction must not move the player');
        interactionResults.push({ viewport, width, height, mobile, id, input, opened, closed, screenshot: `${shot}.png` });
      }
    }
  }
  assert.deepEqual(exceptions, []);
  writeFileSync(`${output}/interactions-results.json`, JSON.stringify({ url, recordedAt: new Date().toISOString(),
    mode: 'interactions', results: interactionResults, exceptions }, null, 2));
  console.log(`PASS ${interactionResults.length} TV/vinyl keyboard and touch interaction records`);
}
async function run() {
  assert.ok(existsSync(baselinePath), 'Capture the refreshed preintegration baseline first.');
  const baseline = JSON.parse(readFileSync(baselinePath, 'utf8'));
  await load();
  results.push({ integration: await verifyIntegration(baseline), bodyCount: baseline.bodies.length });
  await send('Emulation.setDeviceMetricsOverride', { width: 1280, height: 900, deviceScaleFactor: 1, mobile: false });
  await send('Emulation.setTouchEmulationEnabled', { enabled: false });
  const route = [[190, 168], [148, 168], [148, 205], [190, 205], [232, 205], [232, 168], [190, 168]];
  await evaluate(`window.qaChunks=[];window.qaRecorder=new MediaRecorder(document.querySelector('canvas').captureStream(30),{mimeType:'video/webm'});qaRecorder.ondataavailable=e=>qaChunks.push(e.data);qaRecorder.start();void 0`);
  for (const speed of [144, 72]) {
    await evaluate(`s.player.speed=${speed}`);
    for (const [name, points] of [['forward', route], ['reverse', [...route].reverse()]]) {
      await position(...points[0]);
      for (let i = 0; i < points.length; i++) {
        const [x, y] = points[i];
        const actual = i ? await walkTo(x, y, speed) : { x, y };
        const depth = await checkDepth(y > 199);
        results.push({ route: name, speed, waypoint: i, target: { x, y }, actual, depth });
      }
    }
  }
  for (const speed of [144, 72]) for (const reverse of [false, true]) await passage(speed, reverse);
  const video = await evaluate(`new Promise(resolve=>{qaRecorder.onstop=()=>{const reader=new FileReader();reader.onload=()=>resolve(reader.result.split(',')[1]);reader.readAsDataURL(new Blob(qaChunks,{type:'video/webm'}))};qaRecorder.stop()})`);
  writeFileSync(`${output}/table-routes.webm`, Buffer.from(video, 'base64'));
  for (const speed of [144, 72]) {
    for (const [label, x, y, directions] of [
      ['north', 190, 167, ['ArrowDown']], ['south', 190, 207, ['ArrowUp']],
      ['west', 146, 187, ['ArrowRight']], ['east', 234, 187, ['ArrowLeft']],
      ['north-west', 146, 167, ['ArrowDown', 'ArrowRight']], ['north-east', 234, 167, ['ArrowDown', 'ArrowLeft']],
      ['south-west', 146, 207, ['ArrowUp', 'ArrowRight']], ['south-east', 234, 207, ['ArrowUp', 'ArrowLeft']],
    ]) await contact(label, x, y, directions, speed);
  }
  for (const [viewport, width, height, mobile] of [['desktop', 1280, 900, false], ['portrait', 390, 844, true], ['landscape', 844, 390, true]]) {
    await send('Emulation.setDeviceMetricsOverride', { width, height, deviceScaleFactor: 1, mobile });
    await send('Emulation.setTouchEmulationEnabled', { enabled: mobile });
    for (const [name, x, y] of [['behind', 190, 168], ['front', 190, 205], ['left', 148, 187], ['right', 232, 187]]) {
      await position(x, y); await pause(150); await screenshot(`${viewport}-${name}`);
      results.push({ screenshot: `${viewport}-${name}`, depth: await checkDepth(y > 199), collisionBounds: await checkVisibleBounds() });
    }
  }
  // Existing independent actors must remain registered and correctly sorted.
  for (const [id, x, behind, front] of [['living-room-television', 192, 140, 164], ['living-room-record-player', 312, 172, 200], ['living-room-globe', 96, 176, 208], [COUCH, 190, 205, 250]]) {
    for (const y of [behind, front]) {
      await position(x, y);
      const state = await evaluate(`(()=>{const e=s.depths.entries.find(e=>e.id==='${id}');return {plane:e.groundY(),front:s.player.getDisplayObject().depth>e.view.depth}})()`);
      assert.equal(state.front, y > state.plane); results.push({ existingObject: id, y, ...state });
    }
  }
  const listeners = await evaluate("({post:s.events.listenerCount('postupdate'),step:s.physics.world.listenerCount('worldstep')})");
  for (let i = 0; i < 2; i++) {
    await readyAfterRestart(); await verifyIntegration(baseline);
    assert.deepEqual(await evaluate("({post:s.events.listenerCount('postupdate'),step:s.physics.world.listenerCount('worldstep')})"), listeners);
  }
  // Every independent subset of failed original/new/foreground textures.
  for (let mask = 1; mask < 16; mask++) {
    await load();
    const missing = [OLD, NEW, COUCH, TABLE].filter((_, index) => mask & (1 << index));
    // Keep the current scene from rendering destroyed frames between CDP calls.
    // Restart recreates all views; the assertions below inspect those new views unmodified.
    await evaluate(`s.preload=()=>{};const missing=${JSON.stringify(missing)};
      s.children.list.filter(view=>missing.includes(view.texture?.key)).forEach(view=>view.setVisible(false));
      missing.forEach(key=>s.textures.remove(key));void 0`);
    await readyAfterRestart();
    const fullBundle = !missing.includes(NEW) && !missing.includes(COUCH) && !missing.includes(TABLE);
    const originalFallback = !fullBundle && !missing.includes(OLD);
    for (let restart = 0; restart < 2; restart++) {
      if (restart) await readyAfterRestart();
      const state = await evaluate(`(()=>{return {
        backgrounds:s.children.list.filter(o=>o.depth===1&&o.texture).map(o=>o.texture.key),
        backdrops:s.children.list.filter(o=>o.depth===1&&[${JSON.stringify(OLD)},${JSON.stringify(NEW)}].includes(o.texture?.key)).map(o=>({texture:o.texture.key,frame:o.frame.name,width:o.frame.realWidth,height:o.frame.realHeight})),
        members:[${JSON.stringify(COUCH)},${JSON.stringify(TABLE)}].map(id=>({
          id,texture:s.depths.entries.find(e=>e.id===id)?.view.texture.key??null,
          artCount:s.children.list.filter(o=>o.texture?.key===id).length
        })),
        other:s.depths.entries.filter(e=>['living-room-television','living-room-record-player','living-room-globe'].includes(e.id)).map(e=>e.id).sort(),
        listeners:{post:s.events.listenerCount('postupdate'),step:s.physics.world.listenerCount('worldstep')}
      }})()`);
      assert.equal(state.backgrounds.includes(NEW), fullBundle);
      assert.equal(state.backgrounds.includes(OLD), originalFallback);
      assert.deepEqual(state.backdrops, fullBundle || originalFallback
        ? [{ texture: fullBundle ? NEW : OLD, frame: '__BASE', width: 1499, height: 1049 }]
        : []);
      for (const member of state.members) {
        assert.equal(member.texture, fullBundle ? member.id : originalFallback ? null : 'furniture-placeholder');
        assert.equal(member.artCount, fullBundle ? 1 : 0);
      }
      assert.equal(state.other.length, 3); assert.deepEqual(state.listeners, listeners);
      assert.deepEqual(multiset(await bodies()), multiset(expectedBodies(baseline)));
      state.collisionBounds = await checkVisibleBounds();
      results.push({ missing, restart, state });
    }
    await position(190, 168); await screenshot(`fallback-${mask}`);
    await contact(`fallback-${mask}-north`, 190, 167, ['ArrowDown'], 144);
  }
  assert.deepEqual(exceptions, []);
  writeFileSync(`${output}/results.json`, JSON.stringify({ url, recordedAt: new Date().toISOString(), baseline: baselinePath, results, listeners, exceptions }, null, 2));
  console.log(`PASS ${results.length} table QA records: geometry, routes, contacts, emulated viewports, 15 fallback cases and restart`);
}
try {
  await send('Runtime.enable'); await send('Page.enable');
  if (capture) {
    assert.ok(!existsSync(baselinePath), 'Refusing to overwrite the preintegration baseline.');
    await attach();
    assert.equal(await evaluate('s.depths.entries.some(e=>e.id==="living-room-coffee-table")'), false,
      'Table already registered: this is not a preintegration capture.');
    const snapshot = await evaluate('({layout:s.layout,bodies:s.collisionSystem.staticBodyList.map(b=>({x:b.x,y:b.y,width:b.width,height:b.height})),backgrounds:s.children.list.filter(o=>o.depth===1&&o.texture).map(o=>o.texture.key)})');
    assert.equal(snapshot.layout.rooms.find(room => room.id === 'kitchen').origin.x, 24.9375,
      'Expected the refreshed gym/kitchen alignment in baseline.');
    assert.equal(snapshot.bodies.filter(b => b.x === 160 && b.y === 191 && b.width === 60 && b.height === 8).length, 1);
    writeFileSync(baselinePath, JSON.stringify({ capturedAt: new Date().toISOString(), url, ...snapshot }, null, 2));
    console.log(`PASS captured ${snapshot.bodies.length} preintegration static bodies to ${baselinePath}`);
  } else if (interactionsOnly) {
    await runInteractions();
  } else {
    await run();
    await runInteractions();
  }
} catch (error) {
  if (!capture) writeFileSync(`${output}/${interactionsOnly ? 'interactions-failure' : 'failure'}.json`, JSON.stringify({ at: new Date().toISOString(), message: error.stack, results, interactionResults, exceptions }, null, 2));
  throw error;
} finally {
  if (!capture) { await release().catch(() => {}); await send('Page.reload').catch(() => {}); }
  for (const request of pending.values()) clearTimeout(request.timer);
  ws.close();
}
