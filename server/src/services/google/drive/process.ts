import { listDriveFiles } from './index';
import { getProcessedGoogleFileIds } from '../../../qdrant/service';

/**
 * Get the list of Google Drive file IDs to process, filtering out already-processed files in Qdrant.
 * If fileIds is provided, use those; otherwise, list files by path/recursive options.
 */
export async function getUnprocessedGoogleFileIds({
  organizationId,
  fileIds,
  path,
  recursive
}: {
  organizationId: string;
  fileIds?: string[];
  path?: string;
  recursive?: boolean;
}): Promise<string[]> {
  let filesToProcess: string[] = [];

  if (fileIds && Array.isArray(fileIds) && fileIds.length > 0) {
    filesToProcess = fileIds;
  } else {
    const allFiles = await listDriveFiles(organizationId, {
      path,
      recursive,
    });
    filesToProcess = allFiles?.map(file => file.id).filter((id): id is string => Boolean(id)) || [];
  }

  // Filter out files already processed in Qdrant
  const alreadyProcessedIds = await getProcessedGoogleFileIds(organizationId);
  const newFilesToProcess = filesToProcess.filter(id => !alreadyProcessedIds.includes(id));
  return newFilesToProcess;
} 