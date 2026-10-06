import { HttpError } from "./HttpError.js";
import { GearShelf } from "../src/domain/GearShelf.js";

/** 道具・荷物を1トランザクションで読み書きするAPIです。 */
export class ShelfApi {
  constructor(gateway) {
    this.gateway = gateway;
  }
  async load(token) {
    return (
      (await this.gateway.rpc("camp_load_shelf", token)) || {
        state: new GearShelf(),
        revision: 0,
      }
    );
  }
  async save(token, input) {
    if (
      !input ||
      !Number.isSafeInteger(input.expectedRevision) ||
      input.expectedRevision < 0 ||
      !Array.isArray(input.state?.gear) ||
      input.state.gear.length > 1000
    )
      throw new HttpError(400, "道具の記録の形式を確認してください。");
    const ids = new Set();
    for (const gear of input.state.gear) {
      if (
        !/^[\w-]{1,100}$/.test(gear.id || "") ||
        ids.has(gear.id) ||
        !String(gear.name || "").trim()
      )
        throw new HttpError(400, "道具の名前とIDを確認してください。");
      ids.add(gear.id);
    }
    return this.gateway.rpc("camp_save_shelf", token, {
      p_state: new GearShelf(input.state),
      p_expected_revision: input.expectedRevision,
    });
  }
}
