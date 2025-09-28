import { EBeaconEvent } from "../beaconEvent";
import { EventSystem } from "../eventSystem";
export class ProxyMap extends Map {
    constructor() {
        super(...arguments);
        this._events = new EventSystem();
        this._isProxyMap = true;
    }
    _dispose() {
        this._events.clear();
    }
    set(key, value) {
        const old = Map.prototype.get.apply(this, [key]);
        if (old === value)
            return this;
        Map.prototype.set.apply(this, [key, value]);
        this._events.emit({
            eventType: EBeaconEvent.SET_PROP,
            key: key,
            value: value,
            oldValue: old
        });
        return this;
    }
    get(key) {
        const value = Map.prototype.get.apply(this, [key]);
        this._events.emit({
            eventType: EBeaconEvent.GET_PROP,
            key: key,
            value: value
        });
        return value;
    }
    clear() {
        Map.prototype.clear.apply(this);
        this._events.emit({
            eventType: EBeaconEvent.CLEAR
        });
    }
    delete(key) {
        const old = Map.prototype.get.apply(this, [key]);
        const r = Map.prototype.delete.apply(this, [key]);
        if (r === false)
            return r;
        this._events.emit({
            eventType: EBeaconEvent.UNSET_PROP,
            key: key,
            oldValue: old
        });
        return r;
    }
}
export const isProxyMap = (x) => {
    if (typeof x === 'undefined' || x === null)
        return false;
    if (typeof x === 'string' || typeof x === 'number' || typeof x === 'boolean' || typeof x === 'bigint' || typeof x === 'symbol')
        return false;
    return x._isProxyMap === true;
};
