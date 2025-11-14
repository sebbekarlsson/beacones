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
    return {
        state,
        select,
    };
};
