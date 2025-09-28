type Dict<T = any> = Record<PropertyKey, T>;
export type EventSystemEvent<T extends Dict = Dict> = T & {
    eventType: PropertyKey;
};
export type EventSystemEventCallback<T> = (event: T) => any;
export type EventSystemGlobalEventCallback<EventMap extends Record<string, EventSystemEvent>> = <EvType extends keyof EventMap = keyof EventMap>(event: EventMap[EvType]) => any;
export declare class EventSystem<EventMap extends Record<PropertyKey, EventSystemEvent>> {
    slots: Map<PropertyKey, Set<EventSystemEventCallback<EventMap[keyof EventMap]>>>;
    globalListeners: Set<EventSystemGlobalEventCallback<EventMap>>;
    constructor();
    emit<K extends keyof EventMap>(event: EventMap[K]): void;
    emitAsync<K extends keyof EventMap>(event: EventMap[K]): Promise<void>;
    subscribe<K extends keyof EventMap>(eventType: K, callback: EventSystemEventCallback<EventMap[K]>): () => void;
    subscribeAll(callback: EventSystemGlobalEventCallback<EventMap>): () => void;
    clearAllSubscribers(): void;
    clear(): void;
}
export {};
