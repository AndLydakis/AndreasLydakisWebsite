// Isolated CDP browser only. Owns PORT-18F evidence; never edits runtime data on disk.
import assert from 'node:assert/strict';
import { mkdirSync, readFileSync, writeFileSync, existsSync } from 'node:fs';
const url = process.argv[2] ?? 'http://127.0.0.1:5173';
const port = process.argv[3] ?? '9333';
const interactionsOnly = process.argv.includes('--interactions-only');
const dpadOnly = process.argv.includes('--dpad-only');
const output = `output/qa/port18f/${url.includes(':4173') ? 'production' : 'development'}`;
const baselinePath = 'output/qa/port18f/preintegration-geometry.json';
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
 {id:'gym-steel-plates',asset:'gym-steel-plates-front',anchor:{x:12.625,y:8.625},index:7,side:580,points:[[602,185],[580,185],[580,211],[602,211],[624,211],[624,185],[602,185]]},
 {id:'gym-bumper-plates',asset:'gym-bumper-plates-front',anchor:{x:14.125,y:10.5},index:8,side:574,points:[[626,217],[574,217],[574,240],[626,240]]},
 {id:'gym-bumper-plates-extra',asset:'gym-bumper-plates-front',anchor:{x:12.125,y:10.5},index:9,side:574,points:[[594,217],[574,217],[574,240],[594,240]]},
 {id:'gym-boxing-bag',asset:'gym-boxing-bag-front-three-quarter',anchor:{x:3,y:11.6875},index:6,side:476,points:[[450,235],[476,235],[476,254],[450,254],[424,254],[424,235],[450,235]]},
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
  for (const [viewport, width, height, mobile] of [['desktop', 1280, 900, false], ['portrait', 390, 844, true]]) {
    await send('Emulation.setDeviceMetricsOverride', { width, height, deviceScaleFactor: 1, mobile });
    await send('Emulation.setTouchEmulationEnabled', { enabled: mobile });
    await pause(200);
    // Existing reachable interaction positions in world pixels; metadata migration must not move them.
    for (const [id, x, y, title] of [
      ['gym-squat-rack', 596, 170, 'Personal records'],
      ['gym-boombox', 528, 140, 'Music collection'],
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
  console.log(`PASS ${interactionResults.length} squat/music keyboard and touch interaction records`);
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
  assert.deepEqual(multiset(await bodies()),multiset(baseline.bodies));assert.equal(baseline.bodies.length,80);
  const current=await evaluate('s.layout');
  for(const room of current.rooms){
    const before=baseline.layout.rooms.find(r=>r.id===room.id);
    if(room.id!=='gym'){assert.deepEqual(room,before);continue;}
    const expected=structuredClone(before);
    for(const a of ACTORS){
      const o=expected.decorations.find(o=>o.id===a.id);o.groundAnchor=a.anchor;o.footprints=[before.collisionRects[a.index]];
    }
    expected.collisionRects=before.collisionRects.filter((_,i)=>!ACTORS.some(a=>a.index===i));
    assert.deepEqual(room,expected,'Only four anchors and exact existing base transfers');
  }
  assert.deepEqual({...current,rooms:[]},{...baseline.layout,rooms:[]});
  assert.equal(await evaluate("s.depths.entries.some(e=>e.id==='gym-boombox')"),false,'Boombox remains legacy');
  return {bodies:80,bounds:await checkVisibleBounds()};
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

async function runDpad() {
  await load();
  await verifyIntegration(JSON.parse(readFileSync(baselinePath, 'utf8')));
  const records = [];
  const state = () => evaluate('({x:s.playerSprite.body.center.x,y:s.player.getGroundY(),vx:s.playerSprite.body.velocity.x,vy:s.playerSprite.body.velocity.y})');
  for (const [viewport,width,height] of [['portrait',390,844],['landscape',844,390]]) {
    await send('Emulation.setDeviceMetricsOverride',{width,height,deviceScaleFactor:1,mobile:true});
    await send('Emulation.setTouchEmulationEnabled',{enabled:true});
    await clearPosition(602,219);
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
    assert.ok(Math.abs(contact.y-203)<0.1,'Steel south contact: feet top 202, sole 203');
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
  console.log('PASS portrait/landscape actual D-pad movement, steel collision, free-floor release stops');
}

async function run() {
 const baseline=JSON.parse(readFileSync(baselinePath,'utf8'));await load();
 results.push({integration:await verifyIntegration(baseline)});
 for(const[viewport,width,height,mobile]of [['desktop',1280,900,false],['portrait',390,844,true],['landscape',844,390,true]]){
  await send('Emulation.setDeviceMetricsOverride',{width,height,deviceScaleFactor:1,mobile});await send('Emulation.setTouchEmulationEnabled',{enabled:mobile});await pause(200);
  for(const a of ACTORS){
   for(const speed of [144,72]){
    await routeCheck({id:a.id,name:a.id+'-reachable-perimeter',points:a.points},speed,speed===72);results.at(-1).viewport=viewport;
   }
   for(const[label,x,y]of [['behind',...a.points[0]],['front',...a.points[3]],['side',a.side,64+a.anchor.y*16]]){
    await clearPosition(x,y);await pause(150);const state=await pose(a.id);await screenshot(viewport+'-'+a.id+'-'+label);results.push({viewport,screenshot:viewport+'-'+a.id+'-'+label+'.png',state});
   }
  }
  results.push({viewport,debugOff:await diagnostics(false),debugOn:await diagnostics(true)});await screenshot(viewport+'-diagnostics');await diagnostics(false);
 }
 // All instances independently, including shared-texture bumper ties by stable ID.
 for(const a of ACTORS)for(const delta of [-.25,0,.25]){
  await clearPosition(a.side,64+a.anchor.y*16+delta);const immediate=await pose(a.id);await pause(80);results.push({tie:a.id,delta,immediate,settled:await pose(a.id)});
 }
 assert.equal(await evaluate("s.depths.entries.find(e=>e.id==='gym-bumper-plates').view.depth<s.depths.entries.find(e=>e.id==='gym-bumper-plates-extra').view.depth"),true);
 const listeners=await evaluate("({post:s.events.listenerCount('postupdate'),step:s.physics.world.listenerCount('worldstep')})");
 for(let restart=0;restart<2;restart++){await readyAfterRestart();await verifyIntegration(baseline);assert.deepEqual(await evaluate("({post:s.events.listenerCount('postupdate'),step:s.physics.world.listenerCount('worldstep')})"),listeners);results.push({restart,listeners});}
 const assets=[...new Set(ACTORS.map(a=>a.asset))];
 for(const missing of [...assets.map(a=>[a]),assets,['player-down'],[...assets,'player-down']]){
  await load();await evaluate(`s.preload=()=>{};const missing=${JSON.stringify(missing)};s.children.list.filter(v=>missing.includes(v.texture?.key)).forEach(v=>{v.anims?.stop();v.setActive(false);v.setVisible(false)});missing.forEach(k=>s.textures.remove(k));void 0`);
  for(let restart=0;restart<2;restart++){
   await readyAfterRestart();await verifyIntegration(baseline);
   const states=[];
   for(const a of ACTORS){await clearPosition(a.side,64+a.anchor.y*16);const p=await pose(a.id);assert.equal(p.texture,missing.includes(a.asset)?'furniture-placeholder':a.asset);assert.equal(p.playerTexture==='player-placeholder',missing.includes('player-down'));states.push(p);}
   const current=await evaluate("({post:s.events.listenerCount('postupdate'),step:s.physics.world.listenerCount('worldstep')})");
   assert.deepEqual(current,{post:listeners.post,step:missing.includes('player-down')?listeners.step-1:listeners.step});results.push({missing,restart,states,listeners:current});
  }
  await screenshot('missing-'+missing.join('_'));
 }
 assert.deepEqual(exceptions,[]);
 writeFileSync(output+'/results.json',JSON.stringify({url,recordedAt:new Date().toISOString(),baseline:baselinePath,results,exceptions,
 limitations:['Bumper gap 12px and east wall gap 4px cannot fit 16px feet; shared left bypass only.','Bag base to south wall leaves 5px sole strip; composite artwork has one plane, visual review required.','Mobile route sequences use keyboard; actual D-pad smoke has separate JSON.']},null,2));
 console.log('PASS '+results.length+' four-decoration core records');
}
try{
 await send('Runtime.enable');await send('Page.enable');
 if(dpadOnly)await runDpad();else if(interactionsOnly)await runInteractions();else{await run();await runInteractions();await runDpad();}
}catch(error){writeFileSync(output+'/failure.json',JSON.stringify({at:new Date().toISOString(),error:error.stack,results,exceptions},null,2));throw error;}
finally{await release().catch(()=>{});await send('Page.reload').catch(()=>{});for(const r of pending.values())clearTimeout(r.timer);ws.close();}
