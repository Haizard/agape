import { useRef } from 'react';

/**
 * Deep comparison function for objects
 * @param {*} a - First value
 * @param {*} b - Second value
 * @returns {boolean} - Whether the values are equal
 */
const isEqual = (a, b) => {
  // Handle primitive types
  if (a === b) return true;
  
  // Handle null/undefined
  if (a == null || b == null) return a === b;
  
  // Handle different types
  if (typeof a !== typeof b) return false;
  
  // Handle arrays
  if (Array.isArray(a) && Array.isArray(b)) {
    if (a.length !== b.length) return false;
    return a.every((item, index) => isEqual(item, b[index]));
  }
  
  // Handle objects
  if (typeof a === 'object' && typeof b === 'object') {
    const keysA = Object.keys(a);
    const keysB = Object.keys(b);
    
    if (keysA.length !== keysB.length) return false;
    
    return keysA.every(key => {
      if (!Object.prototype.hasOwnProperty.call(b, key)) return false;
      return isEqual(a[key], b[key]);
    });
  }
  
  // Handle other types
  return false;
};

/**
 * Like React's useMemo, but with deep comparison of dependencies
 * @param {Function} factory - Factory function
 * @param {Array} deps - Dependencies
 * @returns {*} - Memoized value
 */
const useDeepMemo = (factory, deps) => {
  const ref = useRef({
    deps: undefined,
    value: undefined
  });
  
  // Check if deps have changed
  const depsChanged = !ref.current.deps || !isEqual(deps, ref.current.deps);
  
  // If deps have changed, update value
  if (depsChanged) {
    ref.current.deps = deps;
    ref.current.value = factory();
  }
  
  // Return memoized value
  return ref.current.value;
};

export default useDeepMemo;
