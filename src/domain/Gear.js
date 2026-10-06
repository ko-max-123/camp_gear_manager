/** 道具1件。入力の型と、保存する項目をここで揃えます。 */
export class Gear {
  constructor(record = {}) {
    this.id = String(record.id || crypto.randomUUID());
    this.name = String(record.name || "")
      .trim()
      .slice(0, 80);
    this.category = String(record.category || "その他").slice(0, 80);
    this.brand = String(record.brand || "").slice(0, 60);
    this.qty = Math.min(99, Math.max(1, Math.trunc(Number(record.qty) || 1)));
    this.qtyUnit = String(record.qtyUnit || "個").slice(0, 10);
    this.weight = Math.min(999, Math.max(0, Number(record.weight) || 0));
    this.status = ["good", "check", "repair"].includes(record.status)
      ? record.status
      : "check";
    this.default = Boolean(record.default ?? record.essential);
    this.storage = String(record.storage || "").slice(0, 100);
    this.purchased = /^\d{4}-\d{2}-\d{2}$/.test(record.purchased || "")
      ? record.purchased
      : "";
    this.url = this.purchaseUrl(record.url);
    this.note = String(record.note || "").slice(0, 500);
    this.updated = this.timestamp(record.updated);
    this.photoCutout = Boolean(record.photoCutout);
    // 同梱写真とアップロード写真を分け、秘密の画像URLをDBに保存しません。
    if (
      /^assets\/[\w./-]+$/.test(record.photoSrc || "") &&
      !record.photoSrc.includes("..")
    )
      this.photoSrc = record.photoSrc;
    if (typeof record.photoPath === "string" && record.photoPath)
      this.photoPath = record.photoPath;
    const steps = ["clean", "dry", "inspect", "store"];
    this.care = {
      steps: [
        ...new Set(
          (Array.isArray(record.care?.steps) ? record.care.steps : []).filter(
            (id) => steps.includes(id),
          ),
        ),
      ],
      updated: this.timestamp(record.care?.updated),
      lastCompleted:
        typeof record.care?.lastCompleted === "string" &&
        Number.isFinite(Date.parse(record.care.lastCompleted))
          ? new Date(record.care.lastCompleted).toISOString()
          : null,
    };
  }

  purchaseUrl(value) {
    try {
      const url = new URL(value);
      return ["https:", "http:"].includes(url.protocol) &&
        url.href.length <= 2000
        ? url.href
        : "";
    } catch {
      return "";
    }
  }

  timestamp(value) {
    const number = Number(value);
    return Number.isSafeInteger(number) && number >= 0 ? number : 0;
  }

  get totalWeight() {
    return this.weight * this.qty;
  }
}
