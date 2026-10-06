import { $, $$ } from "./gearPresentation.js";

/** 棚と同じ写真・紙・布の質感で、ログインだけを扱う画面です。 */
export class AuthView {
  constructor() {
    this.mode = "login";
    this.ready = false;
    this.emailEnabled = false;
  }

  bind(actions) {
    $("#googleLoginBtn").onclick = () => this.run(() => actions.google());
    $$("[data-auth-mode]").forEach(
      (button) => (button.onclick = () => this.show(button.dataset.authMode)),
    );
    $("#authLocalBackBtn").onclick = () => this.close();
    $("#authForm").onsubmit = (event) => {
      event.preventDefault();
      const email = $("#authEmail").value.trim(),
        password = $("#authPassword").value;
      this.run(async () => {
        await actions[this.mode](email, password);
        if (this.mode === "signup")
          this.message(
            "確認メールを送りました。メールのリンクから棚を開いてください。",
          );
        if (this.mode === "recover")
          this.message(
            "登録済みの場合、パスワードを変更するメールが届きます。",
          );
      });
    };
  }

  configure({ ready, emailEnabled = false, local = false }) {
    this.ready = ready;
    this.emailEnabled = emailEnabled;
    this.local = local;
    $(".auth-footnote").textContent = local
      ? "このブラウザに保存した道具棚を開いています。"
      : "あなたの道具は、あなたのアカウントに保存します。";
    $("#authLocalBackBtn").hidden = !local;
    $("#authEmailSection").hidden = !emailEnabled;
    $("#googleLoginBtn").disabled = !ready;
  }

  show(mode = "login") {
    this.mode = mode;
    $("#appHeader").hidden = true;
    $("#appLayout").hidden = true;
    $("#authScreen").hidden = false;
    const titles = {
      login: "いつもの道具を、あなたの棚へ。",
      signup: "自分の道具棚をつくる。",
      recover: "棚の鍵を、新しくする。",
      updatePassword: "新しいパスワードを決める。",
    };
    $("#authTitle").textContent = titles[mode] || titles.login;
    $("#authEmailField").hidden = mode === "updatePassword";
    $("#authEmail").required = mode !== "updatePassword";
    $("#authPasswordField").hidden = mode === "recover";
    $("#authPassword").required = mode !== "recover";
    $("#authPassword").minLength = ["signup", "updatePassword"].includes(mode)
      ? 8
      : 1;
    $("#authPassword").autocomplete =
      mode === "login" ? "current-password" : "new-password";
    $("#authSubmitBtn").textContent = {
      login: "メールで棚を開く",
      signup: "道具棚をつくる",
      recover: "変更用のメールを送る",
      updatePassword: "新しいパスワードを保存",
    }[mode];
    $("#googleLoginBtn").hidden = mode === "updatePassword";
    $("#authEmailSection").hidden =
      !this.emailEnabled && mode !== "updatePassword";
    $("#authPassword").value = "";
    this.message(
      this.ready
        ? ""
        : this.local
          ? "現在の棚は、このブラウザに保存されています。クラウド接続後にログインを利用できます。"
          : "クラウドへの接続を準備しています。",
    );
    $("#authTitle").focus({ preventScroll: true });
  }

  close() {
    $("#authScreen").hidden = true;
    $("#appHeader").hidden = false;
    $("#appLayout").hidden = false;
    $("#authForm").reset();
  }

  message(text) {
    $("#authMessage").textContent = text;
  }
  async run(action) {
    if (!this.ready) return;
    $$("#authScreen button").forEach((button) => (button.disabled = true));
    this.message("棚の鍵を確認しています…");
    try {
      await action();
    } catch {
      this.message(
        "ログインできませんでした。入力内容や接続を確認して、もう一度お試しください。",
      );
    } finally {
      $$("#authScreen button").forEach((button) => (button.disabled = false));
    }
  }
}
