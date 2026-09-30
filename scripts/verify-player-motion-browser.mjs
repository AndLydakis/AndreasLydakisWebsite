// Isolated, temporary browser fixtures. No changes to saved game data.
// node scripts/verify-player-motion-browser.mjs [URL] [CDP port]
import assert from 'node:assert/strict';
import { mkdirSync, writeFileSync } from 'node:fs';

const url = process.argv[2] ?? 'http://127.0.0.1:5173';
const output = process.env.QA_OUTPUT_DIR ?? `output/qa/player-motion/${url.includes(':4173') ? 'production' : 'development'}`;
mkdirSync(output, {recursive:true});
const targets = await (await fetch(`http://127.0.0.1:${process.argv[3] ?? 9333}/json`)).json();
const ws = new WebSocket(targets.find(t => t.type === 'page').webSocketDebuggerUrl);
await new Promise(resolve => ws.addEventListener('open', resolve, {once:true}));
let id = 0;
const pending = new Map(), errors = [], results = [];
ws.addEventListener('message', ({data}) => {
  const m = JSON.parse(data);
  if (m.method === 'Runtime.exceptionThrown') errors.push(m.params.exceptionDetails);
  if (!m.id) return;
  const p = pending.get(m.id); pending.delete(m.id);
  m.error ? p.reject(m.error) : p.resolve(m.result);
});
const send = (method, params = {}) => new Promise((resolve,reject) => {
  const n = ++id; pending.set(n,{resolve,reject}); ws.send(JSON.stringify({id:n,method,params}));
});
const evaluate = async expression => {
  const r = await send('Runtime.evaluate', {expression,awaitPromise:true,returnByValue:true});
  if (r.exceptionDetails) throw Error(JSON.stringify(r.exceptionDetails));
  return r.result.value;
};
const pause = ms => new Promise(resolve => setTimeout(resolve,ms));
const key = (name,down) => send('Input.dispatchKeyEvent', {type:down?'keyDown':'keyUp',key:name,code:name,
  windowsVirtualKeyCode:{ArrowLeft:37,ArrowUp:38,ArrowRight:39,ArrowDown:40}[name]});

try {
  await send('Runtime.enable'); await send('Page.enable');
  await send('Emulation.setDeviceMetricsOverride',{width:1280,height:900,deviceScaleFactor:1,mobile:false});
  await send('Page.navigate',{url}); await pause(3000);
  const proto = await send('Runtime.evaluate',{expression:'Phaser.Game.prototype'});
  const games = await send('Runtime.queryObjects',{prototypeObjectId:proto.result.objectId});
  await send('Runtime.callFunctionOn',{objectId:games.objects.objectId,
    functionDeclaration:'function(){window.motionScene=this[0].scene.getScene("HouseScene")}',returnByValue:true});
  await evaluate(`window.motionRestore={x:motionScene.playerSprite.x,y:motionScene.playerSprite.y,active:motionScene.collisionSystem.playerCollider.active};`);
  for (const keys of [['ArrowRight'],['ArrowLeft'],['ArrowUp'],['ArrowDown'],['ArrowRight','ArrowDown']]) {
    // Remove furniture interference only for a controlled stride/camera measurement.
    await evaluate(`(()=>{const s=motionScene;s.collisionSystem.playerCollider.active=false;s.playerSprite.body.reset(512,272);document.querySelector('#game-shell').focus();})()`);
    await pause(100);
    await evaluate(`(()=>{const s=motionScene;window.motionRows=[];window.motionListener=(time,delta)=>{const a=s.playerSprite,c=s.cameras.main,v=s.player.options.visual;
      motionRows.push({time,delta,x:a.x,y:a.y,screenX:(a.x-c.scrollX)*c.zoom,screenY:(a.y-c.scrollY)*c.zoom,phase:v.phase,frame:Number(v.sprite.frame.name),animation:v.sprite.anims.currentAnim.key});};s.events.on('postupdate',motionListener);})()`);
    for (const k of keys) await key(k,true);
    await pause(850);
    for (const k of keys) await key(k,false);
    const rows = await evaluate(`(()=>{motionScene.events.off('postupdate',motionListener);return motionRows;})()`);
    const moving = rows.filter(r=>r.animation.includes('-walk-'));
    assert.ok(moving.length>15,'movement actually occurred');
    const spread = field => Math.max(...moving.map(r=>r[field]))-Math.min(...moving.map(r=>r[field]));
    assert.ok(spread('screenX')<1e-6 && spread('screenY')<1e-6,'camera tracks completed physics position without wobble');
    let distance=0;
    for(let i=1;i<moving.length;i++) {
      const a=moving[i-1], b=moving[i]; const d=Math.hypot(b.x-a.x,b.y-a.y);distance+=d;
      const expected=(a.phase+d/72)%1;
      assert.ok(Math.abs(b.phase-expected)<1e-6,'gait tracks actual distance');
      assert.equal(b.frame,Math.min(7,Math.floor(b.phase*8)));
    }
    const summary={keys,frames:moving.length,distance,screenJitterX:spread('screenX'),screenJitterY:spread('screenY')};
    results.push(summary); console.log('PASS',summary);
    writeFileSync(`${output}/${keys.join('-')}.json`,JSON.stringify(rows,null,2));
  }
  // With real collisions restored, held movement against a counter must idle.
  await evaluate(`(()=>{const s=motionScene;s.collisionSystem.playerCollider.active=true;const r=s.layout.rooms.find(r=>r.id==='kitchen');s.playerSprite.body.reset((r.origin.x+2.6)*16,30*16-16);document.querySelector('#game-shell').focus();})()`);
  await key('ArrowLeft',true); await pause(650);
  assert.equal(await evaluate('motionScene.player.options.visual.sprite.anims.currentAnim.key'),'player-idle-left');
  await key('ArrowLeft',false);
  // Pause/resume + listener cleanup: restart the scene and check registrations.
  const listeners = () => evaluate(`({post:motionScene.events.listenerCount('postupdate'),step:motionScene.physics.world.listenerCount('worldstep')})`);
  const before = await listeners();
  await evaluate('motionScene.scene.restart(); void 0'); await pause(1500);
  assert.deepEqual(await listeners(),before);
  assert.deepEqual(errors,[]);
  writeFileSync(`${output}/summary.json`,JSON.stringify({results,blockedIdle:true,restartListeners:before,exceptions:errors},null,2));
  console.log('PASS blocked idle, scene restart cleanup, no exceptions');
} finally {
  for (const k of ['ArrowLeft','ArrowRight','ArrowUp','ArrowDown']) await key(k,false);
  await evaluate(`(()=>{const s=window.motionScene;if(s&&window.motionRestore){if(window.motionListener)s.events.off('postupdate',motionListener);s.collisionSystem.playerCollider.active=motionRestore.active;s.playerSprite.body.reset(motionRestore.x,motionRestore.y);}delete window.motionRows;delete window.motionListener;delete window.motionRestore;delete window.motionScene;})()`).catch(()=>{});
  ws.close();
}
