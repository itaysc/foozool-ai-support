# Database Migration Script: Local to Production

This script allows you to copy all data from your local database to your production database. It will migrate all collections while preserving data integrity.

## Features

- **Complete Data Migration**: Migrates all collections from local to production
- **Data Safety**: First deletes all existing data in production, then copies fresh data from local
- **Batch Processing**: Processes documents in configurable batches for memory efficiency
- **Error Handling**: Comprehensive error reporting and logging
- **Dry Run Mode**: Test the migration without actually copying data
- **Progress Tracking**: Real-time progress updates during migration

## Collections Migrated

The script migrates the following collections:
- `users` - User accounts and authentication
- `organizations` - Organization data
- `llmusages` - LLM usage tracking
- `llmprices` - LLM pricing information
- `tickets` - Support tickets
- `seedtracks` - Seed tracking data
- `products` - Product information
- `tokens` - Authentication tokens
- `actionthresholds` - Action threshold configurations
- `actionlogs` - Action logging data
- `customertiers` - Customer tier definitions
- `webhooks` - Webhook configurations
- `crms` - CRM data
- `thresholdmisses` - Threshold miss tracking

## Prerequisites

1. **Environment Variables**: Ensure the following environment variables are set:
   ```bash
   # Local database connection
   DB_CONNECTION_STRING_LOCAL=mongodb://localhost:27017/your_local_db
   # OR for Docker
   DB_CONNECTION_STRING_LOCAL_DOCKER=mongodb://mongodb:27017/your_local_db
   
   # Production database connection
   ATLAS_CONNECTION_STRING=mongodb+srv://<db_username>:<db_password>@your-cluster.mongodb.net/your_db
   ATLAS_USERNAME=your_username
   ATLAS_PASSWORD=your_password
   
   # Optional: Enable dry run mode
   DRY_RUN=true
   ```

2. **Build the Project**: Ensure the project is built so the compiled schemas are available:
   ```bash
   npm run build
   ```

## Usage

### Running the Migration

1. **Navigate to the server directory**:
   ```bash
   cd server
   ```

2. **Run the migration script**:
   ```bash
   # Using Node.js directly
   node scripts/copy-local-to-prod.js
   
   # OR using npm script (if added to package.json)
   npm run migrate:local-to-prod
   ```

### Dry Run Mode

To test the migration without actually copying data, set the `DRY_RUN` environment variable:

```bash
DRY_RUN=true node scripts/copy-local-to-prod.js
```

This will:
- Show what would be migrated
- Count documents in each collection
- Not actually delete or copy any data

## Configuration Options

The script can be customized by modifying the configuration object in the script:

```javascript
this.config = {
  local: {
    connectionString: process.env.DB_CONNECTION_STRING_LOCAL || process.env.DB_CONNECTION_STRING_LOCAL_DOCKER || '',
    databaseName: 'test'
  },
  production: {
    connectionString: process.env.ATLAS_CONNECTION_STRING || '',
    databaseName: 'test'
  },
  collections: [...], // List of collections to migrate
  batchSize: 1000,   // Number of documents to process in each batch
  dryRun: process.env.DRY_RUN === 'true'
};
```

## What the Script Does

1. **Connects to both databases** (local and production)
2. **For each collection**:
   - Counts total documents in local collection
   - **Deletes ALL existing data** from production collection
   - Copies all documents from local to production in batches
   - Reports progress and any errors
3. **Generates a comprehensive report** showing:
   - Overall success/failure status
   - Document counts for each collection
   - Execution time
   - Any errors encountered

## Safety Features

- **Connection Validation**: Verifies connections to both databases before starting
- **Error Handling**: Continues migration even if individual batches fail
- **Progress Logging**: Detailed logging of each step
- **Batch Processing**: Prevents memory issues with large datasets
- **Clean Slate**: Ensures production database starts fresh with local data

## Troubleshooting

### Common Issues

1. **Connection Failed**:
   - Verify your connection strings
   - Check network connectivity
   - Ensure database credentials are correct

2. **Model Not Found**:
   - Run `npm run build` to compile TypeScript schemas
   - Check that the `dist/schemas` directory exists

3. **Permission Denied**:
   - Ensure your production database user has read/write permissions
   - Check if the database exists and is accessible

4. **Memory Issues**:
   - Reduce the `batchSize` in the configuration
   - Monitor system memory during migration

### Logs and Debugging

The script provides detailed logging:
- Connection status
- Document counts
- Batch progress
- Error details
- Final summary

## Example Output

```
🚀 Starting database migration from local to production...
📋 Configuration:
   Local DB: mongodb://localhost:27017/test
   Production DB: mongodb+srv://***:***@cluster.mongodb.net/test
   Collections: users, organizations, llmusages, llmprices, tickets, seedtracks, products, tokens, actionthresholds, actionlogs, customertiers, webhooks, crms, thresholdmisses
   Batch Size: 1000
   Dry Run: No

🔌 Connecting to local database...
✅ Connected to local database
🔌 Connecting to production database...
✅ Connected to production database

📦 Migrating collection: users
📊 Total documents in local users: 150
🧹 Deleting all existing data from production users...
🗑️  Deleted 0 existing documents from production users
✅ Migrated batch: 1-150 of 150
✅ Completed migration of users: 150/150 documents in 245ms

...

📊 MIGRATION RESULTS SUMMARY
================================================================================

🎯 Overall Status: ✅ SUCCESS
📦 Collections: 14/14 successful
⏱️  Total Time: 3245ms
📄 Total Documents: 2,847
✅ Copied Documents: 2,847
❌ Total Errors: 0

📋 Collection Details:
--------------------------------------------------------------------------------
✅ users                    |      150 docs |    245ms | No errors
✅ organizations            |       25 docs |     89ms | No errors
✅ llmusages               |      450 docs |    567ms | No errors
...

🎉 Migration completed successfully!
🌐 Your production database now contains all the data from your local database.
```

## Important Notes

⚠️ **WARNING**: This script will **DELETE ALL EXISTING DATA** in your production database before copying from local. Make sure you have backups if needed.

- Always test with `DRY_RUN=true` first
- Ensure your local database contains the data you want in production
- Consider running during maintenance windows
- Monitor the migration progress and logs

## Support

If you encounter issues:
1. Check the error logs in the console output
2. Verify your environment variables
3. Ensure both databases are accessible
4. Check that the project has been built (`npm run build`)
