import { Signal } from "../primitives";
import { Get } from "./pick";
type Dict = Record<PropertyKey, any>;
export type Drill<T extends Dict> = {
    state: Signal<T>;
    select: <Path extends string>(path: Path) => Signal<Get<T, Path>>;
    selectRemapped: <Path extends string, RemapFn extends (value: any) => any>(path: Path, remapFunc: RemapFn) => Signal<ReturnType<RemapFn>>;
};
export declare const drill: <T extends Dict>(initialState: T) => Drill<T>;
export {};
