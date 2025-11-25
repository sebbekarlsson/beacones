import { Beacon } from "./beacon";
export declare class BeaconScope {
    currentUpdate: Beacon | null;
    run<T>(fn: () => T, caller: Beacon): T;
}
