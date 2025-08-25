import { Router } from 'express';
import anomalySettingsRouter from './anomaly-settings';

const router = Router();

// Anomaly detection settings routes
router.use('/', anomalySettingsRouter);

// Dashboard settings functionality removed with insights

export default router; 