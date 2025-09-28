type Dict<T = any> = Record<PropertyKey, T>;

export type EventSystemEvent<T extends Dict = Dict> = T & {
  eventType: PropertyKey;
};
export type EventSystemEventCallback<T> = (event: T) => any;
export type EventSystemGlobalEventCallback<
  EventMap extends Record<string, EventSystemEvent>,
> = <EvType extends keyof EventMap = keyof EventMap>(
  event: EventMap[EvType],
) => any;

export class EventSystem<EventMap extends Record<PropertyKey, EventSystemEvent>> {
  slots: Map<
    PropertyKey,
    Set<EventSystemEventCallback<EventMap[keyof EventMap]>>
  >;
  globalListeners: Set<EventSystemGlobalEventCallback<EventMap>>;

  constructor() {
    this.globalListeners = new Set();
    this.slots = new Map();
  }

  emit<K extends keyof EventMap>(event: EventMap[K]) {
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

  async emitAsync<K extends keyof EventMap>(event: EventMap[K]) {
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

  subscribe<K extends keyof EventMap>(
    eventType: K,
    callback: EventSystemEventCallback<EventMap[K]>,
  ) {
    const listeners = this.slots.get(eventType);
    if (listeners) {
      listeners.add(callback as unknown as any);
    } else {
      const listeners = new Set<
        EventSystemEventCallback<EventMap[keyof EventMap]>
      >();
      listeners.add(callback as unknown as any);
      this.slots.set(eventType, listeners);
    }

    return () => {
      const listeners = this.slots.get(eventType);
      if (listeners) {
        listeners.delete(callback as unknown as any);
      }
    };
  }

  subscribeAll(callback: EventSystemGlobalEventCallback<EventMap>) {
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
