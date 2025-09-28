import { Beacon, isBeacon } from "../beacon";
import { BeaconEventMap, EBeaconEvent } from "../beaconEvent";
import { compare } from "../compare";
import { EventSystem } from "../eventSystem";
import {
  Computation,
  Setter,
  Unsubscribe,
  ValueChangeSubscriptor,
} from "../functionTypes";
import { GlobalBeaconScope } from "../globalScope";
import { isNullish } from "../typeguards";
import { isProxyMap, ProxyMap } from "./proxyMap";

export type Signal<T = any> = Beacon<T> & {
  _signal: true;
  _init: () => void;
  _trackGet: () => void;
  _assign: (value: T) => void;

  set: (value: T | Setter<T>) => T;
  get: () => T;
  peek: () => T;
  subscribe: (sub: ValueChangeSubscriptor<T>) => Unsubscribe;
};

export type SignalInit<T = any> = Computation<T> | T;

const makeSignal = <T = any>(init: SignalInit<T>): Signal<T> => {
  const events = new EventSystem<BeaconEventMap<T>>();
  const deps = new Set<Beacon>();
  const cleanups = new Set<() => void>();

  let _value!: T;
  let _didUpdate: boolean = false;
  let _compute: Computation<T> | null =
    typeof init === "function" ? (init as Computation<T>) : null;

  const assign = (value: T) => {
    if (value instanceof Map) {
      const old = _value;
      if (isProxyMap(old) && old !== value) {
        old._dispose();
      }
      const proxy = new ProxyMap(value.entries());
      cleanups.add(
        proxy._events.subscribe(EBeaconEvent.SET_PROP, (ev) => {
          events.emit({
            oldValue: old,
            value: _value,
            key: ev.key,
            eventType: EBeaconEvent.UPDATE,
          });
        }),
      );

      cleanups.add(
        proxy._events.subscribe(EBeaconEvent.CLEAR, (_ev) => {
          events.emit({
            oldValue: _value,
            value: _value,
            eventType: EBeaconEvent.UPDATE,
          });
        }),
      );

      cleanups.add(
        proxy._events.subscribe(EBeaconEvent.UNSET_PROP, (ev) => {
          events.emit({
            oldValue: _value,
            value: _value,
            key: ev.key,
            eventType: EBeaconEvent.UPDATE,
          });
        }),
      );

      cleanups.add(
        proxy._events.subscribe(EBeaconEvent.GET, (_ev) => {
          const currentUpdate = GlobalBeaconScope.current.currentUpdate;
          if (currentUpdate && currentUpdate !== sig) {
            currentUpdate._addDependency(sig);
          }
        }),
      );

      _value = proxy as unknown as any as T;
    } else {
      _value = value;
    }
  };

  const initialize = () => {
    if (_compute) {
      update();
    } else {
      assign(init as T);
    }
  };

  const set = (value: T | Setter<T>): T => {
    const oldValue = _value;
    const next =
      typeof value === "function" ? (value as Setter<T>)(oldValue) : value;
    if (_didUpdate && compare(oldValue, next)) return oldValue;

    assign(next);
    events.emit({
      oldValue: oldValue,
      value: next,
      eventType: EBeaconEvent.UPDATE,
    });
    _didUpdate = true;

    return next;
  };

  const trackGet = () => {
    const currentUpdate = GlobalBeaconScope.current.currentUpdate;
    if (currentUpdate && currentUpdate !== this) {
      currentUpdate._addDependency(sig);
    }
  };

  const get = (): T => {
    trackGet();
    return _value;
  };

  const peek = (): T => {
    return _value;
  };

  const update = (): T => {
    if (_compute) {
      return GlobalBeaconScope.current.run(() => {
        const nextValue = _compute!(_value);
        return set(nextValue);
      }, sig);
    }
    return _value;
  };

  const addDependecy = (dep: Beacon) => {
    if (deps.has(dep)) return;
    deps.add(dep);
    if (isSignal(dep)) {
      cleanups.add(
        dep.subscribe(() => {
          update();
        }),
      );
    } else {
      const unsub = dep._events.subscribe(EBeaconEvent.UPDATE, () => {
        update();
      });
      cleanups.add(unsub);
    }
  };

  const subscribe = (sub: ValueChangeSubscriptor<T>): Unsubscribe => {
    const unsub = events.subscribe(EBeaconEvent.UPDATE, (event) => {
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

  const sig: Signal<T> = {
    _beacon: true,
    _signal: true,
    _events: events,
    _deps: deps,
    _dispose: dispose,
    _addDependency: addDependecy,
    _init: initialize,
    _trackGet: trackGet,
    _assign: assign,
    get,
    set,
    peek,
    subscribe,
  };

  return sig;
};

export const signal = <T = any>(init: SignalInit<T>): Signal<T> => {
  const sig = makeSignal<T>(init);
  sig._init();
  return sig;
};

export type CreateSignalInit<T = any> = {
  set: (value: T) => T;
  get: () => T;
};

export const createSignal = <T = any>(init: CreateSignalInit<T>): Signal<T> => {
  const sig = makeSignal<T>(init.get());

  const oldGet = sig.get;
  const oldSet = sig.set;

  sig.get = () => {
    oldGet();
    return init.get();
  };
  
  sig.set = (value) => {
    const x = typeof value === 'function' ? (value as Setter<T>)(sig.peek()) : value;
    return oldSet(init.set(x));
  };

  return sig;
};

export const isSignal = <T>(x: any): x is Signal<T> => {
  if (isNullish(x)) return false;
  if (!isBeacon(x)) return false;
  return (x as any)._signal === true;
};
