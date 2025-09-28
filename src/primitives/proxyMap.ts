import { BeaconEventMap, EBeaconEvent } from "../beaconEvent";
import { EventSystem } from "../eventSystem";

export class ProxyMap<K extends PropertyKey = PropertyKey, V = any> extends Map<K, V> {
  _events = new EventSystem<BeaconEventMap<V>>();
  _isProxyMap: true = true;

  _dispose() {
    this._events.clear();
  }
  
  set(key: K, value: V): this {
    const old = Map.prototype.get.apply(this, [key]);
    if (old === value) return this;

    Map.prototype.set.apply(this, [key, value]);
    
    this._events.emit({
      eventType: EBeaconEvent.SET_PROP,
      key: key,
      value: value,
      oldValue: old
    });
    
    return this;
  }

  get(key: K): V | undefined {
    const value = Map.prototype.get.apply(this, [key]);
    this._events.emit({
      eventType: EBeaconEvent.GET_PROP,
      key: key,
      value: value
    });
    return value;
  }

  clear(): void {
    Map.prototype.clear.apply(this);
    this._events.emit({
      eventType: EBeaconEvent.CLEAR
    });
  }

  delete(key: K): boolean {
    const old = Map.prototype.get.apply(this, [key]);
    const r = Map.prototype.delete.apply(this, [key]);
    if (r === false) return r;
    
    this._events.emit({
      eventType: EBeaconEvent.UNSET_PROP,
      key: key,
      oldValue: old
    });
    
    return r;
  }
}

export const isProxyMap = <K extends PropertyKey = PropertyKey, V = any>(x: any): x is ProxyMap<K, V> => {
  if (typeof x === 'undefined' || x === null) return false;
  if (typeof x === 'string' || typeof x === 'number' || typeof x === 'boolean' || typeof x === 'bigint' || typeof x === 'symbol') return false;
  return x._isProxyMap === true;
}
