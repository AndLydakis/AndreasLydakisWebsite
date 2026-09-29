import assert from 'node:assert/strict';
import { mkdirSync, writeFileSync } from 'node:fs';

const url = process.argv[2] ?? 'http://127.0.0.1:5176/';
const port = process.argv[3] ?? '9336';
const tabs = await (await fetch(`http://127.0.0.1:${port}/json`)).json();
const tab = tabs.find(item => item.type === 'page' && item.url.startsWith(url));
assert.ok(tab, `No isolated QA page found for ${url}`);
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
  const request = pending.get(message.id);
  if (!request) return;
  pending.delete(message.id); clearTimeout(request.timer);
  if (message.error) request.reject(Error(JSON.stringify(message.error)));
  else request.resolve(message.result);
});
const send = (method, params = {}) => new Promise((resolve, reject) => {
  const id = ++sequence;
  const timer = setTimeout(() => { pending.delete(id); reject(Error(`CDP timeout: ${method}`)); }, 20_000);
  pending.set(id, { resolve, reject, timer });
  ws.send(JSON.stringify({ id, method, params }));
});
const evaluate = async expression => {
  const response = await send('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true });
  if (response.exceptionDetails) throw Error(JSON.stringify(response.exceptionDetails));
  return response.result.value;
};
const pause = ms => new Promise(resolve => setTimeout(resolve, ms));

await send('Runtime.enable'); await send('Page.enable');
for (let attempt = 0; attempt < 100; attempt++) {
  if (await evaluate('typeof Phaser !== "undefined" && !!document.querySelector("canvas")')) break;
  await pause(100);
}
const prototype = await send('Runtime.evaluate', { expression: 'Phaser.Game.prototype' });
const games = await send('Runtime.queryObjects', { prototypeObjectId: prototype.result.objectId });
await send('Runtime.callFunctionOn', { objectId: games.objects.objectId,
  functionDeclaration: 'function(){window.s=this.find(g=>g.scene?.getScene("HouseScene")?.player)?.scene.getScene("HouseScene")}' });
for (let attempt = 0; attempt < 100 && !(await evaluate('!!window.s?.interactionSystem')); attempt++) await pause(100);
assert.equal(await evaluate('!!window.s?.interactionSystem'), true);

const base = await evaluate(`(()=>({
  collisionBoundsVisible:s.collisionBoundsVisible,
  collisionLayerVisible:s.renderLayers.collisionPreview.visible,
  groundAnchorsVisible:s.groundAnchorsVisible,
  groundAnchorLayerVisible:s.debugOverlay.groundAnchors.visible,
  roomConnectionBoundsVisible:s.roomConnectionBoundsVisible,
  roomConnectionLayerVisible:s.renderLayers.doorwayPreview.visible,
  roomBoundsVisible:s.roomBoundsVisible,
  roomBoundsLayerVisible:s.debugOverlay.roomBounds.visible,
  radiusFlag:s.interactionRadiusVisible,
  radiusVisible:s.renderLayers.interactionRadiusPreview.visible,
  radiusDepth:s.renderLayers.interactionRadiusPreview.depth,
  radiusCommands:s.renderLayers.interactionRadiusPreview.commandBuffer.length,
  labels:s.renderLayers.interactableLabels.size,
  highlights:s.renderLayers.interactableLabelHighlights.size,
  activationBounds:s.renderLayers.labelActivationBounds.size
}))()`);
assert.deepEqual(base, {
  collisionBoundsVisible: false, collisionLayerVisible: false,
  groundAnchorsVisible: false, groundAnchorLayerVisible: false,
  roomConnectionBoundsVisible: false, roomConnectionLayerVisible: false,
  roomBoundsVisible: false, roomBoundsLayerVisible: false,
  radiusFlag: true, radiusVisible: true, radiusDepth: 2.8,
  radiusCommands: base.radiusCommands, labels: 11, highlights: 11, activationBounds: 11,
});
assert.ok(base.radiusCommands > 0, 'Original circles must remain drawn and available to the flag');
const playerMetrics = await evaluate(`(()=>({
  anchorWidth:s.playerSprite.width,
  anchorHeight:s.playerSprite.height,
  bodyWidth:s.playerSprite.body.width,
  bodyHeight:s.playerSprite.body.height,
  bodyOffsetX:s.playerSprite.body.offset.x,
  bodyOffsetY:s.playerSprite.body.offset.y
}))()`);
console.error('Player interaction anchor metrics:', JSON.stringify(playerMetrics, null, 2));

const labelResults = await evaluate(`(()=>[...s.renderLayers.labelActivationBounds.entries()].map(([id,b])=>{
  s.interactionSystem.update({position:{x:b.x+b.width/2,y:b.y+b.height/2}});
  const active=[...s.renderLayers.interactableLabelHighlights.entries()].filter(([,g])=>g.visible).map(([key])=>key);
  return {id,target:s.interactionSystem.getCurrentTarget()?.id??null,active,bounds:b};
}))()`);
const labelMismatches = labelResults.filter(result =>
  result.target !== result.id || result.active.length !== 1 || result.active[0] !== result.id);
if (labelMismatches.length > 0) {
  console.error('Label interaction mismatches:', JSON.stringify(labelMismatches, null, 2));
}
const labelCoverage = await evaluate(`(()=>[...s.renderLayers.labelActivationBounds.entries()].map(([id,b])=>{
  const outcomes={};
  for(const fx of [0.05,0.25,0.5,0.75,0.95]) for(const fy of [0.05,0.25,0.5,0.75,0.95]){
    s.interactionSystem.update({position:{x:b.x+b.width*fx,y:b.y+b.height*fy}});
    const target=s.interactionSystem.getCurrentTarget()?.id??'none';
    outcomes[target]=(outcomes[target]??0)+1;
  }
  return {id,outcomes};
}))()`);
console.error('Label coverage (25 samples each):', JSON.stringify(labelCoverage, null, 2));
const footContactResults = await evaluate(`(()=>[...s.renderLayers.labelActivationBounds.entries()].map(([id,b])=>{
  s.player.teleportTo({x:b.x+b.width/2+0.5,y:b.y+0.5});
  const state=s.player.getState(),interactionBounds=s.player.getInteractionBounds();
  s.interactionSystem.update({position:state.position,interactionBounds});
  const active=[...s.renderLayers.interactableLabelHighlights.entries()].filter(([,g])=>g.visible).map(([key])=>key);
  return {id,target:s.interactionSystem.getCurrentTarget()?.id??null,active,interactionBounds};
}))()`);
console.error('Label foot-contact results:', JSON.stringify(footContactResults, null, 2));
const originalRadius = await evaluate(`(()=>{
  s.interactionSystem.update({position:{x:11.5,y:8}});const center=s.interactionSystem.getCurrentTarget()?.id??null;
  s.interactionSystem.update({position:{x:13.51,y:8}});const outside=s.interactionSystem.getCurrentTarget()?.id??null;
  return {center,outside};
})()`);
assert.deepEqual(originalRadius, { center: 'living-room-television', outside: null });

const workstation = labelResults.find(item => item.id === 'office-workstation');
assert.ok(workstation);
await evaluate(`(()=>{
  const bounds=${JSON.stringify(workstation.bounds)};
  s.player.teleportTo({x:bounds.x+bounds.width/2+0.5,y:bounds.y+0.5});
  s.interactionSystem.update({position:s.player.getState().position,interactionBounds:s.player.getInteractionBounds()});
  s.synchronizePresentation();
})()`);
await pause(100);
const capture = await send('Page.captureScreenshot', { format: 'png', captureBeyondViewport: false });
mkdirSync('output/qa/label-interaction', { recursive: true });
writeFileSync('output/qa/label-interaction/office-workstation-highlight.png', capture.data, 'base64');
assert.deepEqual(exceptions, []);
assert.deepEqual(labelMismatches, [], 'Every label center must select and highlight its owner');
for (const result of labelCoverage) {
  assert.deepEqual(result.outcomes, { [result.id]: 25 }, `Every sampled point in ${result.id} must select its owner`);
}
for (const result of footContactResults) {
  assert.equal(result.target, result.id, `Foot contact with ${result.id} must select its owner`);
  assert.deepEqual(result.active, [result.id]);
}
console.log(JSON.stringify({ base, labelResults, originalRadius, exceptions: exceptions.length }, null, 2));
ws.close();
