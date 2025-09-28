export type Nullish = undefined | null;

export const isNullish = (x: unknown): x is Nullish => typeof x === 'undefined' || x === null;
export const isPlainObject = (x: unknown): x is object => !isNullish(x) && Object.getPrototypeOf(x) === Object.prototype;
