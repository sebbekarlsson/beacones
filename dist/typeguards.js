export const isNullish = (x) => typeof x === 'undefined' || x === null;
export const isPlainObject = (x) => !isNullish(x) && Object.getPrototypeOf(x) === Object.prototype;
