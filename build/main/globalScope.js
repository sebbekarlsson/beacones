import { BeaconScope } from "./scope";
export class GlobalBeaconScope {
    static pushScope() {
        const scope = new BeaconScope();
        this.stack.push(scope);
        this.current = scope;
        return scope;
    }
    static popScope() {
        if (this.stack.length <= 1)
            return;
        this.stack.pop();
        this.current = this.stack[this.stack.length - 1];
    }
}
GlobalBeaconScope.stack = [];
GlobalBeaconScope.current = new BeaconScope();
