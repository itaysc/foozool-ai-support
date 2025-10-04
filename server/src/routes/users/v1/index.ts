import express, { Request, Response } from 'express';
import { createUser, getUsersByOrganization } from '../../../services/users/v1';
import { validateRequest } from '../../../middleware/validateRequest';
import { createUserSchema } from './validations';
import { authenticateJWT } from '../../../middleware/authenticate';
import { hasPermission } from '../../../middleware/permissions';

const router = express.Router();

router.post('/', authenticateJWT, hasPermission('users:create'), validateRequest(createUserSchema), async (req: Request, res: Response): Promise<void> => {
  try {
    // assemble the full jwt from the payload + other parts that are stored in a cookie
    const userRes = await createUser(req.body);
    res.status(userRes.status).json(userRes.payload);
  } catch (err) {
    res.status(500).json({ message: 'Internal server error' });
  }
});

/**
 * GET /users
 * Get all users in the current organization
 */
router.get('/', authenticateJWT, hasPermission('users:read'), async (req: Request, res: Response): Promise<void> => {
  try {
    const usersRes = await getUsersByOrganization();
    res.status(usersRes.status).json(usersRes.payload);
  } catch (err) {
    res.status(500).json({ message: 'Internal server error' });
  }
});

export default router;