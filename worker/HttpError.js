/** 内部の接続情報を返さず、HTTPで伝えられるエラーだけを表します。 */
export class HttpError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}
