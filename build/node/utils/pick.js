"use strict";
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// src/utils/pick.ts
var pick_exports = {};
__export(pick_exports, {
  insert: () => insert,
  insertReflect: () => insertReflect,
  pick: () => pick
});
module.exports = __toCommonJS(pick_exports);
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
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  insert,
  insertReflect,
  pick
});
