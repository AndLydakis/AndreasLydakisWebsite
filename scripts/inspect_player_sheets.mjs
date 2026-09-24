// Read-only RGBA PNG inspection. No generated artwork is rewritten.
import { readFileSync } from 'node:fs';
import { inflateSync } from 'node:zlib';

const names = process.argv.slice(2).filter(arg => arg !== '--bounds');
for (const direction of (names.length ? names : ['down', 'left', 'right', 'up'])) {
  const png = readFileSync(`public/assets/sprites/player/animations/${direction}.png`);
  let width, height;
  const chunks = [];
  for (let offset = 8; offset < png.length;) {
    const size = png.readUInt32BE(offset);
    const type = png.toString('ascii', offset + 4, offset + 8);
    const data = png.subarray(offset + 8, offset + 8 + size);
    if (type === 'IHDR') {
      width = data.readUInt32BE(0);
      height = data.readUInt32BE(4);
      if (data[8] !== 8 || data[9] !== 6 || data[12] !== 0) throw Error('Expected non-interlaced RGBA8');
    }
    if (type === 'IDAT') chunks.push(data);
    offset += size + 12;
  }
  const frameWidth = Math.floor(width / 4), frameHeight = Math.floor(height / 3);
  if (frameWidth < 1 || frameHeight < 1) throw Error('Unexpected sheet dimensions');
  const raw = inflateSync(Buffer.concat(chunks));
  const pixels = Buffer.alloc(width * height * 4);
  const stride = width * 4;
  for (let y = 0; y < height; y++) {
    const filter = raw[y * (stride + 1)];
    for (let x = 0; x < stride; x++) {
      const left = x >= 4 ? pixels[y * stride + x - 4] : 0;
      const above = y ? pixels[(y - 1) * stride + x] : 0;
      const corner = y && x >= 4 ? pixels[(y - 1) * stride + x - 4] : 0;
      let prediction = 0;
      if (filter === 1) prediction = left;
      if (filter === 2) prediction = above;
      if (filter === 3) prediction = Math.floor((left + above) / 2);
      if (filter === 4) {
        const p = left + above - corner;
        const a = Math.abs(p - left), b = Math.abs(p - above), c = Math.abs(p - corner);
        prediction = a <= b && a <= c ? left : b <= c ? above : corner;
      }
      pixels[y * stride + x] = (raw[y * (stride + 1) + 1 + x] + prediction) & 255;
    }
  }
  const anchors = [];
  if (process.argv.includes('--bounds')) {
    // Generated rows may spill across an ideal grid. Detect three tall body
    // bands per column, ignoring tiny isolated alpha specks. Read-only metadata.
    const frames = [];
    for (let column = 0; column < 4; column++) {
      const counts = [];
      for (let y = 0; y < height; y++) {
        let count = 0;
        if (y < height) for (let x = column*frameWidth; x < (column+1)*frameWidth; x++) {
          if (pixels[(y*width+x)*4+3] >= 128) count++;
        }
        counts.push(count);
      }
      const cuts = [0];
      for (const boundary of [frameHeight,2*frameHeight]) {
        const ys = Array.from({length:65},(_,i)=>boundary-32+i);
        const minimum = Math.min(...ys.map(y=>counts[y]));
        cuts.push(ys.find(y=>counts[y]===minimum));
      }
      cuts.push(height);
      const bands = [0,1,2].map(row=>{
        const ys=Array.from({length:cuts[row+1]-cuts[row]},(_,i)=>cuts[row]+i).filter(y=>counts[y]>=16);
        return [ys[0],ys.at(-1)+1];
      });
      bands.forEach(([top,bottom],row) => {
        const y = Math.max(cuts[row],top-2), h = Math.min(cuts[row+1],bottom+2)-y;
        const torsoY = top + 140;
        const xs = Array.from({length:frameWidth},(_,x)=>x).filter(x=>pixels[(torsoY*width+column*frameWidth+x)*4+3]>=128);
        frames[row*4+column] = {rect:[column*frameWidth,y,frameWidth,h],anchor:[Math.round((xs[0]+xs.at(-1))/2),bottom-y]};
      });
    }
    console.log('EXPLICIT',direction,JSON.stringify(frames));
  }
  for (let frame = 0; frame < 12; frame++) {
    const ox = frame % 4 * frameWidth, oy = Math.floor(frame / 4) * frameHeight;
    const opaque = (x, y) => pixels[((oy + y) * width + ox + x) * 4 + 3] >= 128;
    // Torso center is stable even when arms/legs swing outside the silhouette.
    const row = Array.from({ length: frameWidth }, (_, x) => x).filter((x) => opaque(x, Math.round(frameHeight * 150 / 362)));
    const occupiedRows = Array.from({ length: frameHeight }, (_, y) => y).filter((y) => {
      let count = 0;
      for (let x = 0; x < frameWidth; x++) if (opaque(x, y)) count++;
      return count >= 16;
    });
    if (!row.length || !occupiedRows.length) throw Error(`Empty frame ${direction}/${frame}`);
    anchors.push([Math.round((row[0] + row.at(-1)) / 2), occupiedRows.at(-1) + 1]);
  }
  console.log(direction, { width, height, frameWidth, frameHeight }, JSON.stringify(anchors));
}
