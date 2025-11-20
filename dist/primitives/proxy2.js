import { compare } from "../compare";
import { EventSystem } from "../eventSystem";
import { reference } from "./reference";
const createSnapshot = (originalState, obj) => createProxy(JSON.parse(JSON.stringify(obj)));
export var EProxyEvent;
(function (EProxyEvent) {
    EProxyEvent["PROP_SET"] = "PROP_SET";
    EProxyEvent["PROP_DELETE"] = "PROP_DELETE";
    EProxyEvent["UPDATE"] = "UPDATE";
})(EProxyEvent || (EProxyEvent = {}));
;
export class GlobalProxy {
}
GlobalProxy.states = new WeakMap();
GlobalProxy.proxies = new WeakMap();
GlobalProxy.stateToProxy = new WeakMap();
GlobalProxy.stateToObject = new WeakMap();
const createState = (obj) => {
    const state = {
        parent: reference(null),
        receivers: new Set(),
        accessedKeys: new Set(),
        accessedPaths: new Set(),
        mutatedKeys: new Set(),
        mutatedPaths: new Set(),
        events: new EventSystem()
    };
    GlobalProxy.states.set(obj, state);
    return state;
};
const proxyEmit = (state, event) => {
    state.events.emit(event);
    const parent = state.parent.value;
    if (parent) {
        if (event.eventType === EProxyEvent.UPDATE) {
            const prox = GlobalProxy.stateToProxy.get(parent);
            if (prox) {
                proxyEmit(parent, { ...event, snapshot: createSnapshot(parent, prox) });
            }
        }
    }
};
const isPlainObject = (val) => {
    if (val === null || typeof val !== "object") {
        return false;
    }
    const proto = Object.getPrototypeOf(val);
    return proto === Object.prototype || proto === null;
};
const canBeProxied = (x) => Array.isArray(x) || isPlainObject(x);
export const createProxy = (obj) => {
    const create = (obj, ctx) => {
        if (GlobalProxy.proxies.has(obj)) {
            return GlobalProxy.proxies.get(obj);
        }
        const state = createState(obj);
        if (ctx.parent) {
            state.parent.value = ctx.parent;
        }
        const proxy = new Proxy(obj, {
            get: (target, p, receiver) => {
                state.accessedKeys.add(p);
                const rec = GlobalProxy.states.get(receiver);
                if (rec && rec !== state) {
                    state.receivers.add(rec);
                    rec.accessedPaths.add([...ctx.crumbs, p].join('.'));
                }
                const value = Reflect.get(target, p, receiver);
                if (canBeProxied(value) && !GlobalProxy.states.has(value)) {
                    const proxied = create(value, {
                        crumbs: [...ctx.crumbs, p],
                        parent: state
                    });
                    Reflect.set(target, p, proxied);
                    return proxied;
                }
                return value;
            },
            set: (target, p, newValue, receiver) => {
                const oldValue = Reflect.get(target, p, receiver);
                if (compare(oldValue, newValue))
                    return true;
                const result = Reflect.set(target, p, canBeProxied(newValue)
                    ? create(newValue, {
                        crumbs: [...ctx.crumbs, p],
                        parent: state
                    })
                    : newValue, receiver);
                state.mutatedKeys.add(p);
                const rec = GlobalProxy.states.get(receiver);
                if (rec) {
                    rec.mutatedPaths.add([...ctx.crumbs, p].join('.'));
                }
                proxyEmit(state, { eventType: EProxyEvent.PROP_SET, key: p, path: [...ctx.crumbs, p].join('.'), value: newValue, oldValue: oldValue, state: state });
                proxyEmit(state, {
                    eventType: EProxyEvent.UPDATE,
                    state: state,
                    snapshot: createSnapshot(state, target)
                });
                state.receivers.forEach((rec) => {
                    const prox = GlobalProxy.stateToProxy.get(rec);
                    if (prox) {
                        proxyEmit(rec, {
                            eventType: EProxyEvent.UPDATE,
                            state: state,
                            snapshot: createSnapshot(rec, prox)
                        });
                    }
                });
                return result;
            },
            deleteProperty: (target, p) => {
                if (Reflect.has(target, p)) {
                    const deleted = Reflect.get(target, p);
                    if (deleted && deleted !== null && typeof deleted === 'object') {
                        const rec = GlobalProxy.states.get(deleted);
                        if (rec && state.receivers.has(rec)) {
                            state.receivers.delete(rec);
                        }
                    }
                    const result = Reflect.deleteProperty(target, p);
                    state.mutatedKeys.add(p);
                    state.events.emit({ eventType: EProxyEvent.PROP_DELETE, key: p, path: ctx.crumbs.join('.'), state: state, });
                    proxyEmit(state, {
                        eventType: EProxyEvent.UPDATE,
                        state: state,
                        snapshot: createSnapshot(state, target)
                    });
                    return result;
                }
                return false;
            },
        });
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
export const proxySubscribe = (obj, callback) => {
    const state = GlobalProxy.states.get(obj);
    if (!state) {
        console.warn(`Tried to subscribe to a non registered proxy.`);
        return () => { };
    }
    const unsub = state.events.subscribe(EProxyEvent.UPDATE, (event) => {
        callback(event.snapshot);
    });
    return () => {
        unsub();
    };
};
