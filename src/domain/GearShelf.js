import { Gear } from "./Gear.js";

/** 道具と今回の荷物をまとめる集約。画面や通信に依存しません。 */
export class GearShelf {
  constructor(record = {}) {
    this.theme = record.theme === "dark" ? "dark" : "light";
    this.gear = (Array.isArray(record.gear) ? record.gear : []).map(
      (item) => new Gear(item),
    );
    this.trip = {
      name: String(record.trip?.name || "次回キャンプ").slice(0, 100),
      selected: [
        ...new Set(
          Array.isArray(record.trip?.selected) ? record.trip.selected : [],
        ),
      ].filter((id) => this.gear.some((item) => item.id === id)),
    };
  }

  clone() {
    return new GearShelf(JSON.parse(JSON.stringify(this)));
  }
  find(id) {
    return this.gear.find((item) => item.id === id);
  }
  get selectedGear() {
    return this.gear.filter((item) => this.trip.selected.includes(item.id));
  }

  put(record) {
    const gear = new Gear(record);
    if (!gear.name) throw new Error("道具の名前を入力してください。");
    const index = this.gear.findIndex((item) => item.id === gear.id);
    if (index < 0) this.gear.unshift(gear);
    else this.gear[index] = gear;
  }

  remove(id) {
    this.gear = this.gear.filter((item) => item.id !== id);
    this.trip.selected = this.trip.selected.filter((value) => value !== id);
  }

  pack(id, selected) {
    if (!this.find(id)) return;
    this.trip.selected = this.trip.selected.filter((value) => value !== id);
    if (selected) this.trip.selected.push(id);
  }
}
