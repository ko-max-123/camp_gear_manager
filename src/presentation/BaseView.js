/** DOMへメソッドを渡しても、所属する画面インスタンスを維持します。 */
export class BaseView {
  constructor(context) {
    this.context = context;
    for (const name of Object.getOwnPropertyNames(this.constructor.prototype)) {
      if (name !== "constructor" && typeof this[name] === "function")
        this[name] = this[name].bind(this);
    }
  }
}
