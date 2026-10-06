import { HttpError } from "./HttpError.js";

/** 写真はユーザーごとの非公開フォルダへ保存します。公開URLは作りません。 */
export class PhotoApi {
  constructor(gateway) {
    this.gateway = gateway;
    this.bucket = "gear-photos";
  }

  async ownPath(token, path) {
    if (!/^[\w-]+\/[\w-]+\/[\w.-]+$/.test(path))
      throw new HttpError(400, "写真の保存先が正しくありません。");
    const user = await this.gateway.user(token);
    if (!path.startsWith(user.id + "/"))
      throw new HttpError(403, "この写真は開けません。");
    return path.split("/").map(encodeURIComponent).join("/");
  }

  async upload(token, request, bytes) {
    const user = await this.gateway.user(token);
    const id = request.headers.get("X-Gear-Id");
    const type = request.headers.get("Content-Type")?.split(";")[0];
    const formats = {
      "image/webp": "webp",
      "image/png": "png",
      "image/jpeg": "jpg",
    };
    if (!/^[\w-]{1,100}$/.test(id || "") || !formats[type])
      throw new HttpError(400, "PNG・WebP・JPEGの写真を選んでください。");
    const header = new Uint8Array(bytes);
    const magic =
      type === "image/png"
        ? header[0] === 137 &&
          header[1] === 80 &&
          header[2] === 78 &&
          header[3] === 71
        : type === "image/jpeg"
          ? header[0] === 255 && header[1] === 216
          : String.fromCharCode(...header.slice(0, 4)) === "RIFF" &&
            String.fromCharCode(...header.slice(8, 12)) === "WEBP";
    if (!magic)
      throw new HttpError(400, "写真のファイル形式を確認してください。");
    const path = `${user.id}/${id}/${crypto.randomUUID()}.${formats[type]}`;
    const response = await fetch(
      `${this.gateway.url}/storage/v1/object/${this.bucket}/${path}`,
      {
        method: "POST",
        headers: this.gateway.headers(token, type),
        body: bytes,
      },
    );
    if (!response.ok) throw new HttpError(502, "写真を保存できませんでした。");
    return { path };
  }

  async read(token, path) {
    const encoded = await this.ownPath(token, path);
    const response = await fetch(
      `${this.gateway.url}/storage/v1/object/authenticated/${this.bucket}/${encoded}`,
      { headers: this.gateway.headers(token) },
    );
    if (!response.ok)
      throw new HttpError(
        response.status === 404 ? 404 : 502,
        "写真を読み込めませんでした。",
      );
    return new Response(response.body, {
      headers: {
        "Content-Type":
          response.headers.get("Content-Type") || "application/octet-stream",
        "Cache-Control": "private, no-store",
        "X-Content-Type-Options": "nosniff",
      },
    });
  }

  async remove(token, path) {
    await this.ownPath(token, path);
    const response = await fetch(
      `${this.gateway.url}/storage/v1/object/${this.bucket}`,
      {
        method: "DELETE",
        headers: this.gateway.headers(token, "application/json"),
        body: JSON.stringify({ prefixes: [path] }),
      },
    );
    if (!response.ok) throw new HttpError(502, "写真を削除できませんでした。");
    return { deleted: true };
  }
}
