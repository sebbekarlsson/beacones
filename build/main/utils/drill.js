import { createSignal, signal } from "../primitives";
import { insert, pick } from "./pick";
export const drill = (initialState) => {
    const state = signal(initialState);
    const cache = new Map();
    const select = (path) => {
        const old = cache.get(path);
        if (old)
            return old;
        const sig = createSignal({
            get: () => pick(state.peek(), path),
            peek: () => pick(state.peek(), path),
            set: (value) => {
                state.set(insert(state.peek(), path, value));
                return value;
            },
        });
        cache.set(path, sig);
        return sig;
    };
    const selectRemapped = (path, remapFunc) => {
        const old = cache.get(path);
        if (old)
            return old;
        const sig = createSignal({
            get: () => remapFunc(pick(state.peek(), path)),
            peek: () => remapFunc(pick(state.peek(), path)),
            set: (value) => {
                const remapped = remapFunc(value);
                state.set(insert(state.peek(), path, remapped));
                return remapped;
            },
        });
        cache.set(path, sig);
        return sig;
    };
    return {
        state,
        select,
        selectRemapped
    };
};
