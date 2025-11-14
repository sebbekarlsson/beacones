type FilterUndefined<T> = T extends undefined ? never : T;
type FilterNull<T> = T extends null ? never : T;
type FilterUndefinedAndNull<T> = FilterUndefined<FilterNull<T>>;

export type ExtractFromObject<O extends Record<PropertyKey, unknown>, K> =
  K extends keyof O ? O[K]
  : K extends keyof FilterUndefinedAndNull<O> ?
    FilterUndefinedAndNull<O>[K] | undefined
  : undefined;

type ExtractFromArray<A extends readonly any[], K> =
  any[] extends A ?
    A extends readonly (infer T)[] ?
      T | undefined
    : undefined
  : K extends keyof A ? A[K]
  : undefined;

export type GetWithArray<O, K> =
  K extends [] ? O
  : K extends [infer Key, ...infer Rest] ?
    O extends Record<PropertyKey, unknown> ?
      GetWithArray<ExtractFromObject<O, Key>, Rest>
    : O extends readonly any[] ? GetWithArray<ExtractFromArray<O, Key>, Rest>
    : undefined
  : never;

export type GetPath<T> =
  T extends `${infer Key}.${infer Rest}` ? [Key, ...GetPath<Rest>]
  : T extends `${infer Key}` ? [Key]
  : [];

export type Get<O, K> = GetWithArray<O, GetPath<K>>;

export function pick<O, K extends string>(
  obj: O,
  path: K,
  unwrap?: (value: unknown) => any,
): Get<O, K>;

export function pick(
  obj: Record<string, unknown>,
  path: string,
  unwrap?: (value: unknown) => any,
): unknown {
  if (unwrap) {
    obj = unwrap(obj);
  }
  const keys = path.split(".");

  let currentObj = obj;
  for (const key of keys) {
    const value = currentObj[key];
    if (value === undefined || value === null) {
      return undefined;
    }

    currentObj = value as Record<string, unknown>;
  }

  return currentObj;
}

// TODO: make this more type-safe
export const insert = <T extends Record<PropertyKey, any>>(obj: T, path: string, value: any): T => {
  const copy  = {...obj};
  const keys = path.split(".");

  let next = copy;
  while (keys.length > 0 && !!next) {
    const key = keys[0];
    if (!key) break;

    if (keys.length <= 1) {
      (next as any)[key] = value;
      break;
    }

    keys.splice(0, 1);
    next = next[key];
  }

  return copy;
};
