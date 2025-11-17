import { createSignal, signal, Signal } from "../primitives";
import { Get, insert, pick } from "./pick";


type Dict = Record<PropertyKey, any>;

export type Drill<T extends Dict> = {
  state: Signal<T>;
  select: <Path extends string>(path: Path) => Signal<Get<T, Path>>;
  selectRemapped: <Path extends string, RemapFn extends (value: any) => any>(
    path: Path,
    remapFunc: RemapFn 
  ) => Signal<ReturnType<RemapFn>>;
};

export const drill = <T extends Dict>(
  initialState: T,
): Drill<T> => {
  const state = signal<T>(initialState);

  const cache = new Map<string, Signal<any>>();

  const select = <Path extends string>(path: Path): Signal<Get<T, Path>> => {
    const old = cache.get(path);
    if (old) return old;
    const sig = createSignal<Get<T, Path>>({
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

  const selectRemapped = <Path extends string, RemapFn extends (value: any) => any>(
    path: Path,
    remapFunc: RemapFn 
  ): Signal<ReturnType<RemapFn>> => {
    const old = cache.get(path);
    if (old) return old;
    const sig = createSignal<ReturnType<RemapFn>>({
      get: () => remapFunc(pick(state.peek(), path)) as ReturnType<RemapFn>,
      peek: () => remapFunc(pick(state.peek(), path)) as ReturnType<RemapFn>, 
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
