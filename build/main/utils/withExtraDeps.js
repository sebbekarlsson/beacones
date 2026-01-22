export const withExtraDeps = (sig, deps) => {
    deps.forEach((dep) => {
        sig._addDependency(dep);
    });
    return sig;
};
