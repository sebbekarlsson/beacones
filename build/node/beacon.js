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

// src/beacon.ts
var beacon_exports = {};
__export(beacon_exports, {
  isBeacon: () => isBeacon
});
module.exports = __toCommonJS(beacon_exports);

// src/typeguards.ts
var isNullish = (x) => typeof x === "undefined" || x === null;

// src/beacon.ts
var isBeacon = (x) => {
  if (isNullish(x)) return false;
  if (typeof x !== "object") return false;
  const y = x;
  return y._beacon === true && !isNullish(y._events);
};
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  isBeacon
});
