"use strict";
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));

// src/primitives/signal.test.ts
var import_node_assert = __toESM(require("node:assert"), 1);
var import_node_test = require("node:test");

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

// src/primitives/signal.test.ts
(0, import_node_test.it)("Updates a derived state", () => {
  const count = signal(0);
  import_node_assert.default.equal(count.peek(), 0);
  const timesTwo = signal(() => count.get() * 2);
  signal(() => {
    console.log(timesTwo.get());
  });
  import_node_assert.default.equal(timesTwo.peek(), 0);
  count.set((x) => x + 1);
  import_node_assert.default.equal(timesTwo.peek(), 2);
  count.set((x) => x + 1);
  import_node_assert.default.equal(timesTwo.peek(), 4);
});
(0, import_node_test.it)("Tracks Map changes", () => {
  const map = signal(/* @__PURE__ */ new Map());
  const x = signal(() => map.get().get("x"));
  import_node_assert.default.equal(x.peek(), void 0);
  map.peek().set("x", 7);
  import_node_assert.default.equal(x.peek(), 7);
  map.peek().set("x", 42);
  import_node_assert.default.equal(x.peek(), 42);
  map.peek().delete("x");
  import_node_assert.default.equal(x.peek(), void 0);
});
(0, import_node_test.it)("Custom Signal get & set works correctly", () => {
  const data = {
    firstname: "john",
    lastname: "doe",
    age: 47,
    pet: {
      name: "boo",
      age: 7
    }
  };
  const firstname = createSignal({
    get: () => data.firstname,
    set: (value) => {
      data["firstname"] = value;
      return value;
    }
  });
  const lastname = createSignal({
    get: () => data.lastname,
    set: (value) => {
      data["lastname"] = value;
      return value;
    }
  });
  const age = createSignal({
    get: () => data.age,
    set: (value) => {
      data["age"] = value;
      return value;
    }
  });
  const ageTimesTwo = signal(() => age.get() * 2);
  import_node_assert.default.equal(ageTimesTwo.peek(), data.age * 2);
  const petName = createSignal({
    get: () => data.pet.name,
    set: (value) => {
      data.pet["name"] = value;
      return value;
    }
  });
  firstname.set("david");
  import_node_assert.default.equal(data.firstname, "david");
  import_node_assert.default.equal(firstname.peek(), data.firstname);
  lastname.set("kent");
  import_node_assert.default.equal(data.lastname, "kent");
  import_node_assert.default.equal(lastname.peek(), data.lastname);
  age.set(33);
  import_node_assert.default.equal(data.age, 33);
  import_node_assert.default.equal(age.peek(), data.age);
  import_node_assert.default.equal(ageTimesTwo.peek(), 33 * 2);
  petName.set("foo");
  import_node_assert.default.equal(data.pet.name, "foo");
  import_node_assert.default.equal(petName.peek(), data.pet.name);
});
(0, import_node_test.it)("Can be lazy", () => {
  const count = signal(1);
  const timesTwo = lazySignal(0, () => {
    return count.get() * 2;
  });
  import_node_assert.default.equal(timesTwo.get(), 0);
  count.set(4);
  import_node_assert.default.equal(timesTwo.get(), 2 * 4);
});
