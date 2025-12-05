// src/utils/pick.ts
function pick(obj, path, unwrap) {
  if (unwrap) {
    obj = unwrap(obj);
  }
  const keys = path.split(".");
  let currentObj = obj;
  for (const key of keys) {
    const value = currentObj[key];
    if (value === void 0 || value === null) {
      return void 0;
    }
    currentObj = value;
  }
  return currentObj;
}
var insert = (obj, path, value) => {
  const copy = { ...obj };
  const keys = path.split(".");
  let next = copy;
  while (keys.length > 0 && !!next) {
    const key = keys[0];
    if (!key) break;
    if (keys.length <= 1) {
      next[key] = value;
      break;
    }
    keys.splice(0, 1);
    next = next[key];
  }
  return copy;
};
var insertReflect = (obj, path, value) => {
  const copy = { ...obj };
  const keys = path.split(".");
  let next = copy;
  while (keys.length > 0 && !!next) {
    const key = keys[0];
    if (!key) break;
    if (keys.length <= 1) {
      Reflect.set(next, key, value);
      break;
    }
    keys.splice(0, 1);
    next = next[key];
  }
  return copy;
};
export {
  insert,
  insertReflect,
  pick
};
