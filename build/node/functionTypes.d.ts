export type Setter<T = any> = (old: T) => T;
export type Computation<T = any> = (old?: T) => T;
export type ValueChangeSubscriptor<T = any> = (value: T, prev?: T) => any;
export type Unsubscribe = () => void;
