import express, { Request, Response } from 'express';
import { oauth2Client, SCOPES } from "../../../utils/google";
import { handleGoogleCallback } from "../../../services/google/auth";
import { authenticateJWT } from '../../../middleware/authenticate';
import { validateRequest } from '../../../middleware/validateRequest';
import { listDriveFiles } from '../../../services/google/drive';
import { processGoogleDriveFiles } from "../../../qdrant/service";
import { processGoogleDriveFilesSchema, searchGoogleDriveFilesSchema } from './validations';
import { getUnprocessedGoogleFileIds } from '../../../services/google/drive/process';
import { hasPermission } from '../../../middleware/permissions';
import { TokenModel } from '../../../schemas/token.schema';
import { google } from 'googleapis';
import { setupOAuth2Client } from '../../../services/google/auth/setupClient';

const router = express.Router();

// Step 1: Redirect user/org admin to Google Consent Screen
router.get("/connect", authenticateJWT, hasPermission('google:connect'), (req, res) => {
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

  // Return the URL instead of redirecting to avoid CORS issues
  res.json({ 
    success: true, 
    redirectUrl: url,
    message: "Google OAuth URL generated successfully"
  });
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

router.get("/drive/files", authenticateJWT, hasPermission('google:connect'), async (req, res) => {
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
router.post("/drive/process", authenticateJWT, hasPermission('google:connect'), validateRequest(processGoogleDriveFilesSchema), async (req, res) => {
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

// Check if Google token exists for the organization
router.get("/token-status", authenticateJWT, async (req, res) => {
  const organizationId = req.user!.organization;

  console.log('🔍 Checking Google token status for org:', organizationId);

  if (!organizationId) {
    return res.status(400).json({ error: "Missing organizationId" });
  }

  try {
    const tokenDoc = await TokenModel.findOne({ organizationId, type: "google" });
    console.log('🔍 Token doc found:', !!tokenDoc);
    
    // If token exists, test if it's still valid
    if (tokenDoc) {
      try {
        await setupOAuth2Client(organizationId as string);
        console.log('✅ Token is valid');
      } catch (error: any) {
        console.log('❌ Token is invalid, removing from DB');
        await TokenModel.findOneAndDelete({ organizationId, type: "google" });
        return res.json({ 
          success: true, 
          hasToken: false,
          message: "Google token has expired. Please reconnect your Google account."
        });
      }
    }
    
    res.json({ 
      success: true, 
      hasToken: !!tokenDoc,
      message: tokenDoc ? "Google token found" : "No Google token found"
    });
  } catch (err: any) {
    console.error("❌ Error checking Google token:", err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// Create a new Google Doc
router.post("/docs/create", authenticateJWT, hasPermission('google:connect'), async (req, res) => {
  const organizationId = req.user!.organization;
  const { title, customerName } = req.body;

  console.log('📝 Creating Google Doc for org:', organizationId, 'customer:', customerName);

  if (!organizationId) {
    return res.status(400).json({ error: "Missing organizationId" });
  }

  try {
    // Setup OAuth2 client with the organization's tokens
    console.log('🔧 Setting up OAuth2 client...');
    await setupOAuth2Client(organizationId as string);
    console.log('✅ OAuth2 client setup complete');

    // Create Google Docs API client
    const docs = google.docs({ version: 'v1', auth: oauth2Client });
    const drive = google.drive({ version: 'v3', auth: oauth2Client });

    // Create a new document using Docs API
    const docTitle = title || `Meeting Summary - ${customerName || 'Customer'} - ${new Date().toLocaleDateString()}`;
    console.log('📄 Creating document with title:', docTitle);
    
    const createResponse = await docs.documents.create({
      requestBody: {
        title: docTitle,
      },
    });

    const documentId = createResponse.data.documentId;
    const documentUrl = `https://docs.google.com/document/d/${documentId}/edit`;
    console.log('✅ Document created with ID:', documentId);

    // Add formatted content with professional template
    console.log('📝 Adding formatted content with professional template...');
    await docs.documents.batchUpdate({
      documentId: documentId!,
      requestBody: {
        requests: [
          // Insert our template content
          {
            insertText: {
              location: { index: 1 },
              text: `Meeting Summary

📅 Meeting Details
Customer: ${customerName || 'N/A'}
Date: ${new Date().toLocaleDateString()}
Meeting Type:
Attendees:
Duration:

---

📋 Agenda

•
•
•

📝 Meeting Notes


✅ Action Items

□
□
□

🎯 Next Steps

•
•
•`,
            },
          },
          // Format the title
          {
            updateTextStyle: {
              range: {
                startIndex: 1,
                endIndex: 16,
              },
              textStyle: {
                bold: true,
                fontSize: { magnitude: 18, unit: 'PT' },
              },
              fields: 'bold,fontSize',
            },
          },
        ],
      },
    });
    console.log('✅ Professional template with date instructions added');

    res.json({
      success: true,
      documentId,
      documentUrl,
      title: docTitle,
    });
  } catch (err: any) {
    console.error("❌ Error creating Google Doc:", err);
    console.error("❌ Error details:", {
      message: err.message,
      code: err.code,
      status: err.status,
      errors: err.errors
    });
    res.status(500).json({ success: false, error: err.message, details: err.errors });
  }
});

export default router;
