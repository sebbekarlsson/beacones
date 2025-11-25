const isObject = (x) => typeof x === "object" && x !== null;
const isPatchable = (x) => isObject(x) || Array.isArray(x);
const compare = (a, b) => a === b;
export const createPatches = (old, next, isEqual = compare) => {
    const create = (old, next, crumbs) => {
        const patches = [];
        if (isPatchable(old) && isPatchable(next)) {
            const oldKeys = Object.keys(old);
            const nextKeys = Object.keys(next);
            for (const oldKey of oldKeys) {
                if (!nextKeys.includes(oldKey)) {
                    patches.push({ type: "delete", crumbs: [...crumbs, oldKey] });
                    continue;
                }
            }
            for (const nextKey of nextKeys) {
                if (!oldKeys.includes(nextKey)) {
                    patches.push({
                        type: "set",
                        value: next[nextKey],
                        crumbs: [...crumbs, nextKey],
                    });
                }
                else {
                    patches.push(...create(old[nextKey], next[nextKey], [...crumbs, nextKey]));
                }
            }
        }
        else {
            if (!isEqual(old, next)) {
                patches.push({ type: "replace", value: next, crumbs: [...crumbs] });
            }
        }
        return patches;
    };
    return create(old, next, []);
};
export const applyPatches = (old, patches) => {
    const findParent = (obj, crumbs) => {
        if (crumbs.length === 0)
            return null;
        let parent = obj;
        for (let i = 0; i < crumbs.length - 1; i++) {
            const crumb = crumbs[i];
            if (!isPatchable(parent[crumb])) {
                return null;
            }
            parent = parent[crumb];
        }
        const key = crumbs[crumbs.length - 1];
        return { parent, key };
    };
    const assign = (obj, crumbs, value) => {
        const target = findParent(obj, crumbs);
        if (target) {
            target.parent[target.key] = value;
        }
    };
    const remove = (obj, crumbs) => {
        const target = findParent(obj, crumbs);
        if (target) {
            if (Array.isArray(target.parent)) {
                const index = parseInt(target.key, 10);
                if (!isNaN(index) && String(target.key) === String(index)) {
                    target.parent.splice(index, 1);
                }
                else {
                    delete target.parent[target.key];
                }
            }
            else {
                delete target.parent[target.key];
            }
        }
    };
    for (const patch of patches) {
        switch (patch.type) {
            case "replace":
                assign(old, patch.crumbs, patch.value);
                break;
            case "set":
                assign(old, patch.crumbs, patch.value);
                break;
            case "delete":
                remove(old, patch.crumbs);
                break;
        }
    }
};
