import { Migration, MigrationResult, DatabaseType } from './types';

export abstract class BaseMigration implements Migration {
  abstract name: string;
  abstract description: string;
  abstract version: string;
  abstract databaseType: DatabaseType;

  async run(): Promise<MigrationResult> {
    const startTime = Date.now();
    
    try {
      console.log(`🚀 Starting migration: ${this.name}`);
      const result = await this.execute();
      const executionTime = Date.now() - startTime;
      
      console.log(`✅ Migration ${this.name} completed in ${executionTime}ms`);
      return {
        ...result,
        executionTime
      };
    } catch (error) {
      const executionTime = Date.now() - startTime;
      console.error(`❌ Migration ${this.name} failed after ${executionTime}ms:`, error);
      
      return {
        success: false,
        errors: [(error as Error).message],
        executionTime
      };
    }
  }

  protected abstract execute(): Promise<MigrationResult>;
} 