import { Signal } from "./signal";
type Rec = Record<PropertyKey, any>;
export type WithoutSignals<T> = Exclude<T, undefined> extends Signal<infer K> ? WithoutSignals<K> : Exclude<T, undefined> extends Array<infer K> ? Array<WithoutSignals<K>> : Exclude<T, undefined> extends Rec ? {
    [Prop in keyof T]: WithoutSignals<T[Prop]>;
} : T;
export type WithSignals<T> = Exclude<T, undefined> extends string ? Signal<T> : Exclude<T, undefined> extends number ? Signal<T> : Exclude<T, undefined> extends boolean ? Signal<T> : Exclude<T, undefined> extends bigint ? Signal<T> : Exclude<T, undefined> extends Array<infer K> ? Signal<Array<WithSignals<K>>> : T extends Rec ? Signal<{
    [Prop in keyof T]: WithSignals<T[Prop]>;
}> : Signal<T>;
export type MaybeWithSignals<T> = T | WithSignals<T>;
export type MaybeSignal<T> = T | Signal<T>;
export declare const createNestedSignals: <T>(item: T) => WithSignals<T>;
export declare const unwrapNestedSignals: <T>(item: T, options?: {
    peek?: boolean;
}) => WithoutSignals<T>;
export declare const traverseNestedSignals: <T>(item: T, callback: (sig: Signal<unknown>, crumbs: PropertyKey[]) => void | Promise<void>, options?: {
    peek?: boolean;
}) => void;
export declare const observeNestedSignals: <T>(item: T, callback: (ctx: {
    value: unknown;
    prev?: unknown;
    crumbs: PropertyKey[];
}) => void | Promise<void>) => (() => void);
export declare const reflectNestedSignals: <T extends Record<PropertyKey, any>>(item: T) => Signal<WithoutSignals<T>>;
export {};
