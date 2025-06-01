function convertSnakeToCamel(obj: Record<string, any>): Record<string, any> {
    const result: Record<string, any> = {};
  
    // Iterate through each property in the object
    for (const key in obj) {
      if (obj.hasOwnProperty(key)) {
        // Convert snake_case to camelCase
        const camelCaseKey = key.replace(/_([a-z])/g, (match, p1) => p1.toUpperCase());
        // Recursively convert nested objects
        result[camelCaseKey] = obj[key] && typeof obj[key] === 'object' ? convertSnakeToCamel(obj[key]) : obj[key];
      }
    }
  
    return result;
  }

  export default convertSnakeToCamel;
