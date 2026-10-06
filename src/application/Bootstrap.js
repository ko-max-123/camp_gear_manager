import { ApplicationContext } from "./ApplicationContext.js";
import { ShelfService } from "./ShelfService.js";
import { LegacyMigrationService } from "./LegacyMigrationService.js";
import { LocalShelfRepository } from "../infrastructure/LocalShelfRepository.js";
import { LocalPhotoRepository } from "../infrastructure/LocalPhotoRepository.js";
import { CloudShelfRepository } from "../infrastructure/CloudShelfRepository.js";
import { CloudPhotoRepository } from "../infrastructure/CloudPhotoRepository.js";
import { SupabaseAuthService } from "../infrastructure/SupabaseAuthService.js";
import { SupabaseSdkLoader } from "../infrastructure/SupabaseSdkLoader.js";
import { ApiClient } from "../infrastructure/ApiClient.js";
import { AuthView } from "../presentation/AuthView.js";
import { $ } from "../presentation/gearPresentation.js";

/** 起動時の依存注入と、ユーザー切替時のライフサイクルを管理します。 */
export class Bootstrap {
  constructor(config) {
    this.config = config;
    this.context = new ApplicationContext();
    this.context.cloud = config.mode === "cloud";
    this.authView = new AuthView();
    this.local = new LocalShelfRepository();
    this.localPhotos = new LocalPhotoRepository();
    this.auth = null;
    this.userId = null;
    this.generation = 0;
  }

  async start() {
    this.bindAccount();
    if (this.config.mode !== "cloud") {
      this.context.service = this.service(this.local, this.localPhotos);
      await this.context.service.load();
      this.authView.configure({ ready: false, local: true });
      this.authView.close();
      await this.context.shell.init();
      this.context.shell.setStatus("local");
      return;
    }
    this.authView.configure({ ready: false });
    this.authView.show();
    const response = await fetch(this.config.apiBaseUrl + "/config", {
      cache: "no-store",
    });
    if (!response.ok) throw new Error("保存先の準備がまだ完了していません。");
    const settings = await response.json();
    const sdk = await new SupabaseSdkLoader().load();
    const client = sdk.createClient(settings.authUrl, settings.publishableKey, {
      auth: {
        flowType: "pkce",
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
        storageKey: "campGearShelf_session",
      },
    });
    this.auth = new SupabaseAuthService(client);
    this.authView.configure({
      ready: true,
      emailEnabled: settings.emailEnabled,
    });
    this.authView.show();
    this.auth.subscribe((event, session) =>
      this.sessionChanged(event, session).catch((error) =>
        this.authView.message(error.message),
      ),
    );
    // INITIAL_SESSIONイベントが起動後の状態を決めます。
  }

  service(repository, photos) {
    return new ShelfService(repository, photos, (status, error) =>
      this.context.shell.setStatus(status, error),
    );
  }

  async sessionChanged(event, session) {
    if (event === "PASSWORD_RECOVERY") {
      this.recovering = true;
      this.context.clear();
      this.userId = null;
      ++this.generation;
      this.authView.show("updatePassword");
      return;
    }
    const user = session?.user;
    if (!user) {
      this.recovering = false;
      ++this.generation;
      this.userId = null;
      this.context.clear();
      $("#accountEmail").textContent = "";
      $("#logoutBtn").hidden = true;
      $("#migrationBanner").hidden = true;
      $("#accountBtn").textContent = "ログイン";
      this.authView.show();
      return;
    }
    if (this.recovering) return;
    if (this.userId === user.id) return; // token更新で編集中の画面を消しません。
    const generation = ++this.generation;
    this.userId = user.id;
    this.context.clear();
    const api = new ApiClient(this.config.apiBaseUrl, this.auth);
    const service = this.service(
      new CloudShelfRepository(api),
      new CloudPhotoRepository(api),
    );
    this.context.service = service;
    try {
      await service.load();
      if (generation !== this.generation) return;
      this.migration = new LegacyMigrationService(
        this.local,
        this.localPhotos,
        service,
        user.id,
      );
      $("#accountEmail").textContent = user.email || "あなたの道具棚";
      $("#logoutBtn").hidden = false;
      $("#accountBtn").textContent = "自分の棚";
      this.authView.close();
      await this.context.shell.init();
      this.refreshMigration();
      this.context.shell.setStatus("saved");
    } catch (error) {
      if (generation === this.generation) {
        this.userId = null;
        this.authView.show();
        this.authView.message(error.message);
      }
    }
  }

  bindAccount() {
    this.authView.bind({
      google: () => this.auth.google(),
      login: (email, password) => this.auth.login(email, password),
      signup: (email, password) => this.auth.signup(email, password),
      recover: (email) => this.auth.recover(email),
      updatePassword: async (_email, password) => {
        await this.auth.updatePassword(password);
        await this.auth.logout();
        this.authView.show("login");
        this.authView.message("新しいパスワードでログインしてください。");
      },
    });
    $("#accountBtn").onclick = (event) => {
      event.stopPropagation();
      if (this.userId) {
        $("#toolsMenu").open = !$("#toolsMenu").open;
      } else this.authView.show();
    };
    $("#logoutBtn").onclick = async () => {
      const button = $("#logoutBtn");
      button.disabled = true;
      try {
        await this.context.shell.flushTripName();
        await this.context.service?.queue.catch(() => {});
        await this.auth.logout();
      } catch {
        this.context.shell.toast(
          "ログアウトできませんでした。保存状態を確かめてください。",
        );
      } finally {
        button.disabled = false;
      }
    };
    $("#reloadShelfBtn").onclick = () => this.reload();
    $("#migrateLocalBtn").onclick = async () => {
      const button = $("#migrateLocalBtn");
      button.disabled = true;
      try {
        await this.migration.import((current, total) => {
          $("#migrationMessage").textContent =
            `写真と道具を移しています ${current} / ${total}`;
        });
        this.context.photoCache.clear();
        await this.context.shell.renderAll();
        this.refreshMigration();
        this.context.shell.toast("このブラウザの道具を棚へ移しました");
      } catch (error) {
        this.context.shell.toast(error.message);
      } finally {
        button.disabled = false;
      }
    };
  }

  refreshMigration() {
    const available = this.migration?.available();
    $("#migrationBanner").hidden = !available;
    if (available)
      $("#migrationMessage").textContent =
        `このブラウザに保存した道具 ${this.local.readStored().gear.length}点を、自分の棚へ移せます。`;
  }

  async reload() {
    // 読み直しは未保存の入力を戻します。競合した内容を再送しません。
    if (!confirm("未保存の入力を戻して、保存先から棚を読み直しますか？"))
      return;
    try {
      clearTimeout(this.context.shell.tripTimer);
      this.context.shell.pendingTripName = null;
      await this.context.service.queue.catch(() => {});
      this.context.navigation.discardEditor();
      this.context.navigation.discardDetail();
      await this.context.service.load();
      this.context.photoCache.clear();
      await this.context.navigation.switchView("inventory");
      document.body.classList.toggle(
        "dark",
        this.context.service.state.theme === "dark",
      );
      this.context.shell.setStatus(
        this.config.mode === "cloud" ? "saved" : "local",
      );
      this.refreshMigration();
    } catch {
      this.context.shell.toast(
        "棚を読み直せませんでした。接続を確認してください。",
      );
    }
  }
}
