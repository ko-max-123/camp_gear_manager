/** 外周につながる白背景だけを透明にする。囲まれた白い部分は残す。 */
export class WhiteBackgroundRemover {
  remove({ data, width, height }) {
    const count = width * height;
    const background = new Uint8Array(count);
    const queue = new Uint32Array(count);
    let head = 0;
    let tail = 0;
    const add = (pixel) => {
      if (background[pixel]) return;
      const offset = pixel * 4;
      const min = Math.min(data[offset], data[offset + 1], data[offset + 2]);
      const max = Math.max(data[offset], data[offset + 1], data[offset + 2]);
      // JPEGの白に入る小さな色差・圧縮ノイズを許容する。
      if (min < 240 || max - min > 20) return;
      background[pixel] = 1;
      queue[tail++] = pixel;
    };
    for (let x = 0; x < width; ++x) {
      add(x);
      add((height - 1) * width + x);
    }
    for (let y = 1; y < height - 1; ++y) {
      add(y * width);
      add(y * width + width - 1);
    }
    while (head < tail) {
      const pixel = queue[head++];
      const x = pixel % width;
      if (x > 0) add(pixel - 1);
      if (x < width - 1) add(pixel + 1);
      if (pixel >= width) add(pixel - width);
      if (pixel < count - width) add(pixel + width);
    }
    if (!tail) return 0;
    for (let pixel = 0; pixel < count; ++pixel) {
      const offset = pixel * 4;
      if (background[pixel]) {
        data[offset + 3] = 0;
        continue;
      }
      // 輪郭の1画素だけをなじませ、白背景が混ざった明るい縁を抑える。
      const min = Math.min(data[offset], data[offset + 1], data[offset + 2]);
      const max = Math.max(data[offset], data[offset + 1], data[offset + 2]);
      if (min < 220 || min >= 240 || max - min > 20) continue;
      const x = pixel % width;
      const touchesBackground =
        (x > 0 && background[pixel - 1]) ||
        (x < width - 1 && background[pixel + 1]) ||
        (pixel >= width && background[pixel - width]) ||
        (pixel < count - width && background[pixel + width]);
      if (!touchesBackground) continue;
      const opacity = (240 - min) / 20;
      for (let channel = 0; channel < 3; ++channel) {
        data[offset + channel] = Math.max(
          0,
          (data[offset + channel] - 255 * (1 - opacity)) / opacity,
        );
      }
      data[offset + 3] = Math.round(data[offset + 3] * opacity);
    }
    return tail;
  }
}
