import { EventSystem } from "../eventSystem";
import { Reference } from "./reference";
export declare enum EProxyEvent {
    PROP_SET = "PROP_SET",
    PROP_DELETE = "PROP_DELETE",
    UPDATE = "UPDATE"
}
export type ProxyEventMap = {
    [EProxyEvent.PROP_SET]: {
        eventType: EProxyEvent.PROP_SET;
        key: PropertyKey;
        value: unknown;
        oldValue: unknown;
        path: string;
        state: ProxyState;
    };
    [EProxyEvent.PROP_DELETE]: {
        eventType: EProxyEvent.PROP_DELETE;
        key: PropertyKey;
        path: string;
        state: ProxyState;
    };
    [EProxyEvent.UPDATE]: {
        eventType: EProxyEvent.UPDATE;
        snapshot: object;
        state: ProxyState;
    };
};
export type ProxyState = {
    parent: Reference<ProxyState | null>;
    receivers: Set<ProxyState>;
    accessedKeys: Set<PropertyKey>;
    accessedPaths: Set<string>;
    mutatedKeys: Set<PropertyKey>;
    mutatedPaths: Set<string>;
    events: EventSystem<ProxyEventMap>;
};
export declare class GlobalProxy {
    static states: WeakMap<object, ProxyState>;
    static proxies: WeakMap<object, object>;
    static stateToProxy: WeakMap<ProxyState, object>;
    static stateToObject: WeakMap<ProxyState, object>;
}
export declare const createProxy: <T extends object>(obj: T) => T;
export declare const proxySubscribe: <T extends object>(obj: T, callback: (snapshot: T) => void) => (() => void);
