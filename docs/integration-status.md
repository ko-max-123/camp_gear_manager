# 外部サービスの設定状況

2026-10-06に設定・確認した公開環境。

公開サイト：<https://camp-gear-manager.mini-mountain1990.workers.dev/>

| サービス | 設定した内容 | 状態 |
| --- | --- | --- |
| Cloudflare Workers | `camp-gear-manager`、静的ファイル、認証・棚・写真のAPI | 公開済み |
| Supabase Database | `camp_shelves`、`camp_gear`、`camp_trip_items`、保存・読み込み関数、本人だけが操作できるRLS | SQL適用済み、実際の棚の保存・読み込みを確認 |
| Supabase Storage | 非公開の `gear-photos` バケット、本人のフォルダだけにアクセスするポリシー、5MiBの画像上限 | 設定済み、写真のアップロード・再表示は未確認 |
| Google / Supabase Auth | 専用Google Cloudプロジェクト、Web用OAuthクライアント、SupabaseのGoogle provider、公開サイトへの戻り先 | ご本人のGoogleアカウントでログイン成功 |

## 接続先

- Supabaseプロジェクト名：`camp-gear-manager`
- SupabaseプロジェクトID：`lexqnowverzerqphsbip`
- Google CloudプロジェクトID：`camp-gear-manager`
- Google OAuthクライアント名：`camp-gear-manager Web`
- Google側の戻り先：`https://lexqnowverzerqphsbip.supabase.co/auth/v1/callback`
- SupabaseのSite URL・許可したRedirect URL：`https://camp-gear-manager.mini-mountain1990.workers.dev/`

Google OAuthの秘密鍵はSupabaseのGoogle providerへ保存した。リポジトリには書いていない。WorkerにはSupabase URLとPublishable keyを設定し、管理キーを持たせていない。

## 確認結果

- `npm run check`、`npm run build`、Workerの公開前ビルドが成功。
- 公開サイト、クラウド用設定、認証SDKが正常に配信される。
- 未ログインで棚・写真のAPIへアクセスすると401になる。
- 3テーブルのRLS、非公開バケット、権限を昇格しない保存・読み込み関数をSQLで確認。
- Googleのアカウント選択・同意・Supabaseのコールバックを経て、公開サイトで空の棚を開ける。
- キャンプ名を一時的に変更して保存し、ページの再読み込み後にも同じ値が残ることを確認。確認後は元の「次回キャンプ」に戻した。
- ページの再読み込み後もログイン状態を維持できる。
- 写真のdata URLを`fetch`で読み直すと公開サイトのCSPに拒否される不具合を修正し、2026-10-06に再公開した。Base64から直接Blobへ変換し、`connect-src 'self'`を維持する。`npm test`でWebP・JPEG・PNGの画像のバイト列と形式が送信時に保持されることを確認し、公開用コードを使ったブラウザ検証でも同じCSP下で圧縮・送信・再表示が成功した。本番Supabase Storageへの写真アップロード・再表示は引き続き未確認。
- 2026-10-06にJPEG登録時の白背景除去を公開した。外周につながるほぼ白い背景をブラウザ内で透明にし、透過WebPとして送信する。`npm test`の8件、構文・import検査、ビルド、Workerの公開前ビルドが成功。同じCSPを使うChromeの確認画面で、白背景JPEG・白背景PNG・白背景WebP・透過PNG・色付き背景JPEGの5種類を圧縮・PC内の確認用保存先へ送信・再表示し、JPEGの白背景だけを除去し、道具の白いラベルと既存透過を保持することを確認。公開先の画像処理・白背景除去・写真送信・編集画面の各コードがビルドと一致することも確認した。既存写真は元のJPEGを選び直して記録すると適用される。

## 運用上の残り

Googleの公開ステータスは「テスト中」。ご本人のアカウントをテストユーザーに登録済み。ただし今回のGoogleログインは氏名・メール・プロフィール（`openid`、`userinfo.email`、`userinfo.profile`）だけを使うため、Googleの例外規定によりテストユーザーに未登録のアカウントも認証できる。Supabaseの「Allow new users to sign up」は有効で、初回のGoogleログインでアプリの利用者が登録される。実際のログイン確認はご本人のアカウントで行い、別アカウントでは未確認。

以前の「ご本人のみ利用可能」という説明は訂正。Googleのブランディング設定と公開ステータス変更は一般公開に向けた設定として残っているが、今回の基本情報だけを使うGoogleログインの新規登録を阻止する条件ではない。追加のOAuth権限を要求した場合は、この例外が適用されなくなる。[Google公式の対象ユーザー・公開ステータス説明](https://support.google.com/cloud/answer/15549945?hl=en)を参照。

メールログインは初期設定どおり無効。独自SMTPはGoogleログインで使うためには不要。

従来のGitHub Pagesや別ドメインのブラウザ保存データは移していない。移す場合は[旧データ移行の手順](deployment.md#3-従来データを移す場合)を使う。新しい棚にサンプルや既存のローカルデータを自動登録していない。
