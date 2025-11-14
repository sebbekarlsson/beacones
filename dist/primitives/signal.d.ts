import { Beacon } from "../beacon";
import { Computation, Setter, Unsubscribe, ValueChangeSubscriptor } from "../functionTypes";
export type Signal<T = any> = Beacon<T> & {
    _signal: true;
    _init: () => void;
    _trackGet: () => void;
    _assign: (value: T) => void;
    _cleanups: Set<() => void>;
    _current: {
        value: T | null;
    };
    set: (value: T | Setter<T>) => T;
    get: () => T;
    peek: () => T;
    subscribe: (sub: ValueChangeSubscriptor<T>) => Unsubscribe;
};
export type SignalInit<T = any> = Computation<T> | T;
export declare const signal: <T = any>(init: SignalInit<T>) => Signal<T>;
export type CreateSignalInit<T = any> = {
    set: (value: T) => T;
    get: () => T;
    peek?: () => T;
};
export declare const createSignal: <T = any>(init: CreateSignalInit<T>) => Signal<T>;
export declare const isSignal: <T>(x: any) => x is Signal<T>;
