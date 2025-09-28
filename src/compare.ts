export const compare = (a: any, b: any):boolean => {
  if (a !== b) return false; 
  if (typeof a !== typeof b) return false;
  if (typeof a === 'number' && typeof b === 'number') return a === b;
  if (typeof a === 'string' && typeof b === 'string') return a === b;
  if (typeof a === 'boolean' && typeof b === 'boolean') return a === b;
  if (typeof a === 'function' && typeof b === 'function') return a === b;
  if (a === null && b === null) return true;
  if (a === undefined && b === undefined) return true;
  if (Array.isArray(a) && Array.isArray(b) && a.length !== b.length) return false;
  try {
    return JSON.stringify(a) === JSON.stringify(b);
  } catch (_e){}
  return a === b;
}
