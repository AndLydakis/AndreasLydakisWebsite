// Isolated Chrome/CDP QA for the living-room television placement.
// Run: node scripts/verify-tv-label-clearance-browser.mjs [URL] [CDP port]
import assert from 'node:assert/strict';
import { mkdirSync, writeFileSync } from 'node:fs';

const url = process.argv[2] ?? 'http://127.0.0.1:5176/';
const port = process.argv[3] ?? '9340';
const outputDir = 'output/qa/tv-label-clearance';
mkdirSync(outputDir, { recursive: true });
const targets = await (await fetch(`http://127.0.0.1:${port}/json`)).json();
const page = targets.find(target => target.type === 'page');
assert.ok(page, 'No isolated QA page is available');
const ws = new WebSocket(page.webSocketDebuggerUrl);
await new Promise((resolve, reject) => {
  ws.addEventListener('open', resolve, { once: true });
  ws.addEventListener('error', reject, { once: true });
});
let sequence = 0;
const pending = new Map();
const exceptions = [];
ws.addEventListener('message', ({ data }) => {
  const message = JSON.parse(data);
  if (message.method === 'Runtime.exceptionThrown') exceptions.push(message.params.exceptionDetails);
  const request = pending.get(message.id);
  if (!request) return;
  pending.delete(message.id);
  if (message.error) request.reject(Error(JSON.stringify(message.error)));
  else request.resolve(message.result);
});
const send = (method, params = {}) => new Promise((resolve, reject) => {
  const id = ++sequence;
  pending.set(id, { resolve, reject });
  ws.send(JSON.stringify({ id, method, params }));
});
const evaluate = async expression => {
  const response = await send('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true });
  if (response.exceptionDetails) throw Error(JSON.stringify(response.exceptionDetails));
  return response.result.value;
};
const pause = ms => new Promise(resolve => setTimeout(resolve, ms));

await send('Runtime.enable');
await send('Page.enable');
await send('Emulation.setDeviceMetricsOverride', { width: 1280, height: 900, deviceScaleFactor: 1, mobile: false });
await send('Page.navigate', { url });
for (let attempt = 0; attempt < 100; attempt++) {
  if (await evaluate('typeof Phaser !== "undefined" && !!document.querySelector("canvas")')) break;
  await pause(100);
}
const prototype = await send('Runtime.evaluate', { expression: 'Phaser.Game.prototype' });
const games = await send('Runtime.queryObjects', { prototypeObjectId: prototype.result.objectId });
for (let attempt = 0; attempt < 100 && !(await evaluate('!!window.s?.player')); attempt++) {
  await send('Runtime.callFunctionOn', {
    objectId: games.objects.objectId,
    functionDeclaration: 'function(){window.s=this.find(g=>g.scene?.getScene("HouseScene")?.player)?.scene.getScene("HouseScene")}',
  });
  await pause(100);
}
assert.equal(await evaluate('!!window.s?.player'), true);
const result = await evaluate(`(()=>{
  const room=s.layout.rooms.find(room=>room.id==='living-room');
  const tv=room.interactables.find(item=>item.id==='living-room-television');
  s.player.teleportTo({x:room.origin.x+10,y:room.origin.y+6.25});
  s.interactionSystem.update(s.player.getState());
  s.synchronizePresentation();
  const label=s.renderLayers.interactableLabels.get(tv.id).getBounds();
  const table=s.depths.entries.find(entry=>entry.id==='living-room-coffee-table').view.getBounds();
  return {position:tv.position,groundAnchor:tv.groundAnchor,footprint:tv.footprints[0],label,table};
})()`);
assert.deepEqual(result.position, { x: 9.5, y: 3.5 });
assert.deepEqual(result.groundAnchor, { x: 10, y: 5.0625 });
assert.deepEqual(result.footprint, { x: 9, y: 4.75, width: 2, height: 0.3125 });
console.error('Television clearance:', JSON.stringify(result, null, 2));
assert.ok(result.label.y + result.label.height <= result.table.y,
  'Television label must end above the table sprite');
await pause(150);
const capture = await send('Page.captureScreenshot', { format: 'png', captureBeyondViewport: false });
writeFileSync(`${outputDir}/desktop.png`, capture.data, 'base64');
assert.deepEqual(exceptions, []);
console.log(JSON.stringify({ result, exceptions: exceptions.length }, null, 2));
ws.close();
