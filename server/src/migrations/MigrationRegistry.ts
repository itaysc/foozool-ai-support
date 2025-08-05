import { Migration, MigrationRunResult } from './types';
import fs from 'fs';
import path from 'path';

export class MigrationRegistry {
  private static instance: MigrationRegistry;
  private migrations: Map<string, Migration> = new Map();
  private initialized = false;

  private constructor() {}

  public static getInstance(): MigrationRegistry {
    if (!MigrationRegistry.instance) {
      MigrationRegistry.instance = new MigrationRegistry();
    }
    return MigrationRegistry.instance;
  }

  private async registerMigrations(): Promise<void> {
    if (this.initialized) {
      return;
    }

    try {
      const itemsDir = path.join(__dirname, 'items');
      
      // Check if items directory exists
      if (!fs.existsSync(itemsDir)) {
        console.log('📁 No items directory found, no migrations to register');
        this.initialized = true;
        return;
      }

      // Read all TypeScript files in the items directory
      const files = fs.readdirSync(itemsDir)
        .filter(file => file.endsWith('.ts') && !file.endsWith('.d.ts'));

      console.log(`📁 Found ${files.length} migration files in items directory`);

      for (const file of files) {
        try {
          const filePath = path.join(itemsDir, file);
          const moduleName = path.basename(file, '.ts');
          
          // Dynamic import of the migration module
          const module = await import(`./items/${moduleName}`);
          
          // Look for classes that extend BaseMigration
          const migrationClasses = Object.values(module).filter(
            (exported: any) => 
              typeof exported === 'function' && 
              exported.prototype && 
              exported.prototype.constructor &&
              exported.prototype.constructor.name.includes('Migration')
          );

          for (const MigrationClass of migrationClasses) {
            const migration = new (MigrationClass as any)();
            
            // Verify it implements the Migration interface
            if (migration && typeof migration.run === 'function' && migration.name) {
              this.migrations.set(migration.name, migration);
              console.log(`✅ Registered migration: ${migration.name}`);
            }
          }
        } catch (error) {
          console.error(`❌ Failed to load migration from ${file}:`, error);
        }
      }

      console.log(`📋 Total registered migrations: ${this.migrations.size}`);
      this.initialized = true;
    } catch (error) {
      console.error('❌ Error registering migrations:', error);
      this.initialized = true;
    }
  }

  public async getMigration(name: string): Promise<Migration | undefined> {
    await this.registerMigrations();
    return this.migrations.get(name);
  }

  public async getAllMigrations(): Promise<Migration[]> {
    await this.registerMigrations();
    return Array.from(this.migrations.values());
  }

  public async getMigrationNames(): Promise<string[]> {
    await this.registerMigrations();
    return Array.from(this.migrations.keys());
  }

  public async runMigration(name: string): Promise<MigrationRunResult> {
    const migration = await this.getMigration(name);
    if (!migration) {
      throw new Error(`Migration '${name}' not found`);
    }

    const startedAt = new Date();
    const result = await migration.run();
    const completedAt = new Date();

    return {
      name: migration.name,
      databaseType: migration.databaseType,
      result,
      startedAt,
      completedAt
    };
  }

  public async runAllMigrations(): Promise<MigrationRunResult[]> {
    const results: MigrationRunResult[] = [];
    const migrationNames = await this.getMigrationNames();

    console.log(`🔄 Running all ${migrationNames.length} migrations...`);

    for (const name of migrationNames) {
      try {
        const result = await this.runMigration(name);
        results.push(result);
      } catch (error) {
        console.error(`❌ Failed to run migration ${name}:`, error);
        results.push({
          name,
          databaseType: 'mongo', // fallback
          result: {
            success: false,
            errors: [(error as Error).message]
          },
          startedAt: new Date(),
          completedAt: new Date()
        });
      }
    }

    return results;
  }
} 