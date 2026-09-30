// Verify the real office interaction and placeholder CV download in isolated Chrome.
import assert from 'node:assert/strict';
import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';

const url = process.argv[2] ?? 'http://127.0.0.1:5173';
const port = process.argv[3] ?? '9444';
const environment = url.includes(':4173') ? 'production' : 'development';
const output = `output/qa/port13b/${environment}`;
const downloadRoot = `/tmp/codex-cv-download-${environment}-${process.pid}`;
mkdirSync(output, { recursive: true });
mkdirSync(downloadRoot, { recursive: true });

const tabs = await (await fetch(`http://127.0.0.1:${port}/json`)).json();
const page = tabs.find((item) => item.type === 'page' && item.url.startsWith(url))
  ?? tabs.find((item) => item.type === 'page' && /^http:\/\/127\.0\.0\.1:(5173|4173)\//.test(item.url));
assert.ok(page, `Expected isolated QA page for ${url}`);
const ws = new WebSocket(page.webSocketDebuggerUrl);
await new Promise((resolve, reject) => {
  ws.addEventListener('open', resolve, { once: true });
  ws.addEventListener('error', reject, { once: true });
});

let sequence = 0;
const pending = new Map();
const exceptions = [];
const results = [];
ws.addEventListener('message', ({ data }) => {
  const message = JSON.parse(data);
  if (message.method === 'Runtime.exceptionThrown') exceptions.push(message.params.exceptionDetails);
  const request = pending.get(message.id);
  if (!request) return;
  pending.delete(message.id);
  clearTimeout(request.timer);
  message.error ? request.reject(Error(JSON.stringify(message.error))) : request.resolve(message.result);
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
const evaluate = async (expression) => {
  const response = await send('Runtime.evaluate', { expression, awaitPromise: true, returnByValue: true });
  if (response.exceptionDetails) throw Error(JSON.stringify(response.exceptionDetails));
  return response.result.value;
};
const pause = (milliseconds) => new Promise((resolve) => setTimeout(resolve, milliseconds));
const waitFor = async (expression, label) => {
  for (let attempt = 0; attempt < 100; attempt++) {
    if (await evaluate(expression)) return;
    await pause(100);
  }
  throw Error(`Timed out waiting for ${label}`);
};
const press = async (key, code, virtual) => {
  await send('Input.dispatchKeyEvent', { type: 'keyDown', key, code, windowsVirtualKeyCode: virtual });
  await send('Input.dispatchKeyEvent', { type: 'keyUp', key, code, windowsVirtualKeyCode: virtual });
};
const tap = async (selector) => {
  const point = await evaluate(`(()=>{const r=document.querySelector(${JSON.stringify(selector)}).getBoundingClientRect();return {x:r.x+r.width/2,y:r.y+r.height/2}})()`);
  await send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ ...point, id: 1 }] });
  await send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
};
const attach = async () => {
  await waitFor('typeof Phaser !== "undefined" && !!document.querySelector("canvas")', 'Phaser canvas');
  const prototype = await send('Runtime.evaluate', { expression: 'Phaser.Game.prototype' });
  const games = await send('Runtime.queryObjects', { prototypeObjectId: prototype.result.objectId });
  await send('Runtime.callFunctionOn', {
    objectId: games.objects.objectId,
    // A reloaded QA tab may retain disposed Phaser instances until GC.
    functionDeclaration: 'function(){window.s=undefined;for(const g of this){try{const scene=g.scene?.getScene("HouseScene");if(scene?.player){window.s=scene;break}}catch{}}}',
  });
  await waitFor('!!window.s?.player && !!s.interactionSystem', 'HouseScene');
};

try {
  await send('Runtime.enable');
  await send('Page.enable');
  for (const [viewport, width, height, mobile] of [
    ['desktop', 1280, 900, false],
    ['portrait', 390, 844, true],
  ]) {
    const downloadPath = `${downloadRoot}/${viewport}`;
    mkdirSync(downloadPath, { recursive: true });
    await send('Browser.setDownloadBehavior', { behavior: 'allow', downloadPath, eventsEnabled: true });
    await send('Emulation.setDeviceMetricsOverride', { width, height, deviceScaleFactor: 1, mobile });
    await send('Emulation.setTouchEmulationEnabled', { enabled: mobile, maxTouchPoints: mobile ? 5 : 1 });
    await send('Page.navigate', { url });
    // Page.navigate returns before the previous realm's canvas disappears.
    await pause(1_000);
    await attach();
    await evaluate(`s.player.teleportTo({x:6.5,y:27.125});s.synchronizePresentation();s.interactionSystem.update(s.player.getState());document.querySelector('#game-shell').focus();void 0`);
    await waitFor("s.interactionSystem.getCurrentTarget()?.id==='office-workstation'", 'office workstation target');
    if (mobile) await tap('.mobile-interact');
    else await press('e', 'KeyE', 69);
    await waitFor("document.querySelector('dialog').open", 'CV dialog');
    await evaluate("document.querySelector('.dialog-reveal').click();void 0");
    const legacyLink = await evaluate(`(()=>{const a=document.querySelector('.dialog-header-actions a'),r=a.getBoundingClientRect();return {
      label:a.textContent,href:a.href,target:a.target,rel:a.rel,
      visible:r.width>0&&r.height>=44&&r.top>=0&&r.bottom<=innerHeight,
    }})()`);
    assert.deepEqual(legacyLink, {
      label: 'Legacy Portfolio', href: 'https://andlydakis.github.io/', target: '_blank',
      rel: 'noopener noreferrer', visible: true,
    });
    const link = await evaluate(`(()=>{const a=document.querySelector('.dialog-actions a'),r=a.getBoundingClientRect();return {
      title:document.querySelector('#dialog-title').textContent,
      description:document.querySelector('#dialog-description').textContent,
      label:a.textContent,href:a.href,pathname:new URL(a.href).pathname,origin:new URL(a.href).origin,
      download:a.download,tag:a.tagName,visible:r.width>0&&r.height>=44&&r.top>=0&&r.bottom<=innerHeight,
      overflow:document.documentElement.scrollWidth>innerWidth
    }})()`);
    assert.equal(link.title, 'Curriculum vitae');
    assert.match(link.description, /dummy CV and downloadable PDF/);
    assert.deepEqual({ label: link.label, pathname: link.pathname, download: link.download, tag: link.tag }, {
      label: 'Download placeholder CV (PDF)', pathname: '/assets/cv.pdf', download: 'placeholder-cv.pdf', tag: 'A',
    });
    assert.equal(link.origin, new URL(url).origin);
    assert.equal(link.visible, true);
    assert.equal(link.overflow, false);
    if (mobile) await tap('.dialog-actions a');
    else {
      await press('Tab', 'Tab', 9);
      assert.equal(await evaluate("document.activeElement===document.querySelector('.dialog-actions a')"), true);
      await press('Enter', 'Enter', 13);
    }
    const downloaded = `${downloadPath}/placeholder-cv.pdf`;
    await waitFor(`fetch(${JSON.stringify(url + '/assets/cv.pdf')}).then(r=>r.ok&&r.headers.get('content-type')==='application/pdf')`, 'PDF response');
    for (let attempt = 0; attempt < 100 && !existsSync(downloaded); attempt++) await pause(100);
    assert.equal(existsSync(downloaded), true, `${viewport} download missing`);
    const bytes = readFileSync(downloaded);
    assert.equal(bytes.subarray(0, 5).toString(), '%PDF-');
    assert.ok(bytes.length > 2_000);
    const capture = await send('Page.captureScreenshot', { format: 'png', captureBeyondViewport: true });
    writeFileSync(`${output}/${viewport}-cv-dialog.png`, Buffer.from(capture.data, 'base64'));
    results.push({ viewport, width, height, mobile, legacyLink, link, downloadedBytes: bytes.length });
  }
  assert.deepEqual(exceptions, []);
  writeFileSync(`${output}/results.json`, JSON.stringify({ url, recordedAt: new Date().toISOString(), results, exceptions }, null, 2));
  console.log(`PASS ${results.length} CV dialog/download records for ${environment}`);
} finally {
  rmSync(downloadRoot, { recursive: true, force: true });
  for (const request of pending.values()) clearTimeout(request.timer);
  ws.close();
}
