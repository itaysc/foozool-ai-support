function convertSnakeToCamel(str: string): string {
    return str.replace(/_([a-z])/g, (match, p1) => p1.toUpperCase());
  }

  export default convertSnakeToCamel;
