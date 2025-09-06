import express, { Request, Response } from 'express';
import { authenticateJWT } from '../../../middleware/authenticate';
import { MigrationService } from '../../../migrations/MigrationService';
import { hasPermission } from '../../../middleware/permissions';

const router = express.Router();
const migrationService = new MigrationService();

// Apply authentication middleware to all routes
router.use(authenticateJWT);

/**
 * @route POST /api/v1/migrations/run-all
 * @desc Run all available migrations for the organization
 * @access Private
 */
router.post('/run-all', hasPermission('migrations:run'), async (req: Request, res: Response): Promise<void> => {
  try {
    const user = req.user;
    if (!user) {
      res.status(401).json({
        success: false,
        error: 'Unauthorized - User not found'
      });
      return;
    }

    const organizationId = user.organization.toString();
    const initiatedBy = (user.email as any)?.type || user._id?.toString() || 'unknown';

    console.log(`🚀 Running all migrations for organization ${organizationId} initiated by ${initiatedBy}`);
    
    const { migrations, results } = await migrationService.runAllMigrations(organizationId, initiatedBy);
    
    const successfulMigrations = results.filter(r => r.result.success);
    const failedMigrations = results.filter(r => !r.result.success);
    
    console.log(`✅ Completed running all migrations. Success: ${successfulMigrations.length}, Failed: ${failedMigrations.length}`);

    res.status(200).json({
      success: true,
      message: `Successfully ran ${successfulMigrations.length} migrations${failedMigrations.length > 0 ? `, ${failedMigrations.length} failed` : ''}`,
      data: {
        migrations,
        results,
        summary: {
          total: results.length,
          successful: successfulMigrations.length,
          failed: failedMigrations.length,
          initiatedBy,
          completedAt: new Date().toISOString()
        }
      }
    });

  } catch (error) {
    console.error('❌ Error running migrations:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to run migrations',
      message: (error as Error).message
    });
  }
});

/**
 * @route POST /api/v1/migrations/run/:migrationName
 * @desc Run a specific migration by name
 * @access Private
 */
router.post('/run/:migrationName', hasPermission('migrations:run'), async (req: Request, res: Response): Promise<void> => {
  try {
    const user = req.user;
    if (!user) {
      res.status(401).json({
        success: false,
        error: 'Unauthorized - User not found'
      });
      return;
    }

    const { migrationName } = req.params;
    const organizationId = user.organization.toString();
    const initiatedBy = (user.email as any)?.type || user._id?.toString() || 'unknown';

    console.log(`🚀 Running migration ${migrationName} for organization ${organizationId} initiated by ${initiatedBy}`);
    
    const { migration, result } = await migrationService.runMigration(organizationId, migrationName, initiatedBy);
    
    if (result.result.success) {
      console.log(`✅ Migration ${migrationName} completed successfully`);
      res.status(200).json({
        success: true,
        message: 'Migration completed successfully',
        data: {
          migration,
          result,
          initiatedBy,
          completedAt: new Date().toISOString()
        }
      });
    } else {
      console.log(`❌ Migration ${migrationName} failed`);
      res.status(500).json({
        success: false,
        error: 'Migration failed',
        data: {
          migration,
          result,
          initiatedBy,
          failedAt: new Date().toISOString()
        }
      });
    }

  } catch (error) {
    console.error('❌ Error running migration:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to run migration',
      message: (error as Error).message
    });
  }
});

/**
 * @route GET /api/v1/migrations/status
 * @desc Get migration status and available migrations
 * @access Private
 */
router.get('/status', hasPermission('migrations:run'), async (req: Request, res: Response): Promise<void> => {
  try {
    const user = req.user;
    if (!user) {
      res.status(401).json({
        success: false,
        error: 'Unauthorized - User not found'
      });
      return;
    }

    const organizationId = user.organization.toString();
    const { available, completed, running, failed } = await migrationService.getMigrationStatus(organizationId);

    res.status(200).json({
      success: true,
      data: {
        available: available.map(m => ({
          name: m.name,
          description: m.description,
          version: m.version,
          databaseType: m.databaseType
        })),
        status: {
          total: available.length,
          completed: completed.length,
          running: running.length,
          failed: failed.length
        },
        lastChecked: new Date().toISOString(),
        checkedBy: (user.email as any)?.type || user._id?.toString() || 'unknown'
      }
    });

  } catch (error) {
    console.error('❌ Error getting migration status:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to get migration status',
      message: (error as Error).message
    });
  }
});

/**
 * @route GET /api/v1/migrations/history
 * @desc Get detailed migration history for the organization
 * @access Private
 */
router.get('/history', hasPermission('migrations:run'), async (req: Request, res: Response): Promise<void> => {
  try {
    const user = req.user;
    if (!user) {
      res.status(401).json({
        success: false,
        error: 'Unauthorized - User not found'
      });
      return;
    }

    const organizationId = user.organization.toString();
    const migrationHistory = await migrationService.getMigrationHistory(organizationId);

    res.status(200).json({
      success: true,
      data: {
        migrations: migrationHistory,
        total: migrationHistory.length,
        completed: migrationHistory.filter(m => m.status === 'completed').length,
        running: migrationHistory.filter(m => m.status === 'running').length,
        failed: migrationHistory.filter(m => m.status === 'failed').length,
        checkedBy: (user.email as any)?.type || user._id?.toString() || 'unknown',
        checkedAt: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('❌ Error getting migration history:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to get migration history',
      message: (error as Error).message
    });
  }
});

/**
 * @route POST /api/v1/migrations/reset-stuck
 * @desc Reset migrations that are stuck in running status
 * @access Private
 */
router.post('/reset-stuck', hasPermission('migrations:run'), async (req: Request, res: Response): Promise<void> => {
  try {
    const user = req.user;
    if (!user) {
      res.status(401).json({
        success: false,
        error: 'Unauthorized - User not found'
      });
      return;
    }

    const organizationId = user.organization.toString();
    const initiatedBy = (user.email as any)?.type || user._id?.toString() || 'unknown';

    console.log(`🔄 Resetting stuck migrations for organization ${organizationId} initiated by ${initiatedBy}`);
    
    const { resetCount, resetMigrations } = await migrationService.resetStuckMigrations(organizationId);
    
    res.status(200).json({
      success: true,
      message: resetCount > 0 ? `Reset ${resetCount} stuck migrations` : 'No stuck migrations found',
      data: {
        resetCount,
        resetMigrations,
        initiatedBy,
        completedAt: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('❌ Error resetting stuck migrations:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to reset stuck migrations',
      message: (error as Error).message
    });
  }
});

/**
 * @route GET /api/v1/migrations/check-created-at
 * @desc Check if created_at migration is needed by sampling Qdrant data
 * @access Private
 */
router.get('/check-created-at', hasPermission('migrations:run'), async (req: Request, res: Response): Promise<void> => {
  try {
    const user = req.user;
    if (!user) {
      res.status(401).json({
        success: false,
        error: 'Unauthorized - User not found'
      });
      return;
    }

    // Import QdrantService dynamically to avoid circular dependencies
    const { default: QdrantService } = await import('../../../qdrant/service');
    const { ticketCollectionConfig } = await import('../../../qdrant/schemas/ticket');
    const qdrantService = new QdrantService();
    
    // Sample a few tickets to check their created_at format
    const sampleResults = await qdrantService.client.scroll(ticketCollectionConfig.name, {
      limit: 10,
      with_payload: true,
      with_vector: false
    });

    const tickets = sampleResults.points || [];
    const stringTimestamps = tickets.filter(t => 
      t.payload?.created_at && typeof t.payload.created_at === 'string'
    ).length;
    
    const integerTimestamps = tickets.filter(t => 
      t.payload?.created_at && typeof t.payload.created_at === 'number'
    ).length;

    const needsMigration = stringTimestamps > 0;
    const migrationStatus = needsMigration ? 'needed' : 'not_needed';

    res.status(200).json({
      success: true,
      data: {
        migrationStatus,
        needsMigration,
        sampleSize: tickets.length,
        stringTimestamps,
        integerTimestamps,
        checkedAt: new Date().toISOString(),
        checkedBy: (user.email as any)?.type || user._id?.toString() || 'unknown'
      }
    });

  } catch (error) {
    console.error('❌ Error checking migration status:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to check migration status',
      message: (error as Error).message
    });
  }
});

export default router; 