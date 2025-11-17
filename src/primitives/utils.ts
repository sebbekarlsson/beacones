import { applyPatches, createPatches } from "../utils/patch";
import { isSignal, signal, Signal } from "./signal";

type Rec = Record<PropertyKey | string | number | symbol, any>;



export type WithSignals<T> =
  Exclude<T, undefined> extends string
    ? Signal<T>
    : Exclude<T, undefined> extends number
      ? Signal<T>
      : Exclude<T, undefined> extends boolean
        ? Signal<T>
        : Exclude<T, undefined> extends bigint
          ? Signal<T>
          : Exclude<T, undefined> extends Array<infer K>
            ? Signal<Array<WithSignals<K>>>
            : T extends Rec
              ? Signal<{
                  [Prop in keyof T]: WithSignals<T[Prop]>;
                }>
              : Signal<T>;



export type WithoutSignals<T> =
  T extends Signal<infer U>
    ? WithoutSignals<U>
    : T extends Array<infer K>
      ? Array<WithoutSignals<K>>
    : T extends Rec
      ? { [Prop in keyof T]: WithoutSignals<T[Prop]> }
    : T;


                                                      
export type MaybeWithSignals<T> = T | WithSignals<T>;

export type MaybeSignal<T> = T | Signal<T>;


export const unref = <T, R = T extends Signal<infer K> ? K : T>(x: T, peek: boolean = false): R => {
  if (!isSignal(x)) return x as unknown as R;
    return (peek ? x.peek() : x.get()) as unknown as R;
}


export const createNestedSignals = <T>(item: T): WithSignals<T> => {
  const an = item as any;

  if (
    typeof an === "number" ||
    typeof an === "string" ||
    typeof an === "undefined" ||
    typeof an === "bigint" ||
    typeof an === "boolean" ||
    an === null
  ) {
    return signal(item) as WithSignals<T>;
  }

  if (Array.isArray(an))
    return signal(an.map((it) => createNestedSignals(it))) as WithSignals<T>;

  if (typeof an === "object") {
    return signal(
      Object.assign(
        {},
        ...Object.entries(an).map(([k, v]) => ({
          [k]: createNestedSignals(v),
        })),
      ),
    ) as WithSignals<T>;
  }

  return signal(an) as WithSignals<T>;
};

export const unwrapNestedSignals = <T>(
  item: T,
  options: { peek?: boolean } = {},
): WithoutSignals<T> => {
  const get = (sig: Signal<any>): any => {
    return options.peek ? sig.peek() : sig.get();
  };

  const unwrap = (item: any): any => {
    if (typeof item === "undefined" || item === null) return item;

    if (isSignal(item)) return unwrap(get(item));

    if (Array.isArray(item)) return item.map((it) => unwrap(it));

    if (typeof item === "object") {
      return Object.assign(
        {},
        ...Object.entries(item).map(([k, v]) => ({
          [k]: unwrap(v),
        })),
      );
    }

    return item;
  };

  return unwrap(item) as WithoutSignals<T>;
};

export const traverseNestedSignals = <T>(
  item: T,
  callback: (
    sig: Signal<unknown>,
    crumbs: PropertyKey[],
  ) => void | Promise<void>,
  options: { peek?: boolean } = {},
): void => {
  const get = (sig: Signal<any>): any => {
    return options.peek ? sig.peek() : sig.get();
  };

  const traverse = (item: any, crumbs: PropertyKey[]): void => {
    if (typeof item === "undefined" || item === null) return;

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

const isTraversable = (x: unknown): boolean => x !== null && (typeof x === 'object' || Array.isArray(x));

export const observeNestedSignals = <T>(
  item: T,
  callback: (ctx: {
    value: unknown;
    prev?: unknown;
    crumbs: PropertyKey[];
  }) => void | Promise<void>,
): (() => void) => {
  const cleanups = new Set<() => void>();
  const seen = new WeakSet<any>();

  traverseNestedSignals(item, (sig, crumbs) => {
    const initial = sig.peek();
    if (isTraversable(initial)) {
      seen.add(initial);
    }
    cleanups.add(sig.subscribe((value, prev) => {
      callback({ value, prev, crumbs });
      if (isTraversable(value) && !seen.has(value)) {
        cleanups.add(observeNestedSignals(value,  callback));
        seen.add(value);
      }
    }));
  }, { peek: true });

  return () => {
    cleanups.forEach((fn) => fn());
    cleanups.clear();
  };
};

export const reflectNestedSignals = <T extends Record<PropertyKey, any>>(item: T): Signal<WithoutSignals<T>> => {
  const obj = unwrapNestedSignals(item, { peek: true });
  const sig = signal<WithoutSignals<T>>(obj);

  sig._cleanups.add(observeNestedSignals(item, () => {
    const next = unwrapNestedSignals(item, { peek: true });
    const patches = createPatches(obj as any, next);
    const cur = sig.peek();
    applyPatches(cur as any, patches);
    sig.set(JSON.parse(JSON.stringify(cur)));
  }));

  return sig;
}
