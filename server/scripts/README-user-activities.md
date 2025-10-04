# User Activity Data Generator

This script generates realistic fake user activity data for testing and development purposes.

## Overview

The `generate-user-activities.js` script creates user activity records that simulate real user interactions with various solutions in the platform. It generates data with realistic patterns, timestamps, and metadata.

## Features

- **Realistic Data**: Generates user activities with realistic patterns and relationships
- **Batch Processing**: Processes large datasets efficiently in batches
- **Rich Metadata**: Creates contextual metadata based on actions and solutions
- **Time Distribution**: Spreads activities over the last 30 days with weighted recent activity
- **Error Handling**: Robust error handling with detailed logging
- **Validation**: Input validation for organization ID, customer ID, and record count

## Usage

```bash
node generate-user-activities.js <organizationId> <customerId> <numberOfRecords>
```

### Parameters

- `organizationId`: Valid MongoDB ObjectId for the organization
- `customerId`: Valid MongoDB ObjectId for the customer  
- `numberOfRecords`: Number of user activity records to generate (1-10000)

### Example

```bash
node generate-user-activities.js 507f1f77bcf86cd799439011 507f1f77bcf86cd799439012 100
```

## Generated Data

The script generates user activities with the following realistic patterns:

### Solutions
- Customer Dashboard
- Analytics Platform
- Support Portal
- Billing System
- User Management
- Reporting Tool
- API Gateway
- Notification Center
- And more...

### Actions
- login, logout
- view, create, update, delete
- export, import
- search, filter, sort
- download, upload
- share, comment
- approve, reject
- And more...

### User Roles
- admin, manager, user, viewer
- editor, analyst, developer
- support, sales, marketing

### Metadata
Each activity includes rich metadata such as:
- IP address and user agent
- Browser and device information
- Action-specific data (file sizes, search terms, etc.)
- Solution-specific data (chart types, API endpoints, etc.)

### Timestamps
- Activities spread over the last 30 days
- 80% of activities in the last 7 days (realistic usage pattern)
- Random but realistic time distribution throughout the day

## Environment Setup

The script automatically loads environment variables from:
1. `.env` file in the current directory
2. `prod.env` file in various possible locations
3. System environment variables

Required environment variables:
- `ATLAS_CONNECTION_STRING` (preferred)
- `DB_CONNECTION_STRING_LOCAL` (fallback)
- `DB_CONNECTION_STRING_LOCAL_DOCKER` (fallback)

## Output

The script provides detailed logging including:
- Connection status
- Batch processing progress
- Insertion results
- Summary statistics
- Error details (if any)

### Sample Output

```
🚀 Starting User Activity Generation...
Organization ID: 507f1f77bcf86cd799439011
Customer ID: 507f1f77bcf86cd799439012
Number of records: 100
📡 Connecting to MongoDB...
✅ Connected to MongoDB
📊 Generating 100 user activities in 1 batches...
Processing batch 1/1 (100 records)...
✅ Batch 1 completed: 100 records inserted

📈 Generation Results:
Total records requested: 100
Total records inserted: 100
Success rate: 100.00%

📊 Database Statistics:
Total activities in database: 100
Unique users: 45
Unique solutions: 20
Unique actions: 25
Date range: 2024-01-15 to 2024-02-14

🎉 User activity generation completed successfully!
📡 Database connection closed
```

## Performance

- Processes up to 10,000 records efficiently
- Uses batch processing (100 records per batch)
- Handles duplicate key errors gracefully
- Optimized for MongoDB insertion

## Error Handling

The script includes comprehensive error handling for:
- Invalid ObjectId formats
- Database connection issues
- Duplicate key conflicts
- Invalid record counts
- Environment variable issues

## Use Cases

- **Testing**: Generate test data for development and QA
- **Demo Data**: Create realistic demo data for presentations
- **Performance Testing**: Generate large datasets for load testing
- **Analytics Testing**: Test analytics and reporting features
- **User Behavior Simulation**: Simulate realistic user interaction patterns

## Notes

- The script uses the existing UserActivity schema
- Generated data follows realistic user behavior patterns
- All timestamps are in the past (last 30 days)
- Metadata is contextual and realistic
- Session IDs are consistent for related activities
- User IDs follow common naming patterns
