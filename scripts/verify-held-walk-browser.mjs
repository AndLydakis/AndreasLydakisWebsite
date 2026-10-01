// Sustained real keyboard events including OS-style repeat, in an isolated tab.
// Disable furniture only in this temporary fixture to measure uninterrupted gait.
import assert from 'node:assert/strict';
import { mkdirSync, writeFileSync } from 'node:fs';
import { openBrowserSession } from './lib/browserSession.mjs';
const url = process.argv[2] ?? 'http://127.0.0.1:5173';
const output = process.env.QA_OUTPUT_DIR ?? 'output/qa/held-walk/development';
const b = await openBrowserSession();
const { send, evaluate, errors } = b;
const records = [];
const pause = ms => new Promise(resolve => setTimeout(resolve, ms));
try {
  await send('Runtime.enable'); await send('Page.enable');
  await send('Emulation.setDeviceMetricsOverride', { width:1280, height:900, deviceScaleFactor:1, mobile:false });
  await send('Page.navigate', { url });
  const deadline = Date.now()+30000;
  while (!await evaluate(`document.querySelector('#game-status')?.textContent==='The interactive portfolio is ready.'`)) {
    assert.ok(Date.now()<deadline); await pause(100);
  }
  const proto = await send('Runtime.evaluate', { expression:'Phaser.Game.prototype' });
  const games = await send('Runtime.queryObjects', { prototypeObjectId:proto.result.objectId });
  await send('Runtime.callFunctionOn', { objectId:games.objects.objectId,
    functionDeclaration:'function(){window.s=this.find(g=>g.scene?.isActive("HouseScene")).scene.getScene("HouseScene")}' });
  for (const [key,code,direction] of [['ArrowRight','ArrowRight','right'],['ArrowLeft','ArrowLeft','left'],
    ['ArrowUp','ArrowUp','up'],['ArrowDown','ArrowDown','down'],['d','KeyD','right'],
    ['a','KeyA','left'],['w','KeyW','up'],['s','KeyS','down']]) {
    await evaluate(`(()=>{s.navigation.cancel();s.collisionSystem.playerCollider.active=false;
      s.player.teleportTo({x:s.physics.world.bounds.centerX/16,y:s.physics.world.bounds.centerY/16});
      document.querySelector('#game-shell').focus();window.walkRows=[];
      window.walkListener=()=>{const v=s.player.options.visual;walkRows.push({time:performance.now(),x:s.playerSprite.x,y:s.playerSprite.y,phase:v.phase,frame:Number(v.sprite.frame.name),animation:v.sprite.anims.currentAnim.key})};
      s.events.on('postupdate',walkListener);})()`);
    await send('Input.dispatchKeyEvent', {type:'keyDown',key,code});
    await pause(350);
    const repeatStart = await evaluate('performance.now()');
    for(let i=0;i<30;i++) {
      await send('Input.dispatchKeyEvent', {type:'keyDown',key,code,autoRepeat:true}); await pause(30);
    }
    const rows = await evaluate('s.events.off("postupdate",walkListener);walkRows');
    await send('Input.dispatchKeyEvent', {type:'keyUp',key,code}); await pause(50);
    const repeated = rows.filter(r=>r.time>=repeatStart);
    let resets=0,travel=0;
    for(let i=1;i<repeated.length;i++) {
      const a=repeated[i-1],z=repeated[i],d=Math.hypot(z.x-a.x,z.y-a.y);
      travel+=d;
      if(Math.abs(z.phase-(a.phase+d/72)%1)>1e-6) resets++;
    }
    const frames=[...new Set(repeated.map(r=>r.frame))];
    const idle=await evaluate('s.player.getDisplayObject().anims.currentAnim.key');
    records.push({key,direction,travel,resets,frames,idle,rows});
    console.log(JSON.stringify({key,travel,resets,frames,idle}));
  }
  for(const r of records) {
    assert.equal(r.resets,0,`${r.key}: repeat must not reset gait`);
    assert.ok(r.travel>72,'sustained actual movement');
    assert.equal(r.frames.length,8,`${r.key}: all gait phase slots reached`);
    assert.equal(r.idle,`player-idle-${r.direction}`);
  }
  assert.deepEqual(errors,[]);
} finally {
  mkdirSync(output,{recursive:true});
  writeFileSync(`${output}/results.json`,JSON.stringify({records,errors},null,2)+'\n');
  await b.close();
}
