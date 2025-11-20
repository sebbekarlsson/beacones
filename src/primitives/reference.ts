export type Reference<T> = { value: T };
export const reference = <T>(value: T): Reference<T> => ({ value });
