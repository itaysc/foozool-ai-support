import { callLLM } from '../../together.ai';
import { getSBERTEmbeddingForText } from '../../call-python';
import { searchGoogleDriveFiles } from '../../../qdrant/service';
import { summarizeTickets } from '../../call-python';
import { getDriveFileContent } from '../../../services/google/drive';
import { parseTextIntoChunks } from '../../../services/google/parse';
import sanitizeJSON from '../../../utils/sanitizeJson';

// Fetch and parse all chunks for a file
export async function getAllChunksForFile(organizationId: string, file_id: string, mime_type: string, fileType: string, file_name: string): Promise<any[]> {
  let fileContent = '';
  try {
    fileContent = await getDriveFileContent(organizationId, file_id, mime_type);
  } catch (err) {
    return [];
  }
  return parseTextIntoChunks(fileContent, file_name, fileType);
}

// Get windowed chunks for a Qdrant hit
export function getWindowedChunksForHit(
  allChunks: any[],
  file_id: string,
  chunk_index: number,
  file_name: string,
  file_url: string,
  source: string,
  payload: any,
  windowSize: number,
  seenChunkKeys: Set<string>
): any[] {
  const windowed: any[] = [];
  for (let offset = -windowSize; offset <= windowSize; offset++) {
    const neighborIndex = chunk_index + offset;
    const neighbor = allChunks.find(c => c.index === neighborIndex);
    if (neighbor) {
      const key = `${file_id}_${neighbor.index}`;
      if (!seenChunkKeys.has(key)) {
        windowed.push({
          file_id,
          chunk_index: neighbor.index,
          chunk_type: neighbor.type,
          chunk: neighbor,
          file_name,
          file_url,
          source,
          payload
        });
        seenChunkKeys.add(key);
      }
    }
  }
  return windowed;
}

// Ensure at least one non-title chunk per file
export function ensureNonTitleChunk(
  windowedChunks: any[],
  fileToAllChunks: Record<string, any[]>,
  preferredTypes: string[],
  seenChunkKeys: Set<string>
) {
  for (const file_id of Object.keys(fileToAllChunks)) {
    const hasNonTitle = windowedChunks.some(c => c.file_id === file_id && c.chunk_type !== 'title');
    if (!hasNonTitle) {
      const nonTitleChunk = fileToAllChunks[file_id].find(c => preferredTypes.includes(c.type));
      if (nonTitleChunk) {
        const key = `${file_id}_${nonTitleChunk.index}`;
        if (!seenChunkKeys.has(key)) {
          windowedChunks.push({
            file_id,
            chunk_index: nonTitleChunk.index,
            chunk_type: nonTitleChunk.type,
            chunk: nonTitleChunk,
            file_name: windowedChunks.find(c => c.file_id === file_id)?.file_name || 'Unknown',
            file_url: windowedChunks.find(c => c.file_id === file_id)?.file_url || '',
            source: windowedChunks.find(c => c.file_id === file_id)?.source || 'google',
            payload: windowedChunks.find(c => c.file_id === file_id)?.payload || {}
          });
          seenChunkKeys.add(key);
        }
      }
    }
  }
}

// Fill with additional preferred chunks if needed
export function fillWithAdditionalChunks(
  windowedChunks: any[],
  fileToAllChunks: Record<string, any[]>,
  preferredTypes: string[],
  seenChunkKeys: Set<string>,
  maxChunks: number
) {
  if (windowedChunks.length < maxChunks) {
    for (const file_id of Object.keys(fileToAllChunks)) {
      const moreChunks = fileToAllChunks[file_id].filter(c => preferredTypes.includes(c.type));
      for (const chunk of moreChunks) {
        const key = `${file_id}_${chunk.index}`;
        if (!seenChunkKeys.has(key) && windowedChunks.length < maxChunks) {
          windowedChunks.push({
            file_id,
            chunk_index: chunk.index,
            chunk_type: chunk.type,
            chunk,
            file_name: windowedChunks.find(c => c.file_id === file_id)?.file_name || 'Unknown',
            file_url: windowedChunks.find(c => c.file_id === file_id)?.file_url || '',
            source: windowedChunks.find(c => c.file_id === file_id)?.source || 'google',
            payload: windowedChunks.find(c => c.file_id === file_id)?.payload || {}
          });
          seenChunkKeys.add(key);
        }
        if (windowedChunks.length >= maxChunks) break;
      }
      if (windowedChunks.length >= maxChunks) break;
    }
  }
}

// Extract search queries from user query using LLM
export async function extractSearchQueriesFromUserQuery(userQuery: string, userId: string): Promise<string[]> {
  const extractPrompt = `You are an expert research assistant. Your job is to extract the most relevant search queries from a user's question, to help find supporting information in Google Docs. Always return a JSON array of search queries, and nothing else.\n\nExample:\nUser query: \"How do I split payments at checkout?\"\nOutput: [\"split payments at checkout\", \"checkout payment options\", \"multiple payment methods\"]\n\nUser query: \"${userQuery}\"\nOutput:`;
  const llmExtractResponse = await callLLM({
    userId,
    prompt: extractPrompt,
    maxTokens: 256
  });
  if (llmExtractResponse.isOutOfTokens) {
    throw new Error("Out of tokens");
  }
  if (!llmExtractResponse || !llmExtractResponse.data) {
    throw new Error("Failed to extract search queries from the user query");
  }
  let llmQueries: string[] = [];
  try {
    llmQueries = JSON.parse(llmExtractResponse.data?.trim() || '');
  } catch {
    llmQueries = [userQuery];
  }
  return llmQueries;
}

// Extract retrieval section types/keywords from user query using LLM
export async function extractRetrievalSectionTypesFromUserQuery(userQuery: string, userId: string): Promise<string[]> {
  const prompt = `Given the user query: '${userQuery}', what types of sections or information should be retrieved from a document to answer it fully? Return only a JSON array of section types or keywords, e.g. [\"employment history\", \"roles\"]. Do not add any explanation or text.`;
  const llmResponse = await callLLM({
    userId,
    prompt,
    maxTokens: 128
  });
  if (llmResponse.isOutOfTokens) {
    throw new Error("Out of tokens");
  }
  if (!llmResponse || !llmResponse.data) {
    return [];
  }
  let sectionTypes: string[] = [];
  try {
    const cleaned = sanitizeJSON(llmResponse.data?.trim() || '');
    sectionTypes = JSON.parse(cleaned);
  } catch (e) {
    console.error("Failed to parse LLM section types response:", llmResponse.data);
    sectionTypes = [];
  }
  return sectionTypes;
}

// Fetch Qdrant results for all queries (batched)
export async function fetchQdrantResultsForQueries({
  llmQueries,
  organizationId,
  minQualityScore,
  QDRANT_FETCH_LIMIT
}: {
  llmQueries: string[];
  organizationId: string;
  minQualityScore: number;
  QDRANT_FETCH_LIMIT: number;
}): Promise<any[]> {
  function chunkArray<T>(arr: T[], size: number): T[][] {
    const result: T[][] = [];
    for (let i = 0; i < arr.length; i += size) {
      result.push(arr.slice(i, i + size));
    }
    return result;
  }
  const allResults: any[] = [];
  const queryChunks = chunkArray(llmQueries, 20);
  for (const chunk of queryChunks) {
    const vectors = await getSBERTEmbeddingForText(chunk);
    for (let i = 0; i < chunk.length; i++) {
      const queryVector = vectors[i];
      const results = await searchGoogleDriveFiles({
        organizationId,
        queryVector,
        limit: QDRANT_FETCH_LIMIT,
        minQualityScore
      });
      allResults.push(...results);
    }
  }
  return allResults;
}

// Build fileChunkMap from Qdrant results
export function buildFileChunkMap(allResults: any[]): Record<string, Set<number>> {
  const fileChunkMap: Record<string, Set<number>> = {};
  for (const result of allResults) {
    const file_id = result.payload.file_id;
    const chunk_index = result.payload.chunk_index;
    if (!fileChunkMap[file_id]) fileChunkMap[file_id] = new Set();
    fileChunkMap[file_id].add(chunk_index);
  }
  return fileChunkMap;
}

// Build sources array (fetches content, chunks, summarizes, dedupes)
export async function buildSourcesArray({
  finalResultObjs,
  organizationId,
  truncate,
  TRUNCATE_WORDS,
  totalRelevantChunks
}: {
  finalResultObjs: any[];
  organizationId: string;
  truncate: boolean;
  TRUNCATE_WORDS: number;
  totalRelevantChunks?: number;
}): Promise<{ sources: any[]; chunkCountNote?: string }> {
  const sources: { file_id: string; file_name: string; file_url: string; chunk_type: string; chunk_index: number; chunk_content: string; source: string }[] = [];
  const seenFileIds = new Set<string>();
  for (const result of finalResultObjs) {
    const file_id = result.payload.file_id;
    if (seenFileIds.has(file_id)) continue;
    const chunk_type = result.payload.chunk_type;
    const chunk_index = result.payload.chunk_index;
    let file_name = result.payload.file_name || 'Unknown';
    let file_url = result.payload.file_url || '';
    let source = result.payload.source || 'unknown';
    let chunk_content = '';
    try {
      const fileContent = await getDriveFileContent(organizationId, file_id, result.payload.mime_type);
      const fileType = result.payload.file_type || 'document';
      const chunks = parseTextIntoChunks(fileContent, file_name, fileType);
      const chunk = chunks.find(c => c.index === chunk_index && c.type === chunk_type);
      if (chunk) {
        chunk_content = chunk.content;
        if (truncate) {
          const words = chunk_content.split(/\s+/).slice(0, TRUNCATE_WORDS);
          chunk_content = words.join(' ');
        }
        const summaries = await summarizeTickets([{ description: chunk_content }]);
        if (summaries && summaries.length > 0) {
          chunk_content = summaries[0];
        }
      }
    } catch (err) {
      // If we can't fetch content, leave chunk_content empty
    }
    sources.push({ file_id, file_name, file_url, chunk_type, chunk_index, chunk_content, source });
    seenFileIds.add(file_id);
  }
  let chunkCountNote: string | undefined = undefined;
  if (typeof totalRelevantChunks === 'number' && sources.length < totalRelevantChunks) {
    chunkCountNote = `Note: Only ${sources.length} of ${totalRelevantChunks} relevant sections are included due to space.`;
  }
  return { sources, chunkCountNote };
}

// Generate LLM answer from user query and sources/context
export async function generateLLMAnswer({
  userQuery,
  userId,
  sources,
  chunkCountNote
}: {
  userQuery: string;
  userId: string;
  sources: any[];
  chunkCountNote?: string;
}): Promise<string> {
  let answer = '';
  if (sources.length > 0) {
    let context = sources.map(s => `File: ${s.file_name}\nChunk: ${s.chunk_type} #${s.chunk_index}\nContent (summarized):\n${s.chunk_content}\nURL: ${s.file_url}`).join('\n---\n');
    if (chunkCountNote) {
      context = `WARNING: ${chunkCountNote}\n\n` + context;
    }
    let systemMsg = `IMPORTANT: If you are not 100% certain of the answer based on the provided information, you MUST respond ONLY with: "I don’t know based on the provided information." Never speculate, never infer, never embellish, and never use outside knowledge.\n\nYou are a helpful assistant. Answer the user's question as best as you can using the following information. If you don't have enough information, say so, but do not mention Google Docs, the source, or where you searched. Do not say what content was provided—just answer the question directly.\n\nDo not make up information, do not speculate, and do not infer facts that are not explicitly stated in the provided content. If a job title, company, or other fact is not explicitly stated, do not guess or infer it. If the answer may be incomplete due to missing information, say so.`;
    if (chunkCountNote) {
      systemMsg += `\n\n${chunkCountNote}`;
    }
    const llmAnswer = await callLLM({
      userId,
      prompt: userQuery,
      isChat: true,
      systemMsg,
      maxTokens: 512
    });
    answer = (llmAnswer.data || '').trim();
    // Post-processing: if chunkCountNote is present and answer does not contain 'I don’t know' or 'not available', override
    if (
      chunkCountNote &&
      !/i don['’]t know|not available/i.test(answer)
    ) {
      answer = "I don’t know based on the provided information.";
    }
  } else {
    answer = "Sorry, I couldn't find enough information for your question. Please try again with a different query.";
  }
  return answer;
}

// LLM self-assessment: does the answer fully address the user's question, or could more context improve it?
export async function llmContextSufficiencyCheck({
  userQuery,
  llmAnswer,
  contextSummary,
  userId
}: {
  userQuery: string;
  llmAnswer: string;
  contextSummary: string;
  userId: string;
}): Promise<'sufficient' | 'insufficient'> {
  const prompt = `User question: ${userQuery}\nAnswer: ${llmAnswer}\nContext used: ${contextSummary}\n\nDoes the answer fully address the user's question, or could more context from the document improve the answer? Reply with 'sufficient' or 'insufficient' only.`;
  const llmResponse = await callLLM({
    userId,
    prompt,
    maxTokens: 8
  });
  if (!llmResponse || !llmResponse.data) {
    return 'sufficient'; // fallback: assume sufficient
  }
  const reply = llmResponse.data.trim().toLowerCase();
  if (reply.includes('insufficient')) return 'insufficient';
  return 'sufficient';
} 