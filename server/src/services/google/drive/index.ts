import { google } from "googleapis";
import { oauth2Client } from "../../../utils/google";
import { setupOAuth2Client } from "../auth/setupClient";
import { parseTextIntoChunks, calculateEmbeddingQualityScore, parseSpreadsheetContent, parsePresentationContent } from "../parse";
import { getFileType } from "../utils/mime";

// Helper to get folder ID by path (e.g., /features/subdir)
async function getFolderIdByPath(drive: any, path: string): Promise<string | null> {
  if (!path || path === '/' || path === '') return 'root';
  const parts = path.replace(/^\/+|\/+$/g, '').split('/');
  let parentId = 'root';
  for (const part of parts) {
    const res = await drive.files.list({
      q: `mimeType = 'application/vnd.google-apps.folder' and '${parentId}' in parents and name = '${part.replace(/'/g, "\\'")}' and trashed = false`,
      fields: 'files(id, name)',
      pageSize: 1,
    });
    if (!res.data.files || res.data.files.length === 0) return null;
    parentId = res.data.files[0].id;
  }
  return parentId;
}

// Helper to get all files (not folders) recursively with their full path
async function getAllFilesWithPaths(drive: any, parentId: string, parentPath: string, recursive: boolean): Promise<any[]> {
  let files: any[] = [];
  let pageToken: string | undefined = undefined;
  do {
    const res = await drive.files.list({
      q: `'${parentId}' in parents and trashed = false`,
      fields: 'nextPageToken, files(id, name, mimeType, parents, modifiedTime)',
      pageSize: 1000,
      pageToken,
    });
    for (const file of res.data.files) {
      if (file.mimeType === 'application/vnd.google-apps.folder') {
        if (recursive) {
          // Recurse into subfolder
          const subFiles = await getAllFilesWithPaths(drive, file.id, parentPath + file.name + '/', recursive);
          files = files.concat(subFiles);
        }
      } else {
        // Add file with its path
        files.push({
          ...file,
          path: parentPath,
        });
      }
    }
    pageToken = res.data.nextPageToken;
  } while (pageToken);
  return files;
}

export async function listDriveFiles(organizationId: string, options?: { path?: string, recursive?: boolean }) {
  await setupOAuth2Client(organizationId);
  const drive = google.drive({ version: "v3", auth: oauth2Client });
  const path = options?.path || '/';
  const recursive = options?.recursive !== false; // default true
  const folderId = await getFolderIdByPath(drive, path);
  if (!folderId) return [];
  const files = await getAllFilesWithPaths(drive, folderId, path.startsWith('/') ? path : '/' + path + '/', recursive);
  return files;
}

export async function getDriveFileContent(organizationId: string, fileId: string, mimeType?: string) {
  await setupOAuth2Client(organizationId);

  const drive = google.drive({ version: "v3", auth: oauth2Client });

  try {
    // If mimeType is not provided, fetch it
    let actualMimeType = mimeType;
    if (!actualMimeType) {
      const meta = await drive.files.get({ fileId, fields: 'mimeType' });
      actualMimeType = meta.data.mimeType || '';
    }

    if (actualMimeType?.startsWith('application/vnd.google-apps.document')) {
      // Google Doc
      const response = await drive.files.export({
        fileId,
        mimeType: 'application/pdf' // or DOCX: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
      });
      return response.data;
    } else if (actualMimeType?.startsWith('application/vnd.google-apps.spreadsheet')) {
      // Google Sheet
      const response = await drive.files.export({
        fileId,
        mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      });
      return response.data;
    } else if (actualMimeType?.startsWith('application/vnd.google-apps.presentation')) {
      // Google Slides
      const response = await drive.files.export({
        fileId,
        mimeType: 'application/pdf'
      });
      return response.data;
    } else {
      // Binary file (PDF, image, etc)
      const response = await drive.files.get({
        fileId: fileId,
        alt: 'media'
      });
      return response.data;
    }
  } catch (error: any) {
    console.error(`Error getting file content for file ${fileId}:`, error);
    throw error;
  }
}

export async function getDriveFileMetadata(organizationId: string, fileId: string) {
  await setupOAuth2Client(organizationId);

  const drive = google.drive({ version: "v3", auth: oauth2Client });
  
  try {
    const response = await drive.files.get({
      fileId: fileId,
      fields: 'id,name,mimeType,createdTime,modifiedTime,size'
    });
    
    return response.data;
  } catch (error: any) {
    console.error(`Error getting file metadata for file ${fileId}:`, error);
    throw error;
  }
}
