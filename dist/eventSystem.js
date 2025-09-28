export class EventSystem {
    constructor() {
        this.globalListeners = new Set();
        this.slots = new Map();
    }
    emit(event) {
        this.globalListeners.forEach((fn) => {
            fn(event);
        });
        const listeners = this.slots.get(event.eventType);
        if (listeners) {
            listeners.forEach((fn) => {
                fn(event);
            });
        }
    }
    async emitAsync(event) {
        for (const fn of this.globalListeners) {
            await fn(event);
        }
        const listeners = this.slots.get(event.eventType);
        if (listeners) {
            for (const fn of listeners) {
                await fn(event);
            }
        }
    }
    subscribe(eventType, callback) {
        const listeners = this.slots.get(eventType);
        if (listeners) {
            listeners.add(callback);
        }
        else {
            const listeners = new Set();
            listeners.add(callback);
            this.slots.set(eventType, listeners);
        }
        return () => {
            const listeners = this.slots.get(eventType);
            if (listeners) {
                listeners.delete(callback);
            }
        };
    }
    subscribeAll(callback) {
        this.globalListeners.add(callback);
        return () => {
            this.globalListeners.delete(callback);
        };
    }
    clearAllSubscribers() {
        this.slots.clear();
    }
    clear() {
        this.globalListeners.clear();
        this.slots.clear();
    }
}
