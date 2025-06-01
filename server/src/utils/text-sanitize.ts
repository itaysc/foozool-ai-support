import sanitizeHtml from 'sanitize-html';

function sanitizeText(text: string): string {
    // Remove all HTML tags
    let cleanText: string = sanitizeHtml(text, { allowedTags: [], allowedAttributes: {} });
  
    // Remove newlines and other unwanted characters
    cleanText = cleanText.replace(/\r?\n|\r/g, " ").trim();
  
    return cleanText;
}

export default sanitizeText;
  