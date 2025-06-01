function convertCamelToSnake(obj: Record<string, any>): Record<string, any> {
    const result: Record<string, any> = {};
  
    // Iterate through each property in the object
    for (const key in obj) {
      if (obj.hasOwnProperty(key)) {
        // Convert camelCase to snake_case
        const snakeCaseKey = key.replace(/[A-Z]/g, (match) => `_${match.toLowerCase()}`);
        // Recursively convert nested objects
        result[snakeCaseKey] = obj[key] && typeof obj[key] === 'object' ? convertCamelToSnake(obj[key]) : obj[key];
      }
    }
  
    return result;
  }
  

  export default convertCamelToSnake;
