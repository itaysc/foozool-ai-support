# Foozool Support AI - Postman Collection

This repository contains a comprehensive Postman collection for testing the Foozool Support AI APIs, including both the Node.js server and Python ML service.

## 📁 Files Structure

```
├── postman-collection.json          # Main Postman collection
├── postman-environments/
│   ├── production.json             # Production environment
│   └── development.json            # Development environment
└── README-Postman.md               # This file
```

## 🚀 Quick Start

### 1. Import the Collection

1. Open Postman
2. Click **Import** button
3. Select the `postman-collection.json` file
4. The collection will be imported with all endpoints organized by category

### 2. Import Environments

1. In Postman, go to **Environments** tab
2. Click **Import** button
3. Import both environment files:
   - `postman-environments/production.json`
   - `postman-environments/development.json`

### 3. Set Up Authentication

1. Select the appropriate environment (Production or Development)
2. Go to the **🔐 Authentication** folder
3. Run the **Get Auth Token** request with your credentials
4. Copy the token from the response
5. Set the `auth_token` variable in your environment with the token value

## 🌍 Environments

### Production Environment
- **Node.js Server**: `https://tktai.up.railway.app`
- **Python ML Service**: `https://ml-service.up.railway.app`

### Development Environment
- **Node.js Server**: `http://localhost:3000`
- **Python ML Service**: `http://localhost:8000`

## 📋 API Categories

### 🔐 Authentication
- **Get Auth Token**: Authenticate and get JWT token

### 🏢 Organizations
- **Get Dashboard Settings**: Retrieve organization dashboard settings
- **Update Dashboard Settings**: Update dashboard configuration
- **Reset Dashboard Settings**: Reset to default settings
- **Get Default Dashboard Settings**: Get default configuration
- **Get Anomaly Detection Settings**: Retrieve organization anomaly detection settings
- **Update Anomaly Detection Settings**: Update anomaly detection configuration
- **Reset Anomaly Detection Settings**: Reset anomaly detection to defaults

### 🏥 Health Checks
- **Node.js Health**: Multiple health check endpoints
- **Python ML Health**: ML service health and model status

### 👥 Users
- **Create User**: Register new users

### 🎫 Tickets
- **Handle Ticket Webhook**: Process incoming ticket webhooks

### 🤖 Autonomous AI
- **Analyze Ticket**: Get AI recommendations for tickets
- **Execute Action**: Execute recommended actions
- **Action Thresholds**: Manage action thresholds
- **Customer Tiers**: Manage customer tiers
- **Action Logs**: View action execution logs
- **Zendesk Analysis**: Analyze Zendesk tickets with/without actions

### 🧠 ML Service
- **DistilBERT Embed**: Generate DistilBERT embeddings
- **SBERT Embed**: Generate SBERT embeddings
- **Extract Keywords**: Extract keywords from embeddings
- **Summarize Tickets**: Summarize ticket descriptions
- **Answer Question**: Answer questions based on ticket data
- **Classify Intent**: Classify ticket intent

### 🔧 Model Training
- **Train Zendesk Model**: Train models with Zendesk data

### 🚨 Anomaly Detection
- **Get All Anomalies**: Retrieve anomalies with filtering and pagination
- **Get Anomaly Statistics**: Get anomaly statistics and metrics
- **Get Anomaly by ID**: Retrieve a specific anomaly
- **Acknowledge Anomaly**: Mark an anomaly as acknowledged
- **Resolve Anomaly**: Mark an anomaly as resolved
- **Mark as False Positive**: Mark an anomaly as false positive
- **Trigger Detection**: Manually trigger anomaly detection

## 🚨 Anomaly Detection Details

The anomaly detection system automatically identifies unusual patterns in ticket volume and customer sentiment. It uses statistical methods and machine learning to detect anomalies in real-time.

### Get All Anomalies
- **Endpoint**: `GET /api/v1/anomalies`
- **Description**: Retrieve anomalies with filtering and pagination
- **Query Parameters**:
  - `status`: Filter by status (active, acknowledged, resolved, false_positive, all)
  - `type`: Filter by type (volume, sentiment)
  - `severity`: Filter by severity (low, medium, high, critical)
  - `limit`: Number of results (max 100)
  - `offset`: Pagination offset
  - `hours`: Time window in hours (24, 48, 168) or 'all'
- **Response**: Paginated list of anomalies with metadata

### Get Anomaly Statistics
- **Endpoint**: `GET /api/v1/anomalies/stats`
- **Description**: Get anomaly statistics and metrics
- **Query Parameters**:
  - `hours`: Time window for statistics (default: 24)
- **Response**: Statistics including total active, by severity, by type, and recent activity

### Get Anomaly by ID
- **Endpoint**: `GET /api/v1/anomalies/:id`
- **Description**: Retrieve a specific anomaly by ID
- **Path Parameters**:
  - `id`: Anomaly ID
- **Response**: Detailed anomaly information

### Acknowledge Anomaly
- **Endpoint**: `POST /api/v1/anomalies/:id/acknowledge`
- **Description**: Mark an anomaly as acknowledged
- **Path Parameters**:
  - `id`: Anomaly ID
- **Body**: Optional notes about acknowledgment
- **Response**: Updated anomaly with acknowledgment details

### Resolve Anomaly
- **Endpoint**: `POST /api/v1/anomalies/:id/resolve`
- **Description**: Mark an anomaly as resolved
- **Path Parameters**:
  - `id`: Anomaly ID
- **Body**: Optional resolution notes
- **Response**: Updated anomaly with resolution details

### Mark as False Positive
- **Endpoint**: `POST /api/v1/anomalies/:id/false-positive`
- **Description**: Mark an anomaly as false positive
- **Path Parameters**:
  - `id`: Anomaly ID
- **Body**: Optional notes explaining why it's a false positive
- **Response**: Updated anomaly marked as false positive

### Trigger Detection
- **Endpoint**: `POST /api/v1/anomalies/detect`
- **Description**: Manually trigger anomaly detection for the organization
- **Response**: Confirmation that detection has started
- **Note**: Detection runs in the background; check logs for progress

### Anomaly Types

#### Volume Anomalies
- **Detection**: Statistical analysis of ticket volume patterns
- **Metrics**: Current vs. expected volume, Z-score, confidence
- **Triggers**: Unusual spikes or drops in ticket creation

#### Sentiment Anomalies
- **Detection**: Analysis of customer sentiment trends
- **Metrics**: Sentiment shifts, volatility changes, baseline comparisons
- **Triggers**: Significant changes in customer satisfaction or sentiment patterns

### Anomaly Lifecycle
1. **Active**: Newly detected anomaly requiring attention
2. **Acknowledged**: Anomaly has been reviewed and is being investigated
3. **Resolved**: Issue has been fixed or anomaly is no longer relevant
4. **False Positive**: Anomaly was incorrectly flagged and no action is needed

### Testing Workflow
1. Use **Get All Anomalies** to see existing anomalies
2. Copy an anomaly ID from the response
3. Set the `anomaly_id` environment variable
4. Test acknowledgment, resolution, and false positive marking
5. Use **Trigger Detection** to manually run anomaly detection
6. Check **Get Anomaly Statistics** to see the impact of your actions

### 🔗 Webhooks
- **Zendesk Webhook**: Handle Zendesk webhook events

### 🎭 Faker Data
- **Create Fake Ticket**: Generate test data

### 📚 Documentation
- **Swagger UI**: Access API documentation
- **OpenAPI JSON**: Get API specification
- **FastAPI Docs**: Python ML service documentation

### 📊 Insights & Analytics
- **Get Analytics**: Get comprehensive analytics using organization settings
- **Get Dashboard Metrics**: Get dashboard metrics and KPIs
- **Get Dashboard Insights**: Get AI-powered insights and recommendations
- **Get Dashboard Alerts**: Get real-time alerts and notifications
- **Get Dashboard Performance**: Get performance comparison data
- **Test Dashboard Settings**: Test dashboard configuration
- **Get All Insights**: Get all insights with filtering
- **Generate Insights**: Generate new insights
- **Get Insights Summary**: Get insights summary and breakdowns
- **Get Insights Trends**: Get trend analysis

### 📊 Metrics
- **Prometheus Metrics**: Get service metrics

## 🔧 Configuration

### Environment Variables

The collection uses the following environment variables:

| Variable | Description | Example |
|----------|-------------|---------|
| `nodejs_base_url` | Node.js server base URL | `https://tktai.up.railway.app` |
| `python_base_url` | Python ML service base URL | `https://ml-service.up.railway.app` |
| `auth_token` | JWT authentication token | `eyJhbGciOiJIUzI1NiIs...` |
| `organization_id` | Organization ID for dashboard settings | `507f1f77bcf86cd799439011` |
| `anomaly_id` | Anomaly ID for testing anomaly endpoints | `507f1f77bcf86cd799439012` |
| `environment` | Current environment name | `production` |

### Authentication

Most endpoints require JWT authentication. The collection is configured to use Bearer token authentication. To set up:

1. Run the **Get Auth Token** request
2. Copy the token from the response
3. Set the `auth_token` environment variable
4. All subsequent requests will automatically include the token

## 📝 Request Examples

### Authentication
```json
POST /api/v1/auth/token
{
  "email": "user@example.com",
  "password": "password123"
}
```

### Create User
```json
POST /api/v1/users
{
  "email": "newuser@example.com",
  "password": "password123",
  "firstName": "John",
  "lastName": "Doe",
  "organization": "example-org"
}
```

### Organization Dashboard Settings
```json
PUT /api/v1/organizations/{{organization_id}}/dashboard-settings
{
  "analyticsTimeRange": {
    "type": "all_time"
  },
  "refreshInterval": {
    "enabled": true,
    "minutes": 30
  },
  "aggregationSettings": {
    "groupBy": "week",
    "includeHistoricalData": true,
    "maxDataPoints": 100
  },
  "features": {
    "showPerformanceComparison": true,
    "showTrendAnalysis": true,
    "showAnomalyDetection": true,
    "showSentimentAnalysis": true,
    "showIntentAnalysis": true
  },
  "thresholds": {
    "criticalTicketVolume": 100,
    "highPriorityThreshold": 50,
    "satisfactionAlertThreshold": 70
  }
}
```

### Get Analytics with Organization Settings
```json
GET /api/v1/insights/analytics?useOrganizationSettings=true
```

### ML Service - Classify Intent
```json
POST /api/v1/classify-intent
{
  "subject": "Product not working",
  "description": "I purchased the product but it's not functioning properly"
}
```

### Autonomous AI - Execute Action
```json
POST /api/v1/autonomous-ai/execute-action
{
  "ticketId": "12345",
  "actionType": "auto_reply",
  "thresholdId": "threshold123",
  "confidenceScore": 0.85,
  "parameters": {
    "message": "Thank you for your inquiry. We're working on it."
  }
}
```

## ⚙️ Anomaly Detection Settings

The anomaly detection system can be customized per organization through dedicated settings endpoints. These settings control the sensitivity and behavior of the anomaly detection algorithms.

### Get Anomaly Detection Settings
```json
GET /api/v1/organizations/{organizationId}/anomaly-settings
```
**Response**: Current anomaly detection configuration for the organization

### Update Anomaly Detection Settings
```json
PUT /api/v1/organizations/{organizationId}/anomaly-settings
{
  "volumeThreshold": 2.0,
  "sentimentThreshold": 0.2,
  "timeWindows": {
    "short": 3600000,    // 1 hour in milliseconds
    "medium": 21600000,  // 6 hours in milliseconds
    "long": 86400000     // 24 hours in milliseconds
  },
  "minDataPoints": 5,
  "enabled": true
}
```

**Parameters**:
- `volumeThreshold`: Standard deviations for volume anomalies (0.5 - 10.0)
- `sentimentThreshold`: Threshold for sentiment shifts (0.1 - 2.0)
- `timeWindows`: Time windows for analysis in milliseconds
- `minDataPoints`: Minimum data points required for analysis (3 - 50)
- `enabled`: Whether anomaly detection is active

### Reset Anomaly Detection Settings
```json
POST /api/v1/organizations/{organizationId}/anomaly-settings/reset
```
**Response**: Settings reset to default values

### Default Settings
```json
{
  "volumeThreshold": 2.5,
  "sentimentThreshold": 0.3,
  "timeWindows": {
    "short": 3600000,    // 1 hour
    "medium": 21600000,  // 6 hours
    "long": 86400000     // 24 hours
  },
  "minDataPoints": 10,
  "enabled": true
}
```

## 🧪 Testing Workflow

### 1. Health Check
Start by testing the health endpoints to ensure services are running.

### 2. Authentication
Get an authentication token to access protected endpoints.

### 3. Test Core Functionality
- Create a user
- Process a ticket webhook
- Test ML service endpoints
- Test autonomous AI features
- Configure dashboard settings
- Test analytics with organization settings
- Configure anomaly detection settings (via organization endpoints)

### 4. Test Advanced Features
- Model training
- Action thresholds
- Customer tiers
- Action logs

## 🔍 Troubleshooting

### Common Issues

1. **401 Unauthorized**: Check that the `auth_token` is set correctly
2. **404 Not Found**: Verify the environment URLs are correct
3. **500 Internal Server Error**: Check server logs for details
4. **CORS Issues**: Ensure the correct environment is selected

### Debug Tips

1. Check the **Console** tab in Postman for detailed error messages
2. Verify environment variables are set correctly
3. Test health endpoints first to ensure services are running
4. Check server logs for backend errors

## 📚 Additional Resources

- [Postman Documentation](https://learning.postman.com/)
- [Node.js Server API Docs](https://tktai.up.railway.app/api/swagger)
- [Python ML Service Docs](https://ml-service.up.railway.app/docs)

## 🤝 Contributing

To add new endpoints to the collection:

1. Add the new request to the appropriate folder
2. Update this README with the new endpoint details
3. Test the endpoint in both environments
4. Commit the changes

## 📄 License

This collection is part of the Foozool Support AI project. 