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

  
export default sanitizeText;
  
