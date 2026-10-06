import { HttpError } from "./HttpError.js";

/** 認証SDKが使う限定された経路を中継します。管理APIは公開しません。 */
export class AuthProxy {
  constructor(gateway, emailEnabled = false, origins) {
    this.gateway = gateway;
    this.emailEnabled = emailEnabled;
    this.origins = origins;
  }
  async handle(request, url, body) {
    const route = url.pathname.replace("/api/supabase/auth/v1/", "");
    const methods = {
      authorize: ["GET"],
      token: ["POST"],
      user: ["GET", "PUT"],
      logout: ["POST"],
      signup: ["POST"],
      recover: ["POST"],
      resend: ["POST"],
      verify: ["GET", "POST"],
    };
    if (!methods[route]?.includes(request.method))
      throw new HttpError(404, "この操作は利用できません。");
    if (
      !this.emailEnabled &&
      (["signup", "recover", "resend"].includes(route) ||
        (route === "token" &&
          url.searchParams.get("grant_type") === "password"))
    )
      throw new HttpError(403, "Googleアカウントでログインしてください。");
    const redirect = url.searchParams.get("redirect_to");
    if (redirect) this.origins.checkRedirect(redirect);
    const authorization = request.headers.get("Authorization");
    const bearer = authorization?.startsWith("Bearer ")
      ? authorization.slice(7)
      : null;
    const token = bearer === this.gateway.key ? null : bearer;
    const headers = this.gateway.headers(
      token,
      request.headers.get("Content-Type"),
    );
    // Supabase側の認証レート制限に元の接続元を伝えます。
    const ip = request.headers.get("CF-Connecting-IP");
    if (ip) headers.set("X-Forwarded-For", ip);
    const response = await fetch(
      `${this.gateway.url}/auth/v1/${route}${url.search}`,
      {
        method: request.method,
        headers,
        body: ["GET", "HEAD"].includes(request.method) ? undefined : body,
        redirect: "manual",
      },
    );
    const output = new Headers(response.headers);
    output.delete("Set-Cookie");
    output.set("Cache-Control", "no-store");
    return new Response(response.body, {
      status: response.status,
      headers: output,
    });
  }
}
