// Mechanical export only: generated artwork supplies all poses and styling.
// node scripts/package-idle-matched-walk.mjs [CDP port] [--verify]
import { readFileSync, writeFileSync, mkdtempSync, rmSync, copyFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import assert from 'node:assert/strict';
import { openBrowserSession } from './lib/browserSession.mjs';

const verify = process.argv.includes('--verify');
const browser = await openBrowserSession(process.argv.slice(2).find(arg => arg !== '--verify') ?? 9333);
const exportDirectory = mkdtempSync(join(tmpdir(), 'player-walk-export-'));
const folder = 'output/assets/player-animation-sources/idle-matched-v2';
const reports = {};
const idleAnchors = { down: [217,183,180,149], left: [223,193,193,193], right: [186,175,164,154], up: [181,181,181,181] };
try {
  for (const direction of ['down', 'left', 'right', 'up']) {
    const source = readFileSync(`${folder}/${direction}.png`).toString('base64');
    const idle = readFileSync(`public/assets/sprites/player/runtime/idle-${direction}.webp`).toString('base64');
    const { png, ...report } = await browser.evaluate(
      `(${packageFrames.toString()})(${JSON.stringify(source)},${JSON.stringify(idle)},${JSON.stringify(idleAnchors[direction])})`,
    );
    const packed = join(exportDirectory, `${direction}.png`);
    const webp = join(exportDirectory, `${direction}.webp`);
    const destination = `public/assets/sprites/player/runtime/walk-${direction}.webp`;
    writeFileSync(packed, Buffer.from(png.split(',')[1], 'base64'));
    execFileSync('cwebp', ['-quiet', '-lossless', '-exact', packed, '-o', webp]);
    if (verify) assert.deepEqual(readFileSync(webp), readFileSync(destination), `${direction}: export changed`);
    else copyFileSync(webp, destination);
    reports[direction] = report;
  }
  if (!verify) writeFileSync(`${folder}/measurements.json`, JSON.stringify(reports, null, 2) + '\n');
  console.log(verify ? 'PASS all four exports match the approved runtime bytes' : 'Exported all four walking sheets');
} finally {
  rmSync(exportDirectory, { recursive: true });
  await browser.close();
}

async function packageFrames(sourceData, idleData, anchorXs) {
  const decode = async (data, mime) => {
    const img = new Image(); img.src = `data:${mime};base64,${data}`; await img.decode();
    const canvas = document.createElement('canvas'); canvas.width = img.width; canvas.height = img.height;
    const ctx = canvas.getContext('2d'); ctx.drawImage(img, 0, 0);
    return { img, w: img.width, h: img.height, data: ctx.getImageData(0, 0, img.width, img.height).data };
  };
  const source = await decode(sourceData, 'image/png'), idle = await decode(idleData, 'image/webp');
  const alpha = (asset, x, y) => asset.data[(y * asset.w + x) * 4 + 3] >= 128;
  const scan = (asset, x0, y0, x1, y1) => {
    const rows = [];
    for (let y=y0; y<y1; y++) {
      let n=0; for (let x=x0; x<x1; x++) if (alpha(asset,x,y)) n++;
      if(n>=8) rows.push(y);
    }
    if (!rows.length) throw Error('Empty frame');
    const top=rows[0], bottom=rows.at(-1)+1, headCenters=[];
    // Upper head excludes beard, shoulders and moving arms.
    for(let y=top+Math.round((bottom-top)*.05); y<top+Math.round((bottom-top)*.17); y++) {
      const xs=[]; for(let x=x0; x<x1; x++) if(alpha(asset,x,y)) xs.push(x);
      if(xs.length>=8) headCenters.push((xs[0]+xs.at(-1))/2);
    }
    const headX=headCenters.sort((a,b)=>a-b)[Math.floor(headCenters.length/2)];
    let left=x1,right=x0;
    for(let y=top;y<bottom;y++) for(let x=x0;x<x1;x++) if(alpha(asset,x,y)) {left=Math.min(left,x);right=Math.max(right,x+1);}
    return {left,top,right,bottom,headX,height:bottom-top};
  };
  const idleFrames=Array.from({length:4},(_,i)=>scan(idle,i*362,0,(i+1)*362,idle.h));
  const median = values => values.sort((a,b)=>a-b)[Math.floor(values.length/2)];
  const height=median(idleFrames.map(f=>f.height));
  const headOffset=median(idleFrames.map((f,i)=>f.headX-i*362-anchorXs[i]));
  const frames=[];
  for(let col=0;col<4;col++) {
    const x0=Math.round(col*source.w/4),x1=Math.round((col+1)*source.w/4);
    let cut=0,min=Infinity;
    // The generated grid may have shifted row boundaries: locate the clear gutter.
    for(let y=Math.round(source.h*.40);y<source.h*.60;y++) {
      let n=0; for(let x=x0;x<x1;x++) if(alpha(source,x,y)) n++;
      const score=n*10000+Math.abs(y-source.h/2);
      if(score<min){min=score;cut=y;}
    }
    if(min>=80000) throw Error('No clear row gutter');
    for(let row=0;row<2;row++) frames[row*4+col]=scan(source,x0,row?cut:0,x1,row?source.h:cut);
  }
  // One UNIFORM scale for a direction: no per-frame width/height stretching.
  const scale=Math.min(height/median(frames.map(f=>f.height)),350/Math.max(...frames.map(f=>f.height)));
  const canvas=document.createElement('canvas');canvas.width=1448;canvas.height=724;
  const ctx=canvas.getContext('2d');ctx.imageSmoothingEnabled=false;
  for(const [i,f] of frames.entries()) {
    const width=Math.round((f.right-f.left)*scale), h=Math.round(f.height*scale);
    const x=Math.round(181+headOffset-(f.headX-f.left)*scale), y=356-h;
    if(x<2||x+width>360||y<2) throw Error('Frame cannot fit without clipping');
    ctx.drawImage(source.img,f.left,f.top,f.right-f.left,f.height,i%4*362+x,Math.floor(i/4)*362+y,width,h);
  }
  return {png:canvas.toDataURL('image/png'),sourceSize:[source.w,source.h],idleHeight:height,headOffset,scale,frames,
    anchors:Array.from({length:8},()=>[181,356]),packedSize:[1448,724]};
}
