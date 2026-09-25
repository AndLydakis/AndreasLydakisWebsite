// Isolated Chrome CDP9333, never the owner's active browser. Fixtures reload away.
import assert from 'node:assert/strict';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
const url=process.argv[2]??'http://127.0.0.1:5173',production=url.includes(':4173');
const output=`output/qa/port18d/${production?'production':'development'}`;
mkdirSync(output,{recursive:true});
const tabs=await(await fetch('http://127.0.0.1:9333/json')).json();
const ws=new WebSocket(tabs.find(t=>t.type==='page').webSocketDebuggerUrl);
await new Promise(r=>ws.addEventListener('open',r,{once:true}));
let sequence=0;const pending=new Map(),exceptions=[],results=[];
ws.addEventListener('message',({data})=>{const m=JSON.parse(data);if(m.method==='Runtime.exceptionThrown')exceptions.push(m.params.exceptionDetails);if(m.id){const p=pending.get(m.id);pending.delete(m.id);m.error?p.reject(m.error):p.resolve(m.result)}});
const send=(method,params={})=>new Promise((resolve,reject)=>{const id=++sequence;pending.set(id,{resolve,reject});ws.send(JSON.stringify({id,method,params}))});
const evaluate=async expression=>{const r=await send('Runtime.evaluate',{expression,returnByValue:true,awaitPromise:true});if(r.exceptionDetails)throw Error(JSON.stringify(r.exceptionDetails));return r.result.value};
const pause=ms=>new Promise(r=>setTimeout(r,ms));
const key=async(name,duration=80)=>{const fields={key:name,code:name.length===1?`Key${name.toUpperCase()}`:name,windowsVirtualKeyCode:({ArrowUp:38,ArrowDown:40,ArrowLeft:37,ArrowRight:39,Escape:27})[name]??name.toUpperCase().charCodeAt(0)};await send('Input.dispatchKeyEvent',{type:'keyDown',...fields});await pause(duration);await send('Input.dispatchKeyEvent',{type:'keyUp',...fields});await pause(100)};
const position=async(x,y)=>{await evaluate(`s.player.teleportTo({x:${x+2},y:${y+4}});s.synchronizePresentation();document.querySelector('#game-shell').focus();void 0`);await pause(100)};
const snapshot=()=>evaluate('s.collisionSystem.staticBodyList.map(b=>({x:b.x,y:b.y,width:b.width,height:b.height}))');
const shot=async name=>{const r=await send('Page.captureScreenshot',{format:'png',captureBeyondViewport:true});writeFileSync(`${output}/${name}.png`,Buffer.from(r.data,'base64'))};
try{
 await send('Runtime.enable');await send('Page.enable');await send('Page.navigate',{url});await pause(2500);
 const proto=await send('Runtime.evaluate',{expression:'Phaser.Game.prototype'});
 const games=await send('Runtime.queryObjects',{prototypeObjectId:proto.result.objectId});
 await send('Runtime.callFunctionOn',{objectId:games.objects.objectId,functionDeclaration:'function(){window.s=this[0].scene.getScene("HouseScene")}'});
 const baseline=JSON.parse(readFileSync('output/qa/port18a/baseline.json','utf8'));
 const rectangles=await evaluate('s.layout.rooms.map(r=>[...r.collisionRects,...[...r.interactables,...(r.decorations??[])].flatMap(o=>o.footprints??[])])');
 assert.deepEqual(rectangles,baseline.layout.rooms.map(r=>r.collisionRects));
 const originalBodies=await snapshot();
 for(const[viewport,width,height,mobile]of[['desktop',1280,900,false],['portrait',390,844,true],['landscape',844,390,true]]){
  await send('Emulation.setDeviceMetricsOverride',{width,height,deviceScaleFactor:1,mobile});await send('Emulation.setTouchEmulationEnabled',{enabled:mobile});await pause(300);
  for(const enabled of [true,false]){await evaluate(`s.setDiagnosticsEnabled(${enabled})`);await position(10,6.25);await shot(`${viewport}-diagnostics-${enabled}`);assert.deepEqual(await snapshot(),originalBodies)}
  for(const[id,x,y]of[['living-room-television',10,6.25],['living-room-record-player',17.5,8.5],['living-room-globe',4,9]]){
   await position(x,y);assert.equal(await evaluate('s.interactionSystem.getCurrentTarget()?.id'),id);
   if(mobile){await evaluate("document.querySelector('.mobile-interact').scrollIntoView({block:'center'})");const p=await evaluate("(()=>{const r=document.querySelector('.mobile-interact').getBoundingClientRect();return{x:r.x+r.width/2,y:r.y+r.height/2}})()");await send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{...p,id:1}]});await send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});await pause(200)}else await key('f');
   assert.equal(await evaluate("document.querySelector('dialog').open"),true);
   await evaluate("document.querySelector('.dialog-close').click()");await pause(200);
   assert.equal(await evaluate('s.inputController.isGameplayEnabled()'),true);results.push({viewport,interaction:id});
  }
 }
 await send('Emulation.setDeviceMetricsOverride',{width:1280,height:900,deviceScaleFactor:1,mobile:false});await send('Emulation.setTouchEmulationEnabled',{enabled:false});
 const pilots=await evaluate("s.layout.rooms[0].interactables.filter(o=>o.footprints).map(o=>({id:o.id,rect:o.footprints[0]}))");
 for(const speed of [144,72])for(const{id,rect:r}of pilots){
  await evaluate(`s.player.speed=${speed}`);
  const points=[['ArrowDown',r.x+r.width/2,r.y-.5],['ArrowUp',r.x+r.width/2,r.y+r.height+.5],['ArrowRight',r.x-.75,r.y+r.height/2]];
  // The vinyl's right side is accessible through the east doorway opening.
  points.push(['ArrowLeft',r.x+r.width+.75,r.y+r.height/2]);
  for(const[direction,x,y]of points){await position(x,y);await key(direction,450);const b=await evaluate('({left:s.playerSprite.body.left,right:s.playerSprite.body.right,top:s.playerSprite.body.top,bottom:s.playerSprite.body.bottom})');
   const actual=direction==='ArrowDown'?b.bottom:direction==='ArrowUp'?b.top:direction==='ArrowRight'?b.right:b.left;
   const expected=direction==='ArrowDown'?(r.y+4)*16:direction==='ArrowUp'?(r.y+r.height+4)*16:direction==='ArrowRight'?(r.x+2)*16:(r.x+r.width+2)*16;
   assert.ok(Math.abs(actual-expected)<.05,`${id} ${direction}: ${actual}/${expected}`);results.push({id,speed,direction,actual,expected});
  }
 }
 // Object-owned geometry must reject real quick travel without moving the player.
 await evaluate("s.layout=structuredClone(s.layout);const office=s.layout.rooms.find(r=>r.id==='office');office.decorations.push({id:'blocked-travel',position:{x:7,y:5},groundAnchor:{x:7.5,y:6},footprints:[{x:7,y:5,width:1,height:1}]});void 0");
 for(const missing of[false,true]){if(missing)await evaluate("s.preload=()=>{};s.textures.remove('television-console-front');s.scene.restart();void 0");await pause(600);
  const state=await evaluate("(()=>{const before={x:s.playerSprite.x,y:s.playerSprite.y};const accepted=s.travelTo('cv');return{accepted,before,after:{x:s.playerSprite.x,y:s.playerSprite.y}}})()");assert.equal(state.accepted,false);assert.deepEqual(state.before,state.after);results.push({missing,state});
 }
 const rebuilt=await snapshot();assert.equal(rebuilt.length,originalBodies.length+1);
 for(const body of originalBodies)assert.ok(rebuilt.some(b=>JSON.stringify(b)===JSON.stringify(body)));
 for(let i=0;i<2;i++){await evaluate('s.scene.restart();void 0');await pause(700);assert.deepEqual(await snapshot(),rebuilt)}
 assert.deepEqual(exceptions,[]);writeFileSync(`${output}/results.json`,JSON.stringify({url,results,bodyCount:originalBodies.length,exceptions},null,2));console.log('PASS combined geometry, diagnostics, desktop/mobile interactions, reachable approaches, no-step rejected travel, missing art and restart');
}finally{await send('Page.reload');ws.close()}
