// Visual review evidence plus decoded-runtime frame checks in an isolated tab.
import assert from 'node:assert/strict';
import { mkdirSync, writeFileSync } from 'node:fs';
import { openBrowserSession } from './lib/browserSession.mjs';
const output='output/qa/player-idle-matched-v2';mkdirSync(output,{recursive:true});
const browser = await openBrowserSession(process.argv[2] ?? 9333);
const { send, evaluate, errors } = browser;
try {
  await send('Runtime.enable');await send('Page.enable');
  await send('Emulation.setDeviceMetricsOverride',{width:1360,height:1250,deviceScaleFactor:1,mobile:false});
  await send('Page.navigate',{url:'http://127.0.0.1:5173/utils/player-animation-preview.html'});
  const deadline = Date.now() + 10000;
  while (!await evaluate(`document.body?.dataset.ready === 'true'`)) {
    assert.ok(Date.now() < deadline, 'preview loads within 10 seconds');
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  await evaluate(`document.querySelector('#pause').click();document.querySelector('#speed').value='2';`);
  const measurements=await evaluate(`(async()=>{
    const result={};
    const {playerAnimationSource,playerFrameRect}=await import('/src/game/entities/playerAnimation.ts');
    for(const dir of ['down','left','right','up']){
      const img=new Image();img.src='/assets/sprites/player/runtime/walk-'+dir+'.webp';await img.decode();
      const c=document.createElement('canvas');c.width=img.width;c.height=img.height;const ctx=c.getContext('2d');ctx.drawImage(img,0,0);
      const data=ctx.getImageData(0,0,c.width,c.height).data,frames=[];
      for(let f=0;f<8;f++){
        let left=362,top=362,right=0,bottom=0,count=0;
        for(let y=0;y<362;y++)for(let x=0;x<362;x++)if(data[((Math.floor(f/4)*362+y)*c.width+f%4*362+x)*4+3]>=128){
          left=Math.min(left,x);top=Math.min(top,y);right=Math.max(right,x);bottom=Math.max(bottom,y);count++;
        }
        frames.push({left,top,right,bottom,count,height:bottom-top+1});
      }
      const source=playerAnimationSource(dir,'walk');
      const runtime=Array.from({length:8},(_,i)=>{
        const [sx,sy]=playerFrameRect(source,i),cell=sy/362*4+sx/362;
        return {cell,headY:frames[cell].top-source.anchors[i][1]};
      });
      result[dir]={width:img.width,height:img.height,frames,runtime};
    }return result;
  })()`);
  for(const direction of Object.values(measurements)){
    assert.equal(direction.width,1448);assert.equal(direction.height,724);
    for(const f of direction.frames){assert.ok(f.count>10000);assert.ok(f.left>1&&f.right<360&&f.top>1&&f.bottom<360,'clear frame margins');assert.ok(Math.abs(f.bottom-355)<=1,'fixed sole baseline');}
  }
  for(const dir of ['left','right','up']){
    const runtime=measurements[dir].runtime;
    const headYs=runtime.map(f=>f.headY);
    assert.ok(Math.max(...headYs)-Math.min(...headYs)<=1,'upper body stays aligned through the loop');
    assert.notEqual(runtime[0].cell,runtime[4].cell,'opposite half-cycle contact poses');
    assert.equal(runtime[2].cell,runtime[3].cell,'passing pose held instead of premature contact');
    assert.equal(runtime[6].cell,runtime[7].cell,'loop ends on passing pose before next contact');
  }
  for(let frame=0;frame<8;frame++){
    await evaluate(`(()=>{const s=document.querySelector('#frame');s.value='${frame}';s.dispatchEvent(new Event('input'));})()`);
    const shot=await send('Page.captureScreenshot',{format:'png'});
    writeFileSync(`${output}/comparison-${frame+1}.png`,Buffer.from(shot.data,'base64'));
  }
  // Exercise slow and runtime-speed playback across wraparound, then pause.
  for(const speed of [2,16]){
    await evaluate(`document.querySelector('#speed').value='${speed}';document.querySelector('#pause').click();`);
    await new Promise(resolve=>setTimeout(resolve,9000/speed));
    await evaluate(`document.querySelector('#pause').click();`);
  }
  assert.deepEqual(errors,[]);
  writeFileSync(`${output}/frames.json`,JSON.stringify({measurements,errors},null,2)+'\n');
  console.log('PASS all 32 decoded frames, transparent margins, sole baselines, preview frame stepping and loop playback without exceptions');
} finally { await browser.close(); }
