/**
 * 保存先の差し替えに必要な契約です。実装の継承よりも、同じ操作を持つ
 * オブジェクトの注入を使い、業務処理をSupabaseやIndexedDBから独立させます。
 *
 * @typedef {Object} ShelfRepository
 * @property {function(): Promise<{state: import('../domain/GearShelf.js').GearShelf, revision: number}>} load
 * @property {function(import('../domain/GearShelf.js').GearShelf, number): Promise<number>} save
 *
 * @typedef {Object} PhotoRepository
 * @property {function(import('../domain/Gear.js').Gear): Promise<string|null>} get
 * @property {function(string, string): Promise<string>} upload
 * @property {function(string): Promise<void>} remove
 * @property {function(): void} clear
 */
export {};
