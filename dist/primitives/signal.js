import { isBeacon } from "../beacon";
import { EBeaconEvent } from "../beaconEvent";
import { compare } from "../compare";
import { EventSystem } from "../eventSystem";
import { GlobalBeaconScope } from "../globalScope";
import { isNullish } from "../typeguards";
import { isProxyMap, ProxyMap } from "./proxyMap";
const makeSignal = (init) => {
    const events = new EventSystem();
    const deps = new Set();
    const cleanups = new Set();
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
            cleanups.add(proxy._events.subscribe(EBeaconEvent.SET_PROP, (ev) => {
                events.emit({
                    oldValue: old,
                    value: _value,
                    key: ev.key,
                    eventType: EBeaconEvent.UPDATE,
                });
            }));
            cleanups.add(proxy._events.subscribe(EBeaconEvent.CLEAR, (_ev) => {
                events.emit({
                    oldValue: _value,
                    value: _value,
                    eventType: EBeaconEvent.UPDATE,
                });
            }));
            cleanups.add(proxy._events.subscribe(EBeaconEvent.UNSET_PROP, (ev) => {
                events.emit({
                    oldValue: _value,
                    value: _value,
                    key: ev.key,
                    eventType: EBeaconEvent.UPDATE,
                });
            }));
            cleanups.add(proxy._events.subscribe(EBeaconEvent.GET, (_ev) => {
                const currentUpdate = GlobalBeaconScope.current.currentUpdate;
                if (currentUpdate && currentUpdate !== sig) {
                    currentUpdate._addDependency(sig);
                }
            }));
            setValue(proxy);
        }
        else {
            setValue(value);
        }
    };
    const initialize = () => {
        if (_compute) {
            update();
        }
        else {
            assign(init);
        }
    };
    const set = (value) => {
        const oldValue = _value;
        const next = typeof value === "function" ? value(oldValue) : value;
        if (_didUpdate && compare(oldValue, next))
            return oldValue;
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
        if (deps.has(dep))
            return;
        deps.add(dep);
        if (isSignal(dep)) {
            cleanups.add(dep.subscribe(() => {
                update();
            }));
        }
        else {
            const unsub = dep._events.subscribe(EBeaconEvent.UPDATE, () => {
                update();
            });
            cleanups.add(unsub);
        }
    };
    const subscribe = (sub) => {
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
        _current: _current,
        get,
        set,
        peek,
        subscribe,
    };
    return sig;
};
export const signal = (init) => {
    const sig = makeSignal(init);
    sig._init();
    return sig;
};
export const createSignal = (init) => {
    const sig = makeSignal(init.get());
    const oldGet = sig.get;
    const oldSet = sig.set;
    sig.get = () => {
        oldGet();
        return init.get();
    };
    sig.set = (value) => {
        const x = typeof value === 'function' ? value(init.peek ? init.peek() : sig.peek()) : value;
        return oldSet(init.set(x));
    };
    sig.peek = init.peek || sig.peek;
    return sig;
};
export const isSignal = (x) => {
    if (isNullish(x))
        return false;
    if (!isBeacon(x))
        return false;
    return x._signal === true;
};
