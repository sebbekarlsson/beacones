import { BeaconEventMap, EBeaconEvent } from "../beaconEvent";
import { EventSystem } from "../eventSystem";
import { ValueChangeSubscriptor } from "../functionTypes";

type Rec = Record<PropertyKey, any>;

export type ProxyConfig = {}

export type ProxyState<T extends Rec> = {
  events: EventSystem<BeaconEventMap<T>>;
  emit: <K extends keyof BeaconEventMap<T>>(
    event: BeaconEventMap<T>[K],
  ) => void;
  children: ProxyState<Rec>[];
  parent: { current: ProxyState<Rec> | null };
  setParent: (parent: ProxyState<Rec>) => void;
  config: ProxyConfig;
};


export type ProxyRef<T extends Rec> = {
  proxy: T;
  state: ProxyState<T>;
  _proxy_ref: true;
};

const createProxyState = <T extends Rec>(config: ProxyConfig): ProxyState<T> => {
  let parent: { current: ProxyState<Rec> | null } = { current: null };

  const events = new EventSystem<BeaconEventMap<T>>();

  const emit = <K extends keyof BeaconEventMap<T>>(
    event: BeaconEventMap<T>[K],
  ) => {
    events.emit(event);

    if (parent.current) {
      parent.current.emit(event);
    }
  };

  const setParent = (nextParent: ProxyState<Rec>) => {
    parent.current = nextParent;
  };

  return {
    events: events,
    emit: emit,
    children: [],
    parent: parent,
    setParent: setParent,
    config: config
  };
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


export class GlobalProxy {
  static refs: WeakMap<Rec, ProxyRef<Rec>> = new WeakMap();
}

export const createProxyRef = <T extends Rec>(obj: T, config: ProxyConfig = {}): ProxyRef<T> => {
  const rootState = createProxyState<T>(config);

  const makeProxy = <T extends Rec>(
    obj: T,
    ctx: {
      parent?: ProxyState<Rec>;
      crumbs: PropertyKey[];
      depth: number;
    },
  ): T => {
    const old = GlobalProxy.refs.get(obj);
    
    const state = old?.state || createProxyState<T>(config);

    if (ctx.parent && !ctx.parent.children.includes(state)) {
      ctx.parent.children.push(state);
      state.setParent(ctx.parent);
    }

    const proxy = old?.proxy || new Proxy<T>(obj, {
      get: (target, p, receiver) => {
        const value = Reflect.get(target, p, receiver);

        state.emit({
          eventType: EBeaconEvent.PROXY_GET_PROP,
          crumbs: [...ctx.crumbs, p],
          value: value,
          depth: ctx.depth,
          child: ctx.parent ? ctx.parent.children.indexOf(state) : -1,
        });

        if (canBeProxied(value)) return makeProxy(value, { ...ctx, parent: state, depth: ctx.depth + 1, crumbs: [...ctx.crumbs, p] });

        return value;
      },
      set: (target, p, newValue, receiver) => {
        const oldValue = Reflect.get(target, p, receiver);

        if (oldValue === newValue) {
          return Reflect.set(target, p, oldValue, receiver);
        }

        state.emit({
          eventType: EBeaconEvent.PROXY_SET_PROP,
          crumbs: [...ctx.crumbs, p],
          oldValue: oldValue,
          value: newValue,
          depth: ctx.depth,
          child: ctx.parent ? ctx.parent.children.indexOf(state) : -1,
        });

        return Reflect.set(
          target,
          p,
          canBeProxied(newValue)
            ? makeProxy(newValue, {
                parent: state,
                depth: ctx.depth + 1,
                crumbs: [...ctx.crumbs, p],
              })
            : newValue,
          receiver,
        );
      },
      deleteProperty: (target, p) => {
        if (Reflect.has(target, p)) {
          state.emit({
            eventType: EBeaconEvent.PROXY_UNSET_PROP,
            crumbs: [...ctx.crumbs, p],
            oldValue: Reflect.get(target, p),
            depth: ctx.depth,
            child: ctx.parent ? ctx.parent.children.indexOf(state) : -1,
          });
          return Reflect.deleteProperty(target, p);
        }
        return false;
      },
    });

    if (!old) {
      const ref: ProxyRef<Rec> = { proxy, state, _proxy_ref: true };
      GlobalProxy.refs.set(obj, ref);
      GlobalProxy.refs.set(proxy, ref);
    }

    return proxy;
  };

  const proxy = makeProxy(obj, { parent: rootState, depth: 0, crumbs: [] });

  const ref: ProxyRef<T> = {
    proxy: proxy,
    state: rootState,
    _proxy_ref: true
  }

  GlobalProxy.refs.set(obj, ref);
  GlobalProxy.refs.set(proxy, ref);
  
  return ref;
};


export const proxySubscribe = <T extends Rec>(obj: T, fn: ValueChangeSubscriptor<T[keyof T]>): (() => void) => {
  const ref = GlobalProxy.refs.get(obj);
  if (!ref) {
    console.warn(`Tried to subscribe to something that was not a proxy.`);
    return () => {};
  }

  const cleanups = new Set<() => void>();

  cleanups.add(ref.state.events.subscribe(EBeaconEvent.PROXY_SET_PROP, (ev) => {
    fn(ev.value as any, ev.oldValue as any);
  }));

  cleanups.add(ref.state.events.subscribe(EBeaconEvent.PROXY_UNSET_PROP, (ev) => {
    fn(undefined as any, ev.oldValue as any);
  }));


  return () => {
    cleanups.forEach((clean) => clean());
    cleanups.clear();
  }
}
