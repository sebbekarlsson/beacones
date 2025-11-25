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

// src/primitives/proxyMap.ts
var proxyMap_exports = {};
__export(proxyMap_exports, {
  ProxyMap: () => ProxyMap,
  isProxyMap: () => isProxyMap
});
module.exports = __toCommonJS(proxyMap_exports);

// src/eventSystem.ts
var EventSystem = class {
  constructor() {
    this.globalListeners = /* @__PURE__ */ new Set();
    this.slots = /* @__PURE__ */ new Map();
  }
  emit(event) {
    this.globalListeners.forEach((fn) => {
      fn(event);
    });
    const listeners = this.slots.get(event.eventType);
    if (listeners) {
      listeners.forEach((fn) => {
        fn(event);
      });
    }
  }
  async emitAsync(event) {
    for (const fn of this.globalListeners) {
      await fn(event);
    }
    const listeners = this.slots.get(event.eventType);
    if (listeners) {
      for (const fn of listeners) {
        await fn(event);
      }
    }
  }
  subscribe(eventType, callback) {
    const listeners = this.slots.get(eventType);
    if (listeners) {
      listeners.add(callback);
    } else {
      const listeners2 = /* @__PURE__ */ new Set();
      listeners2.add(callback);
      this.slots.set(eventType, listeners2);
    }
    return () => {
      const listeners2 = this.slots.get(eventType);
      if (listeners2) {
        listeners2.delete(callback);
      }
    };
  }
  subscribeAll(callback) {
    this.globalListeners.add(callback);
    return () => {
      this.globalListeners.delete(callback);
    };
  }
  clearAllSubscribers() {
    this.slots.clear();
  }
  clear() {
    this.globalListeners.clear();
    this.slots.clear();
  }
};

// src/primitives/proxyMap.ts
var ProxyMap = class extends Map {
  constructor() {
    super(...arguments);
    this._events = new EventSystem();
    this._isProxyMap = true;
  }
  _dispose() {
    this._events.clear();
  }
  set(key, value) {
    const old = Map.prototype.get.apply(this, [key]);
    if (old === value) return this;
    Map.prototype.set.apply(this, [key, value]);
    this._events.emit({
      eventType: "SET_PROP" /* SET_PROP */,
      key,
      value,
      oldValue: old
    });
    return this;
  }
  get(key) {
    const value = Map.prototype.get.apply(this, [key]);
    this._events.emit({
      eventType: "GET_PROP" /* GET_PROP */,
      key,
      value
    });
    return value;
  }
  clear() {
    Map.prototype.clear.apply(this);
    this._events.emit({
      eventType: "CLEAR" /* CLEAR */
    });
  }
  delete(key) {
    const old = Map.prototype.get.apply(this, [key]);
    const r = Map.prototype.delete.apply(this, [key]);
    if (r === false) return r;
    this._events.emit({
      eventType: "UNSET_PROP" /* UNSET_PROP */,
      key,
      oldValue: old
    });
    return r;
  }
};
var isProxyMap = (x) => {
  if (typeof x === "undefined" || x === null) return false;
  if (typeof x === "string" || typeof x === "number" || typeof x === "boolean" || typeof x === "bigint" || typeof x === "symbol") return false;
  return x._isProxyMap === true;
};
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  ProxyMap,
  isProxyMap
});
