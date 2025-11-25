import { BeaconEventMap } from "./beaconEvent";
import { EventSystem } from "./eventSystem";
export type Beacon<T = any> = {
    _beacon: true;
    _deps: Set<Beacon<any>>;
    _events: EventSystem<BeaconEventMap<T>>;
    _addDependency: (dep: Beacon<any>) => void;
    _dispose: () => void;
};
export declare const isBeacon: <T = unknown>(x: unknown) => x is Beacon<T>;
