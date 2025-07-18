import { google } from "googleapis";
import { TokenModel } from "../../../schemas/token.schema";
import { oauth2Client } from "../../../utils/google";

export async function listDriveFiles(organizationId: string) {
  // Get tokens from DB
  const tokenDoc = await TokenModel.findOne({ organizationId, type: "google" });
  if (!tokenDoc) throw new Error("No Google token found for this organization");

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

  const drive = google.drive({ version: "v3", auth: oauth2Client });
  const res = await drive.files.list({
    pageSize: 10,
    fields: "files(id, name, mimeType, modifiedTime)",
  });

  return res.data.files;
}
