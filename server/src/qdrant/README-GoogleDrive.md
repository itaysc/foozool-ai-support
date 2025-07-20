# Google Drive File Processing with Qdrant

This module provides functionality to process Google Drive files, create embeddings, and store them in Qdrant for semantic search.

## Features

- **File Processing**: Read Google Drive files and parse them into chunks (title, paragraph, section, etc.)
- **Embedding Generation**: Use SBERT to create vector embeddings for each chunk
- **Vector Storage**: Store embeddings in Qdrant with metadata
- **Semantic Search**: Search through processed files using vector similarity
- **Quality Scoring**: Automatic quality assessment of embeddings
- **Adaptive Chunking**: Different parsing strategies for different file types
- **Performance Monitoring**: Detailed processing statistics and metrics

## API Endpoints

### Process Google Drive Files

```http
POST /api/v1/google/drive/process
Authorization: Bearer <jwt_token>
Content-Type: application/json

{
  "fileIds": ["file_id_1", "file_id_2", "file_id_3"]
}
```

**Response:**
```json
{
  "success": true,
  "processedFiles": 3,
  "totalChunks": 45,
  "errors": [],
  "totalFilesFound": 5,
  "processingStats": {
    "averageQualityScore": 0.85,
    "averageVectorMagnitude": 0.92,
    "totalProcessingTime": 15000,
    "fileTypeDistribution": {
      "document": 2,
      "spreadsheet": 1
    },
    "chunkTypeDistribution": {
      "title": 5,
      "paragraph": 25,
      "section": 10,
      "list_item": 5
    }
  }
}
```

### Search Google Drive Files

#### Basic Search
```http
POST /api/v1/google/drive/search
Authorization: Bearer <jwt_token>
Content-Type: application/json

{
  "query": "customer support policies",
  "limit": 10,
  "chunkType": "paragraph",
  "fileId": "optional_file_id"
}
```

#### Advanced Search
```http
POST /api/v1/google/drive/search
Authorization: Bearer <jwt_token>
Content-Type: application/json

{
  "query": "quarterly revenue analysis",
  "limit": 15,
  "chunkType": "paragraph",
  "fileType": "spreadsheet",
  "minQualityScore": 0.7
}
```

**Response:**
```json
{
  "success": true,
  "results": [
    {
      "id": "file_id_1_0",
      "score": 0.85,
      "payload": {
        "file_id": "file_id_1",
        "file_name": "Support Policy.pdf",
        "organization_id": "org_123",
        "chunk_type": "paragraph",
        "chunk_content": "Customer support is available 24/7...",
        "chunk_index": 0,
        "chunk_length": 45,
        "chunk_word_count": 8,
        "mime_type": "application/pdf",
        "file_type": "pdf",
        "created_at": "2024-01-01T00:00:00Z",
        "modified_time": "2024-01-01T00:00:00Z",
        "processing_timestamp": "2024-01-01T12:00:00Z",
        "embedding_quality_score": 0.92
      }
    }
  ],
  "query": "customer support policies",
  "totalResults": 1,
  "searchParams": {
    "chunkType": "paragraph",
    "fileType": null,
    "minQualityScore": 0.5,
    "limit": 10
  }
}
```

## Enhanced Features

### Quality Scoring System
The system automatically calculates embedding quality scores based on:
- **Content length**: Optimal length (10-1000 characters)
- **Word count**: Ideal range (5-200 words)
- **Chunk type**: Different weights for different types
- **Content meaningfulness**: Filters out whitespace/special characters

### Adaptive Chunking
Different parsing strategies for different file types:
- **Documents**: Paragraph-based chunking with title/section detection
- **Spreadsheets**: Row-based chunking
- **Presentations**: Slide-based chunking with title detection
- **PDFs**: Standard document parsing

### Performance Monitoring
Processing statistics include:
- **Average quality score**: Overall embedding quality
- **Average vector magnitude**: Embedding strength
- **Processing time**: Total time taken
- **File type distribution**: Breakdown by file type
- **Chunk type distribution**: Breakdown by chunk type

## Chunk Types

The system automatically categorizes text chunks into the following types:

- **title**: Short text that appears to be a title or heading
- **paragraph**: Regular paragraph text
- **section**: Section headers, numbered items, or text with colons
- **list_item**: Bullet points or numbered list items
- **content**: Fallback for any other content

## Score Thresholds by Chunk Type

Different similarity thresholds for different content types:
- **title**: 0.6 (titles need higher similarity)
- **paragraph**: 0.7 (standard paragraphs)
- **section**: 0.65 (section headers)
- **list_item**: 0.75 (list items need high precision)
- **content**: 0.7 (general content)

## Collection Schema

The Google Drive files are stored in a separate Qdrant collection called `google_files` with the following structure:

- **Vector**: 768-dimensional SBERT embeddings
- **Payload**:
  - `file_id`: Google Drive file ID
  - `file_name`: Original file name
  - `organization_id`: Organization identifier
  - `chunk_type`: Type of text chunk
  - `chunk_content`: Original text content
  - `chunk_index`: Position within the file
  - `chunk_length`: Character count of chunk
  - `chunk_word_count`: Word count of chunk
  - `mime_type`: File MIME type
  - `file_type`: Derived file type (document, spreadsheet, etc.)
  - `created_at`: File creation time
  - `modified_time`: File last modified time
  - `processing_timestamp`: When the chunk was processed
  - `embedding_quality_score`: Quality metric for the embedding

## Usage Examples

### Process Specific Files
```javascript
const processResponse = await fetch('/api/v1/google/drive/process', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    fileIds: ['1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms']
  })
});
```

### Process All Files
```javascript
const processAllResponse = await fetch('/api/v1/google/drive/process', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({})
});
```

### Basic Search
```javascript
const searchResponse = await fetch('/api/v1/google/drive/search', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    query: 'How do I reset my password?',
    limit: 5,
    chunkType: 'paragraph'
  })
});
```

### Advanced Search with Filters
```javascript
const advancedSearchResponse = await fetch('/api/v1/google/drive/search', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    query: 'quarterly revenue analysis',
    limit: 15,
    chunkType: 'paragraph',
    fileType: 'spreadsheet',
    minQualityScore: 0.7
  })
});
```

## Error Handling

The system includes comprehensive error handling:

- **File Access Errors**: Handles cases where files are not accessible
- **Embedding Generation Errors**: Retries with exponential backoff
- **Qdrant Storage Errors**: Logs and continues with remaining files
- **Validation Errors**: Returns detailed validation error messages
- **Quality Monitoring**: Tracks and reports embedding quality issues

## Performance Considerations

- Files are processed sequentially to avoid overwhelming the Google Drive API
- Embeddings are generated in batches to optimize ML service calls
- Qdrant operations use bulk insert for better performance
- Search results include similarity scores for ranking
- Quality scoring helps filter out low-quality embeddings
- Adaptive thresholds improve search precision based on content type

## Monitoring and Analytics

The system provides detailed processing statistics:
- **Quality metrics**: Track embedding quality over time
- **Performance metrics**: Monitor processing speed and efficiency
- **Content distribution**: Understand file type and chunk type patterns
- **Error tracking**: Identify and resolve processing issues 