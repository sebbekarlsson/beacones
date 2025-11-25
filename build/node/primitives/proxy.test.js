"use strict";

// src/primitives/proxy.test.ts
var import_node_test = require("node:test");

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

// src/primitives/reference.ts
var reference = (value) => ({ value });

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
var createState = (obj) => {
  const state = {
    parent: reference(null),
    receivers: /* @__PURE__ */ new Set(),
    accessedKeys: /* @__PURE__ */ new Set(),
    accessedPaths: /* @__PURE__ */ new Set(),
    mutatedKeys: /* @__PURE__ */ new Set(),
    mutatedPaths: /* @__PURE__ */ new Set(),
    events: new EventSystem()
  };
  GlobalProxy.states.set(obj, state);
  return state;
};
var proxyEmit = (state, event) => {
  state.events.emit(event);
};
var isPlainObject = (val) => {
  if (val === null || typeof val !== "object") {
    return false;
  }
  const proto = Object.getPrototypeOf(val);
  return proto === Object.prototype || proto === null;
};
var canBeProxied = (x) => Array.isArray(x) || isPlainObject(x);
var createProxy = (obj) => {
  const create = (obj2, ctx) => {
    if (!canBeProxied(obj2)) return obj2;
    if (GlobalProxy.proxies.has(obj2)) {
      return GlobalProxy.proxies.get(obj2);
    }
    const state = createState(obj2);
    GlobalProxy.states.set(obj2, state);
    if (ctx.parent) {
      state.parent.value = ctx.parent;
    }
    const proxy = new Proxy(
      obj2,
      {
        get: (target, p, receiver) => {
          const result = Reflect.get(target, p, receiver);
          if (canBeProxied(result)) {
            return create(result, { ...ctx, crumbs: [...ctx.crumbs, p] });
          }
          return result;
        },
        set: (target, p, newValue, receiver) => {
          const oldValue = Reflect.get(target, p);
          if (!compare(oldValue, newValue)) {
            proxyEmit(state, {
              eventType: "UPDATE" /* UPDATE */,
              state,
              snapshot: target
            });
          }
          return Reflect.set(target, p, newValue, receiver);
        },
        deleteProperty: (target, p) => {
          const result = Reflect.deleteProperty(target, p);
          return result;
        }
      }
    );
    GlobalProxy.states.set(proxy, state);
    GlobalProxy.proxies.set(obj2, proxy);
    GlobalProxy.stateToProxy.set(state, proxy);
    GlobalProxy.stateToObject.set(state, obj2);
    return proxy;
  };
  return create(obj, {
    crumbs: []
  });
};
var proxySubscribe = (obj, callback) => {
  const state = GlobalProxy.states.get(obj);
  if (!state) {
    console.warn(`Tried to subscribe to a non registered proxy.`);
    return () => {
    };
  }
  const unsub = state.events.subscribe("UPDATE" /* UPDATE */, (event) => {
    callback(event.snapshot);
  });
  return () => {
    unsub();
  };
};

// src/primitives/proxy.test.ts
(0, import_node_test.it)("Tracks paths", () => {
  const node = {
    id: "root",
    color: "red",
    numbers: [1, 2, 3, 4],
    children: [
      {
        id: "child1",
        color: "green",
        numbers: [42, 88, 0, 3],
        children: []
      }
    ]
  };
  const prox = createProxy(node);
  proxySubscribe(prox, (snap) => {
    console.log(`SNAP`, snap);
  });
  prox.color;
  prox.children[0].color;
  prox.children[0].numbers[2] = 7;
  prox.children[0].color = "purple";
  prox.numbers[2] = 33;
});
