/** 非公開写真を認証付きで取得し、短命のblob URLを画面へ渡します。 */
export class CloudPhotoRepository {
  constructor(api) {
    this.api = api;
    this.cache = new Map();
    this.generation = 0;
  }
  route(path) {
    return "/photos/" + path.split("/").map(encodeURIComponent).join("/");
  }

  async get(gear) {
    if (!gear.photoPath) return gear.photoSrc || null;
    if (this.cache.has(gear.photoPath)) return this.cache.get(gear.photoPath);
    const generation = this.generation;
    const response = await this.api.request(this.route(gear.photoPath));
    const blob = await response.blob();
    if (generation !== this.generation) return null;
    const url = URL.createObjectURL(blob);
    // 同じ写真の並行取得が終わった場合も、余分なURLを残しません。
    if (this.cache.has(gear.photoPath)) {
      URL.revokeObjectURL(url);
      return this.cache.get(gear.photoPath);
    }
    this.cache.set(gear.photoPath, url);
    return url;
  }

  async upload(id, data) {
    // data URLは通信せずに復元し、connect-src 'self' の制限を維持します。
    const prefix = /^data:(image\/(?:webp|png|jpeg));base64,/.exec(data);
    if (!prefix) throw new Error("写真のデータ形式を確認してください。");
    const binary = atob(data.slice(prefix[0].length));
    const bytes = Uint8Array.from(binary, (character) =>
      character.charCodeAt(0),
    );
    const blob = new Blob([bytes], { type: prefix[1] });
    const response = await this.api.request("/photos", {
      method: "POST",
      headers: { "Content-Type": blob.type, "X-Gear-Id": id },
      body: blob,
    });
    return (await response.json()).path;
  }

  async remove(path) {
    if (!path?.includes("/")) return;
    await this.api.request(this.route(path), { method: "DELETE" });
    if (this.cache.has(path)) URL.revokeObjectURL(this.cache.get(path));
    this.cache.delete(path);
  }

  clear() {
    ++this.generation;
    for (const url of this.cache.values()) URL.revokeObjectURL(url);
    this.cache.clear();
  }
}
