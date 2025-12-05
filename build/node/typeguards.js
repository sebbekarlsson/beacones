// src/typeguards.ts
var isNullish = (x) => typeof x === "undefined" || x === null;
var isPlainObject = (x) => !isNullish(x) && Object.getPrototypeOf(x) === Object.prototype;
export {
  isNullish,
  isPlainObject
};
