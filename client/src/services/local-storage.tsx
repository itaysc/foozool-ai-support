
/**
 * Save data to localStorage
 * @param {string} key - The key under which the data will be stored.
 * @param {any} value - The value to be stored. It will be stringified before storing.
 */

export const keys = {
    token: 'token',
};

export function getStoredToken() {
    return getDataFromLocalStorage(keys.token);
}
export function setStoredToken(token: string) {
    return setDataToLocalStorage(keys.token, token);
}

export function setDataToLocalStorage(key: string, value: unknown) {
  if (!key || typeof key !== 'string') {
      console.error('Key must be a non-empty string.');
      return;
  }

  try {
      const stringValue = JSON.stringify(value);
      localStorage.setItem(key, stringValue);
  } catch (error) {
      console.error('Failed to set data to localStorage:', error);
  }
}

/**
* Fetch data from localStorage by key
* @param {string} key - The key under which the data is stored.
* @returns {any} The parsed value stored under the given key, or null if the key does not exist.
*/
export function getDataFromLocalStorage(key: string) {
  if (!key || typeof key !== 'string') {
      console.error('Key must be a non-empty string.');
      return null;
  }

  try {
      const stringValue = localStorage.getItem(key);
      if (stringValue === null) {
          console.warn(`No data found for key "${key}".`);
          return null;
      }
      return JSON.parse(stringValue);
  } catch (error) {
      console.error('Failed to fetch data from localStorage:', error);
      return null;
  }
}
