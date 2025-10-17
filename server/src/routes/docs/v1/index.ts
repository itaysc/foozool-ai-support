import express, { Request, Response } from 'express';
import { 
  createDocument, 
  getDocumentsByOrganization, 
  getDocumentById, 
  updateDocument, 
  deleteDocument,
  CreateDocumentRequest 
} from '../../../services/docs/v1';
import { 
  createFolder,
  getFolderContents,
  getFolderTree,
  renameFolder,
  deleteFolder,
  moveItem,
  fixMalformedFolderPaths
} from '../../../services/docs/folder.service';
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
 * GET /docs/folders
 * Get root folder contents
 */
router.get('/folders', authenticateJWT, hasPermission('docs:read'), async (req: Request, res: Response): Promise<void> => {
  try {
    const result = await getFolderContents('/');
    res.status(200).json(result);
  } catch (err) {
    res.status(500).json({ message: 'Internal server error' });
  }
});

/**
 * GET /docs/folders/tree
 * Get complete folder tree structure
 */
router.get('/folders/tree', authenticateJWT, hasPermission('docs:read'), async (req: Request, res: Response): Promise<void> => {
  try {
    const result = await getFolderTree();
    res.status(200).json(result);
  } catch (err) {
    res.status(500).json({ message: 'Internal server error' });
  }
});

        /**
         * GET /docs/folders/:path
         * Get folder contents by path
         */
        router.get('/folders/*', authenticateJWT, hasPermission('docs:read'), async (req: Request, res: Response): Promise<void> => {
          try {
            const folderPath = req.params[0] ? `/${decodeURIComponent(req.params[0])}` : '/';
            const parentFolderId = req.query.parentFolderId as string || null;
            console.log('🔍 GET /docs/folders/* - Decoded folderPath:', folderPath, 'parentFolderId:', parentFolderId);
            const result = await getFolderContents(folderPath, parentFolderId);
            res.status(200).json(result);
          } catch (err) {
            console.error('❌ Error in GET /docs/folders/*:', err);
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

/**
 * POST /docs/folders
 * Create a new folder
 */
router.post('/folders', authenticateJWT, hasPermission('docs:create'), async (req: Request, res: Response): Promise<void> => {
  try {
    const { folderName, folderPath } = req.body;
    console.log('🔍 POST /docs/folders received:', { folderName, folderPath, body: req.body });
    const result = await createFolder(folderName, folderPath); // folderPath is actually the parent path
    res.status(result.status).json(result.payload);
  } catch (err) {
    console.error('❌ Error in POST /docs/folders:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
});

/**
 * PUT /docs/folders/:id
 * Rename a folder
 */
router.put('/folders/:id', authenticateJWT, hasPermission('docs:update'), async (req: Request, res: Response): Promise<void> => {
  try {
    const { newName } = req.body;
    const result = await renameFolder(req.params.id, newName);
    res.status(result.status).json(result.payload);
  } catch (err) {
    res.status(500).json({ message: 'Internal server error' });
  }
});

/**
 * DELETE /docs/folders/:id
 * Delete a folder
 */
router.delete('/folders/:id', authenticateJWT, hasPermission('docs:delete'), async (req: Request, res: Response): Promise<void> => {
  try {
    const result = await deleteFolder(req.params.id);
    res.status(result.status).json(result.payload);
  } catch (err) {
    res.status(500).json({ message: 'Internal server error' });
  }
});

/**
 * POST /docs/:id/move
 * Move a document or folder to a new location
 */
router.post('/:id/move', authenticateJWT, hasPermission('docs:update'), async (req: Request, res: Response): Promise<void> => {
  try {
    const { folderPath } = req.body;
    const result = await moveItem(req.params.id, folderPath);
    res.status(result.status).json(result.payload);
  } catch (err) {
    res.status(500).json({ message: 'Internal server error' });
  }
});

/**
 * POST /docs/folders/fix-paths
 * Fix malformed folder paths (utility endpoint)
 */
router.post('/folders/fix-paths', authenticateJWT, hasPermission('docs:update'), async (req: Request, res: Response): Promise<void> => {
  try {
    const result = await fixMalformedFolderPaths();
    res.status(result.status).json(result.payload);
  } catch (err) {
    res.status(500).json({ message: 'Internal server error' });
  }
});

export default router;
