import { HttpError } from "./HttpError.js";

/** 公開キーとユーザーJWTで通信します。管理用キーによるRLS回避はしません。 */
export class SupabaseGateway {
  constructor(env) {
    this.url = env.SUPABASE_URL?.replace(/\/$/, "");
    this.key = env.SUPABASE_PUBLISHABLE_KEY;
    if (!this.url || !this.key || !/^https:\/\//.test(this.url))
      throw new HttpError(503, "保存先の準備がまだ完了していません。");
    if (this.key.startsWith("sb_secret_"))
      throw new HttpError(503, "公開キーの設定を確認してください。");
    // 旧形式でもservice_roleは受け付けません。これは設定の誤り検出です。
    try {
      const payload = JSON.parse(atob(this.key.split(".")[1]));
      if (payload.role === "service_role")
        throw new HttpError(503, "公開キーの設定を確認してください。");
    } catch (error) {
      if (error instanceof HttpError) throw error;
    }
  }

  headers(token, contentType) {
    const headers = new Headers({ apikey: this.key });
    if (token) headers.set("Authorization", `Bearer ${token}`);
    if (contentType) headers.set("Content-Type", contentType);
    return headers;
  }

  async rpc(name, token, body = {}) {
    const response = await fetch(`${this.url}/rest/v1/rpc/${name}`, {
      method: "POST",
      headers: this.headers(token, "application/json"),
      body: JSON.stringify(body),
    });
    const result = await response.json().catch(() => ({}));
    if (!response.ok) {
      if (result.message === "shelf_conflict")
        throw new HttpError(
          409,
          "別の端末で更新されています。棚を読み直してから保存してください。",
        );
      if ([401, 403].includes(response.status))
        throw new HttpError(401, "ログインし直してください。");
      throw new HttpError(502, "道具の記録を保存先で処理できませんでした。");
    }
    return result;
  }

  async user(token) {
    const response = await fetch(`${this.url}/auth/v1/user`, {
      headers: this.headers(token),
    });
    if (!response.ok) throw new HttpError(401, "ログインし直してください。");
    const user = await response.json();
    if (!user.id) throw new HttpError(401, "ログインし直してください。");
    return user;
  }
}
