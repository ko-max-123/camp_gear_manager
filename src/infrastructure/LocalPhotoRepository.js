/** IndexedDBの写真。旧版の道具IDと、新版の写真パスの両方を読めます。 */
export class LocalPhotoRepository {
  async open() {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open("campGearShelfImages", 1);
      request.onupgradeneeded = () => {
        if (!request.result.objectStoreNames.contains("photos"))
          request.result.createObjectStore("photos");
      };
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async read(key) {
    const db = await this.open();
    try {
      return await new Promise((resolve, reject) => {
        const request = db.transaction("photos").objectStore("photos").get(key);
        request.onsuccess = () => resolve(request.result || null);
        request.onerror = () => reject(request.error);
      });
    } finally {
      db.close();
    }
  }

  async get(gear) {
    return (
      (await this.read(gear.photoPath || gear.id).catch(() => null)) ||
      gear.photoSrc ||
      null
    );
  }

  async upload(id, data) {
    const path = `local/${id}/${crypto.randomUUID()}`;
    const db = await this.open();
    try {
      await new Promise((resolve, reject) => {
        const transaction = db.transaction("photos", "readwrite");
        transaction.objectStore("photos").put(data, path);
        transaction.oncomplete = resolve;
        transaction.onerror = () => reject(transaction.error);
        transaction.onabort = () => reject(transaction.error);
      });
    } finally {
      db.close();
    }
    return path;
  }

  async remove(path) {
    const db = await this.open();
    try {
      await new Promise((resolve, reject) => {
        const transaction = db.transaction("photos", "readwrite");
        transaction.objectStore("photos").delete(path);
        transaction.oncomplete = resolve;
        transaction.onerror = () => reject(transaction.error);
        transaction.onabort = () => reject(transaction.error);
      });
    } finally {
      db.close();
    }
  }

  clear() {
    /* data URLを返すため、破棄するオブジェクトURLはありません。 */
  }
}
