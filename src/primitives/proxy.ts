import { compare } from "../compare";
import { EventSystem } from "../eventSystem";
import { reference, Reference } from "./reference";

export enum EProxyEvent {
  PROP_SET = "PROP_SET",
  PROP_DELETE = "PROP_DELETE",
  UPDATE = "UPDATE",
}

export type ProxyEventMap = {
  [EProxyEvent.PROP_SET]: {
    eventType: EProxyEvent.PROP_SET;
    key: PropertyKey;
    value: unknown;
    oldValue: unknown;
    path: string;
    state: ProxyState;
  };
  [EProxyEvent.PROP_DELETE]: {
    eventType: EProxyEvent.PROP_DELETE;
    key: PropertyKey;
    path: string;
    state: ProxyState;
  };
  [EProxyEvent.UPDATE]: {
    eventType: EProxyEvent.UPDATE;
    snapshot: object;
    state: ProxyState;
  };
};

export type ProxyState = {
  parent: Reference<ProxyState | null>;

  receivers: Set<ProxyState>;

  accessedKeys: Set<PropertyKey>;
  accessedPaths: Set<string>;

  mutatedKeys: Set<PropertyKey>;
  mutatedPaths: Set<string>;

  events: EventSystem<ProxyEventMap>;
};

export class GlobalProxy {
  static states: WeakMap<object, ProxyState> = new WeakMap();
  static proxies: WeakMap<object, object> = new WeakMap();
  static stateToProxy: WeakMap<ProxyState, object> = new WeakMap();
  static stateToObject: WeakMap<ProxyState, object> = new WeakMap();
}

const createState = <T extends object>(obj: T): ProxyState => {
  const state: ProxyState = {
    parent: reference(null),

    receivers: new Set(),

    accessedKeys: new Set(),
    accessedPaths: new Set(),

    mutatedKeys: new Set(),
    mutatedPaths: new Set(),

    events: new EventSystem(),
  };

  GlobalProxy.states.set(obj, state);

  return state;
};

const proxyEmit = <K extends keyof ProxyEventMap>(
  state: ProxyState,
  event: ProxyEventMap[K],
) => {
  state.events.emit(event);
};

const isPlainObject = (val: any): val is object => {
  if (val === null || typeof val !== "object") {
    return false;
  }
  const proto = Object.getPrototypeOf(val);
  return proto === Object.prototype || proto === null;
};

const canBeProxied = (x: any): x is object =>
  Array.isArray(x) || isPlainObject(x);

export const createProxy = <T extends object>(obj: T): T => {
  const create = <T extends object>(
    obj: T,
    ctx: {
      crumbs: PropertyKey[];
      parent?: ProxyState;
    },
  ): T => {
    if (!canBeProxied(obj)) return obj;
    
    if (GlobalProxy.proxies.has(obj)) {
      return GlobalProxy.proxies.get(obj)! as T;
    }

    const state = createState(obj);
    GlobalProxy.states.set(obj, state);

    if (ctx.parent) {
      state.parent.value = ctx.parent;
    }

    const proxy = new Proxy<T>(
      obj,
      {
        get: (target, p, receiver) => {
          const result = Reflect.get(target, p, receiver);

          if (canBeProxied(result)) {
            return create(result, {...ctx, crumbs: [...ctx.crumbs, p ]});
          }
          //if (canBeProxied(result) && !GlobalProxy.proxies.has(result)) {
          //  const proxied = create(result, {...ctx, crumbs: [...ctx.crumbs, p], parent: state });
          //  Reflect.set(target, p, proxied);
          //  return proxied;
          //}
          
          return result;
        },
        set: (target, p, newValue, receiver) => {
          //const oldValue = Reflect.get(target, p, receiver);
          //if (compare(oldValue, newValue)) return true;

          //if (canBeProxied(newValue) && !GlobalProxy.proxies.has(newValue)) {
          //  newValue = create(newValue, {...ctx, crumbs: [...ctx.crumbs, p], parent: state });
          //}
          //

          const oldValue = Reflect.get(target, p);
          

          if (!compare(oldValue, newValue)) {
            proxyEmit(state, {
              eventType: EProxyEvent.UPDATE,
              state: state,
              snapshot: target 
            });
          }
          
          
          return Reflect.set(target, p, newValue, receiver);
        },
        deleteProperty: (target, p) => {
          const result = Reflect.deleteProperty(target, p);
          return result;
        },
      },
    );

    GlobalProxy.states.set(proxy, state);
    GlobalProxy.proxies.set(obj, proxy);
    GlobalProxy.stateToProxy.set(state, proxy);
    GlobalProxy.stateToObject.set(state, obj);

    return proxy;
  };

  return create(obj, {
    crumbs: [],
  });
};

export const proxySubscribe = <T extends object>(
  obj: T,
  callback: (snapshot: T) => void,
): (() => void) => {
  const state = GlobalProxy.states.get(obj);
  if (!state) {
    console.warn(`Tried to subscribe to a non registered proxy.`);
    return () => {};
  }

  const unsub = state.events.subscribe(EProxyEvent.UPDATE, (event) => {
    //if (old && JSON.stringify(event.snapshot) === JSON.stringify(old)) return;
    callback(event.snapshot as T);
    //old = JSON.parse(JSON.stringify(event.snapshot));
  });

  return () => {
    unsub();
  };
};
