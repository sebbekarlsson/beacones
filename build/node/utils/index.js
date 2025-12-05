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

// src/compare.ts
var compare = (a, b) => {
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

// src/primitives/proxy.ts
var GlobalProxy = class {
  static {
    this.states = /* @__PURE__ */ new WeakMap();
  }
  static {
    this.proxies = /* @__PURE__ */ new WeakMap();
  }
  static {
    this.stateToProxy = /* @__PURE__ */ new WeakMap();
  }
  static {
    this.stateToObject = /* @__PURE__ */ new WeakMap();
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
    if (_didUpdate && compare(oldValue, next)) return oldValue;
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
var createSignal = (init) => {
  const sig = makeSignal(init.get);
  sig._init();
  const oldSet = sig.set;
  sig.set = (value) => {
    const x = typeof value === "function" ? value(sig.peek()) : value;
    return oldSet(init.set(x));
  };
  sig.peek = init.peek || sig.peek;
  return sig;
};
var isSignal = (x) => {
  if (isNullish(x)) return false;
  if (!isBeacon(x)) return false;
  return x._signal === true;
};

// src/utils/patch.ts
var isObject = (x) => typeof x === "object" && x !== null;
var isPatchable = (x) => isObject(x) || Array.isArray(x);
var compare2 = (a, b) => a === b;
var createPatches = (old, next, isEqual = compare2) => {
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

// src/utils/drill.ts
var drill = (initialState) => {
  const state = signal(initialState);
  const cache = /* @__PURE__ */ new Map();
  const select = (path) => {
    const old = cache.get(path);
    if (old) return old;
    const sig = createSignal({
      get: () => pick(state.peek(), path),
      peek: () => pick(state.peek(), path),
      set: (value) => {
        state.set(insert(state.peek(), path, value));
        return value;
      }
    });
    cache.set(path, sig);
    return sig;
  };
  const selectRemapped = (path, remapFunc) => {
    const old = cache.get(path);
    if (old) return old;
    const sig = createSignal({
      get: () => remapFunc(pick(state.peek(), path)),
      peek: () => remapFunc(pick(state.peek(), path)),
      set: (value) => {
        const remapped = remapFunc(value);
        state.set(insert(state.peek(), path, remapped));
        return remapped;
      }
    });
    cache.set(path, sig);
    return sig;
  };
  return {
    state,
    select,
    selectRemapped
  };
};
export {
  applyPatches,
  createPatches,
  drill,
  insert,
  insertReflect,
  pick
};
