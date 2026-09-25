// Run against an isolated Chrome CDP instance, never the owner's active tabs.
import assert from 'node:assert/strict';
import { mkdirSync, writeFileSync } from 'node:fs';
const url = process.argv[2] ?? 'http://127.0.0.1:5173';
const output = `output/qa/quick-travel/${url.includes(':4173') ? 'production' : 'development'}`;
mkdirSync(output, { recursive: true });
const tabs = await (await fetch(`http://127.0.0.1:${process.argv[3] ?? 9333}/json`)).json();
const ws = new WebSocket(tabs.find(tab => tab.type === 'page').webSocketDebuggerUrl);
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
  // Scrolling the game into view can put another row under a stationary mouse;
  // that genuine hover may move the glove, but must never change the landing.
  assert.equal((await highlight()).length,1);
};
try {
  await send('Runtime.enable');await send('Page.enable');
  for (const [name,width,height,mobile] of [['desktop',1280,900,false],['portrait',390,844,true],['landscape',844,390,true],['narrow',320,640,true]]) {
    await send('Emulation.setDeviceMetricsOverride',{width,height,deviceScaleFactor:1,mobile});
    await send('Emulation.setTouchEmulationEnabled',{enabled:mobile,maxTouchPoints:5});
    await send('Page.navigate',{url});await pause(2000);
    const proto = await send('Runtime.evaluate',{expression:'Phaser.Game.prototype'});
    const games = await send('Runtime.queryObjects',{prototypeObjectId:proto.result.objectId});
    await send('Runtime.callFunctionOn',{objectId:games.objects.objectId,functionDeclaration:'function(){window.s=this[0].scene.getScene("HouseScene")}'});
    assert.deepEqual(await highlight(),['cv']);
    assert.equal(await evaluate("document.querySelectorAll('.quick-travel button:not(:disabled)').length"),4);
    assert.equal(await evaluate('document.documentElement.scrollWidth<=innerWidth'),true);
    assert.equal(await evaluate(`Array.from(document.querySelectorAll('.quick-travel button')).every(b=>b.getBoundingClientRect().height>=${mobile ? 44 : 29})`),true);
    if (!mobile) {
      const before = await evaluate('({x:s.playerSprite.x,y:s.playerSprite.y})');
      await send('Input.dispatchMouseEvent',{type:'mouseMoved',...await point('training')});
      assert.deepEqual(await highlight(),['training']);
      assert.deepEqual(await evaluate('({x:s.playerSprite.x,y:s.playerSprite.y})'),before);
      await evaluate(`document.querySelector('${selector('cv')}').focus()`);
      await key('ArrowDown','ArrowDown',40);
      assert.deepEqual(await highlight(),['media']);
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
    // Modal guard protects movement even from an external/programmatic request.
    assert.equal(await evaluate("s.inputController.setGameplayEnabled(false);s.travelTo('cv')"),false);
    await evaluate(`s.inputController.setGameplayEnabled(true);document.querySelector('${selector('cv')}').click();window.scrollTo(0,0)`);await pause(150);
    const shot = await send('Page.captureScreenshot',{format:'png',captureBeyondViewport:true});
    writeFileSync(`${output}/${name}.png`,Buffer.from(shot.data,'base64'));
    console.log(`PASS ${name}: glove, all destinations twice, camera/feet, input reset, no overflow, modal guard`);
  }
  assert.deepEqual(exceptions,[]);
  console.log('PASS no uncaught exceptions');
} finally { await send('Page.reload'); ws.close(); }
