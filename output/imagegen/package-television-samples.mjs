import { existsSync, readFileSync, writeFileSync } from 'node:fs';

const directory = new URL('../../public/assets/placeholders/', import.meta.url);
const directions = ['front', 'back', 'left', 'right'];
// Optional prefix reuses this lossless packaging step for other directional furniture sets.
const assetPrefix = process.argv[2] ?? 'television-console';
if (!/^[a-z0-9-]+$/.test(assetPrefix)) throw new Error('Invalid asset filename prefix');

// Preserve the generated pixels and alpha exactly; SVG is only a file-format wrapper.
const images = directions.map((direction) => {
  const stem = assetPrefix + '-' + direction + '-sample';
  const png = readFileSync(new URL(stem + '.png', directory));
  if (png.subarray(0, 8).toString('hex') !== '89504e470d0a1a0a') {
    throw new Error('Expected a PNG: ' + stem);
  }
  const destination = new URL(stem + '.svg', directory);
  if (existsSync(destination)) {
    throw new Error('Refusing to overwrite: ' + destination.pathname);
  }
  return {
    direction, destination, png,
    width: png.readUInt32BE(16),
    height: png.readUInt32BE(20),
  };
});

const canvasWidth = Math.max(...images.map((image) => image.width));
const canvasHeight = Math.max(...images.map((image) => image.height));
for (const { direction, destination, png, width, height } of images) {
  const svg = [
    '<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink"',
    '     width="' + canvasWidth + '" height="' + canvasHeight + '" viewBox="0 0 ' + canvasWidth + ' ' + canvasHeight + '">',
    '  <title>Placeholder ' + assetPrefix + ': ' + direction + '</title>',
    '  <desc>AI-generated pixel-art sample. Embedded PNG artwork, not editable vector paths.</desc>',
    '  <image width="' + width + '" height="' + height + '" style="image-rendering:pixelated" xlink:href="data:image/png;base64,' + png.toString('base64') + '"/>',
    '</svg>',
    '',
  ].join('\n');
  writeFileSync(destination, svg, { flag: 'wx' });
  console.log(destination.pathname);
}
