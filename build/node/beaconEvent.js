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

// src/beaconEvent.ts
var beaconEvent_exports = {};
__export(beaconEvent_exports, {
  EBeaconEvent: () => EBeaconEvent
});
module.exports = __toCommonJS(beaconEvent_exports);
var EBeaconEvent = /* @__PURE__ */ ((EBeaconEvent2) => {
  EBeaconEvent2["SET_PROP"] = "SET_PROP";
  EBeaconEvent2["GET_PROP"] = "GET_PROP";
  EBeaconEvent2["UNSET_PROP"] = "UNSET_PROP";
  EBeaconEvent2["GET"] = "GET";
  EBeaconEvent2["SET"] = "SET";
  EBeaconEvent2["CLEAR"] = "CLEAR";
  EBeaconEvent2["UPDATE"] = "UPDATE";
  EBeaconEvent2["PROXY_SET_PROP"] = "PROXY_SET_PROP";
  EBeaconEvent2["PROXY_GET_PROP"] = "PROXY_GET_PROP";
  EBeaconEvent2["PROXY_UNSET_PROP"] = "PROXY_UNSET_PROP";
  return EBeaconEvent2;
})(EBeaconEvent || {});
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  EBeaconEvent
});
