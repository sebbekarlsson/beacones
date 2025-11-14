export type Patch =
  | {
      type: "set";
      crumbs: PropertyKey[];
      value: unknown;
    }
  | {
      type: "replace";
      crumbs: PropertyKey[];
      value: unknown;
    }
  | {
      type: "delete";
      crumbs: PropertyKey[];
    };

type Rec = Record<PropertyKey, any>;

const isObject = (x: any): x is Rec => typeof x === "object" && x !== null;

const isPatchable = (x: any): x is Rec => isObject(x) || Array.isArray(x);

type CompareFunction = (a: unknown, b: unknown) => boolean;

const compare = (a: unknown, b: unknown) => a === b;

export const createPatches = <T extends Rec>(
  old: T,
  next: T,
  isEqual: CompareFunction = compare,
): Patch[] => {
  const create = <T>(old: T, next: T, crumbs: PropertyKey[]): Patch[] => {
    const patches: Patch[] = [];

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
        } else {
          patches.push(
            ...create(old[nextKey], next[nextKey], [...crumbs, nextKey]),
          );
        }
      }
    } else {
      if (!isEqual(old, next)) {
        patches.push({ type: "replace", value: next, crumbs: [...crumbs] });
      }
    }

    return patches;
  };

  return create(old, next, []);
};

export const applyPatches = <T extends Rec>(old: T, patches: Patch[]): void => {
  const findParent = (
    obj: Rec,
    crumbs: PropertyKey[],
  ): { parent: any; key: PropertyKey } | null => {
    if (crumbs.length === 0) return null;

    let parent: any = obj;
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

  const assign = (obj: T, crumbs: PropertyKey[], value: any) => {
    const target = findParent(obj, crumbs);
    if (target) {
      target.parent[target.key] = value;
    }
  };

  const remove = (obj: T, crumbs: PropertyKey[]) => {
    const target = findParent(obj, crumbs);
    if (target) {
      if (Array.isArray(target.parent)) {
        const index = parseInt(target.key as string, 10);
        if (!isNaN(index) && String(target.key) === String(index)) {
          target.parent.splice(index, 1);
        } else {
          delete (target.parent as any)[target.key as any];
        }
      } else {
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
