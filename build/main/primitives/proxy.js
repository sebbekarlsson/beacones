import { compare } from "../compare";
import { EventSystem } from "../eventSystem";
import { reference } from "./reference";
export var EProxyEvent;
(function (EProxyEvent) {
    EProxyEvent["PROP_SET"] = "PROP_SET";
    EProxyEvent["PROP_DELETE"] = "PROP_DELETE";
    EProxyEvent["UPDATE"] = "UPDATE";
})(EProxyEvent || (EProxyEvent = {}));
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
        events: new EventSystem(),
    };
    GlobalProxy.states.set(obj, state);
    return state;
};
const proxyEmit = (state, event) => {
    state.events.emit(event);
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
        if (!canBeProxied(obj))
            return obj;
        if (GlobalProxy.proxies.has(obj)) {
            return GlobalProxy.proxies.get(obj);
        }
        const state = createState(obj);
        GlobalProxy.states.set(obj, state);
        if (ctx.parent) {
            state.parent.value = ctx.parent;
        }
        const proxy = new Proxy(obj, {
            get: (target, p, receiver) => {
                const result = Reflect.get(target, p, receiver);
                if (canBeProxied(result)) {
                    return create(result, { ...ctx, crumbs: [...ctx.crumbs, p] });
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
        //if (old && JSON.stringify(event.snapshot) === JSON.stringify(old)) return;
        callback(event.snapshot);
        //old = JSON.parse(JSON.stringify(event.snapshot));
    });
    return () => {
        unsub();
    };
};
