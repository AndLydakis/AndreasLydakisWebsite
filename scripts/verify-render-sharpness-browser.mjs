// Isolated Chrome/CDP QA for backing resolution, font loading and texture filters.
// Run: node scripts/verify-render-sharpness-browser.mjs [URL] [CDP port]
import assert from 'node:assert/strict';
import { mkdirSync, writeFileSync } from 'node:fs';

const url = process.argv[2] ?? 'http://127.0.0.1:5176/';
const port = process.argv[3] ?? '9340';
const outputDir = 'output/qa/render-sharpness';
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
  clearTimeout(request.timer);
  if (message.error) request.reject(Error(JSON.stringify(message.error)));
  else request.resolve(message.result);
});
const send = (method, params = {}) => new Promise((resolve, reject) => {
  const id = ++sequence;
  const timer = setTimeout(() => {
    pending.delete(id);
    reject(Error(`CDP timeout: ${method}`));
  }, 20_000);
  pending.set(id, { resolve, reject, timer });
  ws.send(JSON.stringify({ id, method, params }));
});
const evaluate = async expression => {
  const response = await send('Runtime.evaluate', {
    expression, returnByValue: true, awaitPromise: true,
  });
  if (response.exceptionDetails) throw Error(JSON.stringify(response.exceptionDetails));
  return response.result.value;
};
const pause = ms => new Promise(resolve => setTimeout(resolve, ms));

await send('Runtime.enable');
await send('Page.enable');
await send('Page.navigate', { url });
for (let attempt = 0; attempt < 100; attempt++) {
  if (await evaluate('typeof Phaser !== "undefined" && !!document.querySelector("canvas")')) break;
  await pause(100);
}
const prototype = await send('Runtime.evaluate', { expression: 'Phaser.Game.prototype' });
const games = await send('Runtime.queryObjects', { prototypeObjectId: prototype.result.objectId });
for (let attempt = 0; attempt < 100 && !(await evaluate('!!window.s?.renderLayers')); attempt++) {
  await send('Runtime.callFunctionOn', {
    objectId: games.objects.objectId,
    functionDeclaration: 'function(){window.s=this.find(g=>g.scene?.getScene("HouseScene")?.player)?.scene.getScene("HouseScene")}',
  });
  await pause(100);
}
assert.equal(await evaluate('!!window.s?.renderLayers'), true, 'HouseScene did not become ready');

const results = [];
for (const [name, width, height, mobile] of [
  ['desktop', 1280, 900, false],
  ['portrait', 390, 844, true],
  ['landscape', 844, 390, true],
]) {
  await send('Emulation.setDeviceMetricsOverride', { width, height, deviceScaleFactor: 1, mobile });
  await send('Emulation.setTouchEmulationEnabled', { enabled: mobile, maxTouchPoints: 5 });
  await pause(350);
  const metrics = await evaluate(`(()=>{
    const canvas=document.querySelector('canvas');
    const label=[...s.renderLayers.interactableLabels.values()][0];
    const text=label.list.find(item=>item.type==='Text');
    const sourceFilter=key=>s.textures.get(key).source[0].scaleMode;
    const rect=canvas.getBoundingClientRect();
    return {
      backing:{width:canvas.width,height:canvas.height},
      displayed:{width:rect.width,height:rect.height},
      imageRendering:getComputedStyle(canvas).imageRendering,
      fontLoaded:document.fonts.status==='loaded' && [...document.fonts]
        .some(face=>face.family==='Tiny5' && face.status==='loaded'),
      label:{fontFamily:text.style.fontFamily,fontSize:text.style.fontSize,resolution:text.style.resolution},
      filters:{environment:sourceFilter('office-background'),player:sourceFilter(s.playerSprite.texture.key)},
      startupError:document.querySelector('#startup-error').hidden,
      fontFaces:[...document.fonts].map(face=>({family:face.family,status:face.status})),
    };
  })()`);
  console.error(`${name} metrics:`, JSON.stringify(metrics, null, 2));
  assert.deepEqual(metrics.backing, { width: 1536, height: 864 });
  assert.ok(metrics.displayed.width > 0 && metrics.displayed.height > 0);
  assert.equal(metrics.imageRendering, 'auto');
  if (name === 'desktop') assert.equal(metrics.fontLoaded, true);
  assert.deepEqual(metrics.label, { fontFamily: 'Tiny5', fontSize: '5px', resolution: 4 });
  assert.equal(metrics.filters.environment, 0, 'Environment art should use linear filtering');
  assert.equal(metrics.filters.player, 1, 'Player art should retain nearest filtering');
  assert.equal(metrics.startupError, true);
  const capture = await send('Page.captureScreenshot', { format: 'png', captureBeyondViewport: false });
  writeFileSync(`${outputDir}/${name}.png`, capture.data, 'base64');
  results.push({ name, ...metrics });
}

assert.deepEqual(exceptions, []);
console.log(JSON.stringify({ results, exceptions: exceptions.length }, null, 2));
ws.close();
