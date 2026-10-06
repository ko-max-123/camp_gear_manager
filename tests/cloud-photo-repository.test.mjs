import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { CloudPhotoRepository } from "../src/infrastructure/CloudPhotoRepository.js";

test("圧縮済み写真をdata URLへの通信なしでアップロードする", async (t) => {
  // connect-src 'self' の画面では、data URLをfetchで読むと拒否されます。
  t.mock.method(globalThis, "fetch", () => {
    throw new Error("CSPによりdata URLへの通信は拒否されました。");
  });
  const fixtures = [
    {
      type: "image/webp",
      bytes: await readFile(
        new URL("../assets/storage-cards.webp", import.meta.url),
      ),
    },
    {
      type: "image/jpeg",
      bytes: await readFile(
        new URL("../assets/storage-cards.jpg", import.meta.url),
      ),
    },
    {
      type: "image/png",
      bytes: Buffer.from(
        "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+a7t0AAAAASUVORK5CYII=",
        "base64",
      ),
    },
  ];
  for (const { type, bytes } of fixtures) {
    let requests = 0;
    const photos = new CloudPhotoRepository({
      async request(route, options) {
        ++requests;
        assert.equal(route, "/photos");
        assert.equal(options.method, "POST");
        assert.equal(options.headers["X-Gear-Id"], "test-gear");
        assert.equal(options.headers["Content-Type"], type);
        assert.ok(options.body instanceof Blob);
        assert.equal(options.body.type, type);
        assert.deepEqual(Buffer.from(await options.body.arrayBuffer()), bytes);
        return Response.json({ path: "user/test-gear/photo.webp" });
      },
    });
    const path = await photos.upload(
      "test-gear",
      `data:${type};base64,${bytes.toString("base64")}`,
    );
    assert.equal(path, "user/test-gear/photo.webp");
    assert.equal(requests, 1);
  }
  assert.equal(globalThis.fetch.mock.callCount(), 0);
});

test("外部URLや対応していない形式を写真として送信しない", async (t) => {
  t.mock.method(globalThis, "fetch", () => {
    throw new Error("外部への通信は行いません。");
  });
  let requests = 0;
  const photos = new CloudPhotoRepository({
    async request() {
      ++requests;
      throw new Error("送信してはいけません。");
    },
  });
  for (const data of [
    "https://example.com/photo.webp",
    "data:text/html;base64,PGgxPnRlc3Q8L2gxPg==",
    "data:image/webp,not-base64",
  ]) {
    await assert.rejects(photos.upload("test-gear", data), /写真のデータ形式/);
  }
  assert.equal(requests, 0);
  assert.equal(globalThis.fetch.mock.callCount(), 0);
});
