# 無料プランでの導入

この手順は、新しいSupabaseプロジェクトとCloudflare Workerへの導入用。リポジトリの準備と、外部サービスへの公開は分けている。ソースだけではログインやDB接続は有効にならない。

## 1. Supabaseの準備

1. SupabaseアカウントでFreeプランのプロジェクトを作る。
2. SQL Editorで [マイグレーション](../supabase/migrations/202610060001_camp_shelf.sql) を実行する。道具用の3テーブル、保存関数、本人だけのRLS、非公開 `gear-photos` バケットが作られる。
3. Project URLと **Publishable key** を控える。公開キーの代わりに管理キーやDBパスワードを入れない。旧 `anon` キーも対応している。
4. AuthenticationのGoogle providerを有効にし、GoogleのOAuth Client IDとSecretをSupabaseの設定へ保存する。これらをリポジトリへ書かない。

GoogleのOAuthクライアントはWeb applicationとして作成し、Supabase画面に表示されるコールバックURL（`https://<project>.supabase.co/auth/v1/callback`）をGoogle側のAuthorized redirect URIへ登録する。Googleの画面で要求される同意画面・テストユーザー設定も済ませる。

詳細：[Supabase公式Google認証設定](https://supabase.com/docs/guides/auth/social-login/auth-google)。

## 2. Cloudflareへ公開

Node.js 22以上を使い、プロジェクトのルートで実行する。

```powershell
npm ci --ignore-scripts
npm run check
npm run build
npx wrangler login
npx wrangler secret put SUPABASE_URL
npx wrangler secret put SUPABASE_PUBLISHABLE_KEY
npm run deploy
```

`secret put` の対話入力で前項の値を渡す。値をソースやGitへ入れない。Publishable keyは利用者にも配信する公開設定だが、環境ごとに差し替えられるようWorkerの設定として管理する。

Cloudflare Workersのプランは **Free** を選ぶ。Worker名は `wrangler.jsonc` の `name` を必要に応じて変更する。静的公開物は `dist/` だけ。元の高容量PNG、SQL、開発設定、依存パッケージ一式は公開物に含めない。

デプロイ結果の `https://camp-gear-manager.<account>.workers.dev` を控える。このURLにアクセスすると `/app-config.js` がクラウド用設定を返す。リポジトリの `app-config.js` はローカル用のままでよい。

Supabase AuthenticationのURL Configurationに、公開URLをSite URLと許可したRedirect URLとして登録する。アプリの実際のパス（通常は `/`）まで一致させる。Google側のコールバックは引き続きSupabaseのURLを使う。

## 3. 従来データを移す場合

既存データはブラウザの**ドメインごと**に保存されている。GitHub Pagesの道具を新しい `workers.dev` の画面から直接読むことはできない。

元サイトと同じURLでクラウドへ接続し、そのサイトで移行ボタンを押す。

1. `wrangler.jsonc` の `ALLOWED_ORIGINS` に旧サイトの接続元を入れる。例：`https://ko-max-123.github.io`。パスや末尾のスラッシュは入れない。複数ならカンマ区切り。
2. Supabaseの許可したRedirect URLに、旧サイトの実際のURL（例：`https://ko-max-123.github.io/camp_gear_manager/`）を追加する。
3. 旧サイトへ配信する `app-config.js` のみ、次のように変更してビルドする。

```javascript
window.CAMP_CONFIG = Object.freeze({
  mode: "cloud",
  apiBaseUrl: "https://camp-gear-manager.<account>.workers.dev/api",
});
```

4. GitHub Pagesには `npm run build` で作った **distの内容** を配信する。ログインには `vendor/supabase.js` が必要なため、旧来のルート配信をクラウド用に切り替えるだけでは不足する。Settings → PagesのSourceをGitHub Actionsにし、同梱の `.github/workflows/pages.yml` をActions画面から手動で実行する。ワークフローはpushだけでは公開しない。
5. 旧サイトを、元データがある同じブラウザで開き、自分のアカウントでログインする。空のクラウド棚に「この棚へ移す」が出るので、自分のデータだと確認して押す。
6. 移行後はCloudflareのURLでも同じ棚を開ける。旧サイトの追加許可が不要なら `ALLOWED_ORIGINS` とSupabaseの旧Redirect URLを取り除く。

旧データは移行後もブラウザに残す。移行先は更新番号0の空の棚だけとし、既存のクラウド棚を自動で置き換えない。同じブラウザを他人と共有する場合、移行するデータが自分のものか確認する。

Cloudflareの `_headers` にある `connect-src 'self'` は同一ドメイン構成用。GitHub PagesでCSPを独自に設定している場合は、移行用Workerの接続先も許可する。GitHub PagesはCloudflareの `_headers` を解釈しない。

## ローカル開発

`.dev.vars.example` を `.dev.vars` へコピーして実際のProject URLと公開キーを入れる。`.dev.vars` はGitの対象外。

```powershell
npm run dev
```

Wranglerが表示するローカルURLをSupabaseのRedirect URLに追加する。GoogleログインもSupabaseに接続するため、開発用プロジェクトを使う。旧ブラウザ保存のみを開く場合は、リポジトリのルートをHTTPサーバーから配信する。ES modulesのため、HTMLをファイルとして直接開く方法は使わない。

## メールログインを追加する場合

初期設定はGoogleのみ。Supabaseの標準SMTPには送信先・送信数の制限があり、一般利用者のメールログインにはそのまま使わない。独自SMTPを設定し、SupabaseのEmail providerを有効にしてから `ENABLE_EMAIL_AUTH` を `true` にして再デプロイする。

SMTPサービスの無料枠は別に確認する。[Supabase公式SMTPガイド](https://supabase.com/docs/guides/auth/auth-smtp)を参照。

## 更新と確認

更新時は `npm run check`、`npm run build`、`npx wrangler deploy --dry-run` でソースと公開物を確認し、`npm run deploy` で公開する。SQLは今回の初期導入を終えたら、以降の変更を新しいマイグレーションとして追加する。

2026-10-06にCloudflareへの公開、SupabaseのSQL適用、Googleログインの設定を完了し、実際のログインと棚の保存を確認した。現在の接続先と確認範囲は[外部サービスの設定状況](integration-status.md)を参照。無料枠の容量・転送量は各サービスのダッシュボードで確認する。
