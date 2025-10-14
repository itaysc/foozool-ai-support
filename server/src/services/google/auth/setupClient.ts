import { oauth2Client } from "../../../utils/google";
import { TokenModel } from "../../../schemas/token.schema";
import { google } from "googleapis";

/**
 * Sets up OAuth2 client with credentials and handles token refresh
 * @param organizationId - The organization ID to get tokens for
 * @returns Promise<void> - Resolves when client is set up
 */
export async function setupOAuth2Client(organizationId: string): Promise<void> {
  // Get tokens from DB
  const tokenDoc = await TokenModel.findOne({ organizationId, type: "google" });
  if (!tokenDoc) {
    throw new Error("No Google token found for this organization");
  }

  oauth2Client.setCredentials({
    access_token: tokenDoc.token,
    refresh_token: tokenDoc.refreshToken,
  });

  // Auto-refresh token if expired
  oauth2Client.on('tokens', async (tokens) => {
    if (tokens.access_token) {
      console.log(`🔄 Refreshed access_token for org ${organizationId}`);
      await TokenModel.findOneAndUpdate(
        { organizationId, type: "google" },
        { token: tokens.access_token }
      );
    }
  });

  // Test the token by making a simple API call
  try {
    const drive = google.drive({ version: 'v3', auth: oauth2Client });
    await drive.about.get({ fields: 'user' });
    console.log(`✅ Google token is valid for org ${organizationId}`);
  } catch (error: any) {
    console.error(`❌ Google token is invalid for org ${organizationId}:`, error.message);
    
    // If token is invalid, remove it from DB so user can re-authenticate
    if (error.message.includes('invalid_grant') || error.message.includes('invalid_token')) {
      console.log(`🗑️ Removing invalid Google token for org ${organizationId}`);
      await TokenModel.findOneAndDelete({ organizationId, type: "google" });
      throw new Error("Google token has expired. Please reconnect your Google account in settings.");
    }
    
    throw error;
  }
} 