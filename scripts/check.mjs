import { readFile, readdir } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { parse } from "acorn";

// 実画面や認証は動かさず、構文・import・静的な参照の整合だけ確認します。
const root = path.resolve(fileURLToPath(new URL("..", import.meta.url)));
async function files(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const nested = await Promise.all(
    entries.map((entry) => {
      const name = path.join(directory, entry.name);
      return entry.isDirectory() ? files(name) : name;
    }),
  );
  return nested.flat().filter((name) => /\.(js|mjs)$/.test(name));
}
function walk(node, callback) {
  if (!node || typeof node !== "object") return;
  if (node.type) callback(node);
  for (const value of Object.values(node)) {
    if (Array.isArray(value)) value.forEach((item) => walk(item, callback));
    else if (value && typeof value === "object") walk(value, callback);
  }
}
const sources = [
  path.join(root, "app.js"),
  path.join(root, "app-config.js"),
  ...(await files(path.join(root, "src"))),
  ...(await files(path.join(root, "worker"))),
  ...(await files(path.join(root, "scripts"))),
];
const parsed = new Map();
for (const file of sources)
  parsed.set(
    file,
    parse(await readFile(file, "utf8"), {
      ecmaVersion: "latest",
      sourceType: "module",
    }),
  );
const html = await readFile(path.join(root, "index.html"), "utf8");
const classes = new Map();
for (const ast of parsed.values())
  walk(ast, (node) => {
    if (node.type === "ClassDeclaration")
      classes.set(
        node.id.name,
        new Set(
          node.body.body
            .filter((item) => item.type === "MethodDefinition")
            .map((item) => item.key.name),
        ),
      );
  });
const handles = {
  shell: "AppController",
  navigation: "NavigationController",
  sceneView: "StorageSceneView",
  collection: "CollectionView",
  details: "GearDetailView",
  maintenance: "GearMaintenanceView",
  assets: "SceneAssetLoader",
  imageProcessor: "ImageProcessor",
  service: "ShelfService",
};
function memberChain(node) {
  if (node?.type === "ThisExpression") return "this";
  if (node?.type === "MemberExpression" && !node.computed)
    return memberChain(node.object) + "." + node.property.name;
  return "";
}
const ids = [...html.matchAll(/\bid="([^"]+)"/g)].map((match) => match[1]);
if (new Set(ids).size !== ids.length)
  throw new Error("HTMLのidが重複しています。");
for (const [file, ast] of parsed) {
  walk(ast, (node) => {
    if (node.type !== "CallExpression") return;
    const parts = memberChain(node.callee).split(".");
    if (
      parts.length === 4 &&
      parts[0] === "this" &&
      parts[1] === "context" &&
      handles[parts[2]] &&
      !classes.get(handles[parts[2]]).has(parts[3])
    )
      throw new Error(
        `${path.relative(root, file)}: クラスのメソッドがありません: ${parts.join(".")}`,
      );
  });
  const imports = ast.body.filter((node) => node.type === "ImportDeclaration");
  for (const node of imports) {
    if (!node.source.value.startsWith(".")) continue;
    const target = path.resolve(path.dirname(file), node.source.value);
    if (!parsed.has(target))
      throw new Error(
        `${path.relative(root, file)}: import先がありません: ${node.source.value}`,
      );
    const exports = new Set();
    walk(parsed.get(target), (item) => {
      if (item.type !== "ExportNamedDeclaration") return;
      if (item.declaration?.id) exports.add(item.declaration.id.name);
      for (const value of item.declaration?.declarations || [])
        exports.add(value.id.name);
      for (const value of item.specifiers || [])
        exports.add(value.exported.name);
    });
    for (const item of node.specifiers)
      if (item.type === "ImportSpecifier" && !exports.has(item.imported.name))
        throw new Error(
          `${path.relative(root, file)}: exportがありません: ${item.imported.name}`,
        );
  }
  if (file.includes(`${path.sep}src${path.sep}`))
    walk(ast, (node) => {
      if (
        node.type !== "CallExpression" ||
        !["$", "$$"].includes(node.callee.name)
      )
        return;
      const selector = node.arguments[0]?.value;
      const id =
        typeof selector === "string" && /^#([\w-]+)/.exec(selector)?.[1];
      if (id && !ids.includes(id))
        throw new Error(
          `${path.relative(root, file)}: HTMLに#${id}がありません。`,
        );
    });
}
console.log(
  `${sources.length}ファイルの構文・importと、${ids.length}個のHTML idを確認しました。`,
);
