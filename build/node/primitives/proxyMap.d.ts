import { BeaconEventMap } from "../beaconEvent";
import { EventSystem } from "../eventSystem";
export declare class ProxyMap<K extends PropertyKey = PropertyKey, V = any> extends Map<K, V> {
    _events: EventSystem<BeaconEventMap<V>>;
    _isProxyMap: true;
    _dispose(): void;
    set(key: K, value: V): this;
    get(key: K): V | undefined;
    clear(): void;
    delete(key: K): boolean;
}
export declare const isProxyMap: <K extends PropertyKey = PropertyKey, V = any>(x: any) => x is ProxyMap<K, V>;
