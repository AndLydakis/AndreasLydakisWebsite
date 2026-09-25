// Isolated CDP browser only. Owns PORT-18F–J evidence; never edits runtime data on disk.
import assert from 'node:assert/strict';
import { mkdirSync, readFileSync, writeFileSync, existsSync } from 'node:fs';
const url = process.argv[2] ?? 'http://127.0.0.1:5173';
const port = process.argv[3] ?? '9333';
const output = `output/qa/office-tall-bounds/${url.includes(':4173') ? 'production' : 'development'}`;
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
  // Arcade's center-to-top conversion can differ from authored edges by one ULP.
  const edges = rs => rs.map(r => JSON.stringify([r.x, r.y, r.x + r.width, r.y + r.height].map(v=>Math.round(v*1e9)/1e9))).sort();
  assert.deepEqual(edges(rectangles), edges(await bodies()), 'Outlines must match every actual collider exactly once');
  delete state.buffer;
  state.rectangles = rectangles;
  return state;
}
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


const SOFA_H=4.6*(1226/1536)*.8,TABLE_H=3.4*(1198/1536)*.8;
const actors=[
 {id:'office-sofa',local:{x:12.875,y:7.1875-SOFA_H,width:1.875,height:SOFA_H},anchor:{x:13.75,y:7.1875},old:{x:262,y:429,width:30,height:6},points:[[277,381],[250,381],[250,443],[277,443]]},
 {id:'office-coffee-table',local:{x:10.0625,y:6.9375-TABLE_H,width:1.375,height:TABLE_H},anchor:{x:10.75,y:6.9375},old:{x:217,y:425,width:22,height:6},points:[[228,390],[205,390],[205,440],[228,440]]},
];
for(const a of actors)a.rect={x:(3.5+a.local.x)*16,y:(20+a.local.y)*16,width:a.local.width*16,height:a.local.height*16};
async function geometry(){
 const baseline=JSON.parse(readFileSync(baselinePath,'utf8'));
 let expected=expectedBodies(baseline);
 for(const a of actors){
  const key=multiset([a.old])[0];assert.equal(multiset(expected).filter(k=>k===key).length,1);
  expected=expected.filter(r=>multiset([r])[0]!==key);
  // Match StaticBody construction through its center; retain exact comparison for all other bodies.
  expected.push({...a.rect,x:(a.rect.x+a.rect.width/2)-a.rect.width/2,y:(a.rect.y+a.rect.height/2)-a.rect.height/2});
 }
 assert.equal(expected.length,79);assert.deepEqual(multiset(await bodies()),multiset(expected));
 const room=await evaluate("s.layout.rooms.find(r=>r.id==='office')");
 const old=baseline.layout.rooms.find(r=>r.id==='office');
 for(const a of actors){
  const object=room.decorations.find(o=>o.id===a.id);assert.deepEqual(object.footprints,[a.local]);assert.deepEqual(object.groundAnchor,a.anchor);
  const{groundAnchor,footprints,...unchanged}=object;assert.deepEqual(unchanged,old.decorations.find(o=>o.id===a.id));
  assert.ok(Math.abs(a.rect.y+a.rect.height-a.old.y-a.old.height)<1e-9);
 }
 return {bodyCount:79,baseline:baselinePath,approvedDeletion:removedDeskWorld,resizes:actors,bounds:await checkVisibleBounds()};
}
async function block(a,side,speed){
 const r=a.rect,cx=r.x+r.width/2,cy=r.y+r.height/2;
 const cases={north:[cx,r.y-7,'ArrowDown'],south:[cx,r.y+r.height+9,'ArrowUp'],west:[r.x-12,cy,'ArrowRight'],east:[r.x+r.width+12,cy,'ArrowLeft']};
 const[x,y,direction]=cases[side];await clearPosition(x,y);
 await evaluate(`s.player.speed=${speed};window.qaBlock={samples:0,violations:[]};window.qaBlockCheck=()=>{const b=s.playerSprite.body;qaBlock.samples++;if(s.collisionSystem.staticBodyList.some(r=>Math.min(b.right,r.right)-Math.max(b.left,r.left)>1e-6&&Math.min(b.bottom,r.bottom)-Math.max(b.top,r.top)>1e-6))qaBlock.violations.push('penetration')};s.events.on('postupdate',qaBlockCheck);void 0`);
 let state;
 try{
  await key(direction,true);await pause(850);
  state=await evaluate('({left:s.playerSprite.body.left,right:s.playerSprite.body.right,top:s.playerSprite.body.top,bottom:s.playerSprite.body.bottom,monitor:qaBlock})');
 }finally{await release();await evaluate("s.events.off('postupdate',qaBlockCheck);void 0");}
 assert.ok(state.monitor.samples>10);assert.deepEqual(state.monitor.violations,[]);
 const edge={north:state.bottom,south:state.top,west:state.right,east:state.left}[side];
 const target={north:r.y,south:r.y+r.height,west:r.x,east:r.x+r.width}[side];
 assert.ok(Math.abs(edge-target)<1e-6,JSON.stringify({id:a.id,side,state,target}));
 results.push({blocking:a.id,side,speed,start:{x,y},state,pose:await pose(a.id)});
}
try{
 await send('Runtime.enable');await send('Page.enable');await load();
 results.push({geometry:await geometry()});
 await send('Emulation.setDeviceMetricsOverride',{width:1280,height:900,deviceScaleFactor:1,mobile:false});
 await send('Emulation.setTouchEmulationEnabled',{enabled:false});
 for(const a of actors){
  for(const speed of [144,72])for(const side of ['north','south','west','east'])await block(a,side,speed);
  for(const speed of [144,72])await routeCheck({id:a.id,name:a.id+'-tall-box-bypass',points:a.points},speed,speed===72);
  for(const[label,x,y]of [['behind',...a.points[0]],['front',...a.points.at(-1)],['midbody-side',a.id==='office-sofa'?250:205,a.rect.y+a.rect.height/2]]){
   await clearPosition(x,y);await pause(100);const state=await pose(a.id);
   await screenshot(a.id+'-'+label+'-cyan');results.push({capture:a.id,label,state,cyan:true});
  }
 }
 assert.deepEqual(exceptions,[]);
 writeFileSync(output+'/results.json',JSON.stringify({url,recordedAt:new Date().toISOString(),results,exceptions,
 scope:'Only two resized office colliders; sustained cardinal pushes at 144/72, actual bypass routes, front/back depth and visible cyan bounds. No broad story matrix.'},null,2));
 console.log('PASS '+results.length+' focused tall-box records; exact79 geometry, 16 sustained cardinal pushes, 4 routes, 6 captures; zero exceptions');
}catch(error){writeFileSync(output+'/failure.json',JSON.stringify({error:error.stack,results,exceptions},null,2));throw error;}
finally{await release().catch(()=>{});await send('Page.reload').catch(()=>{});for(const r of pending.values())clearTimeout(r.timer);ws.close();}
