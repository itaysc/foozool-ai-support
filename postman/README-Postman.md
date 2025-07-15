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

### 🔗 Webhooks
- **Zendesk Webhook**: Handle Zendesk webhook events

### 🎭 Faker Data
- **Create Fake Ticket**: Generate test data

### 📚 Documentation
- **Swagger UI**: Access API documentation
- **OpenAPI JSON**: Get API specification
- **FastAPI Docs**: Python ML service documentation

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