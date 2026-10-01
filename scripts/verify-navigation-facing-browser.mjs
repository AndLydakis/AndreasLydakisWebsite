// Actual pointer commands on clear, non-interactive floor; no disabled collisions.
import assert from 'node:assert/strict';
import { mkdirSync, writeFileSync } from 'node:fs';
import { openBrowserSession } from './lib/browserSession.mjs';

const url = process.argv[2] ?? 'http://127.0.0.1:5173';
const output = process.env.QA_OUTPUT_DIR ?? 'output/qa/port21-facing/development';
const browser = await openBrowserSession(9333);
const { send, evaluate, errors } = browser;
const records = [];
try {
  await send('Runtime.enable'); await send('Page.enable');
  await send('Emulation.setDeviceMetricsOverride', { width: 1280, height: 900, deviceScaleFactor: 1, mobile: false });
  await send('Page.navigate', { url: `${url}/?qa=facing-regression` });
  const deadline = Date.now() + 30000;
  while (!await evaluate(`document.querySelector('#game-status')?.textContent==='The interactive portfolio is ready.'`)) {
    assert.ok(Date.now() < deadline, 'game ready');
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  const proto = await send('Runtime.evaluate', { expression: 'Phaser.Game.prototype' });
  const games = await send('Runtime.queryObjects', { prototypeObjectId: proto.result.objectId });
  await send('Runtime.callFunctionOn', { objectId: games.objects.objectId,
    functionDeclaration: 'function(){window.s=this.find(g=>g.scene?.isActive("HouseScene")).scene.getScene("HouseScene")}', returnByValue: true });
  for (const [dx, dy, expected] of [[64,1,'right'],[64,-1,'right'],[-64,1,'left'],[-64,-1,'left'],
    [1,64,'down'],[-1,64,'down'],[1,-64,'up'],[-1,-64,'up'],[64,0,'right'],[-64,0,'left'],[0,64,'down'],[0,-64,'up']]) {
    const setup = await evaluate(`(()=>{
      const planner=s.navigation.route.planner,targets=s.interactionSystem.getTargets();let pair;
      const hit=p=>targets.some(t=>{
        const q={x:p.x/16-.5,y:p.y/16-.5},r=t.bounds,l=t.labelActivationBounds;
        const d=r?Math.hypot(Math.max(r.x-q.x,0,q.x-r.x-r.width),Math.max(r.y-q.y,0,q.y-r.y-r.height)):Math.hypot(q.x-t.position.x,q.y-t.position.y);
        return d<=t.interactionRadiusTiles||l&&q.x>=l.x&&q.x<=l.x+l.width&&q.y>=l.y&&q.y<=l.y+l.height;
      });
      for(const room of s.layout.rooms){
        for(let y=(room.origin.y+2)*16;y<(room.origin.y+room.heightTiles-1)*16&&!pair;y+=4)
          for(let x=(room.origin.x+1)*16;x<(room.origin.x+room.widthTiles-1)*16&&!pair;x+=4){
            const a={x,y},z={x:x+${dx},y:y+${dy}};if(planner.segmentClear(a,z)&&!hit(z))pair={a,z};
          }
        if(pair)break;
      }
      if(!pair)return null;
      s.navigation.cancel();s.player.teleportTo({x:pair.a.x/16,y:(pair.a.y+.5)/16});s.synchronizePresentation();
      window.facingRows=[];let previous=s.player.getFootCenter();
      window.facingListener=()=>{const p=s.player.getFootCenter();facingRows.push({dx:p.x-previous.x,dy:p.y-previous.y,
        facing:s.player.getState().facing,animation:s.player.getDisplayObject().anims.currentAnim?.key});previous=p;};
      s.events.on('postupdate',facingListener);
      const c=s.cameras.main,r=s.game.canvas.getBoundingClientRect();
      return {...pair,screen:{x:r.left+((pair.z.x-c.scrollX)*c.zoom-c.width*(c.zoom-1)/2)*r.width/s.scale.width,
        y:r.top+((pair.z.y-c.scrollY)*c.zoom-c.height*(c.zoom-1)/2)*r.height/s.scale.height}};
    })()`);
    assert.ok(setup, `clear floor fixture for ${dx},${dy}`);
    await send('Input.dispatchMouseEvent', { type: 'mousePressed', ...setup.screen, button: 'left', clickCount: 1 });
    await send('Input.dispatchMouseEvent', { type: 'mouseReleased', ...setup.screen, button: 'left', clickCount: 1 });
    await new Promise(resolve => setTimeout(resolve, 850));
    const sample = await evaluate(`s.events.off('postupdate',facingListener);({rows:facingRows,end:s.player.getFootCenter(),facing:s.player.getState().facing,active:s.navigation.route.active})`);
    const moving = sample.rows.filter(row => Math.hypot(row.dx, row.dy) > 1e-4);
    assert.ok(moving.length > 10, 'actual physical movement recorded');
    for (const row of moving) {
      assert.equal(row.facing, expected, `actual displacement ${row.dx},${row.dy}`);
      assert.equal(row.animation, `player-walk-${expected}`, 'rendered animation matches travel');
    }
    assert.equal(sample.facing, expected, 'idle retains final direction');
    assert.equal(sample.active, false, 'route finishes');
    assert.ok(Math.hypot(sample.end.x-setup.z.x,sample.end.y-setup.z.y)<=.01, 'destination unchanged');
    records.push({ dx, dy, expected, setup, ...sample });
    console.log(`PASS (${dx},${dy}) -> ${expected}: ${moving.length} movement frames`);
  }
  assert.deepEqual(errors, []);
} finally {
  mkdirSync(output, { recursive: true });
  writeFileSync(`${output}/results.json`, JSON.stringify({ records, errors }, null, 2) + '\n');
  await browser.close();
}
