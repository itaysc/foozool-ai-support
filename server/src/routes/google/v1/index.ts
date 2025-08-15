import express, { Request, Response } from 'express';
import { oauth2Client, SCOPES } from "../../../utils/google";
import { handleGoogleCallback } from "../../../services/google/auth";
import { authenticateJWT } from '../../../../middleware/authenticate';
import { validateRequest } from '../../../../middleware/validateRequest';
import { listDriveFiles } from '../../../../services/google/drive';
import { processGoogleDriveFiles } from "../../../qdrant/service";
import { processGoogleDriveFilesSchema, searchGoogleDriveFilesSchema } from './validations';
import { getUnprocessedGoogleFileIds } from '../../../services/google/drive/process';

const router = express.Router();

// Step 1: Redirect user/org admin to Google Consent Screen
router.get("/connect", authenticateJWT, (req, res) => {
  const organizationId = req.user!.organization;

  if (!organizationId) {
    return res.status(400).send("Missing organizationId");
  }

  const url = oauth2Client.generateAuthUrl({
    access_type: "offline",        // Needed to get refresh_token
    scope: SCOPES,
    prompt: "consent",             // Force refresh_token on every reconnect
    state: organizationId.toString(), // Pass organizationId for multi-tenant
  });

  res.status(302).redirect(url);
});

// Step 2: Google redirects back here after consent
router.get("/callback", async (req, res) => {
  const { code, state: organizationId } = req.query;

  if (!code || !organizationId) {
    return res.status(400).send("Missing code or organizationId");
  }

  try {
    await handleGoogleCallback(code as string, organizationId as string);
    res.send("Google Drive connected successfully ✅");
  } catch (err) {
    console.error("Google OAuth callback error:", err);
    res.status(500).send("Failed to connect Google Drive");
  }
});

router.get("/drive/files", authenticateJWT, async (req, res) => {
    const organizationId = req.user!.organization;
    const { path, recursive } = req.query;

    if (!organizationId) {
      return res.status(400).json({ error: "Missing organizationId" });
    }
  
    try {
      const files = await listDriveFiles(organizationId as string, {
        path: typeof path === 'string' ? path : undefined,
        recursive: recursive === undefined ? undefined : recursive === 'true' || recursive === '1',
      });
      res.json({ success: true, files });
    } catch (err: any) {
      console.error("❌ Error listing Google Drive files:", err);
      res.status(500).json({ success: false, error: err.message });
    }
  });

// Process Google Drive files and store in Qdrant
router.post("/drive/process", authenticateJWT, validateRequest(processGoogleDriveFilesSchema), async (req, res) => {
    const organizationId = req.user!.organization;
    const { fileIds } = req.body;
    const { path, recursive } = req.query;

    if (!organizationId) {
      return res.status(400).json({ error: "Missing organizationId" });
    }

    try {
      // Use the new service function to get only unprocessed file IDs
      const newFilesToProcess = await getUnprocessedGoogleFileIds({
        organizationId: organizationId as string,
        fileIds,
        path: typeof path === 'string' ? path : undefined,
        recursive: recursive === undefined ? undefined : recursive === 'true' || recursive === '1',
      });
      console.log(`Will process ${newFilesToProcess.length} new files.`);

      if (newFilesToProcess.length === 0) {
        return res.status(400).json({ 
          success: false, 
          error: "No new files to process (all files already processed)" 
        });
      }
      
      const result = await processGoogleDriveFiles({
        organizationId: organizationId as string,
        fileIds: newFilesToProcess
      });

      res.json({
        success: result.success,
        processedFiles: result.processedFiles,
        totalChunks: result.totalChunks,
        errors: result.errors,
        totalFilesFound: newFilesToProcess.length,
        processingStats: result.processingStats
      });
    } catch (err: any) {
      console.error("❌ Error processing Google Drive files:", err);
      res.status(500).json({ success: false, error: err.message });
    }
});

export default router;
