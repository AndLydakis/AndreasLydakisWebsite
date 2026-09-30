// Isolated CDP browser only. Owns PORT-18F–J evidence; never edits runtime data on disk.
import assert from 'node:assert/strict';
import { mkdirSync, readFileSync, writeFileSync, existsSync } from 'node:fs';
const url = process.argv[2] ?? 'http://127.0.0.1:5173';
const port = process.argv[3] ?? '9333';
const backgroundsOnly = process.argv.includes('--backgrounds-only');
const output = `output/qa/office-plant-perspective/${url.includes(':4173') ? 'production' : 'development'}`;
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



const background='office-background-plants-removed',original='office-background';
const plants=[
 {id:'office-plant-top-right',position:{x:15.279510,y:2.569582},height:2.066169,anchor:{x:15.8125,y:4},footprint:{x:15.375,y:3.0625,width:.875,height:.9375},points:[[293,381],[293,386],[309,386]],behind:'behind-plane-side-no-rear'},
 {id:'office-plant-bottom-left',position:{x:.500647,y:7.401282},height:2.182908,anchor:{x:1.0625,y:8.75},footprint:{x:.625,y:7.9375,width:.875,height:.8125},points:[[73,439],[73,433],[140,433],[140,464],[73,464]],behind:'behind'},
 {id:'office-plant-bottom-right',position:{x:15.484272,y:7.401211},height:1.962774,anchor:{x:15.9375,y:8.75},footprint:{x:15.5,y:7.9375,width:.875,height:.8125},points:[[311,440],[244,440],[244,464],[311,464]],behind:'behind'},
];
const edges=rs=>rs.map(r=>JSON.stringify([r.x,r.y,r.x+r.width,r.y+r.height].map(v=>Math.round(v*1e9)/1e9))).sort();
async function geometry(){
 const prior=JSON.parse(readFileSync('output/qa/office-dog-pots/development/results.json','utf8')).results[0].geometry.bounds.rectangles;
 assert.equal(prior.length,79);const current=await bodies();assert.equal(current.length,79);assert.deepEqual(edges(current),edges(prior));
 const office=await evaluate("s.layout.rooms.find(r=>r.id==='office')");
 assert.equal(office.visualAssetId,background);assert.deepEqual(office.visualBundle,{fallbackAssetId:original,foregroundIds:plants.map(p=>p.id)});
 for(const p of plants){
  const o=office.decorations.find(o=>o.id===p.id);assert.deepEqual(o.position,p.position);assert.deepEqual(o.groundAnchor,p.anchor);assert.deepEqual(o.footprints,[p.footprint]);assert.equal(o.displayHeightTiles,p.height);
  assert.ok(!office.collisionRects.some(r=>multiset([r])[0]===multiset([p.footprint])[0]));
 }
 return {bodies:79,baseline:'output/qa/office-dog-pots/development/results.json',bounds:await checkVisibleBounds()};
}
async function bundle(mode){
 const state=await evaluate(`(()=>{const ids=${JSON.stringify(plants.map(p=>p.id))},views=s.sys.displayList.list;
  return {backgrounds:views.filter(v=>[${JSON.stringify(background)},${JSON.stringify(original)}].includes(v.texture?.key)).map(v=>({key:v.texture.key,frame:v.frame.name,width:v.frame.cutWidth,height:v.frame.cutHeight,visible:v.visible})),
   plants:ids.map(id=>{const e=s.depths.entries.find(e=>e.id===id);return {id,count:views.filter(v=>v.texture?.key===id).length,registered:!!e,key:e?.view.texture?.key,depth:e?.view.depth}})};})()`);
 if(mode==='generic')assert.deepEqual(state.backgrounds,[]);
 else assert.deepEqual(state.backgrounds,[{key:mode==='normal'?background:original,frame:'__BASE',width:1634,height:962,visible:true}]);
 for(const p of state.plants){
  assert.equal(p.count,mode==='normal'?1:0);
  assert.equal(p.registered,mode!=='restored');
  if(mode!=='restored'){assert.equal(p.key,mode==='normal'?p.id:'furniture-placeholder');assert.ok(p.depth>3&&p.depth<4);}
 }
 return state;
}
async function alpha(id){
 const a=await evaluate(`(()=>{const v=s.depths.entries.find(e=>e.id===${JSON.stringify(id)}).view,f=v.frame,c=document.createElement('canvas');c.width=f.cutWidth;c.height=f.cutHeight;const ctx=c.getContext('2d');ctx.drawImage(f.source.image,f.cutX,f.cutY,f.cutWidth,f.cutHeight,0,0,c.width,c.height);
 const data=ctx.getImageData(0,0,c.width,c.height).data;let minX=c.width,minY=c.height,maxX=-1,maxY=-1,transparent=0;
 for(let y=0;y<c.height;y++)for(let x=0;x<c.width;x++){const a=data[(y*c.width+x)*4+3];if(a===0)transparent++;if(a>=128){minX=Math.min(minX,x);minY=Math.min(minY,y);maxX=Math.max(maxX,x);maxY=Math.max(maxY,y);}}
 return {width:c.width,height:c.height,transparent,bbox:[minX,minY,maxX+1,maxY+1],worldBottom:v.y-v.displayOriginY*v.scaleY+(maxY+1)*v.scaleY,scale:v.scaleY};})()`);
 assert.ok(a.transparent>0&&a.bbox[2]>a.bbox[0]);const p=plants.find(p=>p.id===id);assert.ok(Math.abs(a.worldBottom-(320+p.anchor.y*16))<.15,JSON.stringify({id,a}));
 return a;
}
async function capturePlant(p,label,point){
 await clearPosition(...point);await pause(100);
 const state=await pose(p.id);
 const overlap=await evaluate(`(()=>{const v=s.player.getDisplayObject(),o=s.depths.entries.find(e=>e.id===${JSON.stringify(p.id)}).view;v.anims.pause();const S=4,W=512,H=512,X=v.x-64,Y=v.y-80;
 const mask=q=>{const c=document.createElement('canvas');c.width=W;c.height=H;const ctx=c.getContext('2d');ctx.imageSmoothingEnabled=false;const f=q.frame;ctx.drawImage(f.source.image,f.cutX,f.cutY,f.cutWidth,f.cutHeight,(q.x-q.displayOriginX*q.scaleX-X)*S,(q.y-q.displayOriginY*q.scaleY-Y)*S,q.displayWidth*S,q.displayHeight*S);return ctx.getImageData(0,0,W,H).data};
 const a=mask(v),b=mask(o);let n=0;for(let i=3;i<a.length;i+=4)if(a[i]>=128&&b[i]>=128)n++;return {opaqueSamples:n,samplesPerWorldPixel:16,alphaThreshold:128};})()`);
 try{await screenshot(p.id+'-'+label+'-cyan');await evaluate('s.renderLayers.collisionPreview.setVisible(false);void 0');await screenshot(p.id+'-'+label+'-clean');}
 finally{await evaluate('s.renderLayers.collisionPreview.setVisible(true);s.player.getDisplayObject().anims.resume();void 0');}
 results.push({capture:p.id,label,state,overlap});
}
async function dogPhoto(){
 await clearPosition(104,464);await pause(100);
 assert.equal(await evaluate('s.interactionSystem.getCurrentTarget()?.id'),'office-dog-bed');
 for(const[type,key,code]of [['keyDown','e',69],['keyUp','e',69]])await send('Input.dispatchKeyEvent',{type,key,code:'KeyE',windowsVirtualKeyCode:code});await pause(250);
 const state=await evaluate("({open:document.querySelector('dialog').open,title:document.querySelector('#dialog-title').textContent,loaded:[...document.querySelectorAll('dialog img')].some(i=>i.complete&&i.naturalWidth>0),enabled:s.inputController.isGameplayEnabled()})");
 assert.equal(state.open,true);assert.equal(state.title,'Stella');assert.equal(state.loaded,true);assert.equal(state.enabled,false);await screenshot('dog-photo-regression');
 for(const type of ['keyDown','keyUp'])await send('Input.dispatchKeyEvent',{type,key:'Escape',code:'Escape',windowsVirtualKeyCode:27});await pause(100);assert.equal(await evaluate("document.querySelector('dialog').open"),false);return state;
}
try{
 await send('Runtime.enable');await send('Page.enable');await load();
 if(backgroundsOnly){
  await evaluate(`s.preload=()=>{};const missing=[${JSON.stringify(background)},${JSON.stringify(original)}];s.children.list.filter(v=>missing.includes(v.texture?.key)).forEach(v=>{v.setActive(false);v.setVisible(false)});missing.forEach(k=>s.textures.remove(k));void 0`);
  await readyAfterRestart();const geometryState=await geometry(),bundleState=await bundle('generic');
  assert.equal(await evaluate(`(${JSON.stringify(plants.map(p=>p.id))}).every(k=>s.textures.exists(k))`),true);
  await clearPosition(200,440);await screenshot('both-backdrops-missing-foregrounds-loaded');
  const photo=await dogPhoto();assert.deepEqual(exceptions,[]);
  writeFileSync(output+'/both-backdrops-missing.json',JSON.stringify({url,recordedAt:new Date().toISOString(),geometry:geometryState,bundle:bundleState,foregroundTexturesStillLoaded:true,dogPhoto:photo,exceptions},null,2));
  console.log('PASS both backdrops missing with all foreground textures still loaded: generic atomic placeholders');
 }else{
 await send('Emulation.setDeviceMetricsOverride',{width:1280,height:900,deviceScaleFactor:1,mobile:false});await send('Emulation.setTouchEmulationEnabled',{enabled:false});
 results.push({geometry:await geometry(),bundle:await bundle('normal')});
 for(const p of plants){
  results.push({alpha:p.id,state:await alpha(p.id)});
  for(const speed of [144,72])await routeCheck({id:p.id,name:p.id+'-reachable-bypass',points:p.points},speed,speed===72);
  await capturePlant(p,p.behind,p.points[0]);await capturePlant(p,'front',p.points.at(-1));
 }
 results.push({dogPhoto:await dogPhoto()});
 const listeners=await evaluate("({post:s.events.listenerCount('postupdate'),step:s.physics.world.listenerCount('worldstep')})");
 for(let restart=0;restart<2;restart++){await readyAfterRestart();await geometry();assert.deepEqual(await evaluate("({post:s.events.listenerCount('postupdate'),step:s.physics.world.listenerCount('worldstep')})"),listeners);results.push({normalRestart:restart,bundle:await bundle('normal')});}
 const members=[background,...plants.map(p=>p.id)];
 for(const missing of [...members.map(k=>[k]),[...members,original]]){
  await load();await evaluate(`s.preload=()=>{};const missing=${JSON.stringify(missing)};s.children.list.filter(v=>missing.includes(v.texture?.key)).forEach(v=>{v.anims?.stop();v.setActive(false);v.setVisible(false)});missing.forEach(k=>s.textures.remove(k));void 0`);
  await readyAfterRestart();const g=await geometry(),mode=missing.includes(original)?'generic':'restored',b=await bundle(mode);
  assert.deepEqual(await evaluate("({post:s.events.listenerCount('postupdate'),step:s.physics.world.listenerCount('worldstep')})"),listeners);
  await clearPosition(200,440);await screenshot('fallback-'+(mode==='generic'?'all-backgrounds-and-foregrounds':missing[0]));
  results.push({missing,mode,geometry:g,bundle:b,listeners,dogPhoto:await dogPhoto()});
 }
 assert.deepEqual(exceptions,[]);
 writeFileSync(output+'/results.json',JSON.stringify({url,recordedAt:new Date().toISOString(),results,exceptions,limitations:['Top-right behind-plane pose is reachable side floor, not rear access through wall.','Lower pots require bypass around dog/robots; narrow adjacent gaps are not traversable.','Opaque samples prove overlap only where positive; restored original intentionally suppresses all three foregrounds.']},null,2));
 console.log('PASS '+results.length+' focused plant records, atomic fallback, unchanged79 and zero exceptions');
 }
}catch(error){writeFileSync(output+'/failure.json',JSON.stringify({error:error.stack,results,exceptions},null,2));throw error;}
finally{await release().catch(()=>{});await send('Page.reload').catch(()=>{});for(const r of pending.values())clearTimeout(r.timer);ws.close();}
