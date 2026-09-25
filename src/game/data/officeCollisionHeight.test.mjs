import { readFileSync } from 'node:fs';
import { inflateSync } from 'node:zlib';
import { describe, expect, it } from 'vitest';
import { office } from './office';
import { optionalTexturePaths } from '../../app/assetManifest';
import { approvedOfficeResizes, approvedDogChange, approvedPlants } from '../systems/fixtures/remainingOwnership.mjs';

// Decode the shipped non-interlaced 8-bit RGBA PNG scanlines independently of
// runtime geometry. All five PNG row filters are supported; other formats fail.
function opaqueRows(bytes) {
  expect(bytes.subarray(0, 8).toString('hex')).toBe('89504e470d0a1a0a');
  const width = bytes.readUInt32BE(16), height = bytes.readUInt32BE(20);
  expect([bytes[24], bytes[25], bytes[28]]).toEqual([8, 6, 0]);
  const chunks = [];
  for (let offset = 8; offset < bytes.length;) {
    const length = bytes.readUInt32BE(offset);
    if (bytes.toString('ascii', offset + 4, offset + 8) === 'IDAT') chunks.push(bytes.subarray(offset + 8, offset + 8 + length));
    offset += length + 12;
  }
  const raw = inflateSync(Buffer.concat(chunks)), stride = width * 4;
  expect(raw.length).toBe((stride + 1) * height);
  let prior = Buffer.alloc(stride), first = height, last = -1, left = width, right = -1;
  const rowBounds = [];
  for (let y = 0; y < height; y++) {
    const offset = y * (stride + 1), filter = raw[offset], row = Buffer.alloc(stride);
    expect(filter).toBeLessThanOrEqual(4);
    for (let x = 0; x < stride; x++) {
      const a = x >= 4 ? row[x - 4] : 0, b = prior[x], c = x >= 4 ? prior[x - 4] : 0;
      const p = a + b - c, pa = Math.abs(p - a), pb = Math.abs(p - b), pc = Math.abs(p - c);
      const predictor = filter === 0 ? 0 : filter === 1 ? a : filter === 2 ? b : filter === 3
        ? Math.floor((a + b) / 2) : pa <= pb && pa <= pc ? a : pb <= pc ? b : c;
      row[x] = (raw[offset + 1 + x] + predictor) & 255;
    }
    let rowLeft = width, rowRight = -1;
    for (let x = 3; x < stride; x += 4) if (row[x] >= 128) {
      first = Math.min(first, y); last = y;
      const pixelX = (x - 3) / 4;
      left = Math.min(left, pixelX); right = Math.max(right, pixelX);
      rowLeft = Math.min(rowLeft, pixelX); rowRight = Math.max(rowRight, pixelX);
    }
    rowBounds.push({ y, left: rowLeft, right: rowRight });
    prior = row;
  }
  const lowerRows = rowBounds.filter(row => row.y >= first + (last + 1 - first) * 0.7 && row.right >= 0);
  const potCenter = (Math.min(...lowerRows.map(row => row.left)) + Math.max(...lowerRows.map(row => row.right)) + 1) / 2;
  return { width, height, bounds: [first, last + 1], bbox: [left, first, right + 1, last + 1], potCenter };
}

describe('owner-approved office collision height from opaque artwork', () => {
  it.each([
    { id: 'office-sofa', bounds: [134, 1360], displayHeight: 4.6, anchor: { x: 13.75, y: 7.1875 } },
    { id: 'office-coffee-table', bounds: [151, 1349], displayHeight: 3.4, anchor: { x: 10.75, y: 6.9375 } },
  ])('$id blocks 80 percent of visible height with fixed bottom, width and anchor', ({ id, bounds, displayHeight, anchor }) => {
    const sprite = office.decorations.find(sprite => sprite.id === id);
    const png = readFileSync(new URL(`../../../public/assets/${optionalTexturePaths[sprite.assetId]}`, import.meta.url));
    const measured = opaqueRows(png);
    expect(measured).toMatchObject({ height: 1536, bounds });
    expect(sprite.displayHeightTiles).toBe(displayHeight);
    expect(sprite.groundAnchor).toEqual(anchor);
    const resize = approvedOfficeResizes.find(resize => resize.id === id);
    expect(sprite.footprints).toEqual([resize.rect]);
    const rect = sprite.footprints[0];
    expect(rect.height).toBe(displayHeight * ((measured.bounds[1] - measured.bounds[0]) / measured.height) * 0.8);
    expect(rect.y + rect.height).toBeCloseTo(resize.old.y + resize.old.height, 12);
    expect({ x: rect.x, width: rect.width }).toEqual({ x: resize.old.x, width: resize.old.width });
  });

  it('maps the full dog-bed opaque bounding box after only the approved downward move', () => {
    const dog = office.interactables.find(sprite => sprite.id === 'office-dog-bed');
    const bytes = readFileSync(new URL(`../../../public/assets/${optionalTexturePaths[dog.assetId]}`, import.meta.url));
    const measured = opaqueRows(bytes);
    expect(measured).toMatchObject({ width: 1536, height: 1024, bbox: [31, 107, 1517, 954] });
    expect(dog.position).toEqual(approvedDogChange.position);
    expect(dog.groundAnchor).toEqual(approvedDogChange.anchor);
    expect(dog.displayHeightTiles).toBe(1.6);
    expect(dog.displayWidthTiles).toBeUndefined();
    expect(dog.footprints).toEqual([approvedDogChange.rect]);
    const [left, top, right, bottom] = measured.bbox;
    const scale = 1.6 / measured.height;
    const expected = { x: dog.position.x + 0.5 + (left - measured.width / 2) * scale,
      y: dog.position.y + 0.5 + (top - measured.height / 2) * scale,
      width: (right - left) * scale, height: (bottom - top) * scale };
    for (const key of ['x', 'y', 'width', 'height']) expect(dog.footprints[0][key]).toBeCloseTo(expected[key], 12);
  });
});

describe('extracted office plant asset registration', () => {
  it.each([
    { index: 0, width: 1221, height: 1288, bbox: [325, 90, 930, 1224], potCenter: 619, backdropCenter: 1518 },
    { index: 1, width: 1240, height: 1268, bbox: [195, 179, 1030, 1127], potCenter: 631, backdropCenter: 98 },
    { index: 2, width: 1312, height: 1199, bbox: [209, 102, 1106, 1118], potCenter: 660, backdropCenter: 1537 },
  ])('pins sprite $index alpha bounds and aligns its pot center and visible bottom', ({ index, backdropCenter, ...expected }) => {
    const plant = approvedPlants[index];
    const live = office.decorations.find(sprite => sprite.id === plant.id);
    expect(live).toEqual(plant);
    expect(optionalTexturePaths[plant.assetId]).toBe(`sprites/${plant.id}/front-v1.png`);
    const bytes = readFileSync(new URL(`../../../public/assets/${optionalTexturePaths[plant.assetId]}`, import.meta.url));
    const measured = opaqueRows(bytes);
    expect(measured).toMatchObject(expected);
    const scale = live.displayHeightTiles * 16 / measured.height;
    const visibleBottom = (live.position.y + 0.5) * 16 + (measured.bbox[3] - measured.height / 2) * scale;
    const potCenter = (live.position.x + 0.5) * 16 + (measured.potCenter - measured.width / 2) * scale;
    expect(Math.abs(visibleBottom - live.groundAnchor.y * 16)).toBeLessThan(1e-5);
    // Horizontal registration follows the reviewed original-art pot center,
    // not the independently authored collision/anchor center.
    expect(Math.abs(potCenter - backdropCenter * (17 * 16 / 1634))).toBeLessThan(1e-5);
  });

  it('keeps both restored and original office backgrounds available in the manifest', () => {
    for (const [key, path] of [
      ['office-background', 'backgrounds/office/sample-v5.png'],
      ['office-background-plants-removed', 'backgrounds/office/three-plants-removed-v1.png'],
    ]) {
      expect(optionalTexturePaths[key]).toBe(path);
      const bytes = readFileSync(new URL(`../../../public/assets/${path}`, import.meta.url));
      expect(bytes.subarray(0, 8).toString('hex')).toBe('89504e470d0a1a0a');
      expect([bytes.readUInt32BE(16), bytes.readUInt32BE(20)]).toEqual([1634, 962]);
    }
  });
});
