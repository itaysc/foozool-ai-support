import { Router } from 'express';
import dashboardSettingsRoutes from './dashboard-settings';

const router = Router();

// Dashboard settings routes
router.use('/', dashboardSettingsRoutes);

export default router; 