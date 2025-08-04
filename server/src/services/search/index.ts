import {
  getAllChunksForFile,
  getWindowedChunksForHit,
  ensureNonTitleChunk,
  fillWithAdditionalChunks,
  extractSearchQueriesFromUserQuery,
  fetchQdrantResultsForQueries,
  buildFileChunkMap,
  buildSourcesArray,
  generateLLMAnswer,
  llmContextSufficiencyCheck
} from './helpers/googleRagChunks';
import { UserContextManager } from '../../context/userContext';

/**
 * Main RAG search service: given a user query, use LLM to extract search queries, search Google files, fetch docs, and generate a final answer.
 */
export async function ragSearch({
  userQuery,
  limit = 50,
  minQualityScore = 0.1,
  truncate = true
}: {
  userQuery: string;
  limit?: number;
  minQualityScore?: number;
  truncate?: boolean;
}): Promise<{ answer: string; sources: any[]; llmQueries: string[] }> {
  // Get user ID and organization ID from context
  const userId = UserContextManager.getCurrentUserId();
  const organizationId = UserContextManager.getCurrentOrganizationId();
  
  if (!userId || !organizationId) {
    throw new Error('User context not available');
  }
  
  const QDRANT_FETCH_LIMIT = 30;
  const WINDOW_SIZE = 2;
  const MAX_CHUNKS = 6;
  const preferredTypes = ['paragraph', 'section', 'list_item', 'title_paragraph'];
  const TRUNCATE_WORDS = 100;

  // 1. Extract search queries from user query
  const llmQueries = await extractSearchQueriesFromUserQuery(userQuery, userId);

  // 2. Fetch Qdrant results for all queries
  const allResults = await fetchQdrantResultsForQueries({
    llmQueries,
    organizationId,
    minQualityScore,
    QDRANT_FETCH_LIMIT
  });

  // 3. Pre-fetch all chunks for each file in allResults
  const fileToAllChunks: Record<string, any[]> = {};
  let totalRelevantChunks = 0;
  const allFileIds = new Set<string>();
  for (const result of allResults) {
    const file_id = result.payload.file_id;
    allFileIds.add(file_id);
    if (!fileToAllChunks[file_id]) {
      const fileType = 'document';
      const file_name = result.payload.file_name || 'Unknown';
      fileToAllChunks[file_id] = await getAllChunksForFile(
        organizationId,
        file_id,
        result.payload.mime_type,
        fileType,
        file_name
      );
    }
  }
  // Double-check: count all relevant chunks in all involved files
  totalRelevantChunks = 0;
  for (const file_id of allFileIds) {
    totalRelevantChunks += fileToAllChunks[file_id].filter(c => preferredTypes.includes(c.type)).length;
  }

  // 4. For each Qdrant hit, get windowed chunks
  const windowedChunks: any[] = [];
  const seenChunkKeys = new Set<string>();
  for (const result of allResults) {
    const file_id = result.payload.file_id;
    const chunk_index = result.payload.chunk_index;
    const file_name = result.payload.file_name || 'Unknown';
    const file_url = result.payload.file_url || '';
    const source = result.payload.source || 'google';
    const allChunks = fileToAllChunks[file_id];
    const windowed = getWindowedChunksForHit(
      allChunks,
      file_id,
      chunk_index,
      file_name,
      file_url,
      source,
      result.payload,
      WINDOW_SIZE,
      seenChunkKeys
    );
    windowedChunks.push(...windowed);
  }

  // 5. Ensure at least one non-title chunk per file
  ensureNonTitleChunk(windowedChunks, fileToAllChunks, preferredTypes, seenChunkKeys);
  // 6. Fill with additional preferred chunks if needed
  fillWithAdditionalChunks(windowedChunks, fileToAllChunks, preferredTypes, seenChunkKeys, MAX_CHUNKS);

  // 7. Select up to MAX_CHUNKS, prioritizing preferred types
  let finalResultObjs = windowedChunks.filter(c => preferredTypes.includes(c.chunk_type)).slice(0, MAX_CHUNKS);
  if (finalResultObjs.length < MAX_CHUNKS) {
    const titles = windowedChunks.filter(c => c.chunk_type === 'title').slice(0, MAX_CHUNKS - finalResultObjs.length);
    finalResultObjs = finalResultObjs.concat(titles);
  }
  finalResultObjs = finalResultObjs.map(c => ({
    ...c.payload,
    payload: {
      ...c.payload,
      chunk_index: c.chunk_index,
      chunk_type: c.chunk_type,
    }
  }));

  // 8. Build sources array
  let { sources, chunkCountNote } = await buildSourcesArray({
    finalResultObjs,
    organizationId,
    truncate,
    TRUNCATE_WORDS,
    totalRelevantChunks
  });

  // 9. Generate LLM answer
  let answer = await generateLLMAnswer({
    userQuery,
    userId,
    sources,
    chunkCountNote
  });

  // 10. LLM self-assessment: is the context sufficient?
  const contextSummary = sources.map(s => `${s.file_name}: ${s.chunk_type} #${s.chunk_index}`).join('; ');
  const sufficiency = await llmContextSufficiencyCheck({
    userQuery,
    llmAnswer: answer,
    contextSummary,
    userId
  });

  if (sufficiency === 'insufficient') {
    // Expand: fetch all chunks for each relevant file, up to MAX_CHUNKS
    let expandedResultObjs: any[] = [];
    for (const file_id of Object.keys(fileToAllChunks)) {
      const allChunks = fileToAllChunks[file_id];
      for (const chunk of allChunks) {
        expandedResultObjs.push({
          ...allResults.find(r => r.payload.file_id === file_id)?.payload,
          payload: {
            ...allResults.find(r => r.payload.file_id === file_id)?.payload,
            chunk_index: chunk.index,
            chunk_type: chunk.type,
          }
        });
        if (expandedResultObjs.length >= MAX_CHUNKS) break;
      }
      if (expandedResultObjs.length >= MAX_CHUNKS) break;
    }
    const expanded = await buildSourcesArray({
      finalResultObjs: expandedResultObjs,
      organizationId,
      truncate,
      TRUNCATE_WORDS,
      totalRelevantChunks
    });
    sources = expanded.sources;
    chunkCountNote = expanded.chunkCountNote;
    answer = await generateLLMAnswer({
      userQuery,
      userId,
      sources,
      chunkCountNote
    });
  }

  return { answer, sources, llmQueries };
} 