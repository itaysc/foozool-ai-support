import express from "express";
import { authenticateJWT } from 'src/middleware/authenticate';
import { validateRequest } from 'src/middleware/validateRequest';
import { searchGoogleDriveFilesSchema } from '../../google/v1/validations';
import { ragSearch } from '../../../services/search';

const router = express.Router();

// /api/v1/search
router.post("/", authenticateJWT, validateRequest(searchGoogleDriveFilesSchema), async (req, res) => {
    const organizationId = req.user!.organization;
    const userId = req.user!._id.toString();
    const { query, limit = 10, minQualityScore = 0.5 } = req.body;

    if (!organizationId) {
      return res.status(400).json({ error: "Missing organizationId" });
    }

    try {
      const ragResult = await ragSearch({
        userQuery: query,
        organizationId: String(organizationId),
        userId,
        limit,
        minQualityScore
      });
      res.json({
        success: true,
        answer: ragResult.answer,
        sources: ragResult.sources,
        llmQueries: ragResult.llmQueries
      });
    } catch (err: any) {
      console.error("❌ Error in RAG search:", err);
      res.status(500).json({ success: false, error: err.message });
    }
});

export default router; 