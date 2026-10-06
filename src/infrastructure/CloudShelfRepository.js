import { GearShelf } from "../domain/GearShelf.js";

/** 保存方法の差を吸収し、画面からSupabaseやSQLを切り離します。 */
export class CloudShelfRepository {
  constructor(api) {
    this.api = api;
  }
  async load() {
    const result = await (await this.api.request("/shelf")).json();
    return { state: new GearShelf(result.state), revision: result.revision };
  }
  async save(shelf, expectedRevision) {
    const response = await this.api.request("/shelf", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ state: shelf, expectedRevision }),
    });
    return (await response.json()).revision;
  }
}
