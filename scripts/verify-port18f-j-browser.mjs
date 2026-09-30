// Isolated CDP browser only. Owns PORT-18F–J evidence; never edits runtime data on disk.
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { mkdirSync, readFileSync, writeFileSync, existsSync } from 'node:fs';
const harnessSha256=createHash('sha256').update(readFileSync(new URL(import.meta.url))).digest('hex');
const url = process.argv[2] ?? 'http://127.0.0.1:5173';
const port = process.argv[3] ?? '9333';
const output = `output/qa/port18f-j/final/${url.includes(':4173') ? 'production' : 'development'}`;
const baselinePath = 'output/qa/port18f-j/preintegration-geometry.json';
mkdirSync(output, { recursive: true });
const tabs = await (await fetch(`http://127.0.0.1:${port}/json`)).json();
const tab = tabs.find(item => item.type === 'page' && item.url.startsWith(url))
  ?? (tabs.find(item => item.type === 'page' && /^http:\/\/127\.0\.0\.1:(5173|4173)\//.test(item.url)));
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
const removedDeskWorld = {x:88,y:377,width:33,height:5};
const removedDeskLocal = {x:2,y:3.5625,width:2.0625,height:0.3125};
function expectedBodies(baseline) {
 assert.equal(baseline.bodies.length,80,'Historical baseline must stay immutable');
 const key=multiset([removedDeskWorld])[0];
 assert.equal(multiset(baseline.bodies).filter(k=>k===key).length,1);
 return baseline.bodies.filter(r=>multiset([r])[0]!==key);
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
  const edges = rs => rs.map(r => JSON.stringify([r.x, r.y, r.x + r.width, r.y + r.height].map(v=>Math.round(v*1e9)/1e9))).sort();
  assert.deepEqual(edges(rectangles), edges(await bodies()), 'Outlines must match every actual collider exactly once');
  delete state.buffer;
  state.rectangles = rectangles;
  return state;
}
const ACTORS=[{"id":"gym-boombox","room":"gym","asset":"gym-boombox-front","anchor":{"x":8,"y":4.1875},"indices":[6],"side":552,"points":[[528,121],[552,121],[552,140],[528,140],[504,140],[504,121],[528,121]]},{"id":"office-workstation","room":"office","asset":"office-workstation-right-facing","anchor":{"x":3,"y":6.625},"indices":[5,16,17,18,19,20,21,22,23],"side":154,"points":[[154,396],[154,434],[104,434]],"front":[104,434],"behindLabel":"below-plane-right-side-not-rear"},{"id":"office-dog-bed","room":"office","asset":"office-dog-bed-front","anchor":{"x":3,"y":8.8125},"indices":[7],"side":134,"points":[[104,433],[134,433],[134,464],[104,464]],"position":{"x":2.5,"y":7.625},"footprints":[{"x":1.8484375,"y":7.4921875,"width":2.321875,"height":1.3234375}]},{"id":"office-bookcase","room":"office","asset":"office-bookcase-front","anchor":{"x":5.6,"y":3.75},"indices":[6],"side":174,"points":[[174,376],[174,388],[145,388]],"front":[145,388],"behindLabel":"below-plane-right-side-not-rear"},{"id":"office-sofa","room":"office","asset":"office-sofa-left","anchor":{"x":13.75,"y":7.1875},"indices":[8],"side":304,"points":[[277,381],[250,381],[250,443],[277,443]],"footprints":[{"x":12.875,"y":4.250208333333333,"width":1.875,"height":2.937291666666667}]},{"id":"office-coffee-table","room":"office","asset":"office-coffee-table-front","anchor":{"x":10.75,"y":6.9375},"indices":[9],"side":204,"points":[[228,390],[205,390],[205,440],[228,440]],"footprints":[{"x":10.0625,"y":4.816041666666667,"width":1.375,"height":2.121458333333333}]},{"id":"office-robot-standing","room":"office","asset":"office-robot-standing","anchor":{"x":12.75,"y":8.8125},"indices":[10],"side":244,"points":[[260,446],[244,446],[244,464],[260,464]]},{"id":"office-robot-seated","room":"office","asset":"office-robot-seated","anchor":{"x":14.5,"y":8.75},"indices":[11],"side":244,"points":[[288,446],[244,446],[244,464],[288,464]]},{"id":"kitchen-dining-set","room":"kitchen","asset":"kitchen-dining-set","anchor":{"x":8.5,"y":8.3125},"indices":[9,10,11],"side":486,"points":[[535,407],[486,407],[486,457],[535,457],[584,457],[584,407],[535,407]]},{"id":"office-plant-top-right","room":"office","asset":"office-plant-top-right","indices":[13],"position":{"x":15.27951,"y":2.569582},"height":2.066169,"anchor":{"x":15.8125,"y":4},"footprints":[{"x":15.375,"y":3.0625,"width":0.875,"height":0.9375}],"points":[[293,381],[293,386],[309,386]],"front":[309,386],"side":293,"behindLabel":"behind-plane-side-not-rear","isNew":true},{"id":"office-plant-bottom-left","room":"office","asset":"office-plant-bottom-left","indices":[14],"position":{"x":0.500647,"y":7.401282},"height":2.182908,"anchor":{"x":1.0625,"y":8.75},"footprints":[{"x":0.625,"y":7.9375,"width":0.875,"height":0.8125}],"points":[[73,439],[73,433],[140,433],[140,464],[73,464]],"front":[73,464],"side":134,"isNew":true},{"id":"office-plant-bottom-right","room":"office","asset":"office-plant-bottom-right","indices":[15],"position":{"x":15.484272,"y":7.401211},"height":1.962774,"anchor":{"x":15.9375,"y":8.75},"footprints":[{"x":15.5,"y":7.9375,"width":0.875,"height":0.8125}],"points":[[311,440],[244,440],[244,464],[311,464]],"front":[311,464],"side":244,"isNew":true}];
const plane=a=>(a.room==='gym'?64:320)+a.anchor.y*16;
// Independently sampled clear routes for the approved taller footprints.
ACTORS.find(a=>a.id==='office-dog-bed').points=[[104,439],[134,439],[134,464],[104,464]];
ACTORS.find(a=>a.id==='office-sofa').points=[[276,386],[304,386],[304,443],[276,443]];
ACTORS.find(a=>a.id==='office-coffee-table').points=[[228,395],[204,395],[204,440],[228,440],[248,440],[248,395],[228,395]];
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
    // Wait for two actual game render completions, not only simulation/timer state.
    await evaluate(`new Promise((resolve,reject)=>{let n=0;const done=()=>{if(++n<2)return;clearTimeout(timer);s.game.events.off('postrender',done);resolve(true)};const timer=setTimeout(()=>{s.game.events.off('postrender',done);reject(Error('postrender timeout'))},10000);s.game.events.on('postrender',done)})`);
    const capture = await send('Page.captureScreenshot', { format: 'png', captureBeyondViewport: true });
    writeFileSync(`${output}/${name}.png`, Buffer.from(capture.data, 'base64'));
  } finally {
    await evaluate('qaHidden.forEach(([e,v])=>e.style.visibility=v);delete window.qaHidden;void 0');
  }
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
    // Existing reachable interaction positions in world pixels; metadata migration must not move them.
    for (const [id, x, y, title] of [
      ['office-workstation', 104, 434, 'Curriculum vitae'],
      ['office-dog-bed', 104, 464, 'Stella'],
      ['office-bookcase', 150, 388, 'Recently read books'],
      ['kitchen-stove', 443, 416, 'Recently cooked'],
      ['kitchen-fridge', 631, 404, 'Shopping list'],
      ['gym-boombox', 528, 140, 'Music collection'],
    ]) {
      for (const input of ['e', 'f', 'Enter', ...(mobile ? ['touch'] : [])]) {
        await clearPosition(x, y);
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
    harnessSha256, mode: 'interactions', results: interactionResults, exceptions }, null, 2));
  console.log(`PASS ${interactionResults.length} CV/dog/books/meals/shopping/music keyboard and touch interaction records`);
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


const BASELINE=JSON.parse(readFileSync(baselinePath,'utf8'));
const plantIds=ACTORS.filter(a=>a.isNew).map(a=>a.id),cleanBackground='office-background-plants-removed',originalBackground='office-background';
function expectedLayout(){
 const expected=structuredClone(BASELINE.layout);
 for(const room of expected.rooms){
  const targets=ACTORS.filter(a=>a.room===room.id),rects=[...room.collisionRects];
  for(const a of targets){
   let o=[...room.interactables,...(room.decorations??[])].find(o=>o.id===a.id);
   if(a.isNew){o={id:a.id,assetId:a.asset,position:a.position,displayHeightTiles:a.height};room.decorations.unshift(o);}
   if(a.position)o.position=a.position;o.groundAnchor=a.anchor;
   o.footprints=a.footprints??a.indices.map(i=>rects[i]).filter(p=>!(a.id==='office-workstation'&&multiset([p])[0]===multiset([removedDeskLocal])[0]));
  }
  room.collisionRects=rects.filter((_,i)=>!targets.some(a=>a.indices.includes(i)));
  if(room.id==='office'){room.visualAssetId=cleanBackground;room.visualBundle={fallbackAssetId:originalBackground,foregroundIds:plantIds};}
 }
 // Authored order is top, bottom-left, bottom-right, followed by unchanged existing decorations.
 const office=expected.rooms.find(r=>r.id==='office');office.decorations=[...plantIds.map(id=>office.decorations.find(o=>o.id===id)),...office.decorations.filter(o=>!plantIds.includes(o.id))];
 return expected;
}
const EXPECTED=expectedLayout();
function expectedCurrentBodies(){
 let expected=expectedBodies(BASELINE);
 for(const a of ACTORS.filter(a=>a.footprints)){
  const room=BASELINE.layout.rooms.find(r=>r.id===a.room),old=room.collisionRects[a.indices[0]],n=a.footprints[0];
  const world=p=>({x:(room.origin.x+p.x)*16,y:(room.origin.y+p.y)*16,width:p.width*16,height:p.height*16});
  const key=multiset([world(old)])[0];assert.equal(multiset(expected).filter(k=>k===key).length,1);
  expected=expected.filter(p=>multiset([p])[0]!==key);const p=world(n);
  expected.push({...p,x:(p.x+p.width/2)-p.width/2,y:(p.y+p.height/2)-p.height/2});
 }
 return expected;
}
async function verifyIntegration(){
 assert.deepEqual(await evaluate('s.layout'),EXPECTED,'Only documented ownership, dog move, resized bases and plant bundle additions');
 assert.equal((await bodies()).length,79);assert.deepEqual(multiset(await bodies()),multiset(expectedCurrentBodies()));
 const objects=EXPECTED.rooms.flatMap(r=>[...r.interactables,...(r.decorations??[])].filter(o=>!o.artworkInBackground));
 assert.equal(objects.length,24);assert.ok(objects.every(o=>o.groundAnchor&&o.footprints?.length));
 return {bodies:79,instances:objects.map(o=>o.id),bounds:await checkVisibleBounds()};
}
async function pose(id) {
  const state = await evaluate(`(()=>{const e=s.depths.entries.find(e=>e.id===${JSON.stringify(id)}),v=s.player.getDisplayObject(),b=s.playerSprite.body;
    return {id:${JSON.stringify(id)},plane:e.groundY(),objectDepth:e.view.depth,texture:e.view.texture.key,
      sole:b.bottom,x:b.center.x,playerDepth:v.depth,playerTexture:v.texture.key,visible:v.visible,
      visualY:v.y,anchorY:s.playerSprite.y,animation:v.anims?.currentAnim?.key??null,frame:v.frame.name,
      velocity:{x:b.velocity.x,y:b.velocity.y}}})()`);
  assert.equal(state.playerDepth > state.objectDepth, state.sole >= state.plane);
  assert.ok(state.objectDepth > 3 && state.objectDepth < 4 && state.playerDepth > 3 && state.playerDepth < 4);
  assert.equal(state.visible, true);
  assert.equal(state.sole, state.anchorY + 16);
  if (state.playerTexture !== 'player-placeholder') assert.equal(state.visualY, state.sole);
  return state;
}
async function clearPosition(x, y) {
  const solids = await bodies();
  assert.ok(!solids.some(r => Math.min(x + 8, r.x + r.width) - Math.max(x - 8, r.x) > 1e-6 &&
    Math.min(y, r.y + r.height) - Math.max(y - 1, r.y) > 1e-6), `Blocked fixture (${x},${y})`);
  await position(x, y);
}
async function routeCheck(route, speed, reverse) {
  const points = reverse ? [...route.points].reverse() : route.points;
  await clearPosition(...points[0]);
  await evaluate(`s.player.speed=${speed};window.qaMonitor={samples:0,violations:[],animations:[]};window.qaMonitorCheck=()=>{
    const b=s.playerSprite.body,v=s.player.getDisplayObject(),q=qaMonitor,e=s.depths.entries.find(e=>e.id===${JSON.stringify(route.id)});q.samples++;const c=s.cameras.main;if(!Number.isFinite(c.scrollX+c.scrollY+c.zoom))q.violations.push('camera');
    if((v.depth>e.view.depth)!==(b.bottom>=e.groundY()))q.violations.push('order');
    if(s.collisionSystem.staticBodyList.some(r=>Math.min(b.right,r.right)-Math.max(b.left,r.left)>1e-6&&Math.min(b.bottom,r.bottom)-Math.max(b.top,r.top)>1e-6))q.violations.push('penetration');
    const a=v.anims?.currentAnim?.key;if(a&&!q.animations.includes(a))q.animations.push(a);
  };s.events.on('postupdate',qaMonitorCheck);void 0`);
  await evaluate(`window.qaCameraCheck=()=>{const c=s.cameras.main,b=s.playerSprite.body;qaMonitor.cameraSamples=(qaMonitor.cameraSamples??0)+1;if(!c.worldView.contains(b.center.x,b.bottom))qaMonitor.violations.push({camera:'postrender',x:b.center.x,y:b.bottom,scrollX:c.scrollX,scrollY:c.scrollY,view:{x:c.worldView.x,y:c.worldView.y,width:c.worldView.width,height:c.worldView.height}})};s.game.events.on('postrender',qaCameraCheck);void 0`);
  const states = [];
  let monitor;
  try {
    for (let i = 0; i < points.length; i++) {
      if (i) {
        try { await walkTo(...points[i], speed); }
        catch (error) { results.push({ blockedRoute: route.name, id:route.id, speed, reverse, target:points[i], prior:states, stopped:await pose(route.id) }); throw error; }
      }
      await pause(100);
      states.push(await pose(route.id));
    }
    monitor = await evaluate('qaMonitor');
  } finally { await evaluate("s.events.off('postupdate',qaMonitorCheck);s.game.events.off('postrender',qaCameraCheck);void 0"); }
  assert.deepEqual(monitor.violations, []);
  assert.ok(monitor.cameraSamples>0,'Camera monitor must observe actual renders');
  assert.ok(monitor.animations.some(a => a.startsWith('player-walk-')));
  assert.ok(monitor.animations.some(a => a.startsWith('player-idle-')));
  results.push({ route: route.name, id: route.id, speed, reverse, states, monitor });
}

async function diagnostics(enabled) {
  await evaluate(`s.setDiagnosticsEnabled(${enabled});void 0`);
  const state = await evaluate(`({bounds:s.renderLayers.collisionPreview.visible,door:s.renderLayers.doorwayPreview.visible,
    world:s.renderLayers.worldBounds.visible,debug:s.debugOverlay?.geometry.visible??false})`);
  assert.equal(state.bounds, true);
  const expected = enabled && !url.includes(':4173');
  assert.equal(state.door, expected); assert.equal(state.world, expected); assert.equal(state.debug, expected);
  return state;
}

async function runDpad() {
  await load();
  await verifyIntegration(BASELINE);
  const records = [];
  const state = () => evaluate('({x:s.playerSprite.body.center.x,y:s.player.getGroundY(),vx:s.playerSprite.body.velocity.x,vy:s.playerSprite.body.velocity.y})');
  for (const [viewport,width,height] of [['portrait',390,844],['landscape',844,390]]) {
    await send('Emulation.setDeviceMetricsOverride',{width,height,deviceScaleFactor:1,mobile:true});
    await send('Emulation.setTouchEmulationEnabled',{enabled:true});
    await clearPosition(228,443);
    await evaluate('s.player.speed=144;void 0');
    await pause(200);
    let touching = false;
    const touch = async direction => {
      await evaluate(`document.querySelector('.d-pad button[data-direction="${direction}"]').scrollIntoView({block:'center'});void 0`);
      await pause(100);
      const point = await evaluate(`(()=>{const e=document.querySelector('.d-pad button[data-direction="${direction}"]'),r=e.getBoundingClientRect();return {x:r.x+r.width/2,y:r.y+r.height/2,w:r.width,h:r.height,hit:document.elementFromPoint(r.x+r.width/2,r.y+r.height/2)===e}})()`);
      assert.ok(point.w>0&&point.h>0&&point.hit,`Actual visible D-pad button: ${JSON.stringify(point)}`);
      await send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x:point.x,y:point.y,id:1}]});
      touching = true;
    };
    const end = async () => { if(touching){await send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});touching=false;} };
    const before = await state();
    try { await touch('up'); await pause(650); }
    finally { await end(); }
    await pause(100);
    const contact = await state();
    assert.ok(before.y-contact.y>10,'Touch input must actually move player');
    assert.ok(Math.abs(contact.y-432)<0.1,'Office table south contact: feet top 431, sole 432');
    assert.ok(Math.abs(contact.x-before.x)<0.1);
    // Release on free floor as well: collision alone cannot prove release stops input.
    try { await touch('down'); await pause(120); }
    finally { await end(); }
    await pause(100); const released = await state();
    await pause(250); const settled = await state();
    assert.ok(released.y-contact.y>5,'D-pad retreat must move away from collider');
    assert.equal(settled.vx,0); assert.equal(settled.vy,0);
    assert.ok(Math.abs(settled.x-released.x)<0.01&&Math.abs(settled.y-released.y)<0.01,'Release stops on clear floor');
    await screenshot(`${viewport}-dpad-release`);
    records.push({viewport,input:'CDP touchStart/touchEnd on actual on-screen D-pad; no keyboard or movement reset',before,contact,released,settled});
  }
  assert.deepEqual(exceptions,[]);
  writeFileSync(`${output}/dpad-results.json`,JSON.stringify({url,harnessSha256,recordedAt:new Date().toISOString(),results:records,exceptions},null,2));
  console.log('PASS portrait/landscape actual D-pad movement, office table collision, free-floor release stops');
}

async function run() {
 const baseline=JSON.parse(readFileSync(baselinePath,'utf8'));await load();
 results.push({integration:await verifyIntegration(baseline)});assert.equal(await evaluate('s.depths.entries.length'),25);persist('geometry');
 for(const[viewport,width,height,mobile]of [['desktop',1280,900,false],['portrait',390,844,true],['landscape',844,390,true]]){
  await send('Emulation.setDeviceMetricsOverride',{width,height,deviceScaleFactor:1,mobile});await send('Emulation.setTouchEmulationEnabled',{enabled:mobile});await pause(200);
  for(const a of ACTORS){
   for(const speed of [144,72]){
    for(const reverse of [false,true]){await routeCheck({id:a.id,name:a.id+'-reachable-perimeter',points:a.points},speed,reverse);results.at(-1).viewport=viewport;}
   }
   for(const[label,x,y]of [[a.behindLabel??'behind',...a.points[0]],['front',...(a.front??a.points[3])],['side',a.side,plane(a)]]){
    await clearPosition(x,y);await pause(150);const state=await pose(a.id);await screenshot(viewport+'-'+a.id+'-'+label);results.push({viewport,screenshot:viewport+'-'+a.id+'-'+label+'.png',state});
   }
   console.log('PASS '+viewport+' '+a.id);
  }
  persist(viewport);
  results.push({viewport,debugOff:await diagnostics(false),debugOn:await diagnostics(true)});await screenshot(viewport+'-diagnostics');await diagnostics(false);
 }
 // Every instance gets immediate no-step and settled checks either side of its plane.
 for(const a of ACTORS)for(const delta of [-.25,0,.25]){
  await clearPosition(a.side,plane(a)+delta);const immediate=await pose(a.id);await pause(80);results.push({tie:a.id,delta,immediate,settled:await pose(a.id)});
 }
 const listeners=await evaluate("({post:s.events.listenerCount('postupdate'),step:s.physics.world.listenerCount('worldstep')})");
 for(let restart=0;restart<2;restart++){await readyAfterRestart();await verifyIntegration(baseline);assert.deepEqual(await evaluate("({post:s.events.listenerCount('postupdate'),step:s.physics.world.listenerCount('worldstep')})"),listeners);results.push({restart,listeners});}

 persist('routes');
}
function persist(stage){assert.deepEqual(exceptions,[]);writeFileSync(output+'/'+stage+'-results.json',JSON.stringify({url,harnessSha256,recordedAt:new Date().toISOString(),baseline:baselinePath,results,exceptions},null,2));console.log('PASS '+stage+' '+results.length+' records');}

async function runDeskProbe(){
 await load();
 for(const [viewport,width,height,mobile] of [['desktop',1280,900,false],['portrait',390,844,true],['landscape',844,390,true]]){
  await send('Emulation.setDeviceMetricsOverride',{width,height,deviceScaleFactor:1,mobile});
  await clearPosition(104,434);await pause(150);
  await evaluate('s.player.getDisplayObject().anims.pause();void 0');
  try{
   for(const bounds of [true,false]){
    await evaluate(`s.renderLayers.collisionPreview.setVisible(${bounds});void 0`);
    const name=viewport+'-workstation-front-'+(bounds?'cyan':'clean');await screenshot(name);
    const state=await evaluate(`(()=>{const list=s.sys.displayList.list,p=s.player.getDisplayObject(),o=s.depths.entries.find(e=>e.id==='office-workstation').view;return {sole:s.player.getGroundY(),plane:426,playerIndex:list.indexOf(p),deskIndex:list.indexOf(o),playerDepth:p.depth,deskDepth:o.depth,frame:p.frame.name,players:list.filter(v=>v.visible&&v.texture?.key?.startsWith('player')).map(v=>({key:v.texture.key,depth:v.depth,x:v.x,y:v.y})),desks:list.filter(v=>v.visible&&v.texture?.key==='office-workstation-right-facing').map(v=>({depth:v.depth,x:v.x,y:v.y}))}})()`);
    assert.equal(state.players.length,1);assert.equal(state.desks.length,1);assert.ok(state.playerIndex>state.deskIndex);assert.ok(state.playerDepth>state.deskDepth);
    results.push({viewport,bounds,screenshot:name+'.png',state});
   }
  }finally{await evaluate('s.renderLayers.collisionPreview.setVisible(true);s.player.getDisplayObject().anims.resume();void 0');}
 }
 persist('desk-render-probe');
}
async function runWasd(){
 await load();await clearPosition(192,405);await evaluate('s.player.speed=144;void 0');
 for(const [name,axis,sign] of [['w','y',-1],['a','x',-1],['s','y',1],['d','x',1]]){
  const read=()=>evaluate('({x:s.playerSprite.body.center.x,y:s.player.getGroundY(),vx:s.playerSprite.body.velocity.x,vy:s.playerSprite.body.velocity.y})');
  const before=await read(),fields={key:name,code:'Key'+name.toUpperCase(),windowsVirtualKeyCode:name.toUpperCase().charCodeAt(0)};
  await send('Input.dispatchKeyEvent',{type:'keyDown',...fields});
  try{await pause(120);}finally{await send('Input.dispatchKeyEvent',{type:'keyUp',...fields});}
  await pause(100);const after=await read();await pause(150);const stopped=await read();
  assert.ok((after[axis]-before[axis])*sign>5,'Actual '+name+' movement');
  assert.equal(stopped.vx,0);assert.equal(stopped.vy,0);assert.equal(after.x,stopped.x);assert.equal(after.y,stopped.y);
  results.push({key:name,before,after,stopped});
 }
 persist('wasd');
}
async function runCamera(){
 await load();
 for(const [viewport,width,height,mobile] of [['desktop',1280,900,false],['portrait',390,844,true],['landscape',844,390,true]]){
  await send('Emulation.setDeviceMetricsOverride',{width,height,deviceScaleFactor:1,mobile});
  for(const a of ACTORS){
   await clearPosition(...a.points[0]);
   const reading=await evaluate(`new Promise(resolve=>{const read=()=>{const c=s.cameras.main,b=s.playerSprite.body;return {scrollX:c.scrollX,scrollY:c.scrollY,worldView:{x:c.worldView.x,y:c.worldView.y,width:c.worldView.width,height:c.worldView.height},x:b.center.x,sole:b.bottom,contains:c.worldView.contains(b.center.x,b.bottom)}};const before=read();s.game.events.once('postrender',()=>resolve({before,after:read()}))})`);
   assert.equal(reading.after.contains,true,'Rendered camera contains '+a.id+' '+viewport);
   results.push({viewport,id:a.id,...reading});
  }
  await clearPosition(320,200);await pause(100);
  const before=await evaluate('({x:s.playerSprite.x,scroll:s.cameras.main.scrollX})');
  await evaluate(`window.qaFollow=[];window.qaFollowCheck=()=>{const v=s.player.getDisplayObject(),b=v.getBounds(),c=s.cameras.main,w=c.worldView;qaFollow.push({visible:v.visible,feet:w.contains(s.playerSprite.body.center.x,s.playerSprite.body.bottom),art:b.left>=w.left&&b.right<=w.right&&b.top>=w.top&&b.bottom<=w.bottom,x:s.playerSprite.x,scroll:c.scrollX})};s.game.events.on('postrender',qaFollowCheck);void 0`);
  try{await routeCheck({id:'gym-boombox',name:'unclamped-camera-follow-'+viewport,points:[[320,200],[440,200]]},144,false);}finally{await evaluate("s.game.events.off('postrender',qaFollowCheck);void 0");}
  const samples=await evaluate('qaFollow'),after=samples.at(-1);
  assert.ok(samples.length>0);assert.ok(samples.every(p=>p.visible&&p.feet&&p.art),'Rendered visible player and full art bounds');
  assert.ok(after.x-before.x>100);assert.ok(Math.abs((after.scroll-before.scroll)-(after.x-before.x))<1e-6,'Camera follows actual motion on unclamped X');
  results.push({viewport,following:{before,after,samples}});
 }
 persist('camera');
}
async function runContacts(){
 await load();results.push({integration:await verifyIntegration()});
 for(const a of ACTORS)for(const speed of [144,72]){
  const room=EXPECTED.rooms.find(r=>r.id===a.room),o=[...room.interactables,...room.decorations].find(o=>o.id===a.id);
  const r=[...o.footprints].sort((a,b)=>(b.y+b.height)-(a.y+a.height))[0];
  const x=(room.origin.x+r.x+r.width/2)*16,bottom=(room.origin.y+r.y+r.height)*16;
  await clearPosition(x,bottom+3);await evaluate(`s.player.speed=${speed};void 0`);
  await key('ArrowUp',true);let contact,held;
  try{await pause(300);contact=await pose(a.id);await pause(300);held=await pose(a.id);}finally{await release();}
  assert.ok(Math.abs(contact.sole-(bottom+1))<1e-6,'South contact '+a.id);
  assert.ok(Math.abs(held.sole-contact.sole)<1e-6,'Sustained blocked contact '+a.id);
  results.push({contact:a.id,speed,bottom,state:contact,held});
 }
 persist('contacts');
}
async function runNavigation(){
 await load();results.push({integration:await verifyIntegration()});
 await send('Emulation.setDeviceMetricsOverride',{width:1280,height:900,deviceScaleFactor:1,mobile:false});
 await send('Emulation.setTouchEmulationEnabled',{enabled:false});
 for(const route of [
 {id:'office-workstation',name:'approved-desk-strip',points:[[174,381],[112,381],[112,378],[120,378]]},
 {id:'office-workstation',name:'desk-chair-interior',points:[[154,408],[112,408],[112,411]]},
 {id:'office-workstation',name:'living-office-corridor',points:[[192,250],[192,390]]},
 {id:'gym-boombox',name:'gym-kitchen-corridor',points:[[538.5,245],[538.5,405]]},
 {id:'gym-boombox',name:'living-gym-corridor',points:[[320,200],[440,200]]}
 ])for(const speed of [144,72])for(const reverse of [false,true]){await routeCheck(route,speed,reverse);await screenshot(route.name+'-'+speed+'-'+reverse);}
 persist('navigation');
}
async function bundleState(missing){
 const incomplete=[cleanBackground,...plantIds].some(k=>missing.includes(k)),restored=incomplete&&!missing.includes(originalBackground),generic=incomplete&&!restored;
 const state=await evaluate('(()=>{const list=s.children.list;return {entries:s.depths.entries.map(e=>({id:e.id,texture:e.view.texture?.key})),backgrounds:list.filter(v=>v.visible&&'+JSON.stringify([cleanBackground,originalBackground])+'.includes(v.texture?.key)).map(v=>({key:v.texture.key,frame:v.frame.name,width:v.frame.cutWidth,height:v.frame.cutHeight})),plants:list.filter(v=>v.visible&&'+JSON.stringify(plantIds)+'.includes(v.texture?.key)).map(v=>v.texture.key),listeners:{post:s.events.listenerCount("postupdate"),step:s.physics.world.listenerCount("worldstep")}}})()');
 assert.equal(state.entries.length,restored?22:25);
 assert.equal(state.plants.length,incomplete?0:3);
 if(!generic)assert.deepEqual(state.backgrounds,[{key:restored?originalBackground:cleanBackground,frame:'__BASE',width:1634,height:962}]);
 else assert.deepEqual(state.backgrounds,[]);
 for(const a of ACTORS){
  const entry=state.entries.find(e=>e.id===a.id);
  if(a.isNew&&restored){assert.equal(entry,undefined);continue;}
  assert.ok(entry);
  assert.equal(entry.texture,(a.isNew&&generic)||missing.includes(a.asset)?'furniture-placeholder':a.asset);
  await clearPosition(a.side,plane(a));const p=await pose(a.id);
  assert.equal(p.playerTexture==='player-placeholder',missing.includes('player-down'));
 }
 assert.deepEqual(state.listeners,{post:2,step:missing.includes('player-down')?0:1});
 return {...state,restored,generic};
}
async function runFallbacks(){
 await load();
 for(let restart=0;restart<2;restart++){await readyAfterRestart();results.push({normalRestart:restart,integration:await verifyIntegration(),state:await bundleState([])});}
 const assets=[...new Set(ACTORS.map(a=>a.asset))];
 const cases=[...assets.map(k=>[k]),[cleanBackground],[originalBackground],assets.concat(cleanBackground),['player-down'],[cleanBackground,originalBackground],[...assets,cleanBackground,originalBackground,'player-down']];
 for(const missing of cases){
  await load();await evaluate('s.preload=()=>{};const missing='+JSON.stringify(missing)+';s.children.list.filter(v=>missing.includes(v.texture?.key)).forEach(v=>{v.anims?.stop();v.setActive(false);v.setVisible(false)});missing.forEach(k=>s.textures.remove(k));void 0');
  for(let restart=0;restart<2;restart++){await readyAfterRestart();results.push({missing,restart,integration:await verifyIntegration(),state:await bundleState(missing)});}
  await screenshot('missing-'+missing.join('_').slice(0,180));console.log('PASS missing '+missing.join(','));
 }
 persist('fallbacks');
}
try{
 await send('Runtime.enable');await send('Page.enable');
 const mode=process.argv[4]??'--routes-only';
 if(mode==='--routes-only')await run();
 else if(mode==='--interactions-only')await runInteractions();
 else if(mode==='--dpad-only')await runDpad();
 else if(mode==='--navigation-only')await runNavigation();
 else if(mode==='--contacts-only')await runContacts();
 else if(mode==='--camera-only')await runCamera();
 else if(mode==='--wasd-only')await runWasd();
 else if(mode==='--desk-probe-only')await runDeskProbe();
 else if(mode==='--fallbacks-only')await runFallbacks();
 else throw Error('Unknown stage '+mode);
}catch(error){writeFileSync(output+'/failure-'+(process.argv[4]??'routes')+'-'+Date.now()+'.json',JSON.stringify({harnessSha256,at:new Date().toISOString(),error:error.stack,results,exceptions},null,2));throw error;}
finally{await release().catch(()=>{});await send('Page.reload').catch(()=>{});for(const r of pending.values())clearTimeout(r.timer);ws.close();}
