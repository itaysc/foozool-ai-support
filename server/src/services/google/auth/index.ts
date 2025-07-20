import { oauth2Client } from "../../../utils/google";
import { TokenModel } from "../../../schemas/token.schema";

export async function handleGoogleCallback(code: string, organizationId: string) {
  try {
  // Exchange code for tokens
  const { tokens } = await oauth2Client.getToken(code);
  oauth2Client.setCredentials(tokens);

  if (!tokens.access_token || !tokens.refresh_token) {
    throw new Error("Missing access_token or refresh_token from Google");
  }

  // Upsert token for this organization
  await TokenModel.findOneAndUpdate(
    { organizationId, type: "google" },
    {
      token: tokens.access_token,
      refreshToken: tokens.refresh_token,
      type: "google",
      description: "Google Drive OAuth tokens",
    },
    { upsert: true, new: true }
  );

  console.log(`✅ Stored Google tokens for org ${organizationId}`);
  } catch (error) {
    console.error("❌ Error handling Google callback:", error);
    throw new Error("Failed to handle Google callback");
  }
}
