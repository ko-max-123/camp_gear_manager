import { GearShelf } from "../domain/GearShelf.js";
import { ownedPeg } from "../domain/sampleData.js";

/** ユーザーが選んだ時だけ、旧ブラウザ保存を空のクラウド棚へ移します。 */
export class LegacyMigrationService {
  constructor(local, localPhotos, shelfService, userId) {
    this.local = local;
    this.localPhotos = localPhotos;
    this.service = shelfService;
    this.userId = userId;
  }
  get marker() {
    return "campGearShelf_cloud_import_owner";
  }
  available() {
    const owner = localStorage.getItem(this.marker);
    return (
      (!owner || owner === this.userId) &&
      this.service.revision === 0 &&
      Boolean(this.local.readStored()?.gear.length)
    );
  }
  async import(onProgress = () => {}) {
    if (!this.available()) throw new Error("移行できる道具がありません。");
    const next = new GearShelf(this.local.readStored());
    const peg = next.find(ownedPeg.id);
    if (peg?.photoSrc === "assets/owned-gear/titanmania-v-pegs.jpg") {
      peg.photoSrc = ownedPeg.photoSrc;
      peg.photoCutout = true;
    }
    const uploads = [];
    try {
      for (const [index, gear] of next.gear.entries()) {
        onProgress(index + 1, next.gear.length);
        const photo = await this.localPhotos.read(gear.photoPath || gear.id);
        delete gear.photoPath;
        if (photo) {
          gear.photoPath = await this.service.photos.upload(gear.id, photo);
          uploads.push(gear.photoPath);
          delete gear.photoSrc;
        }
      }
      await this.service.change((shelf) => {
        if (this.service.revision !== 0)
          throw new Error(
            "クラウドの棚が更新されています。読み直してください。",
          );
        Object.assign(shelf, next);
      });
    } catch (error) {
      await Promise.allSettled(
        uploads.map((path) => this.service.discardUpload(path)),
      );
      throw error;
    }
    localStorage.setItem(this.marker, this.userId);
  }
}
