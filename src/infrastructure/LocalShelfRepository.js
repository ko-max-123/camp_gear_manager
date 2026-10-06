import { GearShelf } from "../domain/GearShelf.js";
import { sample, ownedPeg } from "../domain/sampleData.js";

/** 従来の保存先。クラウド移行元と、未接続時のローカル表示に使います。 */
export class LocalShelfRepository {
  static key = "campGearShelf_v7";

  readStored() {
    for (const key of [
      LocalShelfRepository.key,
      "campGearShelf_v6",
      "campGearShelf_v5",
      "campGearShelf_v4",
    ]) {
      try {
        const value = localStorage.getItem(key);
        if (value) {
          const data = JSON.parse(value);
          if (Array.isArray(data.gear)) return data;
        }
      } catch {
        /* 古い・壊れたデータは残し、次の形式を探します。 */
      }
    }
    return null;
  }

  async load() {
    const stored = this.readStored();
    const shelf = new GearShelf(stored || sample);
    const peg = shelf.find(ownedPeg.id);
    if (peg?.photoSrc === "assets/owned-gear/titanmania-v-pegs.jpg") {
      peg.photoSrc = ownedPeg.photoSrc;
      peg.photoCutout = true;
    }
    const marker = LocalShelfRepository.key + "_owned_titanmania_pegs_v1";
    if (!localStorage.getItem(marker)) {
      if (!peg) shelf.put(ownedPeg);
      localStorage.setItem(marker, "1");
    }
    localStorage.setItem(
      LocalShelfRepository.key,
      JSON.stringify({ ...shelf, _revision: Number(stored?._revision) || 0 }),
    );
    return { state: shelf, revision: Number(stored?._revision) || 0 };
  }

  async save(shelf, expectedRevision) {
    const current = Number(this.readStored()?._revision) || 0;
    if (current !== expectedRevision)
      throw new Error("別のタブで更新されています。棚を読み直してください。");
    const revision = current + 1;
    localStorage.setItem(
      LocalShelfRepository.key,
      JSON.stringify({ ...shelf, _revision: revision }),
    );
    return revision;
  }
}
