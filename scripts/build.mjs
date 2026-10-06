import { cp, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

// 公開物を明示してコピーします。SQL・環境設定・元画像は配信しません。
const root = path.resolve(fileURLToPath(new URL("..", import.meta.url)));
const output = path.resolve(root, "dist");
if (path.dirname(output) !== root || path.basename(output) !== "dist") {
  throw new Error("ビルド先がプロジェクト内のdistではありません。");
}
await rm(output, { recursive: true, force: true });
await mkdir(output, { recursive: true });
for (const name of [
  "index.html",
  "styles.css",
  "auth.css",
  "favicon.svg",
  "app.js",
  "app-config.js",
  "_headers",
  "src",
]) {
  await cp(path.join(root, name), path.join(output, name), { recursive: true });
}
const assets = [
  "storage-scene.webp",
  "storage-scene.jpg",
  "storage-cards.webp",
  "storage-cards.jpg",
  "unpack-ground.webp",
  "unpack-gear-atlas.webp",
  "owned-gear/titanmania-v-pegs-cutout.webp",
];
for (const name of assets) {
  const target = path.join(output, "assets", name);
  await mkdir(path.dirname(target), { recursive: true });
  await cp(path.join(root, "assets", name), target);
}
await mkdir(path.join(output, "vendor"), { recursive: true });
await cp(
  path.join(root, "node_modules/@supabase/supabase-js/dist/umd/supabase.js"),
  path.join(output, "vendor/supabase.js"),
);
const dependency = JSON.parse(
  await readFile(
    path.join(root, "node_modules/@supabase/supabase-js/package.json"),
    "utf8",
  ),
);
await cp(
  path.join(root, "node_modules/@supabase/supabase-js/LICENSE"),
  path.join(output, "vendor/supabase.LICENSE"),
);
await writeFile(
  path.join(output, "vendor/version.txt"),
  `@supabase/supabase-js ${dependency.version}\n`,
);
console.log(
  `公開ファイルをdistへ出力しました（Supabase SDK ${dependency.version}）。`,
);
