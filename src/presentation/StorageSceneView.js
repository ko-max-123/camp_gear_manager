import { BaseView } from "./BaseView.js";
import {
  statusText,
  sceneDefs,
  sceneMotion,
  weight,
  fmtWeight,
  esc,
  $,
  $$,
  sceneSprite,
} from "./gearPresentation.js";

/** 収納写真から布の上へ道具を広げる表示とアニメーションです。 */
export class StorageSceneView extends BaseView {
  currentSceneKey = null;
  sceneRenderVersion = 0;
  sceneTransitionVersion = 0;
  shelfScrollTop = 0;

  async renderHome() {
    $$("#storageScene [data-scene]").forEach((b) => {
      const def = sceneDefs[b.dataset.scene];
      const count = this.context.service.state.gear.filter(
        (g) =>
          def.filter(g) &&
          this.context.service.state.trip.selected.includes(g.id),
      ).length;
      b.classList.toggle("has-packed", count > 0);
      b.setAttribute(
        "aria-label",
        `${def.label}を広げる${count ? `（${count}点選択済み）` : ""}`,
      );
    });
    if (this.currentSceneKey) await this.renderScene();
  }

  observeStorageCards() {
    const observer = new ResizeObserver((entries) => {
      entries.forEach(({ target: frame }) => {
        const width = frame.clientWidth,
          height = frame.clientHeight;
        if (!width || !height) return;
        const fullWidth = width * 4,
          fullHeight = (fullWidth * 992) / 1586;
        const crop = frame.querySelector(".storage-card-crop");
        crop.style.left =
          Math.min(
            0,
            Math.max(
              width - fullWidth,
              width / 2 - fullWidth * Number(frame.dataset.cropX),
            ),
          ) + "px";
        crop.style.top =
          Math.min(
            0,
            Math.max(
              height - fullHeight,
              height / 2 - fullHeight * Number(frame.dataset.cropY),
            ),
          ) + "px";
      });
    });
    $$(".storage-card-photo").forEach((frame) => observer.observe(frame));
  }

  visibleSceneTrigger(sceneKey) {
    return $$("#storageScene [data-scene]").find(
      (b) => b.dataset.scene === sceneKey && b.getClientRects().length,
    );
  }

  async openScene(sceneKey) {
    const def = sceneDefs[sceneKey];
    if (!def || this.currentSceneKey) return;
    const transitionVersion = ++this.sceneTransitionVersion;
    this.shelfScrollTop = window.scrollY;
    this.currentSceneKey = sceneKey;
    $$("#storageScene [data-scene]").forEach((b) =>
      b.classList.toggle("active", b.dataset.scene === sceneKey),
    );
    const shelf = $("#storageScene"),
      spread = $("#unpackScene");
    const origin = this.visibleSceneTrigger(sceneKey);
    const shelfRect = shelf.getBoundingClientRect(),
      originRect = origin?.getBoundingClientRect();
    const render = this.renderScene();
    await this.context.assets.load();
    if (transitionVersion !== this.sceneTransitionVersion) return;
    if (sceneMotion() && !shelf.hidden) {
      const transformOrigin = originRect
        ? `${originRect.left - shelfRect.left + originRect.width / 2}px ${originRect.top - shelfRect.top + originRect.height / 2}px`
        : "center";
      await shelf.animate(
        [
          { opacity: 1, transform: "scale(1)", transformOrigin },
          {
            opacity: 0,
            transform: "scale(1.08)",
            filter: "blur(3px)",
            transformOrigin,
          },
        ],
        { duration: 230, easing: "ease-in" },
      ).finished;
    }
    if (transitionVersion !== this.sceneTransitionVersion) return;
    shelf.hidden = true;
    spread.hidden = false;
    window.scrollTo({ top: 0, behavior: "instant" });
    $("#backToShelfBtn").focus({ preventScroll: true });
    if (sceneMotion()) {
      spread.animate(
        [
          { opacity: 0, transform: "scale(.98)" },
          { opacity: 1, transform: "scale(1)" },
        ],
        { duration: 400, easing: "ease-out" },
      );
      $$(".spread-item").forEach((item, i) =>
        item.animate(
          [
            {
              opacity: 0,
              transform: "translate(-35px,-45px) scale(.8) rotate(-7deg)",
            },
            { opacity: 1, transform: "translate(0,0) scale(1) rotate(0deg)" },
          ],
          {
            duration: 550,
            delay: Math.min(i, 8) * 55,
            fill: "backwards",
            easing: "cubic-bezier(.2,.7,.2,1)",
          },
        ),
      );
    }
    await render;
  }

  closeScene(restoreFocus = true) {
    const previous = this.currentSceneKey;
    ++this.sceneTransitionVersion;
    ++this.sceneRenderVersion;
    this.currentSceneKey = null;
    $("#unpackScene").hidden = true;
    $("#storageScene").hidden = false;
    $$("#storageScene [data-scene]").forEach((b) =>
      b.classList.remove("active"),
    );
    if (restoreFocus && previous) {
      window.scrollTo({ top: this.shelfScrollTop, behavior: "instant" });
      this.visibleSceneTrigger(previous)?.focus({ preventScroll: true });
      if (sceneMotion())
        $("#storageScene").animate(
          [
            { opacity: 0, transform: "scale(1.025)" },
            { opacity: 1, transform: "scale(1)" },
          ],
          { duration: 320, easing: "ease-out" },
        );
    }
  }

  async renderScene() {
    const version = ++this.sceneRenderVersion,
      def = sceneDefs[this.currentSceneKey];
    if (!def) return;
    const items = this.context.service.state.gear
      .filter(def.filter)
      .sort((a, b) => (b.updated || 0) - (a.updated || 0));
    const grid = $("#spreadGrid");
    $("#unpackTitle").textContent = def.label;
    $("#unpackDescription").textContent = def.desc;
    $("#unpackMeta").textContent =
      `${items.length}点を広げています / ${items.filter((g) => this.context.service.state.trip.selected.includes(g.id)).length}点選択済み`;
    $("#spreadEmpty").hidden = items.length > 0;
    grid.hidden = items.length === 0;
    const focusedId =
      document.activeElement?.dataset.sceneAdd ||
      document.activeElement?.dataset.gearDetail ||
      document.activeElement?.dataset.gearEdit;
    const focusedAction = document.activeElement?.hasAttribute(
      "data-gear-detail",
    )
      ? "data-gear-detail"
      : document.activeElement?.hasAttribute("data-gear-edit")
        ? "data-gear-edit"
        : "data-scene-add";
    grid.dataset.count = items.length;
    grid.innerHTML = items
      .map((item, index) => this.sceneItemHtml(item, index))
      .join("");
    if (focusedId)
      grid
        .querySelector(`[${focusedAction}="${CSS.escape(focusedId)}"]`)
        ?.focus({ preventScroll: true });
    await Promise.all(
      items.map(async (item) => {
        const photo = await this.context.photoGet(item.id);
        if (version !== this.sceneRenderVersion) return;
        if (photo) this.context.photoCache.set(item.id, photo);
        else this.context.photoCache.delete(item.id);
        const art = grid.querySelector(
          `[data-gear-detail="${CSS.escape(item.id)}"] .spread-art`,
        );
        if (art) {
          if (photo) {
            art.className =
              "spread-art personal-photo" +
              (item.photoCutout ? " photo-cutout" : "");
            art.style.cssText = "";
            const img = document.createElement("img");
            img.decoding = "async";
            img.src = photo;
            img.alt = "";
            art.replaceChildren(img);
          } else {
            const sprite = sceneSprite(item);
            art.className = "spread-art gear-sprite";
            art.replaceChildren();
            art.style.backgroundPosition = `${((sprite % 4) * 100) / 3}% ${(Math.floor(sprite / 4) * 100) / 3}%`;
          }
        }
      }),
    );
  }

  sceneItemHtml(item, index) {
    const chosen = this.context.service.state.trip.selected.includes(item.id);
    const sprite = sceneSprite(item),
      photo = this.context.photoCache.get(item.id) || item.photoSrc,
      tilt = [-5, 4, -2, 6, -4, 3][index % 6];
    const art = photo
      ? `<span class="spread-art personal-photo${item.photoCutout ? " photo-cutout" : ""}"><img src="${esc(photo)}" alt="" decoding="async"></span>`
      : `<span class="spread-art gear-sprite" style="background-position:${((sprite % 4) * 100) / 3}% ${(Math.floor(sprite / 4) * 100) / 3}%" aria-hidden="true"></span>`;
    return `<article class="spread-item ${chosen ? "is-packed" : ""}" style="--gear-tilt:${tilt}deg">
    <a class="spread-pick" href="#gear/${encodeURIComponent(item.id)}" data-gear-detail="${esc(item.id)}" aria-label="${esc(item.name)}の詳細">
      <span class="spread-object">${art}<span class="packed-stamp" aria-hidden="true">✓ PACKED</span></span>
      <span class="gear-tag"><strong>${esc(item.name)}</strong><span>${esc(item.qty || 1)}${esc(item.qtyUnit || "個")} · ${fmtWeight((Number(item.weight) || 0) * (Number(item.qty) || 1))}</span><b>詳細を見る ↗</b></span>
    </a>
    <div class="spread-detail">
      <span class="spread-condition ${esc(item.status)}">${esc(statusText[item.status] || "状態未設定")}</span>
      <button type="button" data-scene-add="${esc(item.id)}" aria-pressed="${chosen}" aria-label="${esc(item.name)}を${chosen ? "今回の荷物から戻す" : "今回持っていく"}">${chosen ? "✓ 荷物から戻す" : "＋ 今回持っていく"}</button>
      <button type="button" data-gear-edit="${esc(item.id)}" aria-label="${esc(item.name)}の手入れ">手入れする ↗</button>
    </div>
  </article>`;
  }
}
