import express from "express";
import { authenticateJWT } from 'src/middleware/authenticate';
import { validateRequest } from 'src/middleware/validateRequest';
import { getSBERTEmbeddingForText } from "../../../services/call-python";
import { searchGoogleDriveFiles } from "../../../qdrant/service";
import { searchGoogleDriveFilesSchema } from '../../google/v1/validations';

const router = express.Router();

// /api/v1/search
router.post("/", authenticateJWT, validateRequest(searchGoogleDriveFilesSchema), async (req, res) => {
    const organizationId = req.user!.organization;
    const { query, limit = 10, chunkType, fileId, fileType, minQualityScore = 0.5 } = req.body;

    if (!organizationId) {
      return res.status(400).json({ error: "Missing organizationId" });
    }

    try {
      // First, get embedding for the query
      const queryEmbeddings = await getSBERTEmbeddingForText([query]);
      
      if (!queryEmbeddings || queryEmbeddings.length === 0) {
        return res.status(500).json({ error: "Failed to generate query embedding" });
      }

      const queryVector = queryEmbeddings[0];

      // Search in Qdrant with enhanced parameters
      const searchResults = await searchGoogleDriveFiles({
        organizationId: organizationId as string,
        queryVector,
        limit,
        chunkType,
        fileId,
        fileType,
        minQualityScore
      });

      res.json({
        success: true,
        results: searchResults,
        query: query,
        totalResults: searchResults.length,
        searchParams: {
          chunkType,
          fileType,
          minQualityScore,
          limit
        }
      });
    } catch (err: any) {
      console.error("❌ Error searching Google Drive files:", err);
      res.status(500).json({ success: false, error: err.message });
    }
});

export default router; 