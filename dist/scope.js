export class BeaconScope {
    constructor() {
        this.currentUpdate = null;
    }
    run(fn, caller) {
        const parent = this.currentUpdate;
        this.currentUpdate = caller;
        const r = fn();
        this.currentUpdate = parent;
        return r;
    }
}
