// Isolated CDP browser only. Owns PORT-18E evidence; never edits runtime data on disk.
import assert from 'node:assert/strict';
import { mkdirSync, readFileSync, writeFileSync, existsSync } from 'node:fs';
const url = process.argv[2] ?? 'http://127.0.0.1:5173';
const port = process.argv[3] ?? '9333';
const capture = process.argv.includes('--capture-baseline');
const interactionsOnly = process.argv.includes('--interactions-only');
const mobileRoutesOnly = process.argv.includes('--mobile-routes-only');
const overlapOnly = process.argv.includes('--overlap-only');
const dpadOnly = process.argv.includes('--dpad-only');
assert.ok(!(capture && interactionsOnly), 'Choose baseline capture or interactions-only, not both.');
const output = `output/qa/port18e/${url.includes(':4173') ? 'production' : 'development'}`;
const baselinePath = 'output/qa/port18e/preintegration-geometry.json';
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
function expectedBodies(baseline) { assert.equal(baseline.bodies.length,80); return baseline.bodies; }
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
const ACTORS = [
  {id:'gym-squat-rack', asset:'gym-squat-rack-front-right', anchor:{x:12.25,y:6.4375}, count:9},
  {id:'gym-dumbbell-rack', asset:'gym-dumbbell-rack-front', anchor:{x:2.5,y:3.96875}, count:1},
  {id:'gym-bench', asset:'gym-bench-front', anchor:{x:9.5,y:8.3125}, count:1},
];
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
      ['gym-squat-rack', 596, 170, 'Personal records'],
      ['gym-boombox', 528, 140, 'Music collection'],
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
  console.log(`PASS ${interactionResults.length} gym and TV/vinyl keyboard and touch interaction records`);
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

async function verifyIntegration(baseline) {
  assert.deepEqual(multiset(await bodies()), multiset(expectedBodies(baseline)));
  const current = await evaluate('s.layout');
  const before = baseline.layout.rooms.find(r => r.id === 'gym');
  const migrated = [...before.collisionRects.slice(6, 15), before.collisionRects[15], before.collisionRects[16]];
  const expectedPieces = [before.collisionRects.slice(6, 15), [before.collisionRects[15]], [before.collisionRects[16]]];
  for (const room of current.rooms) {
    const old = baseline.layout.rooms.find(r => r.id === room.id);
    const strip = o => { const copy = { ...o }; if (ACTORS.some(a => a.id === o.id)) { delete copy.groundAnchor; delete copy.footprints; } return copy; };
    assert.deepEqual({ ...room, collisionRects: undefined, interactables: room.interactables.map(strip), decorations: room.decorations?.map(strip) },
      { ...old, collisionRects: undefined, interactables: old.interactables.map(strip), decorations: old.decorations?.map(strip) });
    assert.deepEqual(multiset(room.collisionRects), multiset(room.id === 'gym' ? old.collisionRects.filter((_, i) => i < 6 || i > 16) : old.collisionRects));
  }
  assert.deepEqual(current.corridors, baseline.layout.corridors);
  assert.deepEqual(current.doorways, baseline.layout.doorways);
  const gym = current.rooms.find(r => r.id === 'gym');
  const inventory = ACTORS.map((a, i) => {
    const object = [...gym.interactables, ...gym.decorations].find(o => o.id === a.id);
    assert.deepEqual(object.groundAnchor, a.anchor);
    assert.equal(object.footprints.length, a.count);
    assert.deepEqual(multiset(object.footprints), multiset(expectedPieces[i]));
    return { ...a, object, worldY: (gym.origin.y + a.anchor.y) * 16 };
  });
  assert.equal(migrated.length, 11);
  return { inventory, bodies: 80, bounds: await checkVisibleBounds() };
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
const routes = [
  { id: 'gym-squat-rack', name: 'left-bypass', points: [[596,135],[552,135],[552,175],[604,175],[630,175],[630,165]] },
  { id: 'gym-squat-rack', name: 'interior-single-plane', points: [[552,160],[590,160],[590,175],[552,175]] },
  { id: 'gym-bench', name: 'around', points: [[552,184],[522,184],[522,205],[552,205],[582,205],[582,184],[552,184]] },
  { id: 'gym-dumbbell-rack', name: 'front-and-right-side-not-rear', points: [[440,136],[466,136],[466,121],[466,136],[424,136],[440,136]] },
];
async function routeCheck(route, speed, reverse) {
  const points = reverse ? [...route.points].reverse() : route.points;
  await clearPosition(...points[0]);
  await evaluate(`s.player.speed=${speed};window.qaMonitor={samples:0,violations:[],animations:[]};window.qaMonitorCheck=()=>{
    const b=s.playerSprite.body,v=s.player.getDisplayObject(),q=qaMonitor,e=s.depths.entries.find(e=>e.id===${JSON.stringify(route.id)});q.samples++;
    if((v.depth>e.view.depth)!==(b.bottom>=e.groundY()))q.violations.push('order');
    if(s.collisionSystem.staticBodyList.some(r=>Math.min(b.right,r.right)-Math.max(b.left,r.left)>1e-6&&Math.min(b.bottom,r.bottom)-Math.max(b.top,r.top)>1e-6))q.violations.push('penetration');
    const a=v.anims?.currentAnim?.key;if(a&&!q.animations.includes(a))q.animations.push(a);
  };s.events.on('postupdate',qaMonitorCheck);void 0`);
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
  } finally { await evaluate("s.events.off('postupdate',qaMonitorCheck);void 0"); }
  assert.deepEqual(monitor.violations, []);
  assert.ok(monitor.animations.some(a => a.startsWith('player-walk-')));
  assert.ok(monitor.animations.some(a => a.startsWith('player-idle-')));
  results.push({ route: route.name, id: route.id, speed, reverse, states, monitor });
}

async function contact(id, label, x, y, directions, speed) {
  await clearPosition(x, y);
  await evaluate(`s.player.speed=${speed};window.qaContact=new Promise(resolve=>{let samples=0;
    const r=s.layout.rooms.find(r=>r.id==='gym'),o=[...r.interactables,...r.decorations].find(o=>o.id===${JSON.stringify(id)});
    const pieces=o.footprints.map(p=>({x:(r.origin.x+p.x)*16,y:(r.origin.y+p.y)*16,width:p.width*16,height:p.height*16}));
    const finish=result=>{clearTimeout(timer);s.events.off('postupdate',check);s.inputController.resetMovement();resolve(result)};
    const check=()=>{const b=s.playerSprite.body;samples++;let contact=-1;
      for(let i=0;i<pieces.length;i++){const p=pieces[i],dx=Math.min(b.right,p.x+p.width)-Math.max(b.left,p.x),dy=Math.min(b.bottom,p.y+p.height)-Math.max(b.top,p.y);
        if(dx>1e-6&&dy>1e-6)return finish({error:'penetration',samples,piece:i});
        if((dx>0&&(Math.abs(b.bottom-p.y)<.05||Math.abs(b.top-p.y-p.height)<.05))||
          (dy>0&&(Math.abs(b.right-p.x)<.05||Math.abs(b.left-p.x-p.width)<.05)))contact=i;
      }if(contact>=0)finish({contact,samples,left:b.left,right:b.right,top:b.top,bottom:b.bottom});};
    const timer=setTimeout(()=>finish({error:'no target contact',samples}),3000);s.events.on('postupdate',check);
  });void 0`);
  try {
    for (const d of directions) await key(d, true);
    const state = await evaluate('qaContact');
    assert.equal(state.error, undefined, `${id}/${label}: ${JSON.stringify(state)}`);
    results.push({ collision: label, id, speed, directions, state, pose: await pose(id) });
  } finally { await release(); }
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

async function captureViews() {
  const views = [
    ['gym-squat-rack',[['behind',596,135],['front',604,175],['left',552,151],['right-lower-foot',630,165],['interior-single-plane',590,160]]],
    ['gym-bench',[['behind',552,184],['front',552,205],['left',522,194],['right',582,194],['steel-proximity',584,198]]],
    ['gym-dumbbell-rack',[['front',440,136],['left-front-only',424,136],['right-side-below-plane',466,121]]],
  ];
  for(const[viewport,width,height,mobile]of [['desktop',1280,900,false],['portrait',390,844,true],['landscape',844,390,true]]){
    await send('Emulation.setDeviceMetricsOverride',{width,height,deviceScaleFactor:1,mobile});await send('Emulation.setTouchEmulationEnabled',{enabled:mobile});
    for(const[id,points]of views)for(const[label,x,y]of points){await clearPosition(x,y);await pause(150);await screenshot(`${viewport}-${id}-${label}`);results.push({screenshot:`${viewport}-${id}-${label}`,pose:await pose(id)});}
    for(const enabled of [false,true]){await clearPosition(590,175);const state=await diagnostics(enabled);await screenshot(`${viewport}-diagnostics-${enabled}`);results.push({viewport,diagnostics:enabled,state});}
    await diagnostics(false);
  }
}

async function run() {
  const baseline = JSON.parse(readFileSync(baselinePath, 'utf8'));
  await load(); results.push({ integration: await verifyIntegration(baseline) });
  await captureViews();
  await send('Emulation.setDeviceMetricsOverride', { width:1280,height:900,deviceScaleFactor:1,mobile:false });
  await send('Emulation.setTouchEmulationEnabled', { enabled:false });
  await evaluate(`window.qaChunks=[];window.qaRecorder=new MediaRecorder(document.querySelector('canvas').captureStream(30),{mimeType:'video/webm'});qaRecorder.ondataavailable=e=>qaChunks.push(e.data);qaRecorder.start();void 0`);
  for (const speed of [144,72]) for (const r of routes) for (const reverse of [false,true]) await routeCheck(r,speed,reverse);
  const video=await evaluate(`new Promise(resolve=>{qaRecorder.onstop=()=>{const r=new FileReader();r.onload=()=>resolve(r.result.split(',')[1]);r.readAsDataURL(new Blob(qaChunks,{type:'video/webm'}))};qaRecorder.stop()})`);
  writeFileSync(`${output}/gym-routes.webm`,Buffer.from(video,'base64'));
  const cardinal = [
    ['gym-squat-rack', [['north',596,135,['ArrowDown']],['south',608,175,['ArrowUp']],['west',550,151,['ArrowRight']],['east-lower-foot',632,165,['ArrowLeft']],['north-west',550,135,['ArrowDown','ArrowRight']],['north-east',632,135,['ArrowDown','ArrowLeft']],['south-west',550,175,['ArrowUp','ArrowRight']],['south-east',632,175,['ArrowUp','ArrowLeft']]]],
    ['gym-bench', [['north',552,183,['ArrowDown']],['south',552,205,['ArrowUp']],['west',520,194,['ArrowRight']],['east',584,194,['ArrowLeft']],['north-west',520,183,['ArrowDown','ArrowRight']],['north-east',584,183,['ArrowDown','ArrowLeft']],['south-west',520,205,['ArrowUp','ArrowRight']],['south-east',584,205,['ArrowUp','ArrowLeft']]]],
    ['gym-dumbbell-rack', [['south',440,136,['ArrowUp']],['east',466,124,['ArrowLeft']],['north-east-side',466,121,['ArrowDown','ArrowLeft']],['south-east',466,136,['ArrowUp','ArrowLeft']],['south-west-front',424,136,['ArrowUp','ArrowRight']]]],
  ];
  for(const speed of [144,72])for(const[id,cases]of cardinal)for(const[label,x,y,keys]of cases)await contact(id,label,x,y,keys,speed);
  // Equal-depth and adjacent-y checks use clear SIDE floor, never a fictitious rear approach.
  for(const a of ACTORS){const x=a.id==='gym-squat-rack'?552:a.id==='gym-bench'?522:466,plane=64+a.anchor.y*16;
    for(const delta of [-.25,0,.25]){await clearPosition(x,plane+delta);const immediate=await pose(a.id);await pause(100);results.push({tie:a.id,delta,immediate,settled:await pose(a.id)});}}
  const listeners=await evaluate("({post:s.events.listenerCount('postupdate'),step:s.physics.world.listenerCount('worldstep')})");
  for(let restart=0;restart<2;restart++){await readyAfterRestart();await verifyIntegration(baseline);assert.deepEqual(await evaluate("({post:s.events.listenerCount('postupdate'),step:s.physics.world.listenerCount('worldstep')})"),listeners);results.push({normalRestart:restart,listeners});}
  for(const missing of [[ACTORS[0].asset],[ACTORS[1].asset],[ACTORS[2].asset],ACTORS.map(a=>a.asset),['player-down'],[...ACTORS.map(a=>a.asset),'player-down']]){
    await load();await evaluate(`s.preload=()=>{};const missing=${JSON.stringify(missing)};s.children.list.filter(v=>missing.includes(v.texture?.key)).forEach(v=>{v.anims?.stop();v.setActive(false);v.setVisible(false)});missing.forEach(k=>s.textures.remove(k));void 0`);
    for(let restart=0;restart<2;restart++){
      await readyAfterRestart();await verifyIntegration(baseline);
      const states=[];for(const a of ACTORS){const x=a.id==='gym-squat-rack'?552:a.id==='gym-bench'?522:466,plane=64+a.anchor.y*16;for(const delta of [-.25,0,.25]){await clearPosition(x,plane+delta);const p=await pose(a.id);assert.equal(p.texture,missing.includes(a.asset)?'furniture-placeholder':a.asset);assert.equal(p.playerTexture==='player-placeholder',missing.includes('player-down'));states.push(p);}}
      const current=await evaluate("({post:s.events.listenerCount('postupdate'),step:s.physics.world.listenerCount('worldstep')})");
      assert.deepEqual(current,{post:listeners.post,step:missing.includes('player-down')?listeners.step-1:listeners.step});
      results.push({missing,restart,states,listeners:current});
    }
    await clearPosition(590,175);await screenshot(`missing-${missing.join('_')}`);
    await contact('gym-squat-rack','missing-south',608,175,['ArrowUp'],144);
    await contact('gym-bench','missing-south',552,205,['ArrowUp'],144);
    await contact('gym-dumbbell-rack','missing-south',440,136,['ArrowUp'],144);
  }
  assert.deepEqual(exceptions,[]);
  writeFileSync(`${output}/results.json`,JSON.stringify({url,recordedAt:new Date().toISOString(),baseline:baselinePath,results,listeners,exceptions,
    limitations:['Dumbbell rear abuts north wall; left gap is 10px for 16px feet, so neither rear nor full left approach is claimed.','Squat rack is one composite sorted at one plane: interior overlap needs explicit owner acceptance, not per-part occlusion.','Bench/steel overlap screenshots require visual review because steel is still unconverted.']},null,2));
  console.log(`PASS ${results.length} gym metadata QA records (visual limitations require review)`);
}
async function runMobileRoutes() {
  await load();await verifyIntegration(JSON.parse(readFileSync(baselinePath,'utf8')));
  const start=results.length;
  for(const[viewport,width,height]of [['portrait',390,844],['landscape',844,390]]){
    await send('Emulation.setDeviceMetricsOverride',{width,height,deviceScaleFactor:1,mobile:true});
    await send('Emulation.setTouchEmulationEnabled',{enabled:true});
    await evaluate(`window.qaChunks=[];window.qaRecorder=new MediaRecorder(document.querySelector('canvas').captureStream(30),{mimeType:'video/webm'});qaRecorder.ondataavailable=e=>qaChunks.push(e.data);qaRecorder.start();void 0`);
    for(const speed of [144,72])for(const r of routes)for(const reverse of [false,true]){await routeCheck(r,speed,reverse);results.at(-1).viewport=viewport;}
    const video=await evaluate(`new Promise(resolve=>{qaRecorder.onstop=()=>{const r=new FileReader();r.onload=()=>resolve(r.result.split(',')[1]);r.readAsDataURL(new Blob(qaChunks,{type:'video/webm'}))};qaRecorder.stop()})`);
    writeFileSync(`${output}/gym-routes-${viewport}.webm`,Buffer.from(video,'base64'));
  }
  assert.deepEqual(exceptions,[]);
  writeFileSync(`${output}/mobile-routes-results.json`,JSON.stringify({url,recordedAt:new Date().toISOString(),results:results.slice(start),exceptions,
    input:'Real keyboard movement under touch-enabled viewport emulation; touch activation covered separately.'},null,2));
  console.log(`PASS ${results.length-start} portrait/landscape route sequences`);
}
async function runOverlap() {
  await load();const start=results.length;
  for(const[viewport,width,height,mobile]of [['desktop',1280,900,false],['portrait',390,844,true],['landscape',844,390,true]]){
    await send('Emulation.setDeviceMetricsOverride',{width,height,deviceScaleFactor:1,mobile});await send('Emulation.setTouchEmulationEnabled',{enabled:mobile});
    for(const speed of [144,72])for(const reverse of [false,true]){await routeCheck({id:'gym-bench',name:'bench-steel-clear-front-pass',points:[[552,205],[580,205],[608,205]]},speed,reverse);results.at(-1).viewport=viewport;}
    await clearPosition(580,205);await pause(150);
    const state=await evaluate(`(()=>{const p=s.player.getDisplayObject(),b=s.depths.entries.find(e=>e.id==='gym-bench').view,
      t=s.children.list.find(v=>v.texture?.key==='gym-steel-plates-front');
      // Freeze this idle frame only for screenshot/measurement consistency; resume immediately afterward.
      p.anims.pause();const S=4,W=440,H=320;
      const alpha=v=>{const c=document.createElement('canvas');c.width=W;c.height=H;const ctx=c.getContext('2d');ctx.imageSmoothingEnabled=false;
        const f=v.frame;ctx.drawImage(f.source.image,f.cutX,f.cutY,f.cutWidth,f.cutHeight,
          (v.x-v.displayOriginX*v.scaleX-520)*S,(v.y-v.displayOriginY*v.scaleY-160)*S,v.displayWidth*S,v.displayHeight*S);
        return ctx.getImageData(0,0,W,H).data;};
      const pa=alpha(p),ba=alpha(b),ta=alpha(t);let bench=0,steel=0,objectOverlap=0;
      for(let i=3;i<pa.length;i+=4){if(pa[i]>=128&&ba[i]>=128)bench++;if(pa[i]>=128&&ta[i]>=128)steel++;if(ba[i]>=128&&ta[i]>=128)objectOverlap++;}
      return {x:p.x,sole:s.player.getGroundY(),frame:p.frame.name,playerDepth:p.depth,benchDepth:b.depth,steelDepth:t.depth,
        alphaThreshold:128,samplesPerWorldPixel:S*S,playerBenchOpaquePixels:bench,playerSteelOpaquePixels:steel,benchSteelOpaquePixels:objectOverlap};})()`);
    try{
      assert.ok(state.playerBenchOpaquePixels>0&&state.playerSteelOpaquePixels>0,'Must have actual opaque player overlap with BOTH assets');
      assert.ok(state.playerDepth>state.benchDepth&&state.playerDepth>state.steelDepth);
      await screenshot(`${viewport}-bench-steel-opaque-overlap`);
    }finally{await evaluate('s.player.getDisplayObject().anims.resume();void 0');}
    results.push({overlap:viewport,state,screenshot:`${viewport}-bench-steel-opaque-overlap.png`});
  }
  assert.deepEqual(exceptions,[]);writeFileSync(`${output}/overlap-results.json`,JSON.stringify({url,recordedAt:new Date().toISOString(),results:results.slice(start),exceptions},null,2));
  console.log('PASS 12 reachable front-pass routes and 3 measured opaque overlap poses');
}
async function runDpad() {
  await load();
  await verifyIntegration(JSON.parse(readFileSync(baselinePath, 'utf8')));
  const records = [];
  const state = () => evaluate('({x:s.playerSprite.body.center.x,y:s.player.getGroundY(),vx:s.playerSprite.body.velocity.x,vy:s.playerSprite.body.velocity.y})');
  for (const [viewport,width,height] of [['portrait',390,844],['landscape',844,390]]) {
    await send('Emulation.setDeviceMetricsOverride',{width,height,deviceScaleFactor:1,mobile:true});
    await send('Emulation.setTouchEmulationEnabled',{enabled:true});
    await clearPosition(552,218);
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
    assert.ok(Math.abs(contact.y-198)<0.1,'Bench south contact: feet top 197, sole 198');
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
  writeFileSync(`${output}/dpad-results.json`,JSON.stringify({url,recordedAt:new Date().toISOString(),results:records,exceptions},null,2));
  console.log('PASS portrait/landscape actual D-pad movement, bench collision, free-floor release stops');
}
try {
  await send('Runtime.enable');await send('Page.enable');
  if(dpadOnly)await runDpad();else if(interactionsOnly)await runInteractions();else if(mobileRoutesOnly)await runMobileRoutes();else if(overlapOnly)await runOverlap();else{await run();await runInteractions();await runMobileRoutes();await runOverlap();await runDpad();}
}catch(error){writeFileSync(`${output}/${interactionsOnly?'interactions-failure':mobileRoutesOnly?'mobile-routes-failure':overlapOnly?'overlap-failure':'failure'}.json`,JSON.stringify({at:new Date().toISOString(),message:error.stack,results,interactionResults,exceptions},null,2));throw error;}
finally{await release().catch(()=>{});await send('Page.reload').catch(()=>{});for(const r of pending.values())clearTimeout(r.timer);ws.close();}
