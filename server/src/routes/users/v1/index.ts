import express, { Request, Response } from 'express';
import { createUser } from '../../../services/users/v1';
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


export default router;