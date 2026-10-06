/** トップの棚を軽く開くため、布と道具の先読みは収納を選ぶまで待ちます。 */
export class SceneAssetLoader {
  load() {
    return (this.promise ??= Promise.all(
      ["assets/unpack-ground.webp", "assets/unpack-gear-atlas.webp"].map(
        (src) =>
          new Promise((resolve) => {
            const image = new Image();
            image.onload = image.onerror = resolve;
            image.src = src;
          }),
      ),
    ));
  }
}
