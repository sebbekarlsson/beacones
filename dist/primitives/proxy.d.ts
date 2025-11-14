import { BeaconEventMap } from "../beaconEvent";
import { EventSystem } from "../eventSystem";
import { ValueChangeSubscriptor } from "../functionTypes";
type Rec = Record<PropertyKey, any>;
export type ProxyConfig = {};
export type ProxyState<T extends Rec> = {
    events: EventSystem<BeaconEventMap<T>>;
    emit: <K extends keyof BeaconEventMap<T>>(event: BeaconEventMap<T>[K]) => void;
    children: ProxyState<Rec>[];
    parent: {
        current: ProxyState<Rec> | null;
    };
    setParent: (parent: ProxyState<Rec>) => void;
    config: ProxyConfig;
};
export type ProxyRef<T extends Rec> = {
    proxy: T;
    state: ProxyState<T>;
    _proxy_ref: true;
};
export declare class GlobalProxy {
    static refs: WeakMap<Rec, ProxyRef<Rec>>;
}
export declare const createProxyRef: <T extends Rec>(obj: T, config?: ProxyConfig) => ProxyRef<T>;
export declare const proxySubscribe: <T extends Rec>(obj: T, fn: ValueChangeSubscriptor<T[keyof T]>) => (() => void);
export {};
