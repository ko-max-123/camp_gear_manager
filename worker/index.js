import { SupabaseGateway } from "./SupabaseGateway.js";
import { ShelfApi } from "./ShelfApi.js";
import { PhotoApi } from "./PhotoApi.js";
import { AuthProxy } from "./AuthProxy.js";
import { HttpError } from "./HttpError.js";
import { ClientOrigins } from "./ClientOrigins.js";

/** 配信とルーティングだけを担当し、業務処理は各APIクラスへ委譲します。 */
class CampWorker {
  async fetch(request, env) {
    if (!new URL(request.url).pathname.startsWith("/api/"))
      return this.route(request, env);
    try {
      const origins = new ClientOrigins(request, env);
      const response =
        request.method === "OPTIONS"
          ? new Response(null, { status: 204 })
          : await this.route(request, env, origins);
      return origins.apply(response);
    } catch (error) {
      return this.json(
        {
          message:
            error instanceof HttpError
              ? error.message
              : "接続元を確認してください。",
        },
        error instanceof HttpError ? error.status : 403,
      );
    }
  }

  async route(request, env, origins) {
    const url = new URL(request.url);
    try {
      if (url.pathname === "/app-config.js")
        return new Response(
          'window.CAMP_CONFIG = Object.freeze({mode:"cloud",apiBaseUrl:"/api"});',
          {
            headers: {
              "Content-Type": "text/javascript; charset=utf-8",
              "Cache-Control": "no-store",
            },
          },
        );
      if (!url.pathname.startsWith("/api/")) return env.ASSETS.fetch(request);
      const gateway = new SupabaseGateway(env);
      if (url.pathname === "/api/config" && request.method === "GET")
        return this.json({
          authUrl: url.origin + "/api/supabase",
          publishableKey: gateway.key,
          emailEnabled: env.ENABLE_EMAIL_AUTH === "true",
        });
      if (url.pathname.startsWith("/api/supabase/auth/v1/"))
        return await new AuthProxy(
          gateway,
          env.ENABLE_EMAIL_AUTH === "true",
          origins,
        ).handle(request, url, await this.body(request, 64 * 1024));
      const token = this.token(request);
      if (url.pathname === "/api/shelf") {
        const api = new ShelfApi(gateway);
        if (request.method === "GET") return this.json(await api.load(token));
        if (request.method === "PUT") {
          let input;
          try {
            input = JSON.parse(
              new TextDecoder().decode(await this.body(request, 1024 * 1024)),
            );
          } catch (error) {
            if (error instanceof HttpError) throw error;
            throw new HttpError(400, "記録の形式が正しくありません。");
          }
          return this.json(await api.save(token, input));
        }
      }
      const photos = new PhotoApi(gateway);
      if (url.pathname === "/api/photos" && request.method === "POST")
        return this.json(
          await photos.upload(
            token,
            request,
            await this.body(request, 5 * 1024 * 1024),
          ),
        );
      if (url.pathname.startsWith("/api/photos/")) {
        let path;
        try {
          path = decodeURIComponent(url.pathname.slice("/api/photos/".length));
        } catch {
          throw new HttpError(400, "写真の保存先が正しくありません。");
        }
        if (request.method === "GET") return await photos.read(token, path);
        if (request.method === "DELETE")
          return this.json(await photos.remove(token, path));
      }
      throw new HttpError(404, "この操作は利用できません。");
    } catch (error) {
      // トークン・写真・上流の詳細はログやレスポンスへ出しません。
      return this.json(
        {
          message:
            error instanceof HttpError
              ? error.message
              : "保存先に接続できませんでした。",
        },
        error instanceof HttpError ? error.status : 502,
      );
    }
  }

  token(request) {
    const value = request.headers.get("Authorization");
    if (!value?.startsWith("Bearer ") || value.length > 8192)
      throw new HttpError(401, "ログインしてください。");
    return value.slice(7);
  }

  /** Content-Lengthがなくても上限を守り、画像を無制限にメモリへ読みません。 */
  async body(request, limit) {
    if (!request.body) return undefined;
    if (Number(request.headers.get("Content-Length")) > limit)
      throw new HttpError(413, "保存するデータが大きすぎます。");
    const reader = request.body.getReader();
    const chunks = [];
    let size = 0;
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      size += value.byteLength;
      if (size > limit) {
        await reader.cancel();
        throw new HttpError(413, "保存するデータが大きすぎます。");
      }
      chunks.push(value);
    }
    const bytes = new Uint8Array(size);
    let offset = 0;
    for (const chunk of chunks) {
      bytes.set(chunk, offset);
      offset += chunk.byteLength;
    }
    return bytes.buffer;
  }

  json(value, status = 200) {
    return Response.json(value, {
      status,
      headers: {
        "Cache-Control": "no-store",
        "X-Content-Type-Options": "nosniff",
      },
    });
  }
}

const application = new CampWorker();
export default { fetch: (request, env) => application.fetch(request, env) };
