import assert from 'node:assert/strict';
import { openBrowserSession } from './lib/browserSession.mjs';

const session = await openBrowserSession(Number(process.argv[3] ?? 9333));
const url = process.argv[2] ?? 'http://127.0.0.1:5173';
const cv = '#office-cv-tab--1';
const projects = '#office-cv-tab-3';
const evaluate = expression => session.evaluate(expression);
async function click(selector) {
  const point = await evaluate(`(()=>{const r=document.querySelector(${JSON.stringify(selector)}).getBoundingClientRect();return {x:r.x+r.width/2,y:r.y+r.height/2}})()`);
  await session.send('Input.dispatchMouseEvent', { type: 'mousePressed', button: 'left', clickCount: 1, ...point });
  await session.send('Input.dispatchMouseEvent', { type: 'mouseReleased', button: 'left', clickCount: 1, ...point });
}
async function key(key) {
  await session.send('Input.dispatchKeyEvent', { type: 'keyDown', key });
  await session.send('Input.dispatchKeyEvent', { type: 'keyUp', key });
}
async function state(projectsSelected) {
  assert.deepEqual(await evaluate(`(()=>{
    const panels=[...document.querySelectorAll('[role=tabpanel]')];
    const active=panels.filter(p=>!p.hidden);
    return {
      visible: active.map(p=>p.id),
      selected: document.querySelector('[role=tab][aria-selected=true]').textContent,
      descriptionHidden: document.querySelector('#dialog-description').hidden,
      describedBy: document.querySelector('dialog').getAttribute('aria-describedby'),
      titleIsTab: document.querySelector('#dialog-title > [role=tab]')?.textContent === 'Curriculum vitae',
      noDuplicateCv: document.querySelectorAll('.dialog-header-actions [role=tab]').length === 1,
      titleSelected: document.querySelector('#dialog-title > [role=tab]').getAttribute('aria-selected'),
      titleDecoration: getComputedStyle(document.querySelector('#dialog-title > [role=tab]')).textDecorationLine,
      projectsBackground: getComputedStyle(document.querySelector('#office-cv-tab-3')).backgroundImage !== 'none',
      cvVisible: !!document.querySelector('.dialog-actions a').getClientRects().length,
      overflow: document.documentElement.scrollWidth>innerWidth,
      tabsFit: [...document.querySelectorAll('#dialog-title button,.dialog-header-actions button,.dialog-header-actions a')].every(e=>{const r=e.getBoundingClientRect();return r.left>=0&&r.right<=innerWidth&&r.top>=0&&r.bottom<=innerHeight}),
    };
  })()`), {
    visible: [projectsSelected ? 'office-cv-panel-3' : 'office-cv-panel--1'],
    selected: projectsSelected ? 'Projects' : 'Curriculum vitae',
    descriptionHidden: projectsSelected, describedBy: projectsSelected ? null : 'dialog-description',
    titleIsTab: true, noDuplicateCv: true, titleSelected: String(!projectsSelected),
    titleDecoration: projectsSelected ? 'none' : 'underline', projectsBackground: projectsSelected,
    cvVisible: !projectsSelected, overflow: false, tabsFit: true,
  });
}
try {
  await session.send('Runtime.enable');
  await session.send('Page.enable');
  for (const width of [1280, 390, 320]) {
    await session.send('Emulation.setDeviceMetricsOverride', { width, height: 900, deviceScaleFactor: 1, mobile: false });
    await session.send('Page.navigate', { url });
    await new Promise(resolve=>setTimeout(resolve,500));
    for (let i=0;i<100;i++) {
      if(await evaluate(`typeof Phaser !== 'undefined' && document.querySelector('#game-status')?.textContent.includes('ready')`)) break;
      await new Promise(resolve=>setTimeout(resolve,100));
    }
    const prototype = await session.send('Runtime.evaluate', { expression: 'Phaser.Game.prototype' });
    const games = await session.send('Runtime.queryObjects', { prototypeObjectId: prototype.result.objectId });
    await session.send('Runtime.callFunctionOn', {
      objectId: games.objects.objectId,
      functionDeclaration: 'function(){for(const g of this){const s=g.scene?.getScene("HouseScene");if(s?.player){window.qaScene=s;break}}}',
    });
    // Use the real scene-to-dialog callback; tab interactions below use native input.
    await evaluate(`qaScene.callbacks.onContentRequested('office-cv','keyboard')`);
    await state(false);
    const { nodes } = await session.send('Accessibility.getFullAXTree');
    const tabList = nodes.find(n=>n.role?.value==='tablist');
    assert.ok(tabList);
    assert.deepEqual(tabList.childIds.map(id=>nodes.find(n=>n.nodeId===id)).filter(n=>n.role?.value==='tab').map(n=>n.name.value), ['Curriculum vitae','Projects']);
    assert.equal(nodes.find(n=>n.role?.value==='dialog').name.value, 'Curriculum vitae');
    await click(projects);
    await state(true);
    assert.equal(await evaluate(`document.querySelector('#office-cv-panel-3 a').textContent`), 'WIP');
    assert.equal(await evaluate(`document.querySelector('#office-cv-panel-3 .dialog-item-notes').textContent`), 'WIP');
    assert.equal(await evaluate(`!!document.querySelector('#office-cv-panel-3 a[href]')`), true);
    await click(cv);
    await state(false);
    await key('ArrowRight');
    await state(true);
    await key('Home');
    await state(false);
    await key('End');
    await state(true);
    await click('.dialog-close');
    await evaluate(`qaScene.callbacks.onContentRequested('office-cv','keyboard')`);
    await state(false);
    await click('.dialog-close');
    await evaluate(`qaScene.callbacks.onContentRequested('livingroom-media','keyboard')`);
    assert.equal(await evaluate(`document.querySelectorAll('[role=tab]').length`),3);
    await click('#livingroom-media-tab-1');
    assert.equal(await evaluate(`document.querySelector('[role=tab][aria-selected=true]').textContent`),'Games');
    assert.equal(await evaluate(`[...document.querySelectorAll('[role=tabpanel]')].filter(p=>!p.hidden).length`),1);
    console.log(`PASS width ${width}: CV/Projects clicks, keyboard, content, reset, media regression`);
  }
  assert.deepEqual(session.errors, []);
} finally {
  await session.close();
}
