import { BeaconScope } from "./scope";
export declare class GlobalBeaconScope {
    static stack: Array<BeaconScope>;
    static current: BeaconScope;
    static pushScope(): BeaconScope;
    static popScope(): void;
}
