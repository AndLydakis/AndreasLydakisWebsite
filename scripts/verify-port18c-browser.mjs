// Isolated CDP Chrome only. All synthetic state is removed by reload.
import assert from 'node:assert/strict';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
const url = process.argv[2] ?? 'http://127.0.0.1:5173';
const production = url.includes(':4173');
const output = `output/qa/port18c/${production ? 'production' : 'development'}`;
mkdirSync(output,{recursive:true});
const tabs = await (await fetch('http://127.0.0.1:9333/json')).json();
const ws = new WebSocket(tabs.find(tab=>tab.type==='page').webSocketDebuggerUrl);
await new Promise(resolve=>ws.addEventListener('open',resolve,{once:true}));
let next=0;const pending=new Map(),exceptions=[];
ws.addEventListener('message',({data})=>{const m=JSON.parse(data);if(m.method==='Runtime.exceptionThrown')exceptions.push(m.params.exceptionDetails);
  if(m.id){const p=pending.get(m.id);pending.delete(m.id);m.error?p.reject(m.error):p.resolve(m.result);}});
const send=(method,params={})=>new Promise((resolve,reject)=>{const id=++next;pending.set(id,{resolve,reject});ws.send(JSON.stringify({id,method,params}));});
const evaluate=async expression=>{try{const r=await send('Runtime.evaluate',{expression,returnByValue:true,awaitPromise:true});if(r.exceptionDetails)throw Error(JSON.stringify(r.exceptionDetails));return r.result.value;}catch(error){throw new Error(`Evaluation failed: ${expression}`,{cause:error});}};
const pause=ms=>new Promise(resolve=>setTimeout(resolve,ms));
const key=(key,type)=>send('Input.dispatchKeyEvent',{type,key,code:key,windowsVirtualKeyCode:{ArrowUp:38,ArrowDown:40,ArrowLeft:37,ArrowRight:39}[key]});
const shot=async name=>{const r=await send('Page.captureScreenshot',{format:'png',captureBeyondViewport:true});writeFileSync(`${output}/${name}.png`,Buffer.from(r.data,'base64'));};
const pilots=[
  ['tv','living-room-television',[[10,4.75],[8.25,4.75],[8.25,6.25],[10,6.25],[8.25,6.25],[8.25,4.75],[10,4.75]]],
  ['vinyl','living-room-record-player',[[17.5,6.75],[15.5,6.75],[15.5,8.5],[17.5,8.5],[15.5,8.5],[15.5,6.75],[17.5,6.75]]],
  ['globe','living-room-globe',[[4,7],[2.5,7],[2.5,9],[4,9],[2.5,9],[2.5,7],[4,7]]],
];
const results=[];
const checkOrder=async(id,front)=>{
  const state=await evaluate(`(()=>{const e=s.depths.entries.find(e=>e.id==='${id}'),p=s.player.getDisplayObject();return {player:p.depth,object:e.view.depth,sole:s.player.getGroundY(),plane:e.groundY(),visualY:p===s.playerSprite?p.y+p.height/2:p.y,expectedVisualY:s.playerSprite.y+16}})()`);
  assert.equal(state.player>state.object,front,`${id} ${JSON.stringify(state)}`);
  assert.ok(state.player>3&&state.player<4&&state.object>3&&state.object<4);
  assert.equal(state.visualY,state.expectedVisualY);return state;
};
try {
  await send('Runtime.enable');await send('Page.enable');
  await send('Emulation.setDeviceMetricsOverride',{width:1280,height:900,deviceScaleFactor:1,mobile:false});
  await send('Emulation.setTouchEmulationEnabled',{enabled:false});
  await send('Page.navigate',{url});await pause(2200);
  const proto=await send('Runtime.evaluate',{expression:'Phaser.Game.prototype'});
  const games=await send('Runtime.queryObjects',{prototypeObjectId:proto.result.objectId});
  await send('Runtime.callFunctionOn',{objectId:games.objects.objectId,functionDeclaration:'function(){window.s=this[0].scene.getScene("HouseScene")}'});
  assert.equal(await evaluate('s.depths.entries.length'),4);
  const baseline=JSON.parse(readFileSync('output/qa/port18a/baseline.json','utf8'));
  const geometry=await evaluate('s.layout.rooms.map(r=>({id:r.id,rects:r.collisionRects,objects:[...r.interactables,...(r.decorations??[])].map(o=>({id:o.id,position:o.position,radius:o.interactionRadiusTiles}))}))');
  assert.deepEqual(geometry,baseline.layout.rooms.map(r=>({id:r.id,rects:r.collisionRects,objects:[...r.interactables,...(r.decorations??[])].map(o=>({id:o.id,position:o.position,...(o.interactionRadiusTiles===undefined?{}:{radius:o.interactionRadiusTiles})}))})));
  for(const enabled of [false,true,false]) {
    await evaluate(`s.setDiagnosticsEnabled(${enabled})`);
    const visibility=await evaluate('s.children.list.filter(o=>o.depth===8||o.depth===9).map(o=>o.visible)');
    assert.ok(visibility.length>=3);assert.ok(visibility.every(v=>v===(!production&&enabled)));
  }
  const reset=async([x,y])=>{await evaluate(`s.player.teleportTo({x:${x+2},y:${y+4}});s.synchronizePresentation();document.querySelector('#game-shell').focus();void 0`);await pause(100);};
  await evaluate(`window.recordingChunks=[];window.recorder=new MediaRecorder(document.querySelector('canvas').captureStream(30),{mimeType:'video/webm'});recorder.ondataavailable=e=>recordingChunks.push(e.data);recorder.start();void 0`);
  for(const speed of [144,72]) {
    await evaluate(`s.player.speed=${speed}`);
    for(const[name,id,points]of pilots) {
      await reset(points[0]);results.push({name,speed,position:'behind',...await checkOrder(id,false)});await shot(`${name}-${speed}-behind`);
      for(let i=1;i<points.length;i++) {
        const [x,y]=points[i],horizontal=points[i][0]!==points[i-1][0];
        const target=(horizontal?x+2:y+4)*16;
        const before=await evaluate(horizontal?'s.playerSprite.body.center.x':'s.player.getGroundY()');
        const sign=Math.sign(target-before),direction=horizontal?(sign>0?'ArrowRight':'ArrowLeft'):(sign>0?'ArrowDown':'ArrowUp');
        await key(direction,'keyDown');
        await evaluate(`new Promise((resolve,reject)=>{const timer=setTimeout(()=>{s.events.off('postupdate',check);reject(Error('route timeout'))},3000);function check(){if((${target}-${horizontal?'s.playerSprite.body.center.x':'s.player.getGroundY()'})*${sign}<=${speed/60}){clearTimeout(timer);s.events.off('postupdate',check);resolve()}}s.events.on('postupdate',check)})`);
        await key(direction,'keyUp');await pause(80);
        const position=await evaluate('({x:s.playerSprite.body.center.x,y:s.player.getGroundY()})');
        assert.ok(Math.abs(position.x-(x+2)*16)<6&&Math.abs(position.y-(y+4)*16)<6);
        if(i===3){results.push({name,speed,position:'front',...await checkOrder(id,true)});await shot(`${name}-${speed}-front`);}
      }
      await checkOrder(id,false);
      // Exact tie via test-only teleport into the plane: checks ordering, not access.
      assert.equal(await evaluate(`(()=>{const e=s.depths.entries.find(e=>e.id==='${id}');s.player.teleportTo({x:s.playerSprite.x/16,y:e.groundY()/16});s.synchronizePresentation();return s.player.getGroundY()===e.groundY()&&s.player.getDisplayObject().depth>e.view.depth})()`),true);
    }
  }
  console.log('PASS three pilots forward/reverse, normal/slow, front/behind/exact tie and unchanged geometry');
  const video=await evaluate(`new Promise(resolve=>{recorder.onstop=async()=>{const reader=new FileReader();reader.onload=()=>resolve(reader.result.split(',')[1]);reader.readAsDataURL(new Blob(recordingChunks,{type:'video/webm'}))};recorder.stop()})`);
  writeFileSync(`${output}/pilot-routes.webm`,Buffer.from(video,'base64'));
  for (const [width,height,label] of [[390,844,'portrait'],[844,390,'landscape']]) {
    await send('Emulation.setDeviceMetricsOverride',{width,height,deviceScaleFactor:1,mobile:true});
    await send('Emulation.setTouchEmulationEnabled',{enabled:true});await pause(400);
    for (const [name,id,points] of pilots) for (const [index,front] of [[0,false],[3,true]]) {
      await reset(points[index]);results.push({name,viewport:label,front,...await checkOrder(id,front)});
      await shot(`${label}-${name}-${front?'front':'behind'}`);
    }
  }
  await send('Emulation.setDeviceMetricsOverride',{width:1280,height:900,deviceScaleFactor:1,mobile:false});
  await send('Emulation.setTouchEmulationEnabled',{enabled:false});await pause(400);
  for(const id of ['cv','media','training','food-log','food-log','cv']) {
    const immediate=await evaluate(`(()=>{s.physics.world.pause();s.inputController.setPointerDirection(91,'right',true);s.travelTo('${id}');const p=s.player.getDisplayObject(),b=s.playerSprite.body;const state={dx:b.center.x-s.playerSprite.x,dy:b.bottom-(s.playerSprite.y+16),visualY:p.y,sole:b.bottom,depth:p.depth,velocity:b.velocity.length(),moving:Object.values(s.inputController.getMovementSnapshot()).some(Boolean)};s.physics.world.resume();return state})()`);
    assert.equal(immediate.dx,0);assert.equal(immediate.dy,0);assert.equal(immediate.visualY,immediate.sole);assert.equal(immediate.velocity,0);assert.equal(immediate.moving,false);
    assert.ok(immediate.depth>3&&immediate.depth<4);results.push({travel:id,immediate});
    const rendered=await evaluate(`new Promise(resolve=>{s.physics.world.pause();s.game.events.once('postrender',()=>{const p=s.player.getDisplayObject();resolve({sole:s.player.getGroundY(),visual:p.y,depth:p.depth});s.physics.world.resume()});s.travelTo('${id}')})`);
    assert.equal(rendered.visual,rendered.sole);assert.ok(rendered.depth>3&&rendered.depth<4);
    results.push({travel:id,firstDestinationRender:rendered});
  }
  const listeners=await evaluate("({post:s.events.listenerCount('postupdate'),step:s.physics.world.listenerCount('worldstep')})");
  await evaluate(`window.firstFrames=[];window.originalReady=s.callbacks.onSceneReady;s.callbacks.onSceneReady=(...args)=>{firstFrames.push({sole:s.player.getGroundY(),visual:s.player.getDisplayObject().y,anchor:s.playerSprite.y+16,depth:s.player.getDisplayObject().depth});originalReady?.(...args)};void 0`);
  for(let i=0;i<2;i++) {
    await evaluate('s.scene.restart();void 0');await pause(1000);
    assert.equal(await evaluate('s.depths.entries.length'),4);
    assert.deepEqual(await evaluate("({post:s.events.listenerCount('postupdate'),step:s.physics.world.listenerCount('worldstep')})"),listeners);
    assert.equal(await evaluate('s.player.getGroundY()===s.playerSprite.y+16'),true);
  }
  const firstFrames=await evaluate('firstFrames');assert.equal(firstFrames.length,2);
  assert.ok(firstFrames.every(f=>f.sole===f.visual&&f.sole===f.anchor&&f.depth>3&&f.depth<4));
  // Synthetic cross-room registration/compound metadata without room-ID branches.
  await evaluate(`(()=>{s.layout=structuredClone(s.layout);for(const room of s.layout.rooms.filter(r=>['office','gym'].includes(r.id))){room.decorations=[...(room.decorations??[]),{id:'shared:fixture',position:{x:7,y:4},groundAnchor:{x:7.5,y:6},footprints:[{x:7,y:5.5,width:.25,height:.5},{x:8,y:5.5,width:.25,height:.5}]}];}const room=s.layout.rooms.find(r=>r.id==='office');room.interactables.push({...room.interactables[1],id:'synthetic-interactable',position:{x:7,y:4},groundAnchor:{x:7.5,y:6}});s.scene.restart()})()`);await pause(1000);
  assert.equal(await evaluate('s.depths.entries.length'),7);
  const overlapTravel=await evaluate(`(()=>{s.physics.world.pause();const r=s.layout.rooms.find(r=>r.id==='office');const e=s.depths.entries.find(e=>e.roomId==='office'&&e.id==='shared:fixture');s.player.teleportTo({x:r.origin.x+7.5,y:r.origin.y+6.5});s.synchronizePresentation();const before=s.player.getDisplayObject().depth>e.view.depth;s.travelTo('cv');const after=s.player.getDisplayObject().depth>e.view.depth;s.physics.world.resume();return {before,after}})()`);
  assert.deepEqual(overlapTravel,{before:true,after:false});results.push({overlapTravel});
  for(const roomId of ['office','gym'])for(const offset of [-.5,.5]) {
    await evaluate(`(()=>{const r=s.layout.rooms.find(r=>r.id==='${roomId}');s.player.teleportTo({x:r.origin.x+7.5,y:r.origin.y+6+${offset}});s.synchronizePresentation()})()`);
    const front=await evaluate(`s.player.getDisplayObject().depth>s.depths.entries.find(e=>e.roomId==='${roomId}'&&e.id==='shared:fixture').view.depth`);
    assert.equal(front,offset>0);
  }
  // Simulate unavailable optional art; suppress reloading it during this restart.
  await evaluate("s.preload=()=>{};s.textures.remove('player-up');s.textures.remove('television-console-front');s.scene.restart();void 0");await pause(1000);
  assert.equal(await evaluate('s.player.getDisplayObject()===s.playerSprite&&s.playerSprite.visible'),true);
  assert.equal(await evaluate("s.depths.entries.find(e=>e.id==='living-room-television').view.texture.key"),'furniture-placeholder');
  await reset([10,4.75]);await checkOrder('living-room-television',false);
  await evaluate("s.physics.world.pause();s.travelTo('media');s.physics.world.resume();void 0");
  assert.equal(await evaluate('s.player.getGroundY()===s.playerSprite.y+16'),true);
  await shot('missing-art');
  await evaluate('s.scene.restart();void 0');await pause(1000);
  assert.equal(await evaluate('s.depths.entries.length'),7);
  const fallbackListeners=await evaluate("s.events.listenerCount('postupdate')");
  assert.equal(fallbackListeners,listeners.post);
  await evaluate('s.game.destroy(true);void 0');await pause(500);
  assert.deepEqual(exceptions,[]);
  writeFileSync(`${output}/results.json`,JSON.stringify({url,results,listeners,firstFrames,exceptions},null,2));
  console.log('PASS no-step travel, restart cleanup, cross-room decorative/interactive fixtures, fallback and no exceptions');
}finally{
  for(const direction of ['ArrowUp','ArrowDown','ArrowLeft','ArrowRight'])await key(direction,'keyUp');
  await send('Page.reload');ws.close();
}
