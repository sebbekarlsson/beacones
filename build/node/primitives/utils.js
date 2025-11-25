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

// src/primitives/utils.ts
var utils_exports = {};
__export(utils_exports, {
  createNestedSignals: () => createNestedSignals,
  observeNestedSignals: () => observeNestedSignals,
  reflectNestedSignals: () => reflectNestedSignals,
  traverseNestedSignals: () => traverseNestedSignals,
  unref: () => unref,
  unwrapNestedSignals: () => unwrapNestedSignals
});
module.exports = __toCommonJS(utils_exports);

// src/utils/is.ts
var isPlainObject = (x) => {
  if (x === null || typeof x === "undefined") return false;
  if (Array.isArray(x)) return false;
  if (x instanceof Date) return false;
  return Object.getPrototypeOf(x) === Object.prototype;
};

// src/utils/patch.ts
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

// src/typeguards.ts
var isNullish = (x) => typeof x === "undefined" || x === null;

// src/beacon.ts
var isBeacon = (x) => {
  if (isNullish(x)) return false;
  if (typeof x !== "object") return false;
  const y = x;
  return y._beacon === true && !isNullish(y._events);
};

// src/compare.ts
var compare2 = (a, b) => {
  if (a !== b) return false;
  if (typeof a !== typeof b) return false;
  if (typeof a === "number" && typeof b === "number") return a === b;
  if (typeof a === "string" && typeof b === "string") return a === b;
  if (typeof a === "boolean" && typeof b === "boolean") return a === b;
  if (typeof a === "function" && typeof b === "function") return a === b;
  if (a === null && b === null) return true;
  if (a === void 0 && b === void 0) return true;
  if (Array.isArray(a) && Array.isArray(b) && a.length !== b.length) return false;
  try {
    return JSON.stringify(a) === JSON.stringify(b);
  } catch (_e) {
  }
  return a === b;
};

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

// src/primitives/signal.ts
var makeSignal = (init) => {
  const events = new EventSystem();
  const deps = /* @__PURE__ */ new Set();
  const cleanups = /* @__PURE__ */ new Set();
  const _current = { value: null };
  let _value;
  let _didUpdate = false;
  let _compute = typeof init === "function" ? init : null;
  const setValue = (value) => {
    _value = value;
    _current.value = value;
  };
  const assign = (value) => {
    if (value instanceof Map) {
      const old = _value;
      if (isProxyMap(old) && old !== value) {
        old._dispose();
      }
      const proxy = new ProxyMap(value.entries());
      cleanups.add(
        proxy._events.subscribe("SET_PROP" /* SET_PROP */, (ev) => {
          events.emit({
            oldValue: old,
            value: _value,
            key: ev.key,
            eventType: "UPDATE" /* UPDATE */
          });
        })
      );
      cleanups.add(
        proxy._events.subscribe("CLEAR" /* CLEAR */, (_ev) => {
          events.emit({
            oldValue: _value,
            value: _value,
            eventType: "UPDATE" /* UPDATE */
          });
        })
      );
      cleanups.add(
        proxy._events.subscribe("UNSET_PROP" /* UNSET_PROP */, (ev) => {
          events.emit({
            oldValue: _value,
            value: _value,
            key: ev.key,
            eventType: "UPDATE" /* UPDATE */
          });
        })
      );
      cleanups.add(
        proxy._events.subscribe("GET" /* GET */, (_ev) => {
          const currentUpdate = GlobalBeaconScope.current.currentUpdate;
          if (currentUpdate && currentUpdate !== sig) {
            currentUpdate._addDependency(sig);
          }
        })
      );
      setValue(proxy);
    } else {
      setValue(value);
    }
  };
  const initialize = () => {
    if (_compute) {
      update();
    } else {
      assign(init);
    }
  };
  const lay = (value) => {
    assign(value);
    return value;
  };
  const set = (value) => {
    const oldValue = _value;
    const next = typeof value === "function" ? value(oldValue) : value;
    if (_didUpdate && compare2(oldValue, next)) return oldValue;
    assign(next);
    events.emit({
      oldValue,
      value: next,
      eventType: "UPDATE" /* UPDATE */
    });
    _didUpdate = true;
    return next;
  };
  const trackGet = () => {
    const currentUpdate = GlobalBeaconScope.current.currentUpdate;
    if (currentUpdate && currentUpdate !== sig) {
      currentUpdate._addDependency(sig);
    }
  };
  const get = () => {
    trackGet();
    return _value;
  };
  const peek = () => {
    return _value;
  };
  const update = () => {
    if (_compute) {
      return GlobalBeaconScope.current.run(() => {
        const nextValue = _compute(_value);
        return set(nextValue);
      }, sig);
    }
    return _value;
  };
  const addDependecy = (dep) => {
    if (deps.has(dep)) return;
    deps.add(dep);
    if (isSignal(dep)) {
      cleanups.add(
        dep.subscribe(() => {
          update();
        })
      );
    } else {
      const unsub = dep._events.subscribe("UPDATE" /* UPDATE */, () => {
        update();
      });
      cleanups.add(unsub);
    }
  };
  const subscribe = (sub) => {
    const unsub = events.subscribe("UPDATE" /* UPDATE */, (event) => {
      sub(event.value, event.oldValue);
    });
    return () => {
      unsub();
    };
  };
  const dispose = () => {
    Array.from(cleanups.values()).forEach((fn) => fn());
    cleanups.clear();
    events.clear();
  };
  const sig = {
    _beacon: true,
    _signal: true,
    _events: events,
    _deps: deps,
    _dispose: dispose,
    _addDependency: addDependecy,
    _init: initialize,
    _trackGet: trackGet,
    _assign: assign,
    _cleanups: cleanups,
    _current,
    get,
    set,
    lay,
    peek,
    subscribe
  };
  return sig;
};
var signal = (init) => {
  const sig = makeSignal(init);
  sig._init();
  return sig;
};
var isSignal = (x) => {
  if (isNullish(x)) return false;
  if (!isBeacon(x)) return false;
  return x._signal === true;
};

// src/primitives/utils.ts
var unref = (x, peek = false) => {
  if (!isSignal(x)) return x;
  return peek ? x.peek() : x.get();
};
var createNestedSignals = (item) => {
  const an = item;
  if (isSignal(an)) return an;
  if (typeof an === "number" || typeof an === "string" || typeof an === "undefined" || typeof an === "bigint" || typeof an === "boolean" || an === null) {
    return signal(item);
  }
  if (Array.isArray(an))
    return signal(an.map((it) => createNestedSignals(it)));
  if (typeof an === "object" && isPlainObject(an)) {
    return signal(
      Object.assign(
        {},
        ...Object.entries(an).map(([k, v]) => ({
          [k]: createNestedSignals(v)
        }))
      )
    );
  }
  return signal(an);
};
var unwrapNestedSignals = (item, options = {}) => {
  const get = (sig) => {
    return options.peek ? sig.peek() : sig.get();
  };
  const unwrap = (item2) => {
    if (typeof item2 === "undefined" || item2 === null) return item2;
    if (isSignal(item2)) return unwrap(get(item2));
    if (Array.isArray(item2)) return item2.map((it) => unwrap(it));
    if (typeof item2 === "object" && isPlainObject(item2)) {
      return Object.assign(
        {},
        ...Object.entries(item2).map(([k, v]) => ({
          [k]: unwrap(v)
        }))
      );
    }
    return item2;
  };
  return unwrap(item);
};
var traverseNestedSignals = (item, callback, options = {}) => {
  const get = (sig) => {
    return options.peek ? sig.peek() : sig.get();
  };
  const traverse = (item2, crumbs) => {
    if (typeof item2 === "undefined" || item2 === null) return;
    if (isSignal(item2)) {
      callback(item2, crumbs);
      traverse(get(item2), crumbs);
      return;
    }
    if (Array.isArray(item2)) {
      item2.forEach((it, i) => traverse(it, [...crumbs, i]));
      return;
    }
    if (typeof item2 === "object") {
      Object.entries(item2).forEach(([k, v]) => traverse(v, [...crumbs, k]));
      return;
    }
  };
  return traverse(item, []);
};
var isTraversable = (x) => x !== null && (typeof x === "object" || Array.isArray(x));
var observeNestedSignals = (item, callback) => {
  const cleanups = /* @__PURE__ */ new Set();
  const seen = /* @__PURE__ */ new WeakSet();
  traverseNestedSignals(item, (sig, crumbs) => {
    const initial = sig.peek();
    if (isTraversable(initial)) {
      seen.add(initial);
    }
    cleanups.add(sig.subscribe((value, prev) => {
      callback({ value, prev, crumbs });
      if (isTraversable(value) && !seen.has(value)) {
        cleanups.add(observeNestedSignals(value, callback));
        seen.add(value);
      }
    }));
  }, { peek: true });
  return () => {
    cleanups.forEach((fn) => fn());
    cleanups.clear();
  };
};
var reflectNestedSignals = (item) => {
  const obj = unwrapNestedSignals(item, { peek: true });
  const sig = signal(obj);
  sig._cleanups.add(observeNestedSignals(item, () => {
    const next = unwrapNestedSignals(item, { peek: true });
    const patches = createPatches(obj, next);
    const cur = sig.peek();
    applyPatches(cur, patches);
    sig.set(JSON.parse(JSON.stringify(cur)));
  }));
  return sig;
};
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  createNestedSignals,
  observeNestedSignals,
  reflectNestedSignals,
  traverseNestedSignals,
  unref,
  unwrapNestedSignals
});
