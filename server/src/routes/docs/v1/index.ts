import express, { Request, Response } from 'express';
import { 
  createDocument, 
  getDocumentsByOrganization, 
  getDocumentById, 
  updateDocument, 
  deleteDocument,
  CreateDocumentRequest 
} from '../../../services/docs/v1';
import { authenticateJWT } from '../../../middleware/authenticate';
import { hasPermission } from '../../../middleware/permissions';

const router = express.Router();

/**
 * POST /docs
 * Create a new document
 */
router.post('/', authenticateJWT, hasPermission('docs:create'), async (req: Request, res: Response): Promise<void> => {
  try {
    const result = await createDocument(req.body as CreateDocumentRequest);
    res.status(result.status).json(result.payload);
  } catch (err) {
    res.status(500).json({ message: 'Internal server error' });
  }
});

/**
 * GET /docs
 * Get all documents for the current organization
 */
router.get('/', authenticateJWT, hasPermission('docs:read'), async (req: Request, res: Response): Promise<void> => {
  try {
    const result = await getDocumentsByOrganization();
    res.status(result.status).json(result.payload);
  } catch (err) {
    res.status(500).json({ message: 'Internal server error' });
  }
});

/**
 * GET /docs/:id
 * Get a specific document by ID
 */
router.get('/:id', authenticateJWT, hasPermission('docs:read'), async (req: Request, res: Response): Promise<void> => {
  try {
    const result = await getDocumentById(req.params.id);
    res.status(result.status).json(result.payload);
  } catch (err) {
    res.status(500).json({ message: 'Internal server error' });
  }
});

/**
 * PUT /docs/:id
 * Update a specific document
 */
router.put('/:id', authenticateJWT, hasPermission('docs:update'), async (req: Request, res: Response): Promise<void> => {
  try {
    const result = await updateDocument(req.params.id, req.body);
    res.status(result.status).json(result.payload);
  } catch (err) {
    res.status(500).json({ message: 'Internal server error' });
  }
});

/**
 * DELETE /docs/:id
 * Delete a specific document
 */
router.delete('/:id', authenticateJWT, hasPermission('docs:delete'), async (req: Request, res: Response): Promise<void> => {
  try {
    const result = await deleteDocument(req.params.id);
    res.status(result.status).json(result.payload);
  } catch (err) {
    res.status(500).json({ message: 'Internal server error' });
  }
});

export default router;
