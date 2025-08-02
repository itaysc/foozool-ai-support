
/**
 * Save data to localStorage
 * @param {string} key - The key under which the data will be stored.
 * @param {any} value - The value to be stored. It will be stringified before storing.
 */

export const keys = {
    token: 'token',
};

export function getStoredToken() {
    const token = getDataFromLocalStorage(keys.token);
    return token;
}
export function setStoredToken(token: string) {
    return setDataFromLocalStorage(keys.token, token);
}

export function setDataToLocalStorage(key: string, value: unknown) {
  if (!key || typeof key !== 'string') {
      return;
  }

  try {
      const stringValue = JSON.stringify(value);
      localStorage.setItem(key, stringValue);
  } catch (error) {
      // Silent error handling
  }
}

/**
* Fetch data from localStorage by key
* @param {string} key - The key under which the data is stored.
* @returns {any} The parsed value stored under the given key, or null if the key does not exist.
*/
export function getDataFromLocalStorage(key: string) {
  if (!key || typeof key !== 'string') {
      return null;
  }

  try {
      const stringValue = localStorage.getItem(key);
      if (stringValue === null) {
          return null;
      }
      return JSON.parse(stringValue);
  } catch (error) {
      return null;
  }
}
