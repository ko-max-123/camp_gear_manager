import { BaseView } from "./BaseView.js";
import {
  categories,
  careSteps,
  careIcon,
  completedCareSteps,
  weight,
  makeId,
  $,
  $$,
  sceneSprite,
} from "./gearPresentation.js";

/** 作業台の入力と写真選択。保存はユースケースへ渡します。 */
export class GearMaintenanceView extends BaseView {
  tempPhoto = null;
  tempPhotoRemoved = false;
  editorOrigin = null;
  editorHasBack = false;
  editorVersion = 0;
  photoRequest = 0;
  editorPhoto = null;
  editorLoading = false;
  photoBusy = false;
  savingGear = false;
  tempPhotoCutout = false;
  editorCareSteps = new Set();

  async openGearEditor(id, options = {}) {
    const g = this.context.service.state.gear.find((x) => x.id === id);
    if (id && !g) {
      this.context.navigation.switchView("inventory");
      this.context.shell.toast("この道具は見つかりませんでした");
      return;
    }
    if (!this.editorOrigin) {
      this.editorOrigin =
        options.returnInfo || this.context.navigation.currentViewContext(id);
      if (options.fromHistory && !options.returnInfo)
        this.editorOrigin = { view: "inventory", scroll: 0, gearId: id };
    }
    const { focus, ...returnInfo } = this.editorOrigin;
    if (!options.fromHistory) {
      if (this.context.navigation.activeView !== "maintenance") {
        history.replaceState(
          returnInfo,
          "",
          this.context.navigation.viewHash(returnInfo),
        );
        history.pushState(
          { view: "maintenance", returnInfo },
          "",
          `#maintenance/${encodeURIComponent(id || "new")}`,
        );
        this.editorHasBack = true;
      } else
        history.replaceState(
          { view: "maintenance", returnInfo },
          "",
          `#maintenance/${encodeURIComponent(id || "new")}`,
        );
    } else this.editorHasBack = !!options.returnInfo;
    const version = ++this.editorVersion;
    ++this.photoRequest;
    this.editorLoading = !!g;
    this.photoBusy = false;
    this.savingGear = false;
    this.editorPhoto = null;
    this.tempPhoto = null;
    this.tempPhotoRemoved = false;
    this.tempPhotoCutout = false;
    this.editorCareSteps = new Set(
      completedCareSteps(g || {}) === careSteps.length
        ? []
        : (g?.care?.steps || []).filter((id) =>
            careSteps.some((step) => step.id === id),
          ),
    );
    $("#maintenanceTitle").textContent = g ? "道具の手入れ" : "道具を迎える";
    $("#maintenanceDescription").textContent = g
      ? "清掃・乾燥・点検・収納。済んだ作業を確かめて、道具を整えましょう。"
      : "写真と名前を添えて、いつもの道具に加えましょう。";
    $("#maintenanceBackBtn").textContent =
      "← " + this.context.navigation.backLabel(returnInfo);
    $("#saveGearBtn").textContent = g ? "手入れを終えて戻る" : "棚に追加する";
    $("#maintenanceTaskPanel").hidden = !g;
    this.renderMaintenanceTasks();
    $("#gearId").value = g?.id || "";
    $("#gearName").value = g?.name || "";
    $("#gearCategory").value = g?.category || categories[0];
    $$('[name="gearStatus"]').forEach(
      (input) => (input.checked = input.value === (g?.status || "good")),
    );
    $("#gearBrand").value = g?.brand || "";
    $("#gearQty").value = g?.qty || 1;
    $("#gearWeight").value = g?.weight ?? "";
    $("#gearPurchased").value = g?.purchased || "";
    $("#gearStorage").value = g?.storage || "";
    $("#gearUrl").value = g?.url || "";
    $("#gearDefault").checked = !!g?.default;
    $("#gearNote").value = g?.note || "";
    $("#maintenanceView .service-records").open = false;
    $("#gearRemoveOptions").hidden = !g;
    $("#gearRemoveOptions").open = false;
    $("#gearSpecs").open = !g;
    $("#photoInfo").textContent = "";
    $("#gearPhoto").value = "";
    this.renderPhotoPreview(null);
    this.updateMaintenanceMeta();
    this.updateEditorBusy();
    this.context.navigation.activateView("maintenance");
    window.scrollTo({ top: 0, behavior: "instant" });
    $("#maintenanceTitle").focus({ preventScroll: true });
    if (options.careStep)
      $(`[data-care-step="${CSS.escape(options.careStep)}"]`)?.focus({
        preventScroll: true,
      });
    const existing = g ? await this.context.photoGet(g.id) : null;
    if (version !== this.editorVersion) return;
    this.editorLoading = false;
    this.renderPhotoPreview(existing);
    this.updateEditorBusy();
  }

  updateMaintenanceMeta() {
    const status = $('[name="gearStatus"]:checked')?.value || "good";
    $("#maintenanceStamp").className = "maintenance-stamp " + status;
    $("#maintenanceStamp").textContent = {
      good: "次のキャンプへ",
      check: "出発前に点検",
      repair: "手入れ中",
    }[status];
    $("#maintenanceGearMeta").textContent = [
      $("#gearBrand").value.trim(),
      $("#gearCategory").value,
    ]
      .filter(Boolean)
      .join(" / ");
  }

  renderMaintenanceTasks() {
    const focused = document.activeElement?.dataset.careStep;
    $("#maintenanceProgress").textContent =
      `${this.editorCareSteps.size} / ${careSteps.length} 工程完了`;
    if ($("#maintenanceTaskPanel").hidden === false)
      $("#saveGearBtn").textContent =
        this.editorCareSteps.size === careSteps.length
          ? "手入れを終えて戻る"
          : "途中まで記録して戻る";
    $("#maintenanceTasks").innerHTML = careSteps
      .map((step) => {
        const done = this.editorCareSteps.has(step.id);
        return `<button class="service-tool ${done ? "is-complete" : ""}" type="button" data-care-step="${step.id}" aria-pressed="${done}">${careIcon(step)}<b>${step.label}</b><small>${step.description}</small><span class="service-step-state">${done ? "✓ 完了" : "済んだら完了にする"}</span></button>`;
      })
      .join("");
    if (focused)
      $(`[data-care-step="${CSS.escape(focused)}"]`)?.focus({
        preventScroll: true,
      });
  }

  updateEditorBusy() {
    $("#saveGearBtn").disabled =
      this.editorLoading || this.photoBusy || this.savingGear;
    $("#choosePhotoBtn").disabled = this.editorLoading || this.savingGear;
    $("#removePhotoBtn").disabled =
      this.editorLoading ||
      this.savingGear ||
      (!this.editorPhoto && !this.photoBusy);
    ["maintenanceBackBtn", "cancelGearBtn", "deleteGearBtn"].forEach(
      (id) => ($("#" + id).disabled = this.savingGear),
    );
    $$("#maintenanceTasks button").forEach(
      (button) => (button.disabled = this.savingGear),
    );
  }

  renderPhotoPreview(dataUrl) {
    this.editorPhoto = dataUrl;
    const preview = $("#photoPreview");
    preview.replaceChildren();
    if (dataUrl) {
      const img = new Image();
      img.src = dataUrl;
      img.alt = ($("#gearName").value || "道具") + "の写真";
      preview.append(img);
    } else if ($("#gearId").value) {
      const sprite = sceneSprite({
        name: $("#gearName").value,
        category: $("#gearCategory").value,
      });
      const art = document.createElement("div");
      art.className = "maintenance-sprite gear-sprite";
      art.style.backgroundPosition = `${((sprite % 4) * 100) / 3}% ${(Math.floor(sprite / 4) * 100) / 3}%`;
      art.setAttribute("role", "img");
      art.setAttribute("aria-label", "道具のイメージ");
      preview.append(art);
    } else
      preview.innerHTML =
        '<div class="photo-placeholder"><svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M4 6h4l2-3h4l2 3h4v14H4V6Z" stroke="currentColor" stroke-width="1.3" stroke-linejoin="round"/><circle cx="12" cy="12.5" r="4" stroke="currentColor" stroke-width="1.3"/></svg><b>道具の写真</b><small>お気に入りの一枚を添える</small></div>';
  }

  async onPhotoSelected(e) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    if (!file.type.startsWith("image/"))
      return alert("画像ファイルを選択してください。");
    const version = this.editorVersion,
      request = ++this.photoRequest;
    this.photoBusy = true;
    this.updateEditorBusy();
    try {
      $("#photoInfo").textContent = "写真を読み込んでいます…";
      const result = await this.context.imageProcessor.compress(file);
      if (version !== this.editorVersion || request !== this.photoRequest)
        return;
      this.tempPhoto = result.data;
      this.tempPhotoCutout = result.hasAlpha;
      this.tempPhotoRemoved = false;
      this.renderPhotoPreview(result.data);
      $("#photoInfo").textContent = "記録すると写真を更新します";
    } catch (err) {
      if (version === this.editorVersion && request === this.photoRequest) {
        $("#photoInfo").textContent =
          "写真を読み込めませんでした。別の写真を選んでください。";
      }
    } finally {
      if (version === this.editorVersion && request === this.photoRequest) {
        this.photoBusy = false;
        this.updateEditorBusy();
      }
    }
  }

  async saveGearFromForm() {
    if (this.editorLoading || this.photoBusy || this.savingGear) return;
    const id = $("#gearId").value || makeId();
    const item = {
      ...this.context.service.state.gear.find((g) => g.id === id),
      id,
      name: $("#gearName").value.trim(),
      category: $("#gearCategory").value,
      status: $('[name="gearStatus"]:checked')?.value || "good",
      brand: $("#gearBrand").value.trim(),
      qty: Math.max(1, Number($("#gearQty").value) || 1),
      weight: Math.max(0, Number($("#gearWeight").value) || 0),
      purchased: $("#gearPurchased").value,
      storage: $("#gearStorage").value.trim(),
      url: $("#gearUrl").value.trim(),
      default: $("#gearDefault").checked,
      note: $("#gearNote").value.trim(),
      updated: Date.now(),
    };
    if (!item.name) return this.context.shell.toast("道具名を入力してください");
    if ($("#gearId").value)
      item.care = {
        ...item.care,
        steps: [...this.editorCareSteps],
        updated: Date.now(),
        lastCompleted:
          this.editorCareSteps.size === careSteps.length
            ? new Date().toISOString()
            : item.care?.lastCompleted || null,
      };
    this.savingGear = true;
    this.updateEditorBusy();
    const version = this.editorVersion;
    const idx = this.context.service.state.gear.findIndex((g) => g.id === id);
    try {
      await this.context.service.saveGear(item, {
        photo: this.tempPhoto,
        removePhoto: this.tempPhotoRemoved,
        cutout: this.tempPhotoCutout,
      });
      this.context.photoCache.delete(id);
      await this.context.shell.renderAll();
      if (version === this.editorVersion) {
        this.savingGear = false;
        this.context.navigation.leaveMaintenance();
      }
      this.context.shell.toast(
        idx >= 0 ? "手入れの記録を保存しました" : "道具を棚に追加しました",
      );
    } catch (err) {
      if (version === this.editorVersion) {
        this.savingGear = false;
        this.updateEditorBusy();
        this.context.shell.toast(err.message || "記録を保存できませんでした。");
      }
    }
  }

  async deleteCurrentGear() {
    if (this.savingGear) return;
    const id = $("#gearId").value,
      g = this.context.service.state.gear.find((x) => x.id === id);
    if (!g) return;
    if (!confirm(`「${g.name}」を削除しますか？`)) return;
    this.savingGear = true;
    this.updateEditorBusy();
    const version = this.editorVersion;
    try {
      await this.context.service.deleteGear(id);
      this.context.photoCache.delete(id);
      await this.context.shell.renderAll();
      if (version === this.editorVersion) {
        this.savingGear = false;
        this.context.navigation.leaveMaintenance();
      }
      this.context.shell.toast("道具を棚から外しました");
    } catch (err) {
      if (version === this.editorVersion) {
        this.savingGear = false;
        this.updateEditorBusy();
        this.context.shell.toast(err.message || "削除できませんでした。");
      }
    }
  }
}
