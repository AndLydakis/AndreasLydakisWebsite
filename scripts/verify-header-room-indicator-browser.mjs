// Run against an isolated Chrome CDP instance, never the owner's active tabs.
import assert from 'node:assert/strict';
import { mkdirSync, writeFileSync, readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
const harnessSha256=createHash('sha256').update(readFileSync(new URL(import.meta.url))).digest('hex');
const records=[];
const url = process.argv[2] ?? 'http://127.0.0.1:5173';
// Optional output folder allows later regression stories to preserve prior evidence.
const output = process.argv[4] ?? `output/qa/header-room-indicator/${url.includes(':4173') ? 'production' : 'development'}`;
mkdirSync(output, { recursive: true });
const tabs = await (await fetch(`http://127.0.0.1:${process.argv[3] ?? 9333}/json`)).json();
const qaTab = tabs.find(tab => tab.type === 'page' && tab.url.startsWith(url))
  ?? tabs.find(tab => tab.type === 'page' && /^http:\/\/127\.0\.0\.1:(5173|4173)\//.test(tab.url));
assert.ok(qaTab, 'Expected an explicit isolated localhost QA page');
const ws = new WebSocket(qaTab.webSocketDebuggerUrl);
await new Promise(resolve => ws.addEventListener('open', resolve, { once: true }));
let sequence = 0;
const pending = new Map(), exceptions = [];
ws.addEventListener('message', ({ data }) => {
  const message = JSON.parse(data);
  if (message.method === 'Runtime.exceptionThrown') exceptions.push(message.params.exceptionDetails);
  if (message.id) {
    const request = pending.get(message.id); pending.delete(message.id);
    message.error ? request.reject(message.error) : request.resolve(message.result);
  }
});
const send = (method, params = {}) => new Promise((resolve, reject) => {
  const id = ++sequence; pending.set(id, { resolve, reject }); ws.send(JSON.stringify({ id, method, params }));
});
const evaluate = async expression => {
  const result = await send('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true });
  if (result.exceptionDetails) throw Error(JSON.stringify(result.exceptionDetails));
  return result.result.value;
};
const pause = ms => new Promise(resolve => setTimeout(resolve, ms));
const selector = id => `.quick-travel [data-destination="${id}"]`;
const point = async id => {
  await evaluate(`document.querySelector('${selector(id)}').scrollIntoView({block:'center'})`);
  return evaluate(`(()=>{const r=document.querySelector('${selector(id)}').getBoundingClientRect();return {x:r.x+r.width/2,y:r.y+r.height/2}})()`);
};
const key = async (key, code, virtual) => {
  await send('Input.dispatchKeyEvent', { type: 'keyDown', key, code, windowsVirtualKeyCode: virtual,
    ...(key === 'Enter' ? { text: '\r' } : key === ' ' ? { text: ' ' } : {}) });
  await send('Input.dispatchKeyEvent', { type: 'keyUp', key, code, windowsVirtualKeyCode: virtual });
  await pause(150);
};
const current=()=>evaluate("Array.from(document.querySelectorAll('.quick-travel [aria-current=location]')).map(b=>b.dataset.destination)");
const highlight = () => evaluate("Array.from(document.querySelectorAll('.quick-travel [data-highlighted=true]')).map(b=>b.dataset.destination)");
const destinations = [['cv','office',7.5,5.5],['media','living-room',7,6.5],['training','gym',6,7],['food-log','kitchen',4,6.5]];
const verifyLanding = async ([id,roomId,x,y]) => {
  await pause(180);
  const state = await evaluate(`(()=>{const p=s.playerSprite,b=p.body,r=s.layout.rooms.find(r=>r.id==='${roomId}'),v=s.cameras.main.worldView;
    return {dx:p.x-(r.origin.x+${x})*16,dy:b.bottom-(r.origin.y+${y})*16,vx:b.velocity.x,vy:b.velocity.y,
      visible:v.contains(p.x,p.y),focus:document.activeElement.id,dialog:document.querySelector('dialog').open,
      keys:Object.values(s.inputController.getMovementSnapshot()).some(Boolean),status:document.querySelector('#game-status').textContent,
      active:document.activeElement.outerHTML.slice(0,200)}})()`);
  assert.ok(Math.abs(state.dx)<.01 && Math.abs(state.dy)<.01, `${id}: ${JSON.stringify(state)}`);
  assert.equal(state.vx,0);assert.equal(state.vy,0);assert.equal(state.keys,false);
  assert.equal(state.visible,true);assert.equal(state.dialog,false);assert.equal(state.focus,'game-shell');
  assert.deepEqual(await highlight(),[id]);assert.deepEqual(await current(),[id]);records.push({kind:'travel',id,state});
};

async function spacing(viewport){
 const state=await evaluate('(()=>{const rect=s=>{const r=document.querySelector(s).getBoundingClientRect();return {x:r.x,y:r.y,right:r.right,bottom:r.bottom,width:r.width,height:r.height}};const css=s=>{const c=getComputedStyle(document.querySelector(s));return {top:parseFloat(c.marginTop),bottom:parseFloat(c.marginBottom)}};return {header:rect(".site-header"),title:rect(".site-header h1"),nav:rect(".quick-travel"),heading:rect("#game-heading"),instructions:rect("#game-instructions"),game:rect("#game-shell"),headerCss:css(".site-header"),headingCss:css("#game-heading"),instructionsCss:css("#game-instructions"),overflow:document.documentElement.scrollWidth>innerWidth}})()');
 assert.equal(state.overflow,false);assert.equal(state.headerCss.bottom,12);
 assert.equal(state.headingCss.top,0);assert.ok(Math.abs(state.headingCss.bottom-5.6)<.02);
 assert.equal(state.instructionsCss.top,0);assert.equal(state.instructionsCss.bottom,16);
 assert.ok(state.heading.y>=state.header.bottom-.1);assert.ok(state.instructions.y>=state.heading.bottom-.1);assert.ok(state.game.y>=state.instructions.bottom-.1);
 assert.ok(Math.abs(state.heading.y-state.header.bottom-12)<.1,'Header to heading gap');
 assert.ok(Math.abs(state.instructions.y-state.heading.bottom-5.6)<.1,'Heading to instructions gap');
 assert.ok(Math.abs(state.game.y-state.instructions.bottom-16)<.1,'Instructions to game gap');
 assert.ok(state.title.right<=state.nav.x||state.nav.right<=state.title.x||state.title.bottom<=state.nav.y||state.nav.bottom<=state.title.y,'Title and quick travel do not overlap');
 records.push({kind:'spacing',viewport,state});
}
async function walking(viewport){
 const points=[[192,390],[192,250],[280,250],[280,200],[440,200],[538.5,200],[538.5,405]];
 await evaluate('s.player.teleportTo({x:12,y:24.375});s.synchronizePresentation();document.querySelector("#game-shell").focus();s.player.speed=144;void 0');
 await pause(100);
 const monitor=()=>{
  const b=s.playerSprite.body,x=b.center.x/16,y=b.bottom/16;
  const r=s.layout.rooms.find(r=>x>=r.origin.x&&x<r.origin.x+r.widthTiles&&y>=r.origin.y&&y<r.origin.y+r.heightTiles);
  const map={'office':'cv','living-room':'media','gym':'training','kitchen':'food-log'};
  if(r)window.expectedLastRoom=r.id;
  const expected=map[window.expectedLastRoom];
  const highlight=Array.from(document.querySelectorAll('.quick-travel [data-highlighted=true]')).map(b=>b.dataset.destination);
  const aria=Array.from(document.querySelectorAll('.quick-travel [aria-current=location]')).map(b=>b.dataset.destination);
  roomProof.push({x,y,room:r?.id??null,expected,highlight,aria});
 };
 await evaluate('window.roomProof=[];window.expectedLastRoom="office";window.roomCheck='+monitor.toString()+';s.game.events.on("postrender",roomCheck);void 0');
 try{
  for(const waypoints of [points,[...points].reverse()])for(const [x,y]of waypoints.slice(1)){
   const before=await evaluate('({x:s.playerSprite.body.center.x,y:s.player.getGroundY()})'),horizontal=Math.abs(x-before.x)>3,sign=Math.sign((horizontal?x:y)-(horizontal?before.x:before.y)),direction=horizontal?(sign>0?'ArrowRight':'ArrowLeft'):(sign>0?'ArrowDown':'ArrowUp'),virtual={ArrowRight:39,ArrowLeft:37,ArrowUp:38,ArrowDown:40}[direction];
   await send('Input.dispatchKeyEvent',{type:'keyDown',key:direction,code:direction,windowsVirtualKeyCode:virtual});
   try{await evaluate('new Promise((resolve,reject)=>{const done=e=>{clearTimeout(timer);s.events.off("postupdate",check);e?reject(Error(e)):resolve(true)},check=()=>{if(('+ (horizontal?x:y)+'-'+(horizontal?'s.playerSprite.body.center.x':'s.player.getGroundY()')+')*'+sign+'<=2.4)done()},timer=setTimeout(()=>done("corridor route timeout"),5000);s.events.on("postupdate",check)})');}
   finally{await send('Input.dispatchKeyEvent',{type:'keyUp',key:direction,code:direction,windowsVirtualKeyCode:virtual});}
   await pause(70);
  }
 }finally{await evaluate('s.game.events.off("postrender",roomCheck);void 0');}
 const samples=await evaluate('roomProof');assert.ok(samples.length>0);
 for(const p of samples){const expected=p.expected?[p.expected]:[];assert.deepEqual(p.highlight,expected,'Walking glove '+JSON.stringify(p));assert.deepEqual(p.aria,expected,'Walking aria-current '+JSON.stringify(p));}
 assert.deepEqual([...new Set(samples.map(p=>p.room))].sort(),[null,'gym','kitchen','living-room','office'].sort());
 records.push({kind:'walking-house-chain',viewport,samples});
}
async function dialog(viewport,mobile){
 await evaluate('s.player.teleportTo({x:6.5,y:27.125});s.synchronizePresentation();document.querySelector("#game-shell").focus();void 0');await pause(200);
 if(mobile){const p=await evaluate('(()=>{const e=document.querySelector(".mobile-interact");e.scrollIntoView({block:"center"});const r=e.getBoundingClientRect();return {x:r.x+r.width/2,y:r.y+r.height/2}})()');await send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{...p,id:1}]});await send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});}
 else await key('e','KeyE',69);
 await pause(150);assert.equal(await evaluate('document.querySelector("dialog").open'),true);
 assert.equal(await evaluate('s.travelTo("training")'),false);assert.deepEqual(await highlight(),['cv']);assert.deepEqual(await current(),['cv']);
 const before=await evaluate('({x:s.playerSprite.x,y:s.playerSprite.y})');await key('ArrowRight','ArrowRight',39);assert.deepEqual(await evaluate('({x:s.playerSprite.x,y:s.playerSprite.y})'),before);
 const shot=await send('Page.captureScreenshot',{format:'png',captureBeyondViewport:true});writeFileSync(output+'/'+viewport+'-dialog.png',Buffer.from(shot.data,'base64'));
 await key('Escape','Escape',27);assert.equal(await evaluate('document.querySelector("dialog").open'),false);
 records.push({kind:'dialog',viewport,input:mobile?'actual touch':'E',blockedTravel:true,blockedMovement:true});
}

async function supplements(){
 for(const [viewport,width,height,mobile] of [['desktop',1280,900,false],['portrait',390,844,true],['landscape',844,390,true],['narrow',320,640,true]]){
  await send('Emulation.setDeviceMetricsOverride',{width,height,deviceScaleFactor:1,mobile});
  await send('Emulation.setTouchEmulationEnabled',{enabled:mobile,maxTouchPoints:5});
  await evaluate('s.travelTo("cv");void 0');await pause(150);
  for(const id of ['cv','training']){
   if(id==='training'){await evaluate('s.travelTo("training");void 0');await pause(150);}
   await evaluate('window.scrollTo(0,0);void 0');await pause(100);
   assert.deepEqual(await highlight(),[id]);assert.deepEqual(await current(),[id]);await spacing(viewport);
   const shot=await send('Page.captureScreenshot',{format:'png',captureBeyondViewport:true});
   const name=viewport+'-header-'+id+'.png';writeFileSync(output+'/'+name,Buffer.from(shot.data,'base64'));
   records.push({kind:'header-capture',viewport,id,screenshot:name});
  }
  await evaluate('new Promise((resolve,reject)=>{const timer=setTimeout(()=>reject(Error("restart timeout")),10000),original=s.callbacks.onSceneReady;s.callbacks.onSceneReady=(...args)=>{s.callbacks.onSceneReady=original;original?.(...args);clearTimeout(timer);resolve(true)};s.scene.restart()})');await pause(150);
  assert.deepEqual(await highlight(),['cv']);assert.deepEqual(await current(),['cv']);
  const state=await evaluate('(()=>{const b=s.playerSprite.body;return {room:s.layout.rooms.find(r=>b.center.x>=r.origin.x*16&&b.center.x<(r.origin.x+r.widthTiles)*16&&b.bottom>=r.origin.y*16&&b.bottom<(r.origin.y+r.heightTiles)*16)?.id,enabled:document.querySelectorAll(".quick-travel button:not(:disabled)").length}})()');
  assert.equal(state.room,'office');assert.equal(state.enabled,4);records.push({kind:'restart',viewport,from:'training',state});
  await evaluate('window.scrollTo(0,0);void 0');await pause(100);
  const initial=await send('Page.captureScreenshot',{format:'png',captureBeyondViewport:true});writeFileSync(output+'/'+viewport+'-initial-office.png',Buffer.from(initial.data,'base64'));
 }
}
try {
  await send('Runtime.enable');await send('Page.enable');
  if(!process.argv.includes('--supplement-only'))for (const [name,width,height,mobile] of [['desktop',1280,900,false],['portrait',390,844,true],['landscape',844,390,true],['narrow',320,640,true]]) {
    await send('Emulation.setDeviceMetricsOverride',{width,height,deviceScaleFactor:1,mobile});
    await send('Emulation.setTouchEmulationEnabled',{enabled:mobile,maxTouchPoints:5});
    await send('Page.navigate',{url});await pause(2000);
    const proto = await send('Runtime.evaluate',{expression:'Phaser.Game.prototype'});
    const games = await send('Runtime.queryObjects',{prototypeObjectId:proto.result.objectId});
    await send('Runtime.callFunctionOn',{objectId:games.objects.objectId,functionDeclaration:'function(){window.s=this[0].scene.getScene("HouseScene")}'});
    assert.deepEqual(await highlight(),['cv']);assert.deepEqual(await current(),['cv']);
    await spacing(name);
    assert.equal(await evaluate("document.querySelectorAll('.quick-travel button:not(:disabled)').length"),4);
    assert.equal(await evaluate('document.documentElement.scrollWidth<=innerWidth'),true);
    assert.equal(await evaluate(`Array.from(document.querySelectorAll('.quick-travel button')).every(b=>b.getBoundingClientRect().height>=${mobile ? 44 : 29})`),true);
    if (!mobile) {
      const before = await evaluate('({x:s.playerSprite.x,y:s.playerSprite.y})');
      await send('Input.dispatchMouseEvent',{type:'mouseMoved',...await point('training')});
      assert.deepEqual(await highlight(),['cv']);assert.deepEqual(await current(),['cv']);
      assert.deepEqual(await evaluate('({x:s.playerSprite.x,y:s.playerSprite.y})'),before);
      await evaluate(`document.querySelector('${selector('cv')}').focus()`);
      await key('ArrowDown','ArrowDown',40);
      assert.deepEqual(await highlight(),['cv']);assert.deepEqual(await current(),['cv']);
      assert.equal(await evaluate('document.activeElement.dataset.destination'),'media');
      assert.deepEqual(await evaluate('({x:s.playerSprite.x,y:s.playerSprite.y})'),before);
      await key('Enter','Enter',13);await verifyLanding(destinations[1]);
      await evaluate(`document.querySelector('${selector('cv')}').focus()`);
      await key(' ','Space',32);await verifyLanding(destinations[0]);
    }
    for (const destination of [...destinations,...destinations]) {
      // A teleport must clear both touch-held movement and a queued interaction.
      await evaluate("s.inputController.setPointerDirection(99,'right',true);s.inputController.requestInteraction('mobile');void 0");
      const p = await point(destination[0]);
      if (mobile) {
        await send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{...p,id:1}]});
        await send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});
      } else {
        await send('Input.dispatchMouseEvent',{type:'mousePressed',...p,button:'left',clickCount:1});
        await send('Input.dispatchMouseEvent',{type:'mouseReleased',...p,button:'left',clickCount:1});
      }
      await verifyLanding(destination);
    }
    await walking(name);await dialog(name,mobile);
    // Modal guard protects movement even from an external/programmatic request.
    assert.equal(await evaluate("s.inputController.setGameplayEnabled(false);s.travelTo('cv')"),false);
    await evaluate(`s.inputController.setGameplayEnabled(true);document.querySelector('${selector('cv')}').click();window.scrollTo(0,0)`);await pause(150);
    const shot = await send('Page.captureScreenshot',{format:'png',captureBeyondViewport:true});
    writeFileSync(`${output}/${name}.png`,Buffer.from(shot.data,'base64'));
    console.log(`PASS ${name}: glove, all destinations twice, camera/feet, input reset, no overflow, modal guard`);
  }
  if(process.argv.includes('--supplement-only')){
   await send('Page.navigate',{url});await pause(2000);
   const proto=await send('Runtime.evaluate',{expression:'Phaser.Game.prototype'}),games=await send('Runtime.queryObjects',{prototypeObjectId:proto.result.objectId});
   await send('Runtime.callFunctionOn',{objectId:games.objects.objectId,functionDeclaration:'function(){window.s=this.find(g=>g.scene?.getScene("HouseScene")?.player).scene.getScene("HouseScene")}' });
  }
  await supplements();
  assert.deepEqual(exceptions,[]);
  writeFileSync(output+(process.argv.includes('--supplement-only')?'/supplement-results.json':'/results.json'),JSON.stringify({url,harnessSha256,recordedAt:new Date().toISOString(),records,exceptions},null,2));
  console.log('PASS no uncaught exceptions');
} catch(error){writeFileSync(output+'/failure.json',JSON.stringify({url,harnessSha256,error:error.stack,records,exceptions},null,2));throw error;} finally { await send('Page.reload'); ws.close(); }
