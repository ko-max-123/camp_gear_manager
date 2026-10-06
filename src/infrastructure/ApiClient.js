/** Cloudflare APIへの窓口。移行中の旧ドメイン接続にも同じJWTを使います。 */
export class ApiClient {
  constructor(baseUrl, auth) {
    this.baseUrl = baseUrl.replace(/\/$/, "");
    this.auth = auth;
  }

  async request(path, options = {}) {
    const userId = this.auth.user?.id;
    const session = await this.auth.session();
    if (!userId || session?.user.id !== userId || this.auth.user?.id !== userId)
      throw new Error("ログインし直してください。");
    const headers = new Headers(options.headers);
    headers.set("Authorization", `Bearer ${session.access_token}`);
    const response = await fetch(this.baseUrl + path, {
      ...options,
      headers,
      credentials: "same-origin",
      cache: "no-store",
    });
    if (!response.ok) {
      const body = await response.json().catch(() => ({}));
      const error = new Error(body.message || "保存先に接続できませんでした。");
      error.status = response.status;
      throw error;
    }
    return response;
  }
}
