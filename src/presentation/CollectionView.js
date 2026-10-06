import { BaseView } from "./BaseView.js";
import {
  statusText,
  careDate,
  weight,
  fmtWeight,
  esc,
  $,
  $$,
  stat,
  sceneSprite,
} from "./gearPresentation.js";

/** 道具一覧・今回の荷物・状態確認を共通の写真と紙札で描画します。 */
export class CollectionView extends BaseView {
  filteredGear() {
    const q = $("#gearSearch").value.trim().toLowerCase(),
      cat = $("#gearCategoryFilter").value,
      st = $("#gearStatusFilter").value;
    return [...this.context.service.state.gear]
      .filter((g) => {
        const hay = [g.name, g.brand, g.storage, g.note]
          .join(" ")
          .toLowerCase();
        return (
          (!q || hay.includes(q)) &&
          (!cat || g.category === cat) &&
          (!st || g.status === st)
        );
      })
      .sort((a, b) => (b.updated || 0) - (a.updated || 0));
  }

  async renderInventory() {
    const list = this.filteredGear();
    $("#inventoryMeta").textContent =
      `${list.length}点 / 約 ${weight(list).toFixed(1)} kg / ${new Set(list.map((g) => g.category)).size}カテゴリ`;
    $("#inventoryEmpty").classList.toggle("hidden", list.length !== 0);
    await this.renderGearCards($("#gearGrid"), list);
  }

  async renderGearCards(root, list) {
    root.innerHTML = list
      .map((g, index) => this.gearCardHtml(g, index))
      .join("");
    await this.hydrateGearPhotos(root, list);
  }

  gearArtHtml(g, className) {
    const photo = this.context.photoCache.get(g.id) || g.photoSrc,
      sprite = sceneSprite(g);
    return `<span class="${className} gear-object ${photo ? "object-photo" + (g.photoCutout ? " photo-cutout" : "") : "gear-sprite"}" data-gear-art="${esc(g.id)}" ${photo ? "" : `style="background-position:${((sprite % 4) * 100) / 3}% ${(Math.floor(sprite / 4) * 100) / 3}%"`} aria-hidden="true">${photo ? `<img src="${esc(photo)}" alt="" loading="lazy" decoding="async" draggable="false">` : ""}</span>`;
  }

  async hydrateGearPhotos(root, list) {
    const version = (this.context.photoRenderVersions.get(root) || 0) + 1;
    this.context.photoRenderVersions.set(root, version);
    await Promise.all(
      list.map(async (g) => {
        const photo = await this.context.photoGet(g.id);
        if (this.context.photoRenderVersions.get(root) !== version) return;
        if (photo) this.context.photoCache.set(g.id, photo);
        else this.context.photoCache.delete(g.id);
        const art = root.querySelector(`[data-gear-art="${CSS.escape(g.id)}"]`);
        if (!art || !photo) return;
        art.classList.remove("gear-sprite");
        art.classList.add("object-photo");
        art.classList.toggle("photo-cutout", !!g.photoCutout);
        art.style.backgroundPosition = "";
        const img = new Image();
        img.loading = "lazy";
        img.decoding = "async";
        img.src = photo;
        img.alt = "";
        img.draggable = false;
        art.replaceChildren(img);
      }),
    );
  }

  gearCardHtml(g, index) {
    const tilt = [-4, 3, -2, 4, -3, 2][index % 6],
      tagTilt = [-0.7, 0.6, -0.4, 0.8, -0.6, 0.4][index % 6];
    const chosen = this.context.service.state.trip.selected.includes(g.id);
    const url = g.url
      ? `<a class="buy-link" href="${esc(g.url)}" target="_blank" rel="noopener">購入サイト ↗</a>`
      : "";
    return `<article class="gear-card" data-id="${esc(g.id)}" style="--gear-tilt:${tilt}deg;--tag-tilt:${tagTilt}deg">
    <div class="gear-photo">
      ${this.gearArtHtml(g, "inventory-art")}
      ${chosen ? '<span class="inventory-packed">✓ 今回の荷物</span>' : ""}
    </div>
    <div class="gear-body">
      <div class="gear-top"><span class="inventory-category">${esc(g.category)}</span><span class="inventory-number" aria-hidden="true">${String(index + 1).padStart(2, "0")}</span></div>
      <h3><a class="gear-detail-link" href="#gear/${encodeURIComponent(g.id)}" data-gear-detail="${esc(g.id)}" aria-label="${esc(g.name)}の詳細">${esc(g.name)}</a></h3>
      ${g.brand ? `<p class="brand-text">${esc(g.brand)}</p>` : ""}
      <div class="inventory-location"><span>しまう場所</span><b>${esc(g.storage || "保管場所未設定")}</b></div>
      <div class="gear-meta">
        <span class="inventory-measure">${esc(g.qty || 1)}${esc(g.qtyUnit || "個")} / ${fmtWeight((Number(g.weight) || 0) * (Number(g.qty) || 1))}</span>
        <span class="inventory-condition ${esc(g.status)}">${esc(statusText[g.status] || "状態未設定")}</span>
      </div>
      <div class="gear-actions"><span class="inventory-open" aria-hidden="true">詳細を見る ↗</span><button class="edit-btn" type="button" data-gear-edit="${esc(g.id)}" aria-label="${esc(g.name)}の手入れ">手入れする ↗</button></div>
      ${url}
    </div>
  </article>`;
  }

  async renderLoadout() {
    const selected = this.context.selectedGear(),
      storage = this.context.service.state.gear.filter(
        (g) => !this.context.service.state.trip.selected.includes(g.id),
      );
    $("#loadoutStats").innerHTML =
      stat("収納側", storage.length, "点") +
      stat("持っていく", selected.length, "点") +
      stat("総重量", weight(selected).toFixed(1), "kg") +
      stat("カテゴリ", new Set(selected.map((g) => g.category)).size, "種");
    await Promise.all([
      this.renderMoveCards($("#storageGearList"), storage, false),
      this.renderMoveCards($("#campGearList"), selected, true),
    ]);
  }

  async renderMoveCards(root, list, inCamp) {
    if (!list.length) {
      this.context.photoRenderVersions.set(
        root,
        (this.context.photoRenderVersions.get(root) || 0) + 1,
      );
      root.innerHTML = `<div class="empty-zone"><small>${inCamp ? "READY TO PACK" : "ON THE SHELF"}</small><b>${inCamp ? "荷物をここに整える" : "道具はすべて荷物の中です"}</b><p>${inCamp ? "棚から、今回使う道具を選んで入れる。" : "使わない道具は、棚へ戻しておけます。"}</p></div>`;
      return;
    }
    root.innerHTML = list
      .map(
        (
          g,
          index,
        ) => `<article class="move-card" draggable="true" data-move-id="${esc(g.id)}" style="--gear-tilt:${index % 2 ? 3 : -3}deg">
    <div class="move-photo">${this.gearArtHtml(g, "move-art")}</div>
    <div class="move-body"><small>${esc(g.category)}</small><strong><a class="gear-detail-link" href="#gear/${encodeURIComponent(g.id)}" data-gear-detail="${esc(g.id)}" draggable="false" aria-label="${esc(g.name)}の詳細">${esc(g.name)}</a></strong><small>${esc(g.qty || 1)}${esc(g.qtyUnit || "個")} · ${fmtWeight((Number(g.weight) || 0) * (Number(g.qty) || 1))}</small>
      <div class="move-actions"><button class="main-move" type="button">${inCamp ? "← 棚へ戻す" : "荷物に入れる →"}</button><button class="move-edit" type="button" data-gear-edit="${esc(g.id)}" aria-label="${esc(g.name)}の手入れ">手入れ ↗</button></div>
    </div>
  </article>`,
      )
      .join("");
    root.querySelectorAll(".move-card").forEach((card) => {
      card.addEventListener("dragstart", (e) => {
        this.context.shell.draggedId = card.dataset.moveId;
        card.classList.add("dragging");
        e.dataTransfer.setData("text/plain", this.context.shell.draggedId);
      });
      card.addEventListener("dragend", () => {
        card.classList.remove("dragging");
        $$(".drop-zone").forEach((z) => z.classList.remove("drag-over"));
        this.context.shell.draggedId = null;
      });
      card.querySelector(".main-move").onclick = () =>
        inCamp
          ? this.context.shell.moveToStorage(card.dataset.moveId)
          : this.context.shell.moveToCamp(card.dataset.moveId);
    });
    await this.hydrateGearPhotos(root, list);
  }

  async renderCare() {
    const good = this.context.service.state.gear.filter(
        (g) => g.status === "good",
      ),
      check = this.context.service.state.gear.filter(
        (g) => g.status === "check",
      ),
      repair = this.context.service.state.gear.filter(
        (g) => g.status === "repair",
      );
    $("#careStats").innerHTML =
      stat("使用OK", good.length, "点") +
      stat("要確認", check.length, "点") +
      stat("修理・交換", repair.length, "点") +
      stat("合計", this.context.service.state.gear.length, "点");
    const list = [...repair, ...check];
    const root = $("#careList");
    root.innerHTML = list.length
      ? list
          .map(
            (
              g,
              index,
            ) => `<article class="care-object" style="--gear-tilt:${index % 2 ? 3 : -4}deg">
    <div class="care-object-photo">${this.gearArtHtml(g, "care-art")}</div>
    <div class="care-tag"><span class="inventory-condition ${esc(g.status)}">${esc(statusText[g.status])}</span><h3><a class="gear-detail-link" href="#gear/${encodeURIComponent(g.id)}" data-gear-detail="${esc(g.id)}" aria-label="${esc(g.name)}の詳細">${esc(g.name)}</a></h3>
      <p>${esc(g.note?.split("\n")[0] || g.storage || "次のキャンプの前に、状態を確かめる。")}</p>
      <small>${g.care?.lastCompleted ? "前回のお手入れ " + careDate(g.care.lastCompleted) : "お手入れの工程をまだ記録していません"}</small>
      <button class="care-edit" type="button" data-gear-edit="${esc(g.id)}" aria-label="${esc(g.name)}の手入れを始める">作業台で手入れする ↗</button>
    </div></article>`,
          )
          .join("")
      : `<div class="care-ready"><span>READY</span><h2>道具は、次のキャンプへ。</h2><p>点検・修理待ちの道具はありません。</p></div>`;
    await this.hydrateGearPhotos(root, list);
  }
}
