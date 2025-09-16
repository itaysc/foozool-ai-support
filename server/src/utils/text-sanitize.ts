import sanitizeHtml from 'sanitize-html';

function sanitizeText(text: string): string {
    // Remove all HTML tags
    let cleanText: string = sanitizeHtml(text, { allowedTags: [], allowedAttributes: {} });
  
    // Remove newlines and other unwanted characters
    cleanText = cleanText.replace(/\r?\n|\r/g, " ").trim();
  
    return cleanText;
}

export function extractCustomerMessage(text: string): string {
    // Remove long dash lines
    text = text.replace(/-+/g, '').trim();
  
    // Remove metadata like "Itay Schmidt, Jun 21, 2025, 15:40"
    text = text.replace(/^[\w\s]+,\s+\w+\s+\d{1,2},\s+\d{4},\s+\d{2}:\d{2}/, '').trim();
  
    // In case it's still prefixed with name (fallback)
    text = text.replace(/^[A-Z][a-z]+\s[A-Z][a-z]+,\s*/, '').trim();
  
    return text;
  }

  
export function extractJSONFromText(text: string): string {
  // Try to find JSON object in the text
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (jsonMatch) {
    let jsonText = jsonMatch[0];
    
    // Remove comments that might be in the JSON
    jsonText = jsonText.replace(/\/\/.*$/gm, ''); // Remove single-line comments
    jsonText = jsonText.replace(/\/\*[\s\S]*?\*\//g, ''); // Remove multi-line comments
    
    return jsonText.trim();
  }
  
  // If no JSON object found, return the original text
  return text;
}

export default sanitizeText;
  
