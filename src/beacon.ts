import { BeaconEventMap } from "./beaconEvent";
import { EventSystem } from "./eventSystem";
import { isNullish } from "./typeguards";

export type Beacon<T = any> = {
  _beacon: true;
  _deps: Set<Beacon<any>>;
  _events: EventSystem<BeaconEventMap<T>>;
  _addDependency: (dep: Beacon<any>) => void;
  _dispose: () => void;
}

export const isBeacon = <T = unknown>(x: unknown): x is Beacon<T> => {
  if (isNullish(x)) return false;
  if (typeof x !== 'object') return false;
  const y = x as any;
  return y._beacon === true && !isNullish(y._events);
}
