import { AppController } from "../presentation/AppController.js";
import { NavigationController } from "../presentation/NavigationController.js";
import { StorageSceneView } from "../presentation/StorageSceneView.js";
import { CollectionView } from "../presentation/CollectionView.js";
import { GearDetailView } from "../presentation/GearDetailView.js";
import { GearMaintenanceView } from "../presentation/GearMaintenanceView.js";
import { SceneAssetLoader } from "../presentation/SceneAssetLoader.js";
import { ImageProcessor } from "../infrastructure/ImageProcessor.js";
import { $ } from "../presentation/gearPresentation.js";

/** 依存するオブジェクトを組み立てる場所。画面に保存先の詳細を渡しません。 */
export class ApplicationContext {
  constructor() {
    this.service = null;
    this.scope = 0;
    this.photoCache = new Map();
    this.photoRenderVersions = new WeakMap();
    this.assets = new SceneAssetLoader();
    this.imageProcessor = new ImageProcessor();
    this.shell = new AppController(this);
    this.navigation = new NavigationController(this);
    this.sceneView = new StorageSceneView(this);
    this.collection = new CollectionView(this);
    this.details = new GearDetailView(this);
    this.maintenance = new GearMaintenanceView(this);
  }

  selectedGear() {
    return this.service.state.selectedGear;
  }

  async photoGet(id) {
    const scope = this.scope;
    const gear = this.service.state.find(id);
    if (!gear) return null;
    try {
      const photo = await this.service.photos.get(gear);
      return scope === this.scope ? photo : null;
    } catch {
      if (scope === this.scope)
        this.shell.setStatus(
          "error",
          new Error("写真を読み込めませんでした。"),
        );
      return null;
    }
  }

  /** ログアウト時は、非公開写真のURLと画面上の個人データを破棄します。 */
  clear() {
    ++this.scope;
    clearTimeout(this.shell.tripTimer);
    this.shell.pendingTripName = null;
    this.navigation.discardEditor();
    this.navigation.discardDetail();
    this.sceneView.closeScene(false);
    this.service?.dispose();
    this.photoCache.clear();
    this.photoRenderVersions = new WeakMap();
    for (const id of [
      "gearGrid",
      "careList",
      "storageGearList",
      "campGearList",
      "spreadGrid",
      "detailPhoto",
      "photoPreview",
      "detailCareTools",
      "detailCareSummary",
    ])
      $("#" + id).replaceChildren();
    for (const id of [
      "detailTitle",
      "detailName",
      "detailNote",
      "detailStorage",
      "detailBrand",
      "detailPacked",
      "detailCategory",
      "detailStatus",
      "maintenanceGearMeta",
      "inventoryMeta",
      "unpackMeta",
    ])
      $("#" + id).textContent = "";
    $("#detailSpecs").replaceChildren();
    $("#careStats").replaceChildren();
    $("#loadoutStats").replaceChildren();
    for (const id of ["tripNameMenu", "tripNameMain"])
      $("#" + id).value = "次回キャンプ";
    for (const id of ["headerTripCount", "unpackTripCount"])
      $("#" + id).textContent = "0";
    $("#tripMiniMeta").textContent = "";
    $("#detailPurchaseLink").removeAttribute("href");
    $("#gearForm").reset();
    for (const id of [
      "gearSearch",
      "globalSearch",
      "gearCategoryFilter",
      "gearStatusFilter",
    ])
      $("#" + id).value = "";
  }
}
