export type DatabaseType = 'mongo' | 'qdrant' | 'elasticsearch';

export interface MigrationResult {
  success: boolean;
  totalRecords?: number;
  processedRecords?: number;
  errors: string[];
  metadata?: Record<string, any>;
  executionTime?: number; // in milliseconds
}

export interface MigrationRunResult {
  name: string;
  databaseType: DatabaseType;
  result: MigrationResult;
  startedAt: Date;
  completedAt: Date;
}

export interface Migration {
  name: string;
  description: string;
  version: string;
  databaseType: DatabaseType;
  run(): Promise<MigrationResult>;
} 