// Adversarial loading/modal races in an isolated production-preview tab.
import assert from 'node:assert/strict';
import { mkdirSync, writeFileSync } from 'node:fs';
import { openBrowserSession } from './lib/browserSession.mjs';
const browser = await openBrowserSession(9333);
const { send, evaluate, errors } = browser;
const pause = ms => new Promise(resolve => setTimeout(resolve, ms));
async function until(expression) {
  const deadline = Date.now() + 15000;
  while (!await evaluate(expression)) { assert.ok(Date.now() < deadline, expression); await pause(50); }
}
const results = [];
try {
  await send('Runtime.enable'); await send('Page.enable');
  await send('Emulation.setDeviceMetricsOverride', { width: 390, height: 844, deviceScaleFactor: 1, mobile: true });
  await send('Emulation.setTouchEmulationEnabled', { enabled: true });
  await send('Page.navigate', { url: 'http://127.0.0.1:4173/?qa=nav-lifecycle' });
  await until(`document.querySelector('#game-status')?.textContent==='The interactive portfolio is ready.'`);
  const proto = await send('Runtime.evaluate', { expression: 'Phaser.Game.prototype' });
  const games = await send('Runtime.queryObjects', { prototypeObjectId: proto.result.objectId });
  await send('Runtime.callFunctionOn', { objectId: games.objects.objectId,
    functionDeclaration: 'function(){window.s=this.find(g=>g.scene?.isActive("HouseScene")).scene.getScene("HouseScene")}', returnByValue: true });
  await evaluate(`window.originalPrepare=s.prepareRoom; window.originalTravel=s.travelTo;window.travels=[];s.travelTo=function(id){travels.push(id);return originalTravel.call(this,id)};`);
  const begin = async () => {
    await evaluate(`s.prepareRoom=()=>new Promise((resolve,reject)=>{window.resolveRoom=resolve;window.rejectRoom=reject});document.querySelector('[data-destination="training"]').click();`);
    assert.equal(await evaluate('s.inputController.isGameplayEnabled()'), false);
  };
  await begin();
  await evaluate(`s.callbacks.onContentRequested(s.interactionSystem.getTargets()[0].contentId,'pointer');document.querySelector('dialog').close();`);
  await pause(100);
  assert.equal(await evaluate('s.inputController.isGameplayEnabled()'), false, 'modal close retains loading suspension');
  await evaluate('resolveRoom(true); void 0');
  await until('s.inputController.isGameplayEnabled()');
  assert.deepEqual(await evaluate('travels'), ['training']);
  results.push('modal close cannot unlock pending travel');

  await begin(); await evaluate(`rejectRoom(new Error('simulated load rejection')); void 0`);
  await until(`!document.querySelector('[data-destination="training"]').disabled`);
  assert.equal(await evaluate('s.inputController.isGameplayEnabled()'), true);
  assert.match(await evaluate(`document.querySelector('#game-status').textContent`), /not available/);
  results.push('rejected load restores controls/menu and reports failure');

  await begin(); const generation = await evaluate('s.getGeneration()');
  await evaluate(`s.prepareRoom=originalPrepare;s.scene.restart();void 0`);
  await until(`s.getGeneration()>${generation} && s.scene.isActive() && !!s.navigation`);
  const before = await evaluate('s.player.getFootCenter()');
  await evaluate('resolveRoom(true);void 0'); await pause(100);
  assert.deepEqual(await evaluate('s.player.getFootCenter()'), before, 'late completion cannot teleport restarted scene');
  assert.equal(await evaluate('s.inputController.isGameplayEnabled()'), true);
  assert.equal(await evaluate(`document.querySelector('[data-direction="up"]')?.disabled ?? document.querySelector('.mobile-dpad button')?.disabled`), false, 'mobile movement recovers');
  assert.deepEqual(await evaluate('travels'), ['training']);
  results.push('restart ignores stale travel and restores mobile controls');
  assert.deepEqual(errors, []);
  console.log('PASS', results);
} finally {
  mkdirSync('output/qa/port21/lifecycle', { recursive: true });
  writeFileSync('output/qa/port21/lifecycle/results.json', JSON.stringify({ results, errors }, null, 2) + '\n');
  await browser.close();
}
