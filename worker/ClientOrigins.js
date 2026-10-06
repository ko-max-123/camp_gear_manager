import { HttpError } from "./HttpError.js";

/** 旧GitHub Pagesからの移行時だけ、設定した接続元を追加で許可します。 */
export class ClientOrigins {
  constructor(request, env) {
    this.allowed = new Set([new URL(request.url).origin]);
    for (const value of (env.ALLOWED_ORIGINS || "").split(",")) {
      if (!value.trim()) continue;
      const url = new URL(value.trim());
      if (
        url.protocol !== "https:" ||
        url.pathname !== "/" ||
        url.search ||
        url.hash
      )
        throw new HttpError(503, "接続元の設定を確認してください。");
      this.allowed.add(url.origin);
    }
    this.origin = request.headers.get("Origin");
    if (this.origin && !this.allowed.has(this.origin))
      throw new HttpError(403, "この接続元からは利用できません。");
  }

  checkRedirect(value) {
    try {
      if (this.allowed.has(new URL(value).origin)) return;
    } catch {
      /* 不正なURLも同じ案内に揃えます。 */
    }
    throw new HttpError(400, "ログイン後の戻り先を確認してください。");
  }

  apply(response) {
    const headers = new Headers(response.headers);
    headers.delete("Access-Control-Allow-Origin");
    headers.delete("Access-Control-Allow-Credentials");
    if (this.origin) {
      headers.set("Access-Control-Allow-Origin", this.origin);
      headers.set(
        "Access-Control-Allow-Methods",
        "GET, POST, PUT, DELETE, OPTIONS",
      );
      headers.set(
        "Access-Control-Allow-Headers",
        "Authorization, Content-Type, X-Gear-Id, apikey, x-client-info, x-supabase-api-version",
      );
      headers.append("Vary", "Origin");
    }
    return new Response(response.body, { status: response.status, headers });
  }
}
