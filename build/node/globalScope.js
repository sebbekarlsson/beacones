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

// src/globalScope.ts
var globalScope_exports = {};
__export(globalScope_exports, {
  GlobalBeaconScope: () => GlobalBeaconScope
});
module.exports = __toCommonJS(globalScope_exports);

// src/scope.ts
var BeaconScope = class {
  constructor() {
    this.currentUpdate = null;
  }
  run(fn, caller) {
    const parent = this.currentUpdate;
    this.currentUpdate = caller;
    const r = fn();
    this.currentUpdate = parent;
    return r;
  }
};

// src/globalScope.ts
var GlobalBeaconScope = class {
  static {
    this.stack = [];
  }
  static {
    this.current = new BeaconScope();
  }
  static pushScope() {
    const scope = new BeaconScope();
    this.stack.push(scope);
    this.current = scope;
    return scope;
  }
  static popScope() {
    if (this.stack.length <= 1) return;
    this.stack.pop();
    this.current = this.stack[this.stack.length - 1];
  }
};
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  GlobalBeaconScope
});
