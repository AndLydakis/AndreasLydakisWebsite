// Isolated browser QA; no production debug hooks or collision disabling.
import assert from 'node:assert/strict';
import { mkdirSync, writeFileSync } from 'node:fs';
import { openBrowserSession } from './lib/browserSession.mjs';

const url = process.argv[2] ?? 'http://127.0.0.1:5173';
const output = process.env.QA_OUTPUT_DIR ?? 'output/qa/port21/browser';
mkdirSync(output, { recursive: true });
const browser = await openBrowserSession(9333);
const { send, evaluate, errors } = browser;
const pause = ms => new Promise(resolve => setTimeout(resolve, ms));
const records = [];
async function until(expression, timeout = 15000) {
  const deadline = Date.now() + timeout;
  while (!await evaluate(expression)) {
    if (Date.now() >= deadline) {
      const state = await evaluate(`(()=>{const s=window.navScene,r=s?.navigation?.route;return {status:document.querySelector('#game-status')?.textContent,hidden:document.hidden,dialog:document.querySelector('dialog')?.open,enabled:s?.inputController.isGameplayEnabled(),feet:s?.player.getFootCenter(),velocity:r?.velocity,route:r&&{index:r.index,path:r.path,started:r.started,progressAt:r.progressAt,now:performance.now(),search:!!r.search,automatic:s.navigation.automatic},errors:window.onerror}})()`);
      throw new Error(`Timed out: ${expression}\n${JSON.stringify(state)}`);
    }
    await pause(50);
  }
}
async function click(point, touch) {
  assert.ok(point.x >= 0 && point.y >= 0, 'pointer point is visible');
  if (touch) {
    await send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [point] });
    await send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
  } else {
    await send('Input.dispatchMouseEvent', { type: 'mousePressed', ...point, button: 'left', clickCount: 1 });
    await send('Input.dispatchMouseEvent', { type: 'mouseReleased', ...point, button: 'left', clickCount: 1 });
  }
}
try {
  await send('Runtime.enable'); await send('Page.enable');
  for (const [name, width, height, touch] of [['desktop', 1280, 900, false], ['portrait', 390, 844, true], ['landscape', 844, 390, true], ['narrow', 320, 740, true]]) {
    await send('Emulation.setDeviceMetricsOverride', { width, height, deviceScaleFactor: 1, mobile: touch });
    await send('Emulation.setTouchEmulationEnabled', { enabled: touch });
    const pageUrl = `${url}/?qa-navigation=${name}`;
    await send('Page.navigate', { url: pageUrl });
    await until(`location.href === ${JSON.stringify(pageUrl)} && document.querySelector('#game-status')?.textContent === 'The interactive portfolio is ready.'`, 30000);
    const proto = await send('Runtime.evaluate', { expression: 'Phaser.Game.prototype' });
    const games = await send('Runtime.queryObjects', { prototypeObjectId: proto.result.objectId });
    await send('Runtime.callFunctionOn', { objectId: games.objects.objectId,
      functionDeclaration: 'function(){window.navScene=this.find(g=>g.scene?.isActive("HouseScene")).scene.getScene("HouseScene")}', returnByValue: true });
    await evaluate(`(()=>{
      const s=navScene;window.navOpens=[];
      const open=s.callbacks.onContentRequested;
      s.callbacks.onContentRequested=(contentId,source)=>{
        const t=s.interactionSystem.getTargets().find(t=>t.id===window.navExpected);
        const p=s.player.getState().position,b=s.player.getInteractionBounds(),r=t?.bounds,l=t?.labelActivationBounds;
        const d=r?Math.hypot(Math.max(r.x-p.x,0,p.x-r.x-r.width),Math.max(r.y-p.y,0,p.y-r.y-r.height)):
          t?Math.hypot(p.x-t.position.x,p.y-t.position.y):Infinity;
        const inRange=!!t&&(d<=t.interactionRadiusTiles||!!l&&b.x<=l.x+l.width&&b.x+b.width>=l.x&&b.y<=l.y+l.height&&b.y+b.height>=l.y);
        navOpens.push({contentId,expectedContent:t?.contentId,source,inRange,feet:s.player.getFootCenter()});open(contentId,source)};
      window.navScreen=(x,y)=>{const c=s.cameras.main,r=s.game.canvas.getBoundingClientRect();
        return {x:r.left+((x-c.scrollX)*c.zoom-c.width*(c.zoom-1)/2)*r.width/s.scale.width,
          y:r.top+((y-c.scrollY)*c.zoom-c.height*(c.zoom-1)/2)*r.height/s.scale.height};};
    })()`);
    const targets = await evaluate(`navScene.interactionSystem.getTargets().map(t=>({id:t.id,room:t.roomId}))`);
    for (const { id, room } of targets) {
      for (const kind of ['radius', 'label']) {
        const point = await evaluate(`(()=>{
          const s=navScene;const rooms={'office':'cv','living-room':'media','gym':'training','kitchen':'food-log'};
          s.travelTo(rooms[${JSON.stringify(room)}]);
          const t=s.interactionSystem.getTargets().find(t=>t.id===${JSON.stringify(id)});
          window.navExpected=t.id;
          const b=t.labelActivationBounds;
          const p=${JSON.stringify(kind)}==='label'?{x:b.x+b.width/2,y:b.y+b.height/2}:t.position;
          document.querySelector('#game-shell').scrollIntoView({block:'center'});
          return navScreen((p.x+.5)*s.layout.tileSize,(p.y+.5)*s.layout.tileSize);
        })()`);
        const before = await evaluate('navOpens.length');
        await click(point, touch);
        await until(`navOpens.length>${before} || (!navScene.navigation.route.active && /Cannot|blocked|limit|timed out/.test(document.querySelector('#game-status').textContent))`);
        const result = await evaluate(`({opens:navOpens.slice(${before}),status:document.querySelector('#game-status').textContent,active:navScene.navigation.route.active})`);
        records.push({ name, id, kind, ...result });
        assert.equal(result.opens.length, 1, `${name} ${id} ${kind}: ${result.status}`);
        assert.equal(result.opens[0].source, 'pointer');
        assert.equal(result.opens[0].contentId, result.opens[0].expectedContent, 'selected content opened');
        assert.equal(result.opens[0].inRange, true, 'actual player in range of selected OBJECT, including shared music content');
        await evaluate(`document.querySelector('dialog[open]')?.close()`);
        await until('navScene.inputController.isGameplayEnabled()');
      }
    }
    // Floor input must remain movement-only, and a replacement invalid point
    // must stop the old route rather than continuing towards it.
    const floor = await evaluate(`(()=>{
      const s=navScene;s.travelTo('media');document.querySelector('#game-shell').scrollIntoView({block:'center'});
      const start=s.player.getFootCenter(),planner=s.navigation.route.planner,targets=s.interactionSystem.getTargets();
      const hit=p=>targets.some(t=>{const q={x:p.x/16-.5,y:p.y/16-.5},r=t.bounds,l=t.labelActivationBounds;
        const d=r?Math.hypot(Math.max(r.x-q.x,0,q.x-r.x-r.width),Math.max(r.y-q.y,0,q.y-r.y-r.height)):Math.hypot(q.x-t.position.x,q.y-t.position.y);
        return d<=t.interactionRadiusTiles||l&&q.x>=l.x&&q.x<=l.x+l.width&&q.y>=l.y&&q.y<=l.y+l.height;});
      let valid,invalid;
      for(let dy=-120;dy<=120;dy+=8)for(let dx=-160;dx<=160;dx+=8){
        const p={x:start.x+dx,y:start.y+dy},screen=navScreen(p.x,p.y);
        if(document.elementFromPoint(screen.x,screen.y)!==s.game.canvas||hit(p))continue;
        if(!valid&&Math.hypot(dx,dy)>24&&planner.segmentClear(start,p))valid={point:p,screen};
        if(!invalid&&!planner.clear(p))invalid={point:p,screen};
      }
      return {valid,invalid,start,opens:navOpens.length};
    })()`);
    assert.ok(floor.valid && floor.invalid, `${name} has floor/blocked test points`);
    await click(floor.valid.screen, touch);
    await until(`!navScene.navigation.route.active`);
    const arrived = await evaluate('navScene.player.getFootCenter()');
    assert.ok(Math.hypot(arrived.x-floor.valid.point.x,arrived.y-floor.valid.point.y)<=.01, 'exact floor arrival');
    assert.equal(await evaluate('navOpens.length'),floor.opens,'floor never opens nearby content');
    // Recalculate screen positions after camera follow, then reject blocked input.
    await evaluate(`navScene.travelTo('media')`);
    const validScreen = await evaluate(`navScreen(${floor.valid.point.x},${floor.valid.point.y})`);
    await click(validScreen,touch);
    const invalidScreen = await evaluate(`navScreen(${floor.invalid.point.x},${floor.invalid.point.y})`);
    await click(invalidScreen,touch);
    await until(`!navScene.navigation.route.active`);
    const stopped = await evaluate('navScene.player.getFootCenter()');await pause(150);
    assert.deepEqual(await evaluate('navScene.player.getFootCenter()'),stopped,'invalid replacement stays stopped');
    assert.match(await evaluate(`document.querySelector('#game-status').textContent`),/Cannot reach/);
    await evaluate(`navScene.travelTo('media')`);
    await click(await evaluate(`navScreen(${floor.valid.point.x},${floor.valid.point.y})`),touch);
    await send('Input.dispatchKeyEvent',{type:'keyDown',key:'ArrowRight',code:'ArrowRight',windowsVirtualKeyCode:39});
    await pause(40);
    await send('Input.dispatchKeyEvent',{type:'keyUp',key:'ArrowRight',code:'ArrowRight',windowsVirtualKeyCode:39});
    assert.equal(await evaluate('navScene.navigation.route.active'),false,'manual intent cancels');
    await evaluate(`navScene.travelTo('media')`);
    await click(await evaluate(`navScreen(${floor.valid.point.x},${floor.valid.point.y})`),touch);
    await until(`navScene.navigation.route.active && Math.hypot(navScene.playerSprite.body.velocity.x,navScene.playerSprite.body.velocity.y)>0`);
    const generation=await evaluate('navScene.getGeneration()');
    const listeners=await evaluate(`navScene.physics.world.listenerCount('worldstep')`);
    await evaluate('navScene.scene.restart(); void 0');
    await until(`navScene.getGeneration()>${generation} && navScene.scene.isActive() && !!navScene.navigation`,30000);
    assert.equal(await evaluate(`navScene.physics.world.listenerCount('worldstep')`),listeners,'restart keeps listener count');
    assert.equal(await evaluate('navScene.navigation.route.active'),false,'restart discards route');
    records.push({name,floor:true,invalidReplacement:true,manualCancellation:true,walkingRestart:true});
    assert.deepEqual(errors, []);
    const shot = await send('Page.captureScreenshot', { format: 'png' });
    writeFileSync(`${output}/${name}.png`, Buffer.from(shot.data, 'base64'));
    console.log(`PASS ${name}: ${targets.length} interactables via radius and label`);
  }
} finally {
  writeFileSync(`${output}/results.json`, JSON.stringify({ records, errors }, null, 2) + '\n');
  await browser.close();
}
