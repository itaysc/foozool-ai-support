import express, { Request, Response } from 'express';
import { authenticateJWT } from '../../../middleware/authenticate';
import { validateRequest } from '../../../middleware/validateRequest';
import { searchGoogleDriveFilesSchema } from '../../google/v1/validations';
import { ragSearch } from '../../../services/search';

const router = express.Router();

// /api/v1/search
router.post("/", authenticateJWT, validateRequest(searchGoogleDriveFilesSchema), async (req, res) => {
    const { query, limit = 10, minQualityScore = 0.5 } = req.body;

    try {
      const ragResult = await ragSearch({
        userQuery: query,
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