// GitHub Pagesとローカル確認は従来のブラウザ保存を使います。
// Cloudflare公開時はWorkerがこの設定をクラウド用に差し替えます。
window.CAMP_CONFIG = Object.freeze({ mode: "local", apiBaseUrl: "/api" });
