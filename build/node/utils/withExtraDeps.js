// src/utils/withExtraDeps.ts
var withExtraDeps = (sig, deps) => {
  deps.forEach((dep) => {
    sig._addDependency(dep);
  });
  return sig;
};
export {
  withExtraDeps
};
