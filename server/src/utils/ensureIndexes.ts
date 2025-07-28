import mongoose from 'mongoose';
import path from 'path';
import fs from 'fs';

/**
 * Recursively import all .schema.ts files in a directory
 */
async function importAllSchemas(dir: string) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      await importAllSchemas(fullPath);
    } else if (entry.isFile() && entry.name.endsWith('.schema.ts')) {
      // Dynamic import (convert to relative path from CWD, remove extension)
      const relPath = path.relative(process.cwd(), fullPath).replace(/\\/g, '/').replace(/\.ts$/, '');
      await import(relPath.startsWith('.') ? relPath : './' + relPath);
    }
  }
}

/**
 * Ensures all database indexes are created for optimal query performance
 * This function should be called after the database connection is established
 */
export async function ensureIndexes(): Promise<void> {
  try {
    console.log('🔍 Ensuring database indexes for all schemas...');

    // Check if we're connected to MongoDB
    if (mongoose.connection.readyState !== 1) {
      console.warn('⚠️ MongoDB not connected, skipping index creation');
      return;
    }

    // Recursively import all schema files to register models
    const schemasDir = path.join(__dirname, '../schemas');
    await importAllSchemas(schemasDir);

    // Get all registered model names
    const modelNames = mongoose.modelNames();
    console.log(`📦 Found ${modelNames.length} mongoose models:`, modelNames);

    // Create indexes for each model
    for (const modelName of modelNames) {
      const model = mongoose.model(modelName);
      try {
        console.log(`🔧 Creating indexes for model: ${modelName}`);
        await model.createIndexes();
        const indexes = await model.collection.getIndexes();
        console.log(`✅ Indexes for ${modelName}:`, Object.keys(indexes));
      } catch (err) {
        console.error(`❌ Error creating indexes for model ${modelName}:`, err);
      }
    }

    console.log('\n✅ All database indexes are ready for optimal performance!');
  } catch (error) {
    console.error('❌ Error ensuring indexes:', error);
    // Don't throw error to prevent application startup failure
    // Indexes will be created automatically by Mongoose if needed
  }
}

/**
 * Get index statistics for monitoring
 */
export async function getIndexStats(): Promise<Record<string, any>> {
  const stats: Record<string, any> = {};
  try {
    // Ensure all schemas are loaded
    const schemasDir = path.join(__dirname, '../schemas');
    await importAllSchemas(schemasDir);
    for (const modelName of mongoose.modelNames()) {
      try {
        stats[modelName] = await mongoose.model(modelName).collection.aggregate([
          { $indexStats: {} }
        ]).toArray();
      } catch (err) {
        stats[modelName] = { error: String(err) };
      }
    }
    return stats;
  } catch (error) {
    console.error('Error getting index stats:', error);
    return stats;
  }
} 