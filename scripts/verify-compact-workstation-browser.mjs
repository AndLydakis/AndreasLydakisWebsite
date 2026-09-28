// Isolated CDP browser QA for the compact office workstation integration.
import assert from 'node:assert/strict';
import { mkdirSync, writeFileSync } from 'node:fs';

const url = process.argv[2] ?? 'http://127.0.0.1:5173';
const port = process.argv[3] ?? '9444';
const mode = url.includes(':4173') ? 'production' : 'development';
const output = `output/qa/office-compact-workstation/${mode}`;
mkdirSync(output, { recursive: true });

const tabs = await (await fetch(`http://127.0.0.1:${port}/json`)).json();
const tab = tabs.find(item => item.type === 'page' && item.url.startsWith(url));
assert.ok(tab, `No isolated QA page found at ${url}`);
const ws = new WebSocket(tab.webSocketDebuggerUrl);
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
  if (!message.id || !pending.has(message.id)) return;
  const request = pending.get(message.id);
  pending.delete(message.id);
  clearTimeout(request.timer);
  if (message.error) request.reject(Error(JSON.stringify(message.error)));
  else request.resolve(message.result);
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
const games = await send('Runtime.queryObjects', { prototypeObjectId: proto.result.objectId });
await send('Runtime.callFunctionOn', { objectId: games.objects.objectId,
  functionDeclaration: 'function(){window.s=this.find(g=>g.scene?.getScene("HouseScene")?.player)?.scene.getScene("HouseScene")}' });
for (let attempt = 0; attempt < 100 && !(await evaluate('!!window.s?.playerSprite?.body')); attempt++) await pause(100);
assert.ok(await evaluate('!!window.s?.playerSprite?.body'), 'HouseScene did not become ready');
await evaluate('document.querySelector("#game-shell").focus();s.setDiagnosticsEnabled(false);void 0');

const expected = [
  { x: 119, y: 403, width: 11, height: 15 },
  { x: 101, y: 410, width: 30, height: 12 },
];
const state = await evaluate(`(()=>{const room=s.layout.rooms.find(r=>r.id==='office');
  const object=room.interactables.find(o=>o.id==='office-workstation');
  const entry=s.depths.entries.find(e=>e.id==='office-workstation');
  return {asset:object.assetId,position:object.position,height:object.displayHeightTiles,anchor:object.groundAnchor,
    footprints:object.footprints,texture:entry.view.texture.key,source:{width:entry.view.texture.source[0].width,height:entry.view.texture.source[0].height},
    display:{width:entry.view.displayWidth,height:entry.view.displayHeight},plane:entry.groundY(),objectDepth:entry.view.depth,
    bodies:s.collisionSystem.staticBodyList.map(b=>({x:b.x,y:b.y,width:b.width,height:b.height}))}})()`);
assert.equal(state.asset, 'office-workstation-right-facing');
assert.equal(state.texture, state.asset);
assert.deepEqual(state.source, { width: 1312, height: 1199 });
assert.deepEqual(state.position, { x: 2.5, y: 3.9 });
assert.equal(state.height, 4.5);
assert.deepEqual(state.anchor, { x: 3.75, y: 6.625 });
assert.equal(state.plane, 426);
assert.equal(state.display.height, 72);
for (const rect of expected) assert.ok(state.bodies.some(body => JSON.stringify(body) === JSON.stringify(rect)), JSON.stringify(rect));

const keys = { ArrowUp: 38, ArrowDown: 40, ArrowLeft: 37, ArrowRight: 39 };
const key = (name, down) => send('Input.dispatchKeyEvent', {
  type: down ? 'keyDown' : 'keyUp', key: name, code: name, windowsVirtualKeyCode: keys[name],
});
async function place(x, groundY) {
  await evaluate(`s.player.teleportTo({x:${x / 16},y:${groundY / 16}});s.synchronizePresentation();void 0`);
  await pause(50);
}
const body = () => evaluate('({left:s.playerSprite.body.left,right:s.playerSprite.body.right,top:s.playerSprite.body.top,bottom:s.playerSprite.body.bottom,centerX:s.playerSprite.body.center.x})');
const overlaps = (player, rect) => Math.min(player.right, rect.x + rect.width) - Math.max(player.left, rect.x) > 1e-6
  && Math.min(player.bottom, rect.y + rect.height) - Math.max(player.top, rect.y) > 1e-6;
async function block(rect, side) {
  const cx = rect.x + rect.width / 2;
  const cy = rect.y + rect.height / 2;
  const cases = {
    north: [cx, rect.y - 1, 'ArrowDown'], south: [cx, rect.y + rect.height + 17, 'ArrowUp'],
    west: [rect.x - 9, cy + 8, 'ArrowRight'], east: [rect.x + rect.width + 9, cy + 8, 'ArrowLeft'],
  };
  const [x, y, direction] = cases[side];
  await place(x, y);
  await key(direction, true);
  await pause(700);
  await key(direction, false);
  const stopped = await body();
  assert.equal(overlaps(stopped, rect), false, `${side} penetration: ${JSON.stringify(stopped)}`);
  return { rect, side, stopped };
}
const blocking = [];
for (const side of ['north', 'east']) blocking.push(await block(expected[0], side));
for (const side of ['south', 'west']) blocking.push(await block(expected[1], side));

// The previous chair reached x=139; the compact version leaves a full player-width lane at x=140.
await place(140, 398);
await key('ArrowDown', true);
await pause(700);
await key('ArrowDown', false);
const openedRoute = await body();
assert.ok(openedRoute.bottom > 430, JSON.stringify(openedRoute));
assert.equal(expected.some(rect => overlaps(openedRoute, rect)), false);

async function depthAt(groundY, name) {
  await place(120, groundY);
  const depth = await evaluate(`(()=>{const e=s.depths.entries.find(e=>e.id==='office-workstation'),v=s.player.getDisplayObject();
    return {player:v.depth,object:e.view.depth,sole:s.playerSprite.body.bottom,plane:e.groundY()}})()`);
  assert.equal(depth.player > depth.object, depth.sole >= depth.plane);
  const capture = await send('Page.captureScreenshot', { format: 'png', captureBeyondViewport: true });
  writeFileSync(`${output}/${name}.png`, Buffer.from(capture.data, 'base64'));
  return depth;
}
const behind = await depthAt(398, 'player-behind');
const inFront = await depthAt(440, 'player-in-front');
assert.equal(behind.player < behind.object, true);
assert.equal(inFront.player > inFront.object, true);
assert.deepEqual(exceptions, []);

writeFileSync(`${output}/browser-results.json`, JSON.stringify({
  url, recordedAt: new Date().toISOString(), state, blocking, openedRoute, behind, inFront, exceptions,
}, null, 2));
console.log('PASS compact workstation texture, collisions, opened route and perspective');
ws.close();
