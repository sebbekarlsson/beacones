// src/utils/is.ts
var isPlainObject = (x) => {
  if (x === null || typeof x === "undefined") return false;
  if (Array.isArray(x)) return false;
  if (x instanceof Date) return false;
  return Object.getPrototypeOf(x) === Object.prototype;
};
export {
  isPlainObject
};
