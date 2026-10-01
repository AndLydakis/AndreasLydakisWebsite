// PORT-22: real computed layout and input checks in an isolated browser tab.
import assert from 'node:assert/strict';
import { mkdirSync, writeFileSync } from 'node:fs';
import { openBrowserSession } from './lib/browserSession.mjs';

const url = process.argv[2] ?? 'http://127.0.0.1:5173';
const output = process.env.QA_OUTPUT_DIR ?? 'output/qa/port22/development';
const browser = await openBrowserSession();
const { send, evaluate, errors } = browser;
const records = [];
const pause = ms => new Promise(resolve => setTimeout(resolve, ms));
try {
  await send('Runtime.enable'); await send('Page.enable');
  await send('Page.navigate', { url });
  const deadline = Date.now() + 30000;
  while (!await evaluate(`document.querySelector('#game-status')?.textContent==='The interactive portfolio is ready.'`)) {
    assert.ok(Date.now() < deadline, 'game ready'); await pause(100);
  }
  const proto = await send('Runtime.evaluate', { expression: 'Phaser.Game.prototype' });
  const games = await send('Runtime.queryObjects', { prototypeObjectId: proto.result.objectId });
  await send('Runtime.callFunctionOn', { objectId: games.objects.objectId,
    functionDeclaration: 'function(){window.qaScene=this.find(g=>g.scene?.isActive("HouseScene")).scene.getScene("HouseScene")}' });
  // No reloads: these also exercise resize, rotation and capability transitions.
  for (const [width, height, touch] of [[1440,900,false],[897,900,false],[896,900,false],
    [850,900,false],[844,390,false],[390,844,false],[390,844,true],[844,390,true],
    [320,740,true],[1440,900,true],[1440,900,false],[850,900,false]]) {
    await send('Emulation.setDeviceMetricsOverride', { width, height, deviceScaleFactor: 1, mobile: false });
    await send('Emulation.setTouchEmulationEnabled', { enabled: touch });
    await pause(100);
    const state = await evaluate(`(()=>{
      const root=document.querySelector('.mobile-controls'),shell=document.querySelector('.game-shell'),
        canvas=document.querySelector('.canvas-layer'),ui=document.querySelector('.game-ui-layer');
      const rect=e=>{const r=e.getBoundingClientRect();return {x:r.x,y:r.y,width:r.width,height:r.height,right:r.right,bottom:r.bottom}};
      return {width:innerWidth,coarse:matchMedia('(any-pointer: coarse)').matches,
        display:getComputedStyle(root).display,grid:getComputedStyle(shell).display,
        uiBottom:getComputedStyle(ui).bottom,uiRight:getComputedStyle(ui).right,
        root:rect(root),shell:rect(shell),canvas:rect(canvas),
        buttons:[...root.querySelectorAll('.d-pad button')].map(rect)};
    })()`);
    assert.equal(state.coarse, touch, 'emulated capability actually matches');
    assert.equal(state.display, touch ? 'flex' : 'none');
    if (!touch) {
      assert.equal(state.grid, 'block', 'no empty side rail');
      assert.equal(state.uiBottom, '0px'); assert.equal(state.uiRight, '0px');
      assert.ok(Math.abs(state.shell.height - state.canvas.height - 6) < 1, 'no reserved bottom strip');
      assert.ok(Math.abs(state.shell.width - state.canvas.width - 6) < 1, 'canvas fills shell');
      await send('Input.dispatchKeyEvent', { type: 'keyDown', key: 'ArrowRight', code: 'ArrowRight', windowsVirtualKeyCode: 39 });
      assert.equal(await evaluate('qaScene.inputController.getMovementSnapshot().right'), true);
      await send('Input.dispatchKeyEvent', { type: 'keyUp', key: 'ArrowRight', code: 'ArrowRight', windowsVirtualKeyCode: 39 });
      assert.equal(await evaluate('qaScene.inputController.getMovementSnapshot().right'), false);
    } else {
      const rail = width > height && height <= 512 && width <= 896;
      assert.equal(state.grid, rail ? 'grid' : 'block');
      assert.ok(rail ? state.root.x >= state.canvas.right - 1 : state.root.y >= state.canvas.bottom - 1,
        'touch controls stay outside canvas');
      for (const rect of state.buttons) assert.ok(rect.width >= 44 && rect.height >= 44);
      await evaluate(`document.querySelector('.d-pad button[data-direction="right"]').scrollIntoView({block:'center'})`);
      const point = await evaluate(`(()=>{const r=document.querySelector('.d-pad button[data-direction="right"]').getBoundingClientRect();return {x:r.x+r.width/2,y:r.y+r.height/2}})()`);
      await send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [point] });
      assert.equal(await evaluate('qaScene.inputController.getMovementSnapshot().right'), true, 'D-pad touch press');
      await send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
      assert.equal(await evaluate('qaScene.inputController.getMovementSnapshot().right'), false, 'D-pad release');
    }
    records.push({ width, height, touch, state });
    console.log(`PASS ${width}x${height} ${touch ? 'touch' : 'mouse'}`);
  }
  // Losing touch capability during a held gesture must not leave movement stuck.
  await send('Emulation.setTouchEmulationEnabled', { enabled: true });
  await pause(100);
  await evaluate(`document.querySelector('.d-pad button[data-direction="right"]').scrollIntoView({block:'center'})`);
  const heldPoint = await evaluate(`(()=>{const r=document.querySelector('.d-pad button[data-direction="right"]').getBoundingClientRect();return {x:r.x+r.width/2,y:r.y+r.height/2}})()`);
  await send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [heldPoint] });
  assert.equal(await evaluate('qaScene.inputController.getMovementSnapshot().right'), true);
  await send('Emulation.setTouchEmulationEnabled', { enabled: false });
  await pause(100);
  const hiddenGesture = await evaluate(`({hidden:getComputedStyle(document.querySelector('.mobile-controls')).display==='none',right:qaScene.inputController.getMovementSnapshot().right})`);
  assert.deepEqual(hiddenGesture, { hidden: true, right: false });
  records.push({ scenario: 'held touch capability removal', ...hiddenGesture });
  assert.deepEqual(errors, []);
} finally {
  mkdirSync(output, { recursive: true });
  writeFileSync(`${output}/results.json`, JSON.stringify({ records, errors }, null, 2) + '\n');
  await browser.close();
}
