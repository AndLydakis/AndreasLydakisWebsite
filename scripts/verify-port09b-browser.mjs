import { mkdirSync, writeFileSync } from 'node:fs';
import assert from 'node:assert/strict';
// Usage: node scripts/verify-port09b-browser.mjs [app URL] [CDP port]
// Requires an isolated Chrome instance launched with remote debugging enabled.
// Fixtures use the live scene's body reset; navigation and interactions use real CDP input.
const outputDir = 'output/qa/port09b';
mkdirSync(outputDir, { recursive: true });
const targets = await (await fetch(`http://127.0.0.1:${process.argv[3] ?? '9333'}/json`)).json();
const ws = new WebSocket(targets.find(t=>t.type==='page').webSocketDebuggerUrl);
await new Promise(r=>ws.addEventListener('open',r,{once:true}));
let id=0; const pending=new Map();
ws.addEventListener('message',e=>{const m=JSON.parse(e.data); if(m.id){const p=pending.get(m.id); pending.delete(m.id);m.error?p.reject(m.error):p.resolve(m.result);}});
const send=(method,params={})=>new Promise((resolve,reject)=>{const n=++id;pending.set(n,{resolve,reject});ws.send(JSON.stringify({id:n,method,params}));});
const evaluate=async expression=>{const r=await send('Runtime.evaluate',{expression,awaitPromise:true,returnByValue:true});if(r.exceptionDetails)throw Error(JSON.stringify(r.exceptionDetails));return r.result.value;};
const errors=[];
ws.addEventListener('message',e=>{const m=JSON.parse(e.data);if(m.method==='Runtime.exceptionThrown')errors.push(m.params.exceptionDetails);});
await send('Page.enable');await send('Runtime.enable');
await send('Page.navigate',{url:process.argv[2] ?? 'http://127.0.0.1:5173'});
await new Promise(r=>setTimeout(r,4000));
const proto=await send('Runtime.evaluate',{expression:'Phaser.Game.prototype'});
const games=await send('Runtime.queryObjects',{prototypeObjectId:proto.result.objectId});
await send('Runtime.callFunctionOn',{objectId:games.objects.objectId,functionDeclaration:'function(){window.testScene=this[0].scene.getScene("HouseScene")}',returnByValue:true});
const pause=ms=>new Promise(r=>setTimeout(r,ms));
const press=async(key,ms=180)=>{const fields={key,code:key.length===1?'Key'+key.toUpperCase():key,windowsVirtualKeyCode:({Escape:27,ArrowLeft:37,ArrowUp:38,ArrowRight:39,ArrowDown:40})[key]??key.toUpperCase().charCodeAt(0)};await send('Input.dispatchKeyEvent',{type:'keyDown',...fields});await pause(ms);await send('Input.dispatchKeyEvent',{type:'keyUp',...fields});await pause(100);};
const place=async(x,y)=>{await evaluate(`testScene.playerSprite.body.reset(${x},${y});document.querySelector('#game-shell').focus()`);await pause(160);};
const sole=async(x,y)=>place(x*16,y*16-16);
const state=()=>evaluate(`({x:testScene.playerSprite.body.x,y:testScene.playerSprite.body.y,right:testScene.playerSprite.body.right,bottom:testScene.playerSprite.body.bottom,blocked:{...testScene.playerSprite.body.blocked}})`);
const tap=async selector=>{await evaluate(`document.querySelector(${JSON.stringify(selector)}).scrollIntoView({block:'center'})`);await pause(120);const p=await evaluate(`(()=>{const r=document.querySelector(${JSON.stringify(selector)}).getBoundingClientRect();return {x:r.x+r.width/2,y:r.y+r.height/2}})()`);await send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{...p,id:1}]});await pause(80);await send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});await pause(180);};
for(const [name,width,height,mobile] of [['desktop',1280,900,false],['portrait',390,844,true],['landscape',844,390,true]]){
 await send('Emulation.setDeviceMetricsOverride',{width,height,deviceScaleFactor:1,mobile});
 await send('Emulation.setTouchEmulationEnabled',{enabled:mobile,maxTouchPoints:5});await pause(450);
 assert.equal(await evaluate(`document.querySelector('#startup-error').hidden`),true);
 assert.equal(await evaluate(`testScene.textures.exists('gym-boxing-bag-front-three-quarter')`),true);
 assert.ok(await evaluate(`document.querySelector('canvas').getBoundingClientRect().width>0`));
 // Walk through the living-room/gym corridor using real keyboard input.
 await sole(20,12);await press('ArrowRight',1050);assert.ok((await state()).x>27*16);
 await press('ArrowLeft',1050);assert.ok((await state()).x<22*16);
 // Both sides of the gym's bottom doorway stay passable.
 await sole(36,15);await press('ArrowDown',500);assert.ok((await state()).bottom>18*16);
 await press('ArrowUp',500);assert.ok((await state()).bottom<18*16);
 for(const [id,rx] of [['dumbbells',1.625],['boombox',7.25],['bench',9.5-1.625*2/3],['bag',2]]){
  const r=await evaluate(`testScene.layout.rooms.find(r=>r.id==='gym').collisionRects.find(r=>Math.abs(r.x-${rx})<1e-9)`);
  const x=(27+r.x+r.width/2)*16, bottom=(4+r.y+r.height)*16;
  await place(x,bottom+8-15);await press('ArrowUp',650);
  assert.ok((await state()).y>=bottom-0.01,`${name} ${id} collision`);
 }
 for(const [id,x,y,title] of [['squat',39.25,10.75,'Personal records'],['boombox',35,8.5,'Music collection'],['TV',12,10,'Games and movies'],['vinyl',19.5,12,'Music collection'],['books',17.75,8.75,'Recently read books']]){
  await sole(x,y);
  const target=await evaluate(`testScene.interactionSystem.getCurrentTarget()`);assert.ok(target,`${name} ${id} target`);
  for(let cycle=0;cycle<2;cycle++){
   if(mobile)await tap('.mobile-interact');else await press(cycle?'f':'e');
   assert.equal(await evaluate(`document.querySelector('dialog').open`),true,`${name} ${id} opens`);
   if(title)assert.equal(await evaluate(`document.querySelector('#dialog-title').textContent`),title);
   assert.equal(await evaluate(`testScene.inputController.isGameplayEnabled()`),false);
   if(mobile)await tap('.dialog-close');else await press('Escape');
   assert.equal(await evaluate(`document.querySelector('dialog').open`),false);
   assert.equal(await evaluate(`testScene.inputController.isGameplayEnabled()`),true);
  }
 }
 if(mobile){
  await sole(34,14);const before=await state();
  await evaluate(`document.querySelector('[data-direction="right"]').scrollIntoView({block:'center'})`);await pause(120);
  const p=await evaluate(`(()=>{const r=document.querySelector('[data-direction="right"]').getBoundingClientRect();return {x:r.x+r.width/2,y:r.y+r.height/2}})()`);
  await send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{...p,id:1}]});await pause(350);await send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});await pause(150);
  const after=await state();assert.ok(after.x>before.x+10,`${name} d-pad moves`);await pause(200);assert.ok(Math.abs((await state()).x-after.x)<0.1,`${name} release stops`);
 }
 await sole(35,11);await pause(200);
 const shot=await send('Page.captureScreenshot',{format:'png'});writeFileSync(`${outputDir}/${name}.png`,Buffer.from(shot.data,'base64'));
 console.log(`PASS ${name}: navigation, four equipment collisions, five dialogs twice, ${mobile?'touch controls':'E/F keys'}`);
}
assert.deepEqual(errors,[]);console.log('PASS no browser exceptions');
ws.close();
