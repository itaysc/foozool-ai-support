// Utility for extracting file type from MIME type

export function getFileType(mimeType: string): string {
  if (mimeType.includes('document') || mimeType.includes('text')) {
    return 'document';
  } else if (mimeType.includes('spreadsheet') || mimeType.includes('sheet')) {
    return 'spreadsheet';
  } else if (mimeType.includes('presentation') || mimeType.includes('slides')) {
    return 'presentation';
  } else if (mimeType.includes('pdf')) {
    return 'pdf';
  } else if (mimeType.includes('image')) {
    return 'image';
  } else {
    return 'other';
  }
} 