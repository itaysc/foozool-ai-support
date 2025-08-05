# Database Migrations API

This directory contains API routes for running database migrations. All routes are protected with JWT authentication.

## Architecture

The migration system is built with the following components:

- **BaseMigration**: Abstract base class that all migrations extend
- **MigrationRegistry**: Singleton that manages all available migrations
- **MigrationService**: Handles database operations and migration execution
- **Migration Schema**: MongoDB collection to track migration status

## Available Routes

### 1. Run All Migrations
**POST** `/api/v1/migrations/run-all`

Runs all available migrations for the organization. Migrations are idempotent and will not run if already completed.

**Response (Success):**
```json
{
  "success": true,
  "message": "Successfully ran 2 migrations",
  "data": {
    "migrations": [
      {
        "_id": "migration_id",
        "name": "created-at-to-integer",
        "status": "completed",
        "totalRecords": 1000,
        "processedRecords": 1000,
        "errorMessages": []
      }
    ],
    "results": [
      {
        "name": "created-at-to-integer",
        "databaseType": "qdrant",
        "result": {
          "success": true,
          "totalRecords": 1000,
          "processedRecords": 1000,
          "errors": [],
          "executionTime": 5000
        },
        "startedAt": "2024-01-01T00:00:00.000Z",
        "completedAt": "2024-01-01T00:00:05.000Z"
      }
    ],
    "summary": {
      "total": 2,
      "successful": 2,
      "failed": 0,
      "initiatedBy": "user@example.com",
      "completedAt": "2024-01-01T00:00:05.000Z"
    }
  }
}
```

### 2. Run Specific Migration
**POST** `/api/v1/migrations/run/:migrationName`

Runs a specific migration by name.

**Response (Success):**
```json
{
  "success": true,
  "message": "Migration completed successfully",
  "data": {
    "migration": {
      "_id": "migration_id",
      "name": "created-at-to-integer",
      "status": "completed",
      "totalRecords": 1000,
      "processedRecords": 1000,
      "errorMessages": []
    },
    "result": {
      "name": "created-at-to-integer",
      "databaseType": "qdrant",
      "result": {
        "success": true,
        "totalRecords": 1000,
        "processedRecords": 1000,
        "errors": [],
        "executionTime": 5000
      },
      "startedAt": "2024-01-01T00:00:00.000Z",
      "completedAt": "2024-01-01T00:00:05.000Z"
    },
    "initiatedBy": "user@example.com",
    "completedAt": "2024-01-01T00:00:05.000Z"
  }
}
```

**Response (Already Completed):**
```json
{
  "success": true,
  "message": "Migration already completed",
  "data": {
    "migration": {
      "_id": "migration_id",
      "name": "created-at-to-integer",
      "status": "completed",
      "completedAt": "2024-01-01T00:05:00.000Z"
    },
    "result": {
      "name": "created-at-to-integer",
      "databaseType": "mongo",
      "result": {
        "success": true,
        "errors": [],
        "metadata": { "message": "Migration already completed" }
      },
      "startedAt": "2024-01-01T00:05:00.000Z",
      "completedAt": "2024-01-01T00:05:00.000Z"
    },
    "initiatedBy": "user@example.com",
    "completedAt": "2024-01-01T00:00:05.000Z"
  }
}
```

### 3. Get Migration Status
**GET** `/api/v1/migrations/status`

Returns available migrations and their current status for the organization.

**Response:**
```json
{
  "success": true,
  "data": {
    "available": [
      {
        "name": "created-at-to-integer",
        "description": "Convert created_at field from string to integer timestamps in Qdrant",
        "version": "1.0.0",
        "databaseType": "qdrant"
      }
    ],
    "status": {
      "total": 1,
      "completed": 1,
      "running": 0,
      "failed": 0
    },
    "lastChecked": "2024-01-01T00:00:00.000Z",
    "checkedBy": "user@example.com"
  }
}
```

### 4. Get Migration History
**GET** `/api/v1/migrations/history`

Returns detailed migration history for the organization.

**Response:**
```json
{
  "success": true,
  "data": {
    "migrations": [
      {
        "_id": "migration_id",
        "name": "created-at-to-integer",
        "description": "Convert created_at field from string to integer timestamps in Qdrant",
        "version": "1.0.0",
        "status": "completed",
        "startedAt": "2024-01-01T00:00:00.000Z",
        "completedAt": "2024-01-01T00:05:00.000Z",
        "initiatedBy": "user@example.com",
        "organization": "org_id",
        "totalRecords": 1000,
        "processedRecords": 1000,
        "errorMessages": [],
        "metadata": {
          "databaseType": "qdrant",
          "executionTime": 5000
        },
        "createdAt": "2024-01-01T00:00:00.000Z",
        "updatedAt": "2024-01-01T00:05:00.000Z"
      }
    ],
    "total": 1,
    "completed": 1,
    "running": 0,
    "failed": 0,
    "checkedBy": "user@example.com",
    "checkedAt": "2024-01-01T00:00:00.000Z"
  }
}
```

### 5. Check Created At Migration
**GET** `/api/v1/migrations/check-created-at`

Samples Qdrant data to check if the created_at migration is needed.

**Response:**
```json
{
  "success": true,
  "data": {
    "migrationStatus": "needed",
    "needsMigration": true,
    "sampleSize": 10,
    "stringTimestamps": 8,
    "integerTimestamps": 2,
    "checkedAt": "2024-01-01T00:00:00.000Z",
    "checkedBy": "user@example.com"
  }
}
```

## Authentication

All migration routes require a valid JWT token in the Authorization header:

```
Authorization: Bearer <your-jwt-token>
```

## Usage Examples

### Using curl

1. **Run all migrations:**
```bash
curl -X POST \
  http://localhost:3000/api/v1/migrations/run-all \
  -H "Authorization: Bearer <your-jwt-token>" \
  -H "Content-Type: application/json"
```

2. **Run a specific migration:**
```bash
curl -X POST \
  http://localhost:3000/api/v1/migrations/run/created-at-to-integer \
  -H "Authorization: Bearer <your-jwt-token>" \
  -H "Content-Type: application/json"
```

3. **Get migration status:**
```bash
curl -X GET \
  http://localhost:3000/api/v1/migrations/status \
  -H "Authorization: Bearer <your-jwt-token>"
```

4. **Get migration history:**
```bash
curl -X GET \
  http://localhost:3000/api/v1/migrations/history \
  -H "Authorization: Bearer <your-jwt-token>"
```

5. **Check if migration is needed:**
```bash
curl -X GET \
  http://localhost:3000/api/v1/migrations/check-created-at \
  -H "Authorization: Bearer <your-jwt-token>"
```

### Using JavaScript/TypeScript

```javascript
// Run all migrations
const response = await fetch('/api/v1/migrations/run-all', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${jwtToken}`,
    'Content-Type': 'application/json'
  }
});

const result = await response.json();
console.log('Migration result:', result);
```

## Creating New Migrations

To create a new migration:

1. **Create a new migration class** in `server/src/migrations/`:

```typescript
import { BaseMigration } from './BaseMigration';
import { MigrationResult } from './types';

export class MyNewMigration extends BaseMigration {
  name = 'my-new-migration';
  description = 'Description of what this migration does';
  version = '1.0.0';
  databaseType = 'mongo' as const; // or 'qdrant' or 'elasticsearch'

  protected async execute(): Promise<MigrationResult> {
    // Your migration logic here
    return {
      success: true,
      totalRecords: 100,
      processedRecords: 100,
      errors: [],
      metadata: {
        // Additional metadata
      }
    };
  }
}
```

2. **Register the migration** in `MigrationRegistry.ts`:

```typescript
import { MyNewMigration } from './MyNewMigration';

// In the registerMigrations method:
const migrations: Migration[] = [
  new CreatedAtToIntegerMigration(),
  new MyNewMigration(), // Add your new migration here
];
```

## Migration System Features

### 🔒 **Idempotent Operations**
- Migrations can be run multiple times safely
- Completed migrations are skipped automatically
- Running migrations are detected and prevented

### 📊 **Comprehensive Tracking**
- All migrations are tracked in the database
- Detailed execution history and statistics
- Error tracking and reporting

### 🛡️ **Safety Features**
- Prevents concurrent execution of the same migration
- Automatic rollback on failure
- Detailed error logging and reporting

### 🔄 **Flexible Architecture**
- Support for multiple database types (MongoDB, Qdrant, Elasticsearch)
- Easy to add new migrations
- Centralized migration management

### 📈 **Performance Monitoring**
- Execution time tracking
- Records processed counting
- Success/failure statistics

## Error Handling

The migration routes include comprehensive error handling:

- **401 Unauthorized**: Invalid or missing JWT token
- **409 Conflict**: Migration already running
- **500 Internal Server Error**: Migration failed or unexpected error
- **Detailed error messages**: Include specific error details and context

## Monitoring

All migration operations are logged with:
- User who initiated the migration
- Start and completion timestamps
- Number of records processed
- Any errors encountered
- Success/failure status
- Execution time
- Database type affected 