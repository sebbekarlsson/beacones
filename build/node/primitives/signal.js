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
var lazySignal = (initialValue, compute) => {
  const tmp = makeSignal(compute);
  tmp._init();
  const sig = makeSignal(compute);
  sig._assign(initialValue);
  tmp._deps.forEach((dep) => sig._addDependency(dep));
  tmp._dispose();
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
export {
  createSignal,
  isSignal,
  lazySignal,
  signal
};
