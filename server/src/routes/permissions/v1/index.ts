import express, { Request, Response } from 'express';
import { authenticateJWT } from '../../../middleware/authenticate';
import { hasPermission } from '../../../middleware/permissions';
import { PermissionModel } from '../../../schemas/permission.schema';
import { RoleModel } from '../../../schemas/role.schema';

const router = express.Router();

// Admin-only: Create a new permission and optionally assign to roles
router.post('/', authenticateJWT, hasPermission('roles:read'), async (req: Request, res: Response): Promise<void> => {
  try {
    const { key, name, description, roles } = req.body as { key: string; name?: string; description?: string; roles?: string[] };
    if (!key) {
      res.status(400).json({ status: 400, error: 'key is required' });
      return;
    }

    const permissionDoc = await PermissionModel.findOneAndUpdate(
      { key },
      { $setOnInsert: { key, name: name || key, description } },
      { upsert: true, new: true }
    ).lean();

    // Optionally assign to roles (by role name)
    if (Array.isArray(roles) && roles.length > 0) {
      await RoleModel.updateMany(
        { name: { $in: roles.map(r => r.toLowerCase()) } },
        { $addToSet: { permissions: key } }
      );
    }

    res.status(201).json({ status: 201, payload: permissionDoc });
  } catch (error: any) {
    console.error('Error creating permission:', error);
    res.status(500).json({ status: 500, error: 'Internal server error', message: error.message });
  }
});

// Admin-only: List all permissions
router.get('/', authenticateJWT, hasPermission('roles:read'), async (_req: Request, res: Response): Promise<void> => {
  try {
    const permissions = await PermissionModel.find({}).sort({ key: 1 }).lean();
    res.status(200).json({ status: 200, payload: permissions });
  } catch (error: any) {
    res.status(500).json({ status: 500, error: 'Internal server error', message: error.message });
  }
});

// Admin-only: Create a new role with optional permission keys
router.post('/roles', authenticateJWT, hasPermission('roles:read'), async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, description, permissions } = req.body as { name: string; description?: string; permissions?: string[] };
    if (!name) {
      res.status(400).json({ status: 400, error: 'name is required' });
      return;
    }
    const role = await RoleModel.findOneAndUpdate(
      { name: name.toLowerCase() },
      { $set: { description, permissions: Array.isArray(permissions) ? permissions : [] } },
      { upsert: true, new: true }
    ).lean();

    res.status(201).json({ status: 201, payload: role });
  } catch (error: any) {
    console.error('Error creating role:', error);
    res.status(500).json({ status: 500, error: 'Internal server error', message: error.message });
  }
});

// Admin-only: List all roles
router.get('/roles', authenticateJWT, hasPermission('roles:read'), async (_req: Request, res: Response): Promise<void> => {
  try {
    const roles = await RoleModel.find({}).sort({ name: 1 }).lean();
    res.status(200).json({ status: 200, payload: roles });
  } catch (error: any) {
    res.status(500).json({ status: 500, error: 'Internal server error', message: error.message });
  }
});

export default router;


