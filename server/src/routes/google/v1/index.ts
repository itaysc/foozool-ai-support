import express from "express";
import { oauth2Client, SCOPES } from "../../../utils/google";
import { handleGoogleCallback } from "../../../services/google/auth";
import { authenticateJWT } from 'src/middleware/authenticate';

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

  res.redirect(url);
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

export default router;
