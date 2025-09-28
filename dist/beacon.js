import { isNullish } from "./typeguards";
export const isBeacon = (x) => {
    if (isNullish(x))
        return false;
    if (typeof x !== 'object')
        return false;
    const y = x;
    return y._beacon === true && !isNullish(y._events);
};
