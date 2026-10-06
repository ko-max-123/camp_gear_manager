import { BaseView } from "./BaseView.js";
import { categories, weight, esc, $, $$ } from "./gearPresentation.js";

/** 画面全体の調停とDOMイベント。永続化はShelfServiceに任せます。 */
export class AppController extends BaseView {
  draggedId = null;

  async init() {
    document.body.classList.toggle(
      "dark",
      this.context.service.state.theme === "dark",
    );
    $("#gearCategory").innerHTML = categories
      .map((c) => `<option>${esc(c)}</option>`)
      .join("");
    $("#gearCategoryFilter").innerHTML =
      '<option value="">すべてのカテゴリ</option>' +
      categories.map((c) => `<option>${esc(c)}</option>`).join("");
    if (!this.bound) {
      this.bind();
      this.context.sceneView.observeStorageCards();
      this.bound = true;
    }
    const route = this.context.navigation.readRoute();
    if (route.view === "maintenance")
      await this.context.maintenance.openGearEditor(route.id, {
        fromHistory: true,
        returnInfo: history.state?.returnInfo,
      });
    else if (route.view === "detail")
      await this.context.details.openGearDetails(route.id, {
        fromHistory: true,
        returnInfo: history.state?.returnInfo,
        hasBack: history.state?.hasBack,
      });
    else await this.context.navigation.switchView(route.view);
  }

  bind() {
    $$(".nav").forEach(
      (b) =>
        (b.onclick = () => this.context.navigation.switchView(b.dataset.view)),
    );
    $$("[data-go]").forEach(
      (b) =>
        (b.onclick = () => this.context.navigation.switchView(b.dataset.go)),
    );
    $$("[data-addgear]").forEach(
      (b) => (b.onclick = () => this.context.maintenance.openGearEditor()),
    );
    $("#addGearQuickBtn").onclick = () => {
      $("#toolsMenu").open = false;
      this.context.maintenance.openGearEditor();
    };
    $("#themeBtn").onclick = () =>
      this.perform(async () => {
        await this.context.service.setTheme(
          this.context.service.state.theme === "dark" ? "light" : "dark",
        );
        document.body.classList.toggle(
          "dark",
          this.context.service.state.theme === "dark",
        );
      });
    document.addEventListener("click", (e) => {
      if (!$("#toolsMenu").contains(e.target)) $("#toolsMenu").open = false;
    });
    $("#globalSearchForm").onsubmit = (e) => {
      e.preventDefault();
      const q = $("#globalSearch").value.trim().toLowerCase();
      if (q) {
        this.context.navigation.switchView("inventory");
        $("#gearSearch").value = $("#globalSearch").value;
        this.context.collection.renderInventory();
      }
    };
    ["tripNameMenu", "tripNameMain"].forEach(
      (id) =>
        ($("#" + id).oninput = (e) => this.scheduleTripName(e.target.value)),
    );
    $("#gearSearch").oninput = this.context.collection.renderInventory;
    $("#gearCategoryFilter").onchange = this.context.collection.renderInventory;
    $("#gearStatusFilter").onchange = this.context.collection.renderInventory;
    $("#addDefaultsBtn").onclick = () =>
      this.perform(
        () => this.context.service.packDefaults(),
        "定番装備を追加しました",
      );
    $("#clearLoadoutBtn").onclick = () => {
      if (confirm("今回持っていく道具をすべて戻しますか？"))
        this.perform(() => this.context.service.clearTrip());
    };
    $$("#storageScene [data-scene]").forEach(
      (btn) =>
        (btn.onclick = () =>
          this.context.sceneView.openScene(btn.dataset.scene)),
    );
    $("#backToShelfBtn").onclick = this.context.sceneView.closeScene;
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && $("#toolsMenu").open) {
        e.preventDefault();
        $("#toolsMenu").open = false;
        $("#toolsMenu summary").focus();
        return;
      }
      if (
        e.key === "Escape" &&
        this.context.sceneView.currentSceneKey &&
        $("#homeView").classList.contains("active")
      ) {
        e.preventDefault();
        this.context.sceneView.closeScene();
      }
    });
    $("#spreadGrid").addEventListener("click", (e) => {
      const pick = e.target.closest("[data-scene-add]");
      if (pick) this.toggleTrip(pick.dataset.sceneAdd);
    });
    document.addEventListener("click", (e) => {
      const detail = e.target.closest("a[data-gear-detail]");
      if (
        detail &&
        !e.ctrlKey &&
        !e.metaKey &&
        !e.shiftKey &&
        !e.altKey &&
        e.button === 0
      ) {
        e.preventDefault();
        this.context.details.openGearDetails(detail.dataset.gearDetail);
        return;
      }
      const edit = e.target.closest("[data-gear-edit]");
      if (edit) this.context.maintenance.openGearEditor(edit.dataset.gearEdit);
      const start = e.target.closest("[data-care-start]");
      if (start && this.context.details.detailGearId)
        this.context.maintenance.openGearEditor(
          this.context.details.detailGearId,
          { careStep: start.dataset.careStart },
        );
    });
    $("#detailBackBtn").onclick = this.context.navigation.leaveDetails;
    $("#detailMaintenanceBtn").onclick = () =>
      this.context.maintenance.openGearEditor(
        this.context.details.detailGearId,
      );
    $("#detailPackBtn").onclick = () => {
      if (this.context.details.detailGearId)
        this.toggleTrip(this.context.details.detailGearId);
    };
    $("#gearForm").onsubmit = (e) => {
      e.preventDefault();
      this.context.maintenance.saveGearFromForm();
    };
    $("#maintenanceTasks").onclick = (e) => {
      const button = e.target.closest("[data-care-step]");
      if (!button || this.context.maintenance.savingGear) return;
      const step = button.dataset.careStep;
      if (this.context.maintenance.editorCareSteps.has(step))
        this.context.maintenance.editorCareSteps.delete(step);
      else this.context.maintenance.editorCareSteps.add(step);
      this.context.maintenance.renderMaintenanceTasks();
    };
    $("#maintenanceBackBtn").onclick = $("#cancelGearBtn").onclick =
      this.context.navigation.leaveMaintenance;
    $("#deleteGearBtn").onclick = this.context.maintenance.deleteCurrentGear;
    $("#choosePhotoBtn").onclick = () => $("#gearPhoto").click();
    $("#gearPhoto").onchange = this.context.maintenance.onPhotoSelected;
    $("#removePhotoBtn").onclick = () => {
      ++this.context.maintenance.photoRequest;
      this.context.maintenance.photoBusy = false;
      this.context.maintenance.tempPhoto = null;
      this.context.maintenance.tempPhotoCutout = false;
      this.context.maintenance.tempPhotoRemoved = true;
      $("#gearPhoto").value = "";
      this.context.maintenance.renderPhotoPreview(null);
      this.context.maintenance.updateEditorBusy();
      $("#photoInfo").textContent = "記録すると写真を削除します";
    };
    $$('[name="gearStatus"]').forEach(
      (input) =>
        (input.onchange = this.context.maintenance.updateMaintenanceMeta),
    );
    ["gearName", "gearCategory"].forEach(
      (id) =>
        ($("#" + id).oninput = () => {
          if (!this.context.maintenance.editorPhoto)
            this.context.maintenance.renderPhotoPreview(null);
          this.context.maintenance.updateMaintenanceMeta();
        }),
    );
    $("#gearBrand").oninput = this.context.maintenance.updateMaintenanceMeta;
    window.addEventListener("popstate", (e) => {
      const route = this.context.navigation.readRoute();
      if (route.view === "maintenance")
        this.context.maintenance.openGearEditor(route.id, {
          fromHistory: true,
          returnInfo: e.state?.returnInfo,
        });
      else if (route.view === "detail") {
        const origin = this.context.maintenance.editorOrigin;
        this.context.details.openGearDetails(route.id, {
          fromHistory: true,
          returnInfo: e.state?.returnInfo,
          hasBack: e.state?.hasBack,
          scroll: origin?.view === "detail" ? origin.scroll : 0,
          fromMaintenance: origin?.view === "detail",
        });
      } else {
        const origin =
          this.context.maintenance.editorOrigin ||
          this.context.details.detailOrigin;
        this.context.navigation.discardEditor();
        this.context.navigation.discardDetail();
        this.context.navigation.restoreViewContext({
          ...origin,
          ...e.state,
          view: route.view,
        });
      }
    });
    $$(".drop-zone").forEach((zone) => {
      zone.addEventListener("dragover", (e) => {
        e.preventDefault();
        zone.classList.add("drag-over");
      });
      zone.addEventListener("dragleave", () =>
        zone.classList.remove("drag-over"),
      );
      zone.addEventListener("drop", (e) => {
        e.preventDefault();
        zone.classList.remove("drag-over");
        const id = e.dataTransfer.getData("text/plain") || this.draggedId;
        if (!id) return;
        if (zone.dataset.drop === "camp") this.moveToCamp(id);
        else this.moveToStorage(id);
        this.draggedId = null;
      });
    });
  }

  syncTrip() {
    const name = this.pendingTripName ?? this.context.service.state.trip.name;
    $("#tripNameMenu").value = name;
    $("#tripNameMain").value = name;
    const sel = this.context.selectedGear();
    $("#tripMiniMeta").textContent =
      `${sel.length}点 / ${weight(sel).toFixed(1)} kg`;
    $("#headerTripCount").textContent = sel.length;
    $(".trip-link").setAttribute(
      "aria-label",
      `今回の荷物 ${sel.length}点を確認`,
    );
    $("#unpackTripCount").textContent = sel.length;
  }

  async renderAll() {
    this.syncTrip();
    if (this.context.navigation.activeView === "home")
      await this.context.sceneView.renderHome();
    else if (this.context.navigation.activeView === "inventory")
      await this.context.collection.renderInventory();
    else if (this.context.navigation.activeView === "loadout")
      await this.context.collection.renderLoadout();
    else if (this.context.navigation.activeView === "care")
      await this.context.collection.renderCare();
    else if (this.context.navigation.activeView === "detail")
      await this.context.details.renderGearDetails();
  }

  /** 更新の成功後に描画します。失敗した操作は現在の棚へ混ぜません。 */
  async perform(action, message) {
    const scope = this.context.scope;
    try {
      await action();
      if (scope !== this.context.scope) return;
      await this.renderAll();
      if (message) this.toast(message);
    } catch (error) {
      if (scope === this.context.scope) this.toast(error.message);
    }
  }

  toggleTrip(id) {
    return this.perform(() =>
      this.context.service.pack(
        id,
        !this.context.service.state.trip.selected.includes(id),
      ),
    );
  }
  moveToCamp(id) {
    return this.perform(() => this.context.service.pack(id, true));
  }
  moveToStorage(id) {
    return this.perform(() => this.context.service.pack(id, false));
  }

  /** 入力ごとの通信を抑え、保存待ちの名前は画面側に保持します。 */
  scheduleTripName(name) {
    this.pendingTripName = name;
    this.syncTrip();
    clearTimeout(this.tripTimer);
    this.tripTimer = setTimeout(
      () => this.flushTripName().catch((error) => this.toast(error.message)),
      500,
    );
  }

  async flushTripName() {
    clearTimeout(this.tripTimer);
    if (this.pendingTripName == null) return;
    const name = this.pendingTripName;
    await this.context.service.setTripName(name);
    if (this.pendingTripName === name) this.pendingTripName = null;
  }

  setStatus(status, error) {
    const labels = {
      local: "このブラウザに保存",
      saving: "保存しています…",
      saved: this.context.cloud ? "クラウドに保存済み" : "このブラウザに保存",
      error: "保存できませんでした",
    };
    $("#cloudStatus").textContent = error?.message || labels[status];
    $("#cloudStatus").dataset.status = status;
    $("#reloadShelfBtn").hidden = status !== "error";
  }

  toast(t) {
    const el = $("#toast");
    el.textContent = t;
    el.classList.add("show");
    clearTimeout(this.toast.t);
    this.toast.t = setTimeout(() => el.classList.remove("show"), 3000);
  }
}
