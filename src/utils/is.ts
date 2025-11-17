export const isPlainObject = (x: any): x is object => {
  if (x === null || typeof x === 'undefined') return false;
  if (Array.isArray(x)) return false;
  if (x instanceof Date) return false;
  return Object.getPrototypeOf(x) === Object.prototype
}
