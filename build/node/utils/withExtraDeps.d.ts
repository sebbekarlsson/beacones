import { Beacon } from "../beacon";
import { Signal } from "../primitives";
export declare const withExtraDeps: <S extends Signal<any>>(sig: S, deps: Beacon<any>[]) => S;
