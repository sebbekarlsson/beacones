export type Patch = {
    type: "set";
    crumbs: PropertyKey[];
    value: unknown;
} | {
    type: "replace";
    crumbs: PropertyKey[];
    value: unknown;
} | {
    type: "delete";
    crumbs: PropertyKey[];
};
type Rec = Record<PropertyKey, any>;
type CompareFunction = (a: unknown, b: unknown) => boolean;
export declare const createPatches: <T extends Rec>(old: T, next: T, isEqual?: CompareFunction) => Patch[];
export declare const applyPatches: <T extends Rec>(old: T, patches: Patch[]) => void;
export {};
