// Isolated Chrome: node scripts/verify-globe-gallery-browser.mjs [URL] [CDP port].
import assert from 'node:assert/strict';
import { mkdirSync, writeFileSync } from 'node:fs';
const url = process.argv[2] ?? 'http://127.0.0.1:5173';
const output = process.argv[4] ?? `output/qa/globe-gallery/${url.includes(':4173') ? 'production' : 'development'}`;
mkdirSync(output, { recursive: true });
const tabs = await (await fetch(`http://127.0.0.1:${process.argv[3] ?? 9333}/json`)).json();
const ws = new WebSocket(tabs.find(t => t.type === 'page').webSocketDebuggerUrl);
await new Promise(resolve => ws.addEventListener('open', resolve, { once: true }));
let sequence = 0; const pending = new Map(), exceptions = [];
ws.addEventListener('message', ({ data }) => {
  const message = JSON.parse(data);
  if (message.method === 'Runtime.exceptionThrown') exceptions.push(message.params.exceptionDetails);
  if (message.id) { const p = pending.get(message.id); pending.delete(message.id); message.error ? p.reject(message.error) : p.resolve(message.result); }
});
const send = (method, params = {}) => new Promise((resolve, reject) => {
  const id = ++sequence; pending.set(id, { resolve, reject }); ws.send(JSON.stringify({ id, method, params }));
});
const evaluate = async expression => {
  const r = await send('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true });
  if (r.exceptionDetails) throw Error(JSON.stringify(r.exceptionDetails));
  return r.result.value;
};
const pause = ms => new Promise(resolve => setTimeout(resolve, ms));
const key = async (name, duration = 80) => {
  const fields = { key: name, code: name.length === 1 && name !== ' ' ? `Key${name.toUpperCase()}` : name === ' ' ? 'Space' : name,
    windowsVirtualKeyCode: ({ Escape: 27, Enter: 13, ' ': 32, ArrowLeft: 37, ArrowUp: 38, ArrowRight: 39, ArrowDown: 40, End: 35 })[name] ?? name.toUpperCase().charCodeAt(0) };
  await send('Input.dispatchKeyEvent', { type: 'keyDown', ...fields }); await pause(duration);
  await send('Input.dispatchKeyEvent', { type: 'keyUp', ...fields }); await pause(150);
};
const tap = async selector => {
  await evaluate(`document.querySelector('${selector}').scrollIntoView({block:'center'});void 0`); await pause(150);
  const point = await evaluate(`(()=>{const r=document.querySelector('${selector}').getBoundingClientRect();return{x:r.x+r.width/2,y:r.y+r.height/2}})()`);
  await send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ ...point, id: 1 }] });
  await send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] }); await pause(200);
};
const screenshot = async name => {
  const image = await send('Page.captureScreenshot', { format: 'png', captureBeyondViewport: true });
  writeFileSync(`${output}/${name}.png`, Buffer.from(image.data, 'base64'));
};
const position = async (x, y) => { await evaluate(`s.playerSprite.body.reset(${x * 16},${y * 16 - 16});document.querySelector('#game-shell').focus();void 0`); await pause(200); };
try {
  await send('Runtime.enable'); await send('Page.enable');
  await send('Page.navigate', { url }); await pause(3000);
  const proto = await send('Runtime.evaluate', { expression: 'Phaser.Game.prototype' });
  const games = await send('Runtime.queryObjects', { prototypeObjectId: proto.result.objectId });
  await send('Runtime.callFunctionOn', { objectId: games.objects.objectId, functionDeclaration: 'function(){window.s=this[0].scene.getScene("HouseScene")}' });
  assert.equal(await evaluate("s.textures.exists('globe-stand-front')"), true);
  for (const [name, width, height, mobile] of [['desktop',1280,900,false],['portrait',390,844,true],['landscape',844,390,true]]) {
    await send('Emulation.setDeviceMetricsOverride', { width, height, deviceScaleFactor: 1, mobile });
    await send('Emulation.setTouchEmulationEnabled', { enabled: mobile, maxTouchPoints: 5 }); await pause(300);
    await position(6,12.75);
    assert.equal(await evaluate('s.interactionSystem.getCurrentTarget()?.id'), 'living-room-globe');
    await screenshot(`${name}-globe`);
    for (const activation of mobile ? ['touch','touch'] : ['e','f','Enter',' ']) {
      if (mobile) await tap('.mobile-interact'); else await key(activation);
      assert.equal(await evaluate("document.querySelector('dialog').open"), true);
      assert.equal(await evaluate("document.querySelector('#dialog-title').textContent"), 'Around the world');
      assert.equal(await evaluate('s.inputController.isGameplayEnabled()'), false);
      assert.equal(await evaluate("document.querySelectorAll('.dialog-gallery figure').length"), 3);
      if (await evaluate("!document.querySelector('.dialog-reveal').hidden")) await evaluate("document.querySelector('.dialog-reveal').click()");
      await evaluate("document.querySelector('.dialog-gallery').focus()");
      if (!mobile) await key('End');
      else {
        const p = await evaluate("(()=>{const r=document.querySelector('.dialog-body').getBoundingClientRect();return {x:r.x+r.width/2,y:r.y+r.height*.8,distance:r.height*.6}})()");
        await send('Input.synthesizeScrollGesture',{x:p.x,y:p.y,yDistance:-p.distance,speed:600,gestureSourceType:'touch'}); await pause(300);
      }
      assert.ok(await evaluate("document.querySelector('.dialog-body').scrollTop > 0"), `${name}: native scroll`);
      await evaluate("document.querySelector('.dialog-gallery figure:last-child').scrollIntoView({block:'end'})"); await pause(400);
      assert.equal(await evaluate("Array.from(document.querySelectorAll('.dialog-gallery img')).every(i=>i.complete&&i.naturalWidth>0)"), true);
      assert.equal(await evaluate('document.documentElement.scrollWidth<=innerWidth'), true);
      await screenshot(`${name}-gallery-end`);
      if (mobile) await tap('.dialog-close'); else await key('Escape');
      assert.equal(await evaluate('s.inputController.isGameplayEnabled()'), true);
      assert.equal(await evaluate("document.activeElement.id"), 'game-shell');
    }
    // Existing single-photo and text dialogs must not retain the previous gallery.
    for (const id of ['office-dog-photo','livingroom-media','office-cv']) {
      await evaluate(`s.callbacks.onContentRequested('${id}','keyboard');void 0`);
      assert.equal(await evaluate("document.querySelectorAll('.dialog-gallery').length"),0);
      if(id==='office-dog-photo') assert.equal(await evaluate("document.querySelectorAll('.dialog-image').length"),1);
      await evaluate("document.querySelector('.dialog-close').click()"); await pause(150);
    }
    console.log(`PASS ${name}: globe, keyboard/touch gallery scroll, images, close/focus, existing dialogs`);
  }
  // Four-sided base collision: only feet are solid; surrounding routes remain open.
  const base = { left: (2+3.375)*16, right: (2+4.625)*16, top: (4+7.75)*16, bottom: (4+8.125)*16 };
  for(const [x,y,direction] of [[6,12.75,'ArrowUp'],[6,11.25,'ArrowDown'],[4.5,12,'ArrowRight'],[7.5,12,'ArrowLeft']]) {
    await position(x,y); await key(direction,450);
    const b=await evaluate('({x:s.playerSprite.body.x,right:s.playerSprite.body.right,y:s.playerSprite.body.y,bottom:s.playerSprite.body.bottom})');
    assert.ok(direction==='ArrowUp'?b.y>=base.bottom-.01:direction==='ArrowDown'?b.bottom<=base.top+.01:direction==='ArrowRight'?b.right<=base.left+.01:b.x>=base.right-.01, direction);
  }
  if(url.includes(':5173')) {
    // Render helper fixtures inside the real dialog; don't depend on V8 retaining
    // a discoverable private DialogManager instance across hot module reloads.
    for(const count of [0,1,150]) {
      await evaluate(`(async()=>{s.callbacks.onContentRequested('livingroom-travel','keyboard');document.querySelector('.dialog-gallery').replaceWith((await import('/src/ui/PhotoGallery.ts')).createPhotoGallery(Array.from({length:${count}},(_,i)=>({src:'/assets/photos/travel/japan-placeholder.png',alt:'Test '+i,caption:'Picture '+i}))));})()`);
      assert.equal(await evaluate("document.querySelectorAll('.dialog-gallery figure').length"),count);
      if(count===0)assert.match(await evaluate("document.querySelector('.dialog-gallery').textContent"),/No pictures yet/);
      else {
        assert.equal(await evaluate("document.querySelector('.dialog-body').scrollTop"),0);
        await evaluate("document.querySelector('.dialog-gallery img').dispatchEvent(new Event('error'));void 0");
        assert.match(await evaluate("document.querySelector('.gallery-error').textContent"),/Picture unavailable: Test 0/);
      }
      await evaluate("document.querySelector('.dialog-close').click()");await pause(150);
    }
    console.log('PASS empty/single/150-photo lists, error fallback and reset');
  }
  assert.deepEqual(exceptions,[]);console.log('PASS four-sided globe base and no uncaught exceptions');
} finally { await send('Page.reload');ws.close(); }
