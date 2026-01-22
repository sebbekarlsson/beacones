import { Beacon } from "../beacon";
import { Signal } from "../primitives";

export const withExtraDeps = <S extends Signal<any>>(
  sig: S,
  deps: Beacon<any>[]
): S => {
  deps.forEach((dep) => {
    sig._addDependency(dep);
  })
  return sig;
}
