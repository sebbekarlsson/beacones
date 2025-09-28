export declare enum EBeaconEvent {
    SET_PROP = "SET_PROP",
    GET_PROP = "GET_PROP",
    UNSET_PROP = "UNSET_PROP",
    GET = "GET",
    SET = "SET",
    CLEAR = "CLEAR",
    UPDATE = "UPDATE"
}
export type BeaconEventMap<T = unknown> = {
    [EBeaconEvent.SET_PROP]: {
        eventType: EBeaconEvent.SET_PROP;
        key: PropertyKey;
        oldValue: unknown;
        value: unknown;
    };
    [EBeaconEvent.GET_PROP]: {
        eventType: EBeaconEvent.GET_PROP;
        key: PropertyKey;
        value: unknown;
    };
    [EBeaconEvent.UNSET_PROP]: {
        eventType: EBeaconEvent.UNSET_PROP;
        key: PropertyKey;
        oldValue: unknown;
    };
    [EBeaconEvent.GET]: {
        eventType: EBeaconEvent.GET;
        value: T;
    };
    [EBeaconEvent.SET]: {
        eventType: EBeaconEvent.SET;
        oldValue: T;
        value: T;
    };
    [EBeaconEvent.CLEAR]: {
        eventType: EBeaconEvent.CLEAR;
    };
    [EBeaconEvent.UPDATE]: {
        eventType: EBeaconEvent.UPDATE;
        oldValue: T;
        value: T;
        key?: PropertyKey;
    };
};
