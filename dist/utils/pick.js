export function pick(obj, path, unwrap) {
    if (unwrap) {
        obj = unwrap(obj);
    }
    const keys = path.split(".");
    let currentObj = obj;
    for (const key of keys) {
        const value = currentObj[key];
        if (value === undefined || value === null) {
            return undefined;
        }
        currentObj = value;
    }
    return currentObj;
}
// TODO: make this more type-safe
export const insert = (obj, path, value) => {
    const copy = { ...obj };
    const keys = path.split(".");
    let next = copy;
    while (keys.length > 0 && !!next) {
        const key = keys[0];
        if (!key)
            break;
        if (keys.length <= 1) {
            next[key] = value;
            break;
        }
        keys.splice(0, 1);
        next = next[key];
    }
    return copy;
};
