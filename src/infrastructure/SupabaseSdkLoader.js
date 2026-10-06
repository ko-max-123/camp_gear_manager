/** 公式SDKの固定版をローカル配信します。ローカル保存時は読み込みません。 */
export class SupabaseSdkLoader {
  async load() {
    if (globalThis.supabase) return globalThis.supabase;
    await new Promise((resolve, reject) => {
      const script = document.createElement("script");
      script.src = new URL("../../vendor/supabase.js", import.meta.url).href;
      script.onload = resolve;
      script.onerror = () =>
        reject(new Error("ログイン画面を読み込めませんでした。"));
      document.head.append(script);
    });
    return globalThis.supabase;
  }
}
