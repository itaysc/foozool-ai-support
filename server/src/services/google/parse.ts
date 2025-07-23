// Parsing-related functions for Google Drive files

// Function to calculate embedding quality score
export function calculateEmbeddingQualityScore(chunk: {
  type: string;
  content: string;
  index: number;
}): number {
  const { type, content } = chunk;
  let score = 0.5; // Base score

  // Length-based scoring
  if (content.length >= 10 && content.length <= 1000) {
    score += 0.2;
  } else if (content.length > 1000) {
    score += 0.1;
  }

  // Type-based scoring
  switch (type) {
    case 'title':
      score += 0.1; // Titles are usually good for embeddings
      break;
    case 'paragraph':
      score += 0.2; // Paragraphs are ideal
      break;
    case 'section':
      score += 0.15; // Section headers are good
      break;
    case 'list_item':
      score += 0.1; // List items can be useful
      break;
    case 'content':
      score += 0.05; // Generic content
      break;
  }

  // Content quality scoring
  const wordCount = content.split(' ').length;
  if (wordCount >= 5 && wordCount <= 200) {
    score += 0.1;
  }

  // Check for meaningful content (not just whitespace or special characters)
  const meaningfulContent = content.replace(/[^\w\s]/g, '').trim();
  if (meaningfulContent.length > 0) {
    score += 0.1;
  }

  return Math.min(score, 1.0); // Cap at 1.0
}

// Enhanced function to parse text content into chunks
export function parseTextIntoChunks(content: string, fileName: string, fileType?: string): Array<{
  type: string;
  content: string;
  index: number;
  length: number;
  wordCount: number;
  qualityScore: number;
}> {
  const chunks: Array<{
    type: string;
    content: string;
    index: number;
    length: number;
    wordCount: number;
    qualityScore: number;
  }> = [];
  
  let chunkIndex = 0;
  
  // Adaptive chunking based on file type
  if (fileType === 'spreadsheet') {
    return parseSpreadsheetContent(content, fileName);
  } else if (fileType === 'presentation') {
    return parsePresentationContent(content, fileName);
  }
  
  // Default document parsing
  const lines = content.split('\n').filter(line => line.trim().length > 0);
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    
    // Skip empty lines
    if (!line) continue;
    
    // Determine chunk type based on content characteristics
    let chunkType = 'paragraph';
    
    // Check if it's a title (usually shorter, ends with no period, or has special formatting)
    if (line.length < 50 && !line.endsWith('.') && !line.endsWith('!') && !line.endsWith('?')) {
      // Check if next few lines are longer (indicating this might be a title)
      const nextLines = lines.slice(i + 1, i + 4);
      const hasLongerContent = nextLines.some(nextLine => nextLine.trim().length > line.length);
      
      if (hasLongerContent && line.length < 50) {
        chunkType = 'title';
      }
    }
    
    // Check if it's a section header (contains numbers, colons, or is in caps)
    if (line.match(/^[A-Z\s]+$/) || line.includes(':') || line.match(/^\d+\./)) {
      chunkType = 'section';
    }
    
    // Check if it's a list item
    if (line.match(/^[\-\*•]\s/) || line.match(/^\d+\.\s/)) {
      chunkType = 'list_item';
    }
    
    const wordCount = line.split(' ').length;
    const qualityScore = calculateEmbeddingQualityScore({ type: chunkType, content: line, index: chunkIndex });
    
    chunks.push({
      type: chunkType,
      content: line,
      index: chunkIndex++,
      length: line.length,
      wordCount,
      qualityScore
    });
  }
  
  // If no chunks were created, create one with the entire content
  if (chunks.length === 0) {
    const qualityScore = calculateEmbeddingQualityScore({ type: 'content', content, index: 0 });
    chunks.push({
      type: 'content',
      content: content,
      index: 0,
      length: content.length,
      wordCount: content.split(' ').length,
      qualityScore
    });
  }

  // Merge title with first paragraph if present
  const mergedChunks: Array<{
    type: string;
    content: string;
    index: number;
    length: number;
    wordCount: number;
    qualityScore: number;
  }> = [];
  for (let i = 0; i < chunks.length; i++) {
    const curr = chunks[i];
    const next = chunks[i + 1];
    if (curr.type === 'title' && next && next.type === 'paragraph') {
      mergedChunks.push({
        type: 'title_paragraph',
        content: curr.content + '\n' + next.content,
        index: curr.index,
        length: curr.length + next.length + 1,
        wordCount: curr.wordCount + next.wordCount,
        qualityScore: (curr.qualityScore + next.qualityScore) / 2
      });
      i++; // Skip next
    } else {
      mergedChunks.push(curr);
    }
  }
  return mergedChunks;
}

// Function to parse spreadsheet content
export function parseSpreadsheetContent(content: string, fileName: string): Array<{
  type: string;
  content: string;
  index: number;
  length: number;
  wordCount: number;
  qualityScore: number;
}> {
  const chunks: Array<{
    type: string;
    content: string;
    index: number;
    length: number;
    wordCount: number;
    qualityScore: number;
  }> = [];
  
  let chunkIndex = 0;
  const rows = content.split('\n').filter(row => row.trim().length > 0);
  
  for (let i = 0; i < rows.length; i++) {
    const row = rows[i].trim();
    if (!row) continue;
    
    const wordCount = row.split(' ').length;
    const qualityScore = calculateEmbeddingQualityScore({ type: 'list_item', content: row, index: chunkIndex });
    
    chunks.push({
      type: 'list_item', // Treat spreadsheet rows as list items
      content: row,
      index: chunkIndex++,
      length: row.length,
      wordCount,
      qualityScore
    });
  }
  
  return chunks;
}

// Function to parse presentation content
export function parsePresentationContent(content: string, fileName: string): Array<{
  type: string;
  content: string;
  index: number;
  length: number;
  wordCount: number;
  qualityScore: number;
}> {
  const chunks: Array<{
    type: string;
    content: string;
    index: number;
    length: number;
    wordCount: number;
    qualityScore: number;
  }> = [];
  
  let chunkIndex = 0;
  const slides = content.split(/\n\s*\n/).filter(slide => slide.trim().length > 0);
  
  for (let i = 0; i < slides.length; i++) {
    const slide = slides[i].trim();
    if (!slide) continue;
    
    const lines = slide.split('\n').filter(line => line.trim().length > 0);
    
    for (let j = 0; j < lines.length; j++) {
      const line = lines[j].trim();
      if (!line) continue;
      
      let chunkType = 'paragraph';
      
      // First line of slide is usually a title
      if (j === 0 && line.length < 100) {
        chunkType = 'title';
      } else if (line.match(/^[\-\*•]\s/) || line.match(/^\d+\.\s/)) {
        chunkType = 'list_item';
      }
      
      const wordCount = line.split(' ').length;
      const qualityScore = calculateEmbeddingQualityScore({ type: chunkType, content: line, index: chunkIndex });
      
      chunks.push({
        type: chunkType,
        content: line,
        index: chunkIndex++,
        length: line.length,
        wordCount,
        qualityScore
      });
    }
  }
  
  return chunks;
} 