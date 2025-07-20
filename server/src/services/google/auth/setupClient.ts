import { oauth2Client } from "../../../utils/google";
import { TokenModel } from "../../../schemas/token.schema";

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
} 