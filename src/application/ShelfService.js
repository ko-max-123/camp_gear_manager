import { GearShelf } from "../domain/GearShelf.js";

/** 保存の順序、競合、写真の差し替えを扱うユースケース層です。 */
export class ShelfService {
  /**
   * @param {import('./ports.js').ShelfRepository} repository
   * @param {import('./ports.js').PhotoRepository} photos
   * @param {function(string, Error=): void} onStatus
   */
  constructor(repository, photos, onStatus = () => {}) {
    this.repository = repository;
    this.photos = photos;
    this.onStatus = onStatus;
    this.state = new GearShelf();
    this.revision = 0;
    this.queue = Promise.resolve();
    this.generation = 0;
  }

  async load() {
    const generation = this.generation;
    const result = await this.repository.load();
    if (generation !== this.generation) return;
    this.state = new GearShelf(result.state);
    this.revision = result.revision;
  }

  /** 連打・別画面の更新を直列化し、DB保存が成功した状態だけ公開します。 */
  change(update) {
    const generation = this.generation;
    const operation = this.queue
      .catch(() => {})
      .then(async () => {
        if (generation !== this.generation)
          throw new Error("ログイン状態が変わりました。");
        this.onStatus("saving");
        try {
          const next = this.state.clone();
          await update(next);
          if (generation !== this.generation)
            throw new Error("ログイン状態が変わりました。");
          const revision = await this.repository.save(next, this.revision);
          if (generation !== this.generation)
            throw new Error("ログイン状態が変わりました。");
          this.state = next;
          this.revision = revision;
          this.onStatus("saved");
        } catch (error) {
          if (generation === this.generation) this.onStatus("error", error);
          throw error;
        }
      });
    this.queue = operation;
    return operation;
  }

  setTheme(theme) {
    return this.change((shelf) => {
      shelf.theme = theme;
    });
  }
  setTripName(name) {
    return this.change((shelf) => {
      shelf.trip.name = String(name).slice(0, 100);
    });
  }
  pack(id, selected) {
    return this.change((shelf) => shelf.pack(id, selected));
  }
  packDefaults() {
    return this.change((shelf) =>
      shelf.gear
        .filter((item) => item.default)
        .forEach((item) => shelf.pack(item.id, true)),
    );
  }
  clearTrip() {
    return this.change((shelf) => {
      shelf.trip.selected = [];
    });
  }

  async saveGear(
    record,
    { photo = null, removePhoto = false, cutout = false } = {},
  ) {
    let newPath = null;
    let oldPhoto = null;
    try {
      await this.change(async (shelf) => {
        const previous = shelf.find(record.id);
        oldPhoto = previous?.photoPath || previous?.id;
        const next = { ...previous, ...record };
        if (photo) {
          newPath = await this.photos.upload(record.id, photo);
          next.photoPath = newPath;
          next.photoCutout = cutout;
          delete next.photoSrc;
        } else if (removePhoto) {
          delete next.photoPath;
          delete next.photoSrc;
          next.photoCutout = false;
        }
        shelf.put(next);
      });
    } catch (error) {
      // 未確定の写真だけを片付けます。元の写真は保存成功まで残します。
      if (newPath) await this.discardUpload(newPath);
      throw error;
    }
    if ((photo || removePhoto) && oldPhoto && oldPhoto !== newPath)
      await this.photos.remove(oldPhoto).catch(() => {});
  }

  async deleteGear(id) {
    let oldPhoto;
    await this.change((shelf) => {
      const gear = shelf.find(id);
      oldPhoto = gear?.photoPath || gear?.id;
      shelf.remove(id);
    });
    if (oldPhoto) await this.photos.remove(oldPhoto).catch(() => {});
  }

  /** 通信切断後はDBが確定済みかもしれません。参照されていない写真だけ削除します。 */
  async discardUpload(path) {
    try {
      const persisted = await this.repository.load();
      if (!persisted.state.gear.some((gear) => gear.photoPath === path))
        await this.photos.remove(path);
    } catch {
      /* 確認できない時は写真を残し、確定済みの記録を壊しません。 */
    }
  }

  dispose() {
    ++this.generation;
    this.state = new GearShelf();
    this.photos.clear();
  }
}
