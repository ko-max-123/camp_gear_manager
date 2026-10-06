import assert from "node:assert/strict";
import test from "node:test";
import { WhiteBackgroundRemover } from "../src/infrastructure/WhiteBackgroundRemover.js";

function picture(rows, colors) {
  return {
    width: rows[0].length,
    height: rows.length,
    data: new Uint8ClampedArray(
      rows.flatMap((row) => [...row].flatMap((symbol) => colors[symbol])),
    ),
  };
}
function pixel(image, x, y) {
  const offset = (y * image.width + x) * 4;
  return [...image.data.slice(offset, offset + 4)];
}
const white = [255, 255, 255, 255];
const dark = [45, 59, 34, 255];

test("外周の白背景を除去し、道具の内側の白い部分は残す", () => {
  const image = picture(
    [
      "WWWWWWW",
      "WDDDDDW",
      "WDWWWDW",
      "WDWWWDW",
      "WDWWWDW",
      "WDDDDDW",
      "WWWWWWW",
    ],
    { W: white, D: dark },
  );
  new WhiteBackgroundRemover().remove(image);
  for (const [x, y] of [
    [0, 0],
    [3, 0],
    [6, 3],
    [3, 6],
    [0, 3],
  ]) {
    assert.equal(pixel(image, x, y)[3], 0);
  }
  assert.deepEqual(pixel(image, 3, 3), white);
  assert.deepEqual(pixel(image, 1, 3), dark);
});

test("JPEGに含まれる小さな色差のある白背景も除去する", () => {
  const image = picture(["NNNNN", "NDDDN", "NDDDN", "NDDDN", "NNNNN"], {
    N: [246, 244, 241, 255],
    D: dark,
  });
  new WhiteBackgroundRemover().remove(image);
  assert.equal(pixel(image, 0, 2)[3], 0);
  assert.deepEqual(pixel(image, 2, 2), dark);
});

test("色付き背景や、斜めにしか接しない白い部分は残す", () => {
  const image = picture(["CWCCC", "CCWCC", "CCDCC", "CCCCC", "CCCCC"], {
    C: [255, 245, 215, 255],
    W: white,
    D: dark,
  });
  new WhiteBackgroundRemover().remove(image);
  assert.equal(pixel(image, 1, 0)[3], 0);
  assert.deepEqual(pixel(image, 2, 1), white);
  assert.deepEqual(pixel(image, 0, 0), [255, 245, 215, 255]);
  assert.deepEqual(pixel(image, 2, 2), dark);
});

test("白が混ざった明るい輪郭だけをなじませ、色のある道具を保つ", () => {
  const image = picture(["WWWWW", "WGGGW", "WGDGW", "WGYGW", "WWWWW"], {
    W: white,
    G: [230, 230, 230, 255],
    D: dark,
    Y: [255, 245, 225, 255],
  });
  new WhiteBackgroundRemover().remove(image);
  const edge = pixel(image, 1, 2);
  assert.ok(edge[3] > 0 && edge[3] < 255);
  assert.ok(edge[0] < 230);
  assert.deepEqual(pixel(image, 2, 2), dark);
  assert.deepEqual(pixel(image, 2, 3), [255, 245, 225, 255]);
});

test("白背景のない写真を変更しない", () => {
  const image = picture(["CCC", "CWC", "CCC"], {
    C: [210, 211, 212, 255],
    W: white,
  });
  const original = image.data.slice();
  assert.equal(new WhiteBackgroundRemover().remove(image), 0);
  assert.deepEqual(image.data, original);
});

test("長辺1280pxの大きな背景でも道具を残して処理を完了する", () => {
  const width = 1280,
    height = 960;
  const data = new Uint8ClampedArray(width * height * 4).fill(255);
  const image = { width, height, data };
  for (let y = 400; y < 560; ++y) {
    for (let x = 560; x < 720; ++x) data.set(dark, (y * width + x) * 4);
  }
  new WhiteBackgroundRemover().remove(image);
  assert.equal(pixel(image, 0, 0)[3], 0);
  assert.equal(pixel(image, width - 1, height - 1)[3], 0);
  assert.deepEqual(pixel(image, 640, 480), dark);
});
