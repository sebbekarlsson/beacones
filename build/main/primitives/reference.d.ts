export type Reference<T> = {
    value: T;
};
export declare const reference: <T>(value: T) => Reference<T>;
