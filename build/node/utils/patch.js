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

// src/utils/patch.ts
var patch_exports = {};
__export(patch_exports, {
  applyPatches: () => applyPatches,
  createPatches: () => createPatches
});
module.exports = __toCommonJS(patch_exports);
var isObject = (x) => typeof x === "object" && x !== null;
var isPatchable = (x) => isObject(x) || Array.isArray(x);
var compare = (a, b) => a === b;
var createPatches = (old, next, isEqual = compare) => {
  const create = (old2, next2, crumbs) => {
    const patches = [];
    if (isPatchable(old2) && isPatchable(next2)) {
      const oldKeys = Object.keys(old2);
      const nextKeys = Object.keys(next2);
      for (const oldKey of oldKeys) {
        if (!nextKeys.includes(oldKey)) {
          patches.push({ type: "delete", crumbs: [...crumbs, oldKey] });
          continue;
        }
      }
      for (const nextKey of nextKeys) {
        if (!oldKeys.includes(nextKey)) {
          patches.push({
            type: "set",
            value: next2[nextKey],
            crumbs: [...crumbs, nextKey]
          });
        } else {
          patches.push(
            ...create(old2[nextKey], next2[nextKey], [...crumbs, nextKey])
          );
        }
      }
    } else {
      if (!isEqual(old2, next2)) {
        patches.push({ type: "replace", value: next2, crumbs: [...crumbs] });
      }
    }
    return patches;
  };
  return create(old, next, []);
};
var applyPatches = (old, patches) => {
  const findParent = (obj, crumbs) => {
    if (crumbs.length === 0) return null;
    let parent = obj;
    for (let i = 0; i < crumbs.length - 1; i++) {
      const crumb = crumbs[i];
      if (!isPatchable(parent[crumb])) {
        return null;
      }
      parent = parent[crumb];
    }
    const key = crumbs[crumbs.length - 1];
    return { parent, key };
  };
  const assign = (obj, crumbs, value) => {
    const target = findParent(obj, crumbs);
    if (target) {
      target.parent[target.key] = value;
    }
  };
  const remove = (obj, crumbs) => {
    const target = findParent(obj, crumbs);
    if (target) {
      if (Array.isArray(target.parent)) {
        const index = parseInt(target.key, 10);
        if (!isNaN(index) && String(target.key) === String(index)) {
          target.parent.splice(index, 1);
        } else {
          delete target.parent[target.key];
        }
      } else {
        delete target.parent[target.key];
      }
    }
  };
  for (const patch of patches) {
    switch (patch.type) {
      case "replace":
        assign(old, patch.crumbs, patch.value);
        break;
      case "set":
        assign(old, patch.crumbs, patch.value);
        break;
      case "delete":
        remove(old, patch.crumbs);
        break;
    }
  }
};
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  applyPatches,
  createPatches
});
