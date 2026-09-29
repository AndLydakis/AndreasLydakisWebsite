// Isolated CDP QA for persistent FF7-inspired interactable nameplates.
import assert from 'node:assert/strict';
import { mkdirSync, writeFileSync } from 'node:fs';

const url = process.argv[2] ?? 'http://127.0.0.1:5173';
const port = process.argv[3] ?? '9455';
const mode = url.includes(':4173') ? 'production' : 'development';
const output = `output/qa/interactable-nameplates/${mode}`;
mkdirSync(output, { recursive: true });

const tabs = await (await fetch(`http://127.0.0.1:${port}/json`)).json();
const tab = tabs.find(item => item.type === 'page' && item.url.startsWith(url))
  ?? tabs.find(item => item.type === 'page');
assert.ok(tab, 'No isolated QA page found');
const ws = new WebSocket(tab.webSocketDebuggerUrl);
await new Promise((resolve, reject) => {
  ws.addEventListener('open', resolve, { once: true });
  ws.addEventListener('error', reject, { once: true });
});
let sequence = 0;
const pending = new Map(), exceptions = [];
ws.addEventListener('message', ({ data }) => {
  const message = JSON.parse(data);
  if (message.method === 'Runtime.exceptionThrown') exceptions.push(message.params.exceptionDetails);
  if (!message.id || !pending.has(message.id)) return;
  const request = pending.get(message.id);
  pending.delete(message.id);
  clearTimeout(request.timer);
  message.error ? request.reject(Error(JSON.stringify(message.error))) : request.resolve(message.result);
});
const send = (method, params = {}) => new Promise((resolve, reject) => {
  const id = ++sequence;
  const timer = setTimeout(() => reject(Error(`CDP timeout: ${method}`)), 20_000);
  pending.set(id, { resolve, reject, timer });
  ws.send(JSON.stringify({ id, method, params }));
});
const evaluate = async expression => {
  const response = await send('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true });
  if (response.exceptionDetails) throw Error(JSON.stringify(response.exceptionDetails));
  return response.result.value;
};
const pause = milliseconds => new Promise(resolve => setTimeout(resolve, milliseconds));

await send('Page.navigate', { url });
await pause(1_000);
for (let attempt = 0; attempt < 100; attempt++) {
  if (await evaluate('typeof Phaser !== "undefined" && !!document.querySelector("canvas")')) break;
  await pause(100);
}
const proto = await send('Runtime.evaluate', { expression: 'Phaser.Game.prototype' });
for (let attempt = 0; attempt < 100 && !(await evaluate('!!window.s?.playerSprite?.body')); attempt++) {
  const games = await send('Runtime.queryObjects', { prototypeObjectId: proto.result.objectId });
  await send('Runtime.callFunctionOn', { objectId: games.objects.objectId,
    functionDeclaration: 'function(){window.s=this.find(g=>g.scene?.getScene("HouseScene")?.player)?.scene.getScene("HouseScene")}' });
  await pause(100);
}
assert.ok(await evaluate('!!window.s?.playerSprite?.body'), 'HouseScene did not become ready');
await evaluate('s.interactionSystem.setGameplayEnabled(false);void 0');

const labels = await evaluate(`(()=>s.children.list.filter(o=>o.name?.startsWith('interactable-label:')).map(c=>{
  const text=c.list.find(o=>o.type==='Text'),graphics=c.list.find(o=>o.type==='Graphics');
  return {name:c.name,x:c.x,y:c.y,depth:c.depth,visible:c.visible,text:text?.text,font:text?.style?.fontFamily,
    fontSize:text?.style?.fontSize,textWidth:text?.width,textHeight:text?.height,graphicsCommands:graphics?.commandBuffer?.length??0};
}))()`);
const expected = await evaluate(`(()=>s.layout.rooms.flatMap(room=>room.interactables.map(object=>{
  const x=object.groundAnchor?.x??object.position.x+.5;
  const footprintBottom=object.footprints?.length?Math.max(...object.footprints.map(r=>r.y+r.height)):undefined;
  const y=footprintBottom??object.groundAnchor?.y??object.position.y+1.5;
  return {name:'interactable-label:'+room.id+':'+object.id,id:object.id,roomId:room.id,text:object.label,
    baseX:(room.origin.x+x)*16,baseY:(room.origin.y+y)*16,roomLeft:room.origin.x*16,roomRight:(room.origin.x+room.widthTiles)*16};
})))()`);
assert.equal(labels.length, expected.length);
assert.equal(labels.length, 11);
for (const item of expected) {
  const label = labels.find(candidate => candidate.name === item.name);
  assert.ok(label, item.name);
  assert.equal(label.text, item.text);
  const width = Math.max(28, Math.ceil(label.textWidth) + 8);
  assert.equal(label.x, Math.max(item.roomLeft + width / 2 + 2, Math.min(item.baseX, item.roomRight - width / 2 - 2)));
  assert.equal(label.y, item.baseY + 2 + (Math.ceil(label.textHeight) + 6) / 2);
  assert.equal(label.depth, 8.5);
  assert.equal(label.visible, true);
  assert.equal(label.font, "'Courier New', Courier, monospace");
  assert.equal(label.fontSize, '5px');
  assert.ok(label.graphicsCommands > 0);
}

const flagModes = await evaluate(`(()=>{
  const visible=()=>s.children.list.filter(o=>o.name?.startsWith('interactable-label:')&&o.visible).map(o=>o.name).sort();
  const defaultAlways=visible();
  s.interactionSystem.setGameplayEnabled(false);s.setActiveInteractableLabel(undefined);
  const alwaysWhileDisabled=visible();
  s.alwaysShowInteractableNameplates=false;s.setActiveInteractableLabel(undefined);
  return {defaultAlways,alwaysWhileDisabled,proximityWithNoTarget:visible()};
})()`);
const expectedNames = expected.map(item => item.name).sort();
assert.deepEqual(flagModes.defaultAlways, expectedNames);
assert.deepEqual(flagModes.alwaysWhileDisabled, expectedNames);
assert.deepEqual(flagModes.proximityWithNoTarget, []);

const captures = [];
const destinationByRoom = { office: 'cv', 'living-room': 'media', gym: 'training', kitchen: 'food-log' };
for (const [viewport, width, height, mobile] of [
  ['desktop', 1280, 900, false], ['portrait', 390, 844, true], ['landscape', 844, 390, true],
]) {
  await send('Emulation.setDeviceMetricsOverride', { width, height, deviceScaleFactor: 1, mobile });
  await send('Emulation.setTouchEmulationEnabled', mobile
    ? { enabled: true, maxTouchPoints: 5 }
    : { enabled: false });
  const targets = viewport === 'desktop' ? expected : expected.filter((item, index, all) =>
    all.findIndex(candidate => candidate.roomId === item.roomId) === index);
  for (const target of targets) {
    const destination = destinationByRoom[target.roomId];
    assert.equal(await evaluate(`s.travelTo(${JSON.stringify(destination)})`), true);
    const active = await evaluate(`(()=>{s.interactionSystem.setGameplayEnabled(true);
      const target=s.interactionSystem.interactables.get(${JSON.stringify(target.id)});
      s.player.teleportTo({x:target.position.x+.5,y:target.position.y+1.5});
      s.interactionSystem.update(s.player.getState());s.synchronizePresentation();
      return s.children.list.filter(o=>o.name?.startsWith('interactable-label:')&&o.visible).map(o=>o.name)})()`);
    assert.deepEqual(active, [target.name]);
    await pause(150);
    const capture = await send('Page.captureScreenshot', { format: 'png', captureBeyondViewport: true });
    const filename = `${viewport}-${target.id}.png`;
    writeFileSync(`${output}/${filename}`, Buffer.from(capture.data, 'base64'));
    captures.push({ viewport, width, height, mobile, destination, target: target.id, filename });
    const hidden = await evaluate(`(()=>{s.interactionSystem.setGameplayEnabled(false);
      return s.children.list.filter(o=>o.name?.startsWith('interactable-label:')&&o.visible).map(o=>o.name)})()`);
    assert.deepEqual(hidden, []);
  }
}
assert.deepEqual(exceptions, []);
writeFileSync(`${output}/browser-results.json`, JSON.stringify({
  url, recordedAt: new Date().toISOString(), labels, expected, flagModes, captures, exceptions,
}, null, 2));
console.log(`PASS both visibility modes for ${labels.length} interactable nameplates across ${captures.length} room/viewport captures`);
ws.close();
