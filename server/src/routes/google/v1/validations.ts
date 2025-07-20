import { z } from 'zod';

export const processGoogleDriveFilesSchema = z.object({
  fileIds: z.array(z.string()).optional()
    .describe('Array of Google Drive file IDs to process. If not provided, all files will be processed.')
});

export const searchGoogleDriveFilesSchema = z.object({
  query: z.string().min(1).max(1000)
    .describe('Search query text'),
  limit: z.number().int().min(1).max(100).default(10)
    .describe('Maximum number of results to return'),
  chunkType: z.enum(['title', 'paragraph', 'section', 'list_item', 'content']).optional()
    .describe('Filter by chunk type'),
  fileId: z.string().optional()
    .describe('Filter by specific file ID'),
  fileType: z.enum(['document', 'spreadsheet', 'presentation', 'pdf', 'image', 'other']).optional()
    .describe('Filter by file type'),
  minQualityScore: z.number().min(0).max(1).default(0.5)
    .describe('Minimum embedding quality score (0.0 to 1.0)')
});

export default {
  processGoogleDriveFilesSchema,
  searchGoogleDriveFilesSchema
}; 