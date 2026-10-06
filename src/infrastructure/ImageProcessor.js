/** 画像の縮小と圧縮。透明部分を白で塗りつぶしません。 */
export class ImageProcessor {
  async compress(file) {
    const url = URL.createObjectURL(file);
    try {
      const img = new Image();
      await new Promise((res, rej) => {
        img.onload = res;
        img.onerror = rej;
        img.src = url;
      });
      const max = 1280;
      let w = img.naturalWidth,
        h = img.naturalHeight;
      const scale = Math.min(1, max / Math.max(w, h));
      w = Math.round(w * scale);
      h = Math.round(h * scale);
      const c = document.createElement("canvas");
      c.width = w;
      c.height = h;
      const ctx = c.getContext("2d");
      ctx.drawImage(img, 0, 0, w, h);
      const pixels = ctx.getImageData(0, 0, w, h).data;
      let hasAlpha = false;
      for (let i = 3; i < pixels.length; i += 4) {
        if (pixels[i] < 250) {
          hasAlpha = true;
          break;
        }
      }
      let data = c.toDataURL("image/webp", 0.8);
      if (!data.startsWith("data:image/webp"))
        data = c.toDataURL(hasAlpha ? "image/png" : "image/jpeg", 0.8);
      return {
        data,
        width: w,
        height: h,
        size: Math.round(data.length * 0.75),
        hasAlpha,
      };
    } finally {
      URL.revokeObjectURL(url);
    }
  }
}
