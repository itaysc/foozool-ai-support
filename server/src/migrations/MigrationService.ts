import MigrationModel, { IMigration } from '../schemas/migration.schema';
import { MigrationRunResult, Migration } from './types';
import { MigrationRegistry } from './MigrationRegistry';

export class MigrationService {
  private registry: MigrationRegistry;

  constructor() {
    this.registry = MigrationRegistry.getInstance();
  }

  /**
   * Get all available migrations
   */
  async getAvailableMigrations(): Promise<Migration[]> {
    return await this.registry.getAllMigrations();
  }

  /**
   * Get migration status for an organization
   */
  async getMigrationStatus(organizationId: string | any): Promise<{
    available: Migration[];
    completed: IMigration[];
    running: IMigration[];
    failed: IMigration[];
  }> {
    const available = await this.getAvailableMigrations();
    const dbMigrations = await MigrationModel.find({ organization: organizationId }).lean();

    const completed = dbMigrations.filter(m => m.status === 'completed');
    const running = dbMigrations.filter(m => m.status === 'running');
    const failed = dbMigrations.filter(m => m.status === 'failed');

    return { available, completed, running, failed };
  }

  /**
   * Check if a specific migration has been completed
   */
  async isMigrationCompleted(organizationId: string | any, migrationName: string): Promise<boolean> {
    const migration = await MigrationModel.findOne({
      organization: organizationId,
      name: migrationName,
      status: 'completed'
    });
    return !!migration;
  }

  /**
   * Check if a migration is currently running
   */
  async isMigrationRunning(organizationId: string | any, migrationName: string): Promise<boolean> {
    const migration = await MigrationModel.findOne({
      organization: organizationId,
      name: migrationName,
      status: 'running'
    });
    return !!migration;
  }

  /**
   * Run a specific migration
   */
  async runMigration(organizationId: string | any, migrationName: string, initiatedBy: string): Promise<{
    migration: IMigration;
    result: MigrationRunResult;
  }> {
    // Check if already completed
    if (await this.isMigrationCompleted(organizationId, migrationName)) {
      const existingMigration = await MigrationModel.findOne({
        organization: organizationId,
        name: migrationName,
        status: 'completed'
      });
      
      return {
        migration: existingMigration!,
        result: {
          name: migrationName,
          databaseType: 'mongo', // fallback
          result: {
            success: true,
            errors: [],
            metadata: { message: 'Migration already completed' }
          },
          startedAt: existingMigration!.startedAt || new Date(),
          completedAt: existingMigration!.completedAt || new Date()
        }
      };
    }

    // Check if currently running
    if (await this.isMigrationRunning(organizationId, migrationName)) {
      throw new Error(`Migration '${migrationName}' is currently running for organization ${organizationId}`);
    }

          // Get migration details
      const migrationInstance = await this.registry.getMigration(migrationName);
      
      // Create migration record
      const migration = new MigrationModel({
        name: migrationName,
        description: migrationInstance?.description || '',
        version: migrationInstance?.version || '1.0.0',
        status: 'running',
        startedAt: new Date(),
        initiatedBy,
        organization: organizationId,
        errorMessages: []
      });

    await migration.save();

    try {
      // Run the migration
      const result = await this.registry.runMigration(migrationName);
      
      // Update migration record
      migration.status = result.result.success ? 'completed' : 'failed';
      migration.completedAt = result.completedAt;
      migration.totalRecords = result.result.totalRecords;
      migration.processedRecords = result.result.processedRecords;
      migration.errorMessages = result.result.errors;
      migration.metadata = {
        ...result.result.metadata,
        databaseType: result.databaseType,
        executionTime: result.result.executionTime
      };

      await migration.save();

      return { migration, result };
    } catch (error) {
      // Update migration record on failure
      migration.status = 'failed';
      migration.completedAt = new Date();
      migration.errorMessages = [(error as Error).message];
      await migration.save();

      throw error;
    }
  }

  /**
   * Run all migrations
   */
  async runAllMigrations(organizationId: string | any, initiatedBy: string): Promise<{
    migrations: IMigration[];
    results: MigrationRunResult[];
  }> {
    const availableMigrations = await this.getAvailableMigrations();
    const migrations: IMigration[] = [];
    const results: MigrationRunResult[] = [];

    for (const migration of availableMigrations) {
      try {
        const { migration: dbMigration, result } = await this.runMigration(
          organizationId, 
          migration.name, 
          initiatedBy
        );
        migrations.push(dbMigration);
        results.push(result);
      } catch (error) {
        console.error(`Failed to run migration ${migration.name}:`, error);
        
        // Create failed migration record
        const failedMigration = new MigrationModel({
          name: migration.name,
          description: migration.description,
          version: migration.version,
          status: 'failed',
          startedAt: new Date(),
          completedAt: new Date(),
          initiatedBy,
          organization: organizationId,
          errorMessages: [(error as Error).message]
        });
        await failedMigration.save();
        
        migrations.push(failedMigration);
        results.push({
          name: migration.name,
          databaseType: migration.databaseType,
          result: {
            success: false,
            errors: [(error as Error).message]
          },
          startedAt: new Date(),
          completedAt: new Date()
        });
      }
    }

    return { migrations, results };
  }

  /**
   * Get migration history for an organization
   */
  async getMigrationHistory(organizationId: string | any): Promise<IMigration[]> {
    return await MigrationModel.find({ organization: organizationId })
      .sort({ createdAt: -1 })
      .lean();
  }

  /**
   * Reset stuck migrations (set running migrations to failed)
   */
  async resetStuckMigrations(organizationId: string | any): Promise<{
    resetCount: number;
    resetMigrations: string[];
  }> {
    const stuckMigrations = await MigrationModel.find({
      organization: organizationId,
      status: 'running'
    });

    if (stuckMigrations.length === 0) {
      return { resetCount: 0, resetMigrations: [] };
    }

    const resetMigrations = stuckMigrations.map(m => m.name);
    
    await MigrationModel.updateMany(
      {
        organization: organizationId,
        status: 'running'
      },
      {
        status: 'failed',
        completedAt: new Date(),
        errorMessages: ['Migration was reset due to being stuck in running state']
      }
    );

    console.log(`🔄 Reset ${stuckMigrations.length} stuck migrations: ${resetMigrations.join(', ')}`);
    
    return {
      resetCount: stuckMigrations.length,
      resetMigrations
    };
  }
} 