import { BaseView } from "./BaseView.js";
import { sceneDefs, $, $$ } from "./gearPresentation.js";

/** 詳細・手入れ・元の画面へ戻るルートとフォーカスを管理します。 */
export class NavigationController extends BaseView {
  activeView = "home";

  readRoute() {
    let hash = "";
    try {
      hash = decodeURIComponent(location.hash.slice(1));
    } catch (e) {}
    if (hash.startsWith("maintenance/"))
      return {
        view: "maintenance",
        id: hash.slice(12) === "new" ? undefined : hash.slice(12),
      };
    if (hash.startsWith("gear/")) return { view: "detail", id: hash.slice(5) };
    return {
      view: ["home", "inventory", "loadout", "care"].includes(hash)
        ? hash
        : "home",
    };
  }

  viewHash(context) {
    return context.view === "detail"
      ? `#gear/${encodeURIComponent(context.gearId)}`
      : `#${context.view}`;
  }

  currentViewContext(id) {
    const context = {
      view: this.activeView,
      scene: this.context.sceneView.currentSceneKey,
      scroll: window.scrollY,
      focus: document.activeElement,
      gearId: id,
    };
    if (this.activeView === "detail") {
      context.gearId = this.context.details.detailGearId;
      context.returnInfo = this.historyContext(
        this.context.details.detailOrigin,
      );
      context.hasBack = this.context.details.detailHasBack;
    }
    return context;
  }

  historyContext(context) {
    const { focus, ...info } = context || { view: "inventory" };
    return info;
  }

  backLabel(context) {
    if (context.view === "home" && context.scene) return "広げた道具に戻る";
    return (
      {
        home: "収納棚に戻る",
        inventory: "道具一覧に戻る",
        loadout: "今回の荷物に戻る",
        care: "状態確認に戻る",
        detail: "道具の詳細に戻る",
      }[context.view] || "道具一覧に戻る"
    );
  }

  activateView(name) {
    this.activeView = name;
    $$(".view").forEach((v) => v.classList.remove("active"));
    $("#" + name + "View")?.classList.add("active");
    $$(".nav").forEach((b) => {
      const active = b.dataset.view === name;
      b.classList.toggle("active", active);
      if (active) b.setAttribute("aria-current", "page");
      else b.removeAttribute("aria-current");
    });
    $("#toolsMenu").open = false;
    if (["home", "inventory", "loadout", "care"].includes(name))
      return this.context.shell.renderAll();
  }

  discardEditor() {
    ++this.context.maintenance.editorVersion;
    ++this.context.maintenance.photoRequest;
    this.context.maintenance.editorOrigin = null;
    this.context.maintenance.editorHasBack = false;
    this.context.maintenance.editorPhoto = null;
    this.context.maintenance.editorLoading = false;
    this.context.maintenance.photoBusy = false;
    this.context.maintenance.savingGear = false;
    this.context.maintenance.tempPhoto = null;
    this.context.maintenance.tempPhotoRemoved = false;
    this.context.maintenance.tempPhotoCutout = false;
    this.context.maintenance.editorCareSteps = new Set();
  }

  discardDetail() {
    ++this.context.details.detailVersion;
    this.context.details.detailGearId = null;
    this.context.details.detailOrigin = null;
    this.context.details.detailHasBack = false;
  }

  switchView(name) {
    this.discardEditor();
    this.discardDetail();
    this.context.sceneView.closeScene(false);
    const rendering = this.activateView(name);
    history.replaceState({ view: name }, "", `#${name}`);
    window.scrollTo({ top: 0, behavior: "smooth" });
    return rendering;
  }

  restoreViewContext(origin = {}) {
    if (origin.view === "detail") {
      this.context.details.openGearDetails(origin.gearId, {
        fromHistory: true,
        returnInfo: origin.returnInfo,
        hasBack: origin.hasBack,
        scroll: origin.scroll,
        fromMaintenance: true,
      });
      return;
    }
    const view = ["home", "inventory", "loadout", "care"].includes(origin.view)
      ? origin.view
      : "inventory";
    this.context.sceneView.closeScene(false);
    this.activateView(view);
    if (view === "home" && sceneDefs[origin.scene]) {
      this.context.sceneView.currentSceneKey = origin.scene;
      $("#storageScene").hidden = true;
      $("#unpackScene").hidden = false;
      $$("#storageScene [data-scene]").forEach((b) =>
        b.classList.toggle("active", b.dataset.scene === origin.scene),
      );
      this.context.sceneView.renderScene();
    }
    window.scrollTo({ top: origin.scroll || 0, behavior: "instant" });
    const id = origin.gearId && CSS.escape(origin.gearId);
    const fallback = id ? $(`#${view}View [data-gear-detail="${id}"]`) : null;
    const focus =
      origin.focus?.isConnected && origin.focus.closest(".view.active")
        ? origin.focus
        : fallback || $("#" + view + "View h1") || $("#backToShelfBtn");
    if (focus) {
      if (!focus.matches("button,input,a,select,textarea")) focus.tabIndex = -1;
      focus.focus({ preventScroll: true });
    }
  }

  leaveMaintenance() {
    if (this.context.maintenance.savingGear) return;
    if (this.context.maintenance.editorHasBack) {
      history.back();
      return;
    }
    const origin = this.context.maintenance.editorOrigin || {
      view: "inventory",
    };
    this.discardEditor();
    history.replaceState(
      this.historyContext(origin),
      "",
      this.viewHash(origin),
    );
    this.restoreViewContext(origin);
  }

  leaveDetails() {
    if (this.context.details.detailHasBack) {
      history.back();
      return;
    }
    const origin = this.context.details.detailOrigin || { view: "inventory" };
    this.discardDetail();
    history.replaceState(
      this.historyContext(origin),
      "",
      this.viewHash(origin),
    );
    this.restoreViewContext(origin);
  }
}
