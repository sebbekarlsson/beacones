import { Beacon } from "./beacon";


export class BeaconScope {
  currentUpdate: Beacon | null = null;

  run<T>(fn: () => T, caller: Beacon): T {
    const parent = this.currentUpdate;
    this.currentUpdate = caller;
    const r = fn();
    this.currentUpdate = parent;
    return r;
  }
}
