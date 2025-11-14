import { applyPatches, createPatches } from "../utils/patch";
import { isSignal, signal } from "./signal";
export const createNestedSignals = (item) => {
    const an = item;
    if (typeof an === "number" ||
        typeof an === "string" ||
        typeof an === "undefined" ||
        typeof an === "bigint" ||
        typeof an === "boolean" ||
        an === null) {
        return signal(item);
    }
    if (Array.isArray(an))
        return signal(an.map((it) => createNestedSignals(it)));
    if (typeof an === "object") {
        return signal(Object.assign({}, ...Object.entries(an).map(([k, v]) => ({
            [k]: createNestedSignals(v),
        }))));
    }
    return signal(an);
};
export const unwrapNestedSignals = (item, options = {}) => {
    const get = (sig) => {
        return options.peek ? sig.peek() : sig.get();
    };
    const unwrap = (item) => {
        if (typeof item === "undefined" || item === null)
            return item;
        if (isSignal(item))
            return unwrap(get(item));
        if (Array.isArray(item))
            return item.map((it) => unwrap(it));
        if (typeof item === "object") {
            return Object.assign({}, ...Object.entries(item).map(([k, v]) => ({
                [k]: unwrap(v),
            })));
        }
        return item;
    };
    return unwrap(item);
};
export const traverseNestedSignals = (item, callback, options = {}) => {
    const get = (sig) => {
        return options.peek ? sig.peek() : sig.get();
    };
    const traverse = (item, crumbs) => {
        if (typeof item === "undefined" || item === null)
            return;
        if (isSignal(item)) {
            callback(item, crumbs);
            traverse(get(item), crumbs);
            return;
        }
        if (Array.isArray(item)) {
            item.forEach((it, i) => traverse(it, [...crumbs, i]));
            return;
        }
        if (typeof item === "object") {
            Object.entries(item).forEach(([k, v]) => traverse(v, [...crumbs, k]));
            return;
        }
    };
    return traverse(item, []);
};
export const observeNestedSignals = (item, callback) => {
    const cleanups = new Set();
    traverseNestedSignals(item, (sig, crumbs) => {
        cleanups.add(sig.subscribe((value, prev) => {
            callback({ value, prev, crumbs });
        }));
    }, { peek: true });
    return () => {
        cleanups.forEach((fn) => fn());
        cleanups.clear();
    };
};
export const reflectNestedSignals = (item) => {
    const obj = unwrapNestedSignals(item, { peek: true });
    const sig = signal(obj);
    sig._cleanups.add(observeNestedSignals(item, () => {
        const next = unwrapNestedSignals(item, { peek: true });
        const patches = createPatches(obj, next);
        const cur = sig.peek();
        applyPatches(cur, patches);
        sig.set(JSON.parse(JSON.stringify(cur)));
    }));
    return sig;
};
