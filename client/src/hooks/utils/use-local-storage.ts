import { useState, useEffect, useCallback, useRef } from 'react';

type SetValue<T> = T | ((val: T) => T);

interface UseLocalStorageOptions<T> {
  serializer?: {
    read: (value: string) => T;
    write: (value: T) => string;
  };
  initializeWithValue?: boolean;
  syncAcrossTabs?: boolean;
}

/**
 * Hook for managing localStorage with TypeScript support and synchronization
 */
export function useLocalStorage<T>(
  key: string,
  initialValue: T,
  options: UseLocalStorageOptions<T> = {}
): [T, (value: SetValue<T>) => void, () => void] {
  const {
    serializer = {
      read: JSON.parse,
      write: JSON.stringify,
    },
    initializeWithValue = true,
    syncAcrossTabs = true,
  } = options;

  const initialValueRef = useRef(initialValue);

  // Get value from localStorage
  const readValue = useCallback((): T => {
    if (typeof window === 'undefined') {
      return initialValueRef.current;
    }

    try {
      const item = window.localStorage.getItem(key);
      if (item === null) {
        return initialValueRef.current;
      }
      return serializer.read(item);
    } catch (error) {
      console.warn(`Error reading localStorage key "${key}":`, error);
      return initialValueRef.current;
    }
  }, [key, serializer]);

  // State to store our value
  const [storedValue, setStoredValue] = useState<T>(() => {
    if (initializeWithValue) {
      return readValue();
    }
    return initialValueRef.current;
  });

  // Return a wrapped version of useState's setter function that persists the new value to localStorage
  const setValue = useCallback(
    (value: SetValue<T>) => {
      if (typeof window === 'undefined') {
        console.warn('localStorage is not available in this environment');
        return;
      }

      try {
        // Allow value to be a function so we have the same API as useState
        const newValue = value instanceof Function ? value(storedValue) : value;

        // Save to localStorage
        window.localStorage.setItem(key, serializer.write(newValue));

        // Save state
        setStoredValue(newValue);

        // Dispatch custom event for cross-tab synchronization
        if (syncAcrossTabs) {
          window.dispatchEvent(
            new CustomEvent('local-storage-change', {
              detail: { key, newValue },
            })
          );
        }
      } catch (error) {
        console.warn(`Error setting localStorage key "${key}":`, error);
      }
    },
    [key, serializer, storedValue, syncAcrossTabs]
  );

  // Remove value from localStorage
  const removeValue = useCallback(() => {
    if (typeof window === 'undefined') {
      console.warn('localStorage is not available in this environment');
      return;
    }

    try {
      window.localStorage.removeItem(key);
      setStoredValue(initialValueRef.current);

      // Dispatch custom event for cross-tab synchronization
      if (syncAcrossTabs) {
        window.dispatchEvent(
          new CustomEvent('local-storage-change', {
            detail: { key, newValue: null },
          })
        );
      }
    } catch (error) {
      console.warn(`Error removing localStorage key "${key}":`, error);
    }
  }, [key, syncAcrossTabs]);

  // Listen for changes in localStorage (for cross-tab synchronization)
  useEffect(() => {
    if (!syncAcrossTabs) return;

    const handleStorageChange = (e: StorageEvent | CustomEvent) => {
      if ('key' in e && e.key !== key) return;
      if ('detail' in e && e.detail.key !== key) return;

      setStoredValue(readValue());
    };

    // Listen for both storage events (from other tabs) and custom events (from same tab)
    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('local-storage-change', handleStorageChange as EventListener);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('local-storage-change', handleStorageChange as EventListener);
    };
  }, [key, readValue, syncAcrossTabs]);

  return [storedValue, setValue, removeValue];
}

/**
 * Hook for managing sessionStorage (similar to localStorage but session-scoped)
 */
export function useSessionStorage<T>(
  key: string,
  initialValue: T,
  options: Omit<UseLocalStorageOptions<T>, 'syncAcrossTabs'> = {}
): [T, (value: SetValue<T>) => void, () => void] {
  const {
    serializer = {
      read: JSON.parse,
      write: JSON.stringify,
    },
    initializeWithValue = true,
  } = options;

  const initialValueRef = useRef(initialValue);

  // Get value from sessionStorage
  const readValue = useCallback((): T => {
    if (typeof window === 'undefined') {
      return initialValueRef.current;
    }

    try {
      const item = window.sessionStorage.getItem(key);
      if (item === null) {
        return initialValueRef.current;
      }
      return serializer.read(item);
    } catch (error) {
      console.warn(`Error reading sessionStorage key "${key}":`, error);
      return initialValueRef.current;
    }
  }, [key, serializer]);

  const [storedValue, setStoredValue] = useState<T>(() => {
    if (initializeWithValue) {
      return readValue();
    }
    return initialValueRef.current;
  });

  const setValue = useCallback(
    (value: SetValue<T>) => {
      if (typeof window === 'undefined') {
        console.warn('sessionStorage is not available in this environment');
        return;
      }

      try {
        const newValue = value instanceof Function ? value(storedValue) : value;
        window.sessionStorage.setItem(key, serializer.write(newValue));
        setStoredValue(newValue);
      } catch (error) {
        console.warn(`Error setting sessionStorage key "${key}":`, error);
      }
    },
    [key, serializer, storedValue]
  );

  const removeValue = useCallback(() => {
    if (typeof window === 'undefined') {
      console.warn('sessionStorage is not available in this environment');
      return;
    }

    try {
      window.sessionStorage.removeItem(key);
      setStoredValue(initialValueRef.current);
    } catch (error) {
      console.warn(`Error removing sessionStorage key "${key}":`, error);
    }
  }, [key]);

  return [storedValue, setValue, removeValue];
}

/**
 * Hook for managing complex objects in localStorage with partial updates
 */
export function useLocalStorageObject<T extends Record<string, any>>(
  key: string,
  initialValue: T,
  options: UseLocalStorageOptions<T> = {}
) {
  const [value, setValue, removeValue] = useLocalStorage(key, initialValue, options);

  // Update specific properties of the object
  const updateValue = useCallback(
    (updates: Partial<T> | ((current: T) => Partial<T>)) => {
      setValue((current) => {
        const updatesObj = typeof updates === 'function' ? updates(current) : updates;
        return { ...current, ...updatesObj };
      });
    },
    [setValue]
  );

  // Reset to initial value
  const resetValue = useCallback(() => {
    setValue(initialValue);
  }, [setValue, initialValue]);

  return {
    value,
    setValue,
    updateValue,
    removeValue,
    resetValue,
  };
}

/**
 * Hook for managing arrays in localStorage with array-specific operations
 */
export function useLocalStorageArray<T>(
  key: string,
  initialValue: T[] = [],
  options: UseLocalStorageOptions<T[]> = {}
) {
  const [array, setArray, removeArray] = useLocalStorage(key, initialValue, options);

  const push = useCallback(
    (...items: T[]) => {
      setArray((current) => [...current, ...items]);
    },
    [setArray]
  );

  const pop = useCallback(() => {
    setArray((current) => current.slice(0, -1));
  }, [setArray]);

  const shift = useCallback(() => {
    setArray((current) => current.slice(1));
  }, [setArray]);

  const unshift = useCallback(
    (...items: T[]) => {
      setArray((current) => [...items, ...current]);
    },
    [setArray]
  );

  const removeAt = useCallback(
    (index: number) => {
      setArray((current) => current.filter((_, i) => i !== index));
    },
    [setArray]
  );

  const updateAt = useCallback(
    (index: number, item: T) => {
      setArray((current) => current.map((existingItem, i) => (i === index ? item : existingItem)));
    },
    [setArray]
  );

  const clear = useCallback(() => {
    setArray([]);
  }, [setArray]);

  return {
    array,
    setArray,
    push,
    pop,
    shift,
    unshift,
    removeAt,
    updateAt,
    clear,
    removeArray,
    length: array.length,
  };
}