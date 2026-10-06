import { Bootstrap } from "./application/Bootstrap.js";

// エントリーポイントには組み立てだけを置きます。
const application = new Bootstrap(
  window.CAMP_CONFIG || { mode: "local", apiBaseUrl: "/api" },
);
application.start().catch((error) => {
  application.authView.show();
  application.authView.message(
    error.message || "棚を開けませんでした。接続を確認してください。",
  );
});
