import { BaseView } from "./BaseView.js";
import {
  statusText,
  careSteps,
  careIcon,
  completedCareSteps,
  careDate,
  weight,
  fmtWeight,
  esc,
  $,
  sceneSprite,
} from "./gearPresentation.js";

/** 道具1件の写真・状態・お手入れの入口を表示します。 */
export class GearDetailView extends BaseView {
  detailOrigin = null;
  detailHasBack = false;
  detailGearId = null;
  detailVersion = 0;

  async openGearDetails(id, options = {}) {
    const g = this.context.service.state.gear.find((x) => x.id === id);
    const origin = options.fromHistory
      ? options.returnInfo || { view: "inventory", scroll: 0, gearId: id }
      : this.context.navigation.activeView === "detail"
        ? this.detailOrigin
        : this.context.navigation.currentViewContext(id);
    if (!g) {
      this.context.navigation.discardEditor();
      this.context.navigation.discardDetail();
      history.replaceState(
        this.context.navigation.historyContext(origin),
        "",
        this.context.navigation.viewHash(origin),
      );
      this.context.navigation.restoreViewContext(origin);
      this.context.shell.toast("この道具は見つかりませんでした");
      return;
    }
    if (
      !options.fromHistory &&
      this.context.navigation.activeView !== "detail"
    ) {
      history.replaceState(
        this.context.navigation.historyContext(origin),
        "",
        this.context.navigation.viewHash(origin),
      );
      history.pushState(
        {
          view: "detail",
          gearId: id,
          returnInfo: this.context.navigation.historyContext(origin),
          hasBack: true,
        },
        "",
        `#gear/${encodeURIComponent(id)}`,
      );
      this.detailHasBack = true;
    } else if (options.fromHistory)
      this.detailHasBack = options.hasBack ?? !!options.returnInfo;
    this.context.navigation.discardEditor();
    this.detailOrigin = origin;
    this.detailGearId = id;
    history.replaceState(
      {
        view: "detail",
        gearId: id,
        returnInfo: this.context.navigation.historyContext(origin),
        hasBack: this.detailHasBack,
      },
      "",
      `#gear/${encodeURIComponent(id)}`,
    );
    $("#detailBackBtn").textContent =
      "← " + this.context.navigation.backLabel(origin);
    this.context.navigation.activateView("detail");
    const rendering = this.renderGearDetails();
    window.scrollTo({ top: options.scroll || 0, behavior: "instant" });
    $(options.fromMaintenance ? "#detailMaintenanceBtn" : "#detailTitle").focus(
      { preventScroll: true },
    );
    await rendering;
  }

  async renderGearDetails() {
    const g = this.context.service.state.gear.find(
      (x) => x.id === this.detailGearId,
    );
    if (!g) return;
    const version = ++this.detailVersion,
      chosen = this.context.service.state.trip.selected.includes(g.id);
    $("#detailTitle").textContent = g.name;
    $("#detailCategory").textContent = g.category || "";
    $("#detailName").textContent = g.name;
    $("#detailBrand").textContent = g.brand || "いつもの道具";
    $("#detailStatus").className = "maintenance-stamp " + g.status;
    $("#detailStatus").textContent = statusText[g.status] || "状態未設定";
    $("#detailPacked").textContent = chosen
      ? "✓ 今回の荷物に入っています"
      : "収納棚で待機中";
    $("#detailNote").textContent = g.note || "まだ道具の記録はありません。";
    $("#detailCareTools").innerHTML = careSteps
      .map(
        (step) =>
          `<button class="service-tool" type="button" data-care-start="${step.id}" aria-label="${esc(g.name)}の${step.label}を始める">${careIcon(step)}<b>${step.label}</b><small>${step.hint}</small></button>`,
      )
      .join("");
    const completed = completedCareSteps(g),
      last = careDate(g.care?.lastCompleted);
    $("#detailCareSummary").innerHTML =
      `<small>お手入れの進み具合</small><strong>${completed} <span>/ ${careSteps.length} 工程</span></strong><div class="service-progress" aria-label="${completed}工程完了"><span style="width:${(completed / careSteps.length) * 100}%"></span></div><p>${last ? "前回の完了 " + last : "まだ完了した手入れの記録はありません"}</p>`;
    $("#detailStorage").textContent =
      g.storage || "保管場所はまだ決まっていません";
    $("#detailPackBtn").textContent = chosen
      ? "今回の荷物から戻す"
      : "今回持っていく";
    $("#detailPackBtn").setAttribute("aria-pressed", String(chosen));
    const specs = [
      ["数量", `${g.qty || 1}${g.qtyUnit || "個"}`],
      [`重量 / 1${g.qtyUnit || "個"}`, fmtWeight(g.weight)],
      ["合計重量", fmtWeight((Number(g.weight) || 0) * (Number(g.qty) || 1))],
      [
        "購入日",
        g.purchased ? String(g.purchased).replaceAll("-", "/") : "未記録",
      ],
      ["メーカー", g.brand || "未記録"],
      [
        "いつもの装備",
        g.default ? "いつも持っていく道具" : "キャンプに合わせて選ぶ道具",
      ],
    ];
    $("#detailSpecs").innerHTML = specs
      .map(
        ([label, value]) =>
          `<div><dt>${esc(label)}</dt><dd>${esc(value)}</dd></div>`,
      )
      .join("");
    const purchase = $("#detailPurchaseLink");
    purchase.hidden = true;
    purchase.removeAttribute("href");
    try {
      const url = new URL(g.url);
      if (url.protocol === "http:" || url.protocol === "https:") {
        purchase.href = url.href;
        purchase.hidden = false;
      }
    } catch (e) {}
    this.renderDetailPhoto(g, this.context.photoCache.get(g.id) || g.photoSrc);
    const photo = await this.context.photoGet(g.id);
    if (version === this.detailVersion && this.detailGearId === g.id)
      this.renderDetailPhoto(g, photo);
  }

  renderDetailPhoto(g, photo) {
    const root = $("#detailPhoto");
    root.replaceChildren();
    if (photo) {
      const img = new Image();
      img.decoding = "async";
      img.src = photo;
      img.alt = g.name + "の写真";
      root.append(img);
    } else {
      const sprite = sceneSprite(g),
        art = document.createElement("div");
      art.className = "maintenance-sprite gear-sprite";
      art.style.backgroundPosition = `${((sprite % 4) * 100) / 3}% ${(Math.floor(sprite / 4) * 100) / 3}%`;
      art.setAttribute("role", "img");
      art.setAttribute("aria-label", g.name + "のイメージ");
      root.append(art);
    }
  }
}
