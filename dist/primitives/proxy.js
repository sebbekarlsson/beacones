import { EBeaconEvent } from "../beaconEvent";
import { EventSystem } from "../eventSystem";
const createProxyState = (config) => {
    let parent = { current: null };
    const events = new EventSystem();
    const emit = (event) => {
        events.emit(event);
        if (parent.current) {
            parent.current.emit(event);
        }
    };
    const setParent = (nextParent) => {
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
const isPlainObject = (val) => {
    if (val === null || typeof val !== "object") {
        return false;
    }
    const proto = Object.getPrototypeOf(val);
    return proto === Object.prototype || proto === null;
};
const canBeProxied = (x) => Array.isArray(x) || isPlainObject(x);
export class GlobalProxy {
}
GlobalProxy.refs = new WeakMap();
export const createProxyRef = (obj, config = {}) => {
    const rootState = createProxyState(config);
    const makeProxy = (obj, ctx) => {
        const old = GlobalProxy.refs.get(obj);
        const state = old?.state || createProxyState(config);
        if (ctx.parent && !ctx.parent.children.includes(state)) {
            ctx.parent.children.push(state);
            state.setParent(ctx.parent);
        }
        const proxy = old?.proxy || new Proxy(obj, {
            get: (target, p, receiver) => {
                const value = Reflect.get(target, p, receiver);
                state.emit({
                    eventType: EBeaconEvent.PROXY_GET_PROP,
                    crumbs: [...ctx.crumbs, p],
                    value: value,
                    depth: ctx.depth,
                    child: ctx.parent ? ctx.parent.children.indexOf(state) : -1,
                });
                if (canBeProxied(value))
                    return makeProxy(value, { ...ctx, parent: state, depth: ctx.depth + 1, crumbs: [...ctx.crumbs, p] });
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
                return Reflect.set(target, p, canBeProxied(newValue)
                    ? makeProxy(newValue, {
                        parent: state,
                        depth: ctx.depth + 1,
                        crumbs: [...ctx.crumbs, p],
                    })
                    : newValue, receiver);
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
            const ref = { proxy, state, _proxy_ref: true };
            GlobalProxy.refs.set(obj, ref);
            GlobalProxy.refs.set(proxy, ref);
        }
        return proxy;
    };
    const proxy = makeProxy(obj, { parent: rootState, depth: 0, crumbs: [] });
    const ref = {
        proxy: proxy,
        state: rootState,
        _proxy_ref: true
    };
    GlobalProxy.refs.set(obj, ref);
    GlobalProxy.refs.set(proxy, ref);
    return ref;
};
export const proxySubscribe = (obj, fn) => {
    const ref = GlobalProxy.refs.get(obj);
    if (!ref) {
        console.warn(`Tried to subscribe to something that was not a proxy.`);
        return () => { };
    }
    const cleanups = new Set();
    cleanups.add(ref.state.events.subscribe(EBeaconEvent.PROXY_SET_PROP, (ev) => {
        fn(ev.value, ev.oldValue);
    }));
    cleanups.add(ref.state.events.subscribe(EBeaconEvent.PROXY_UNSET_PROP, (ev) => {
        fn(undefined, ev.oldValue);
    }));
    return () => {
        cleanups.forEach((clean) => clean());
        cleanups.clear();
    };
};
