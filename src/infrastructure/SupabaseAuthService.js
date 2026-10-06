/** Supabaseの公式SDKだけに認証を任せ、パスワードをアプリで保存しません。 */
export class SupabaseAuthService {
  constructor(client) {
    this.client = client;
    this.user = null;
  }
  async session() {
    const { data, error } = await this.client.auth.getSession();
    if (error) throw error;
    return data.session;
  }
  subscribe(listener) {
    const { data } = this.client.auth.onAuthStateChange((event, session) => {
      this.user = session?.user || null;
      // SDKの認証ロック内では、DBや次の認証メソッドを呼びません。
      setTimeout(() => listener(event, session), 0);
    });
    return () => data.subscription.unsubscribe();
  }
  async google() {
    const { error } = await this.client.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: this.callbackUrl() },
    });
    if (error) throw error;
  }
  async login(email, password) {
    const { error } = await this.client.auth.signInWithPassword({
      email,
      password,
    });
    if (error) throw error;
  }
  async signup(email, password) {
    const { error } = await this.client.auth.signUp({
      email,
      password,
      options: { emailRedirectTo: this.callbackUrl() },
    });
    if (error) throw error;
  }
  async recover(email) {
    const { error } = await this.client.auth.resetPasswordForEmail(email, {
      redirectTo: this.callbackUrl(),
    });
    if (error) throw error;
  }
  async updatePassword(password) {
    const { error } = await this.client.auth.updateUser({ password });
    if (error) throw error;
  }
  async logout() {
    const { error } = await this.client.auth.signOut({ scope: "local" });
    if (error) throw error;
  }
  callbackUrl() {
    return location.origin + location.pathname;
  }
}
