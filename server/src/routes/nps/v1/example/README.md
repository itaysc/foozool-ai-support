# NPS Data Examples

This folder contains example files that demonstrate the expected data format for the NPS (Net Promoter Score) system.

## Files

### 1. `sample-nps-data.csv`
A CSV file showing the expected format for bulk NPS data uploads.

**Columns:**
- `surveyId`: Unique identifier for the survey
- `surveyName`: Human-readable name of the survey
- `questionId`: Unique identifier for the question
- `questionText`: The actual question text
- `questionType`: Type of question (`nps`, `open`, `select`, `multi_select`)
- `required`: Whether the question is required (`true`/`false`)
- `scale`: For NPS questions, the scale (usually 10)
- `timestamp`: When the response was collected (ISO 8601 format)
- `customerId`: Unique identifier for the customer
- `responseValue`: The numeric or selected value
- `responseText`: For open-ended questions, the text response

**Usage:**
- Upload via `POST /api/v1/nps/upload/csv`
- Use the file upload form with the `file` field

### 2. `sample-nps-data.json`
A JSON file showing the expected format for JSON bulk uploads.

### 3. `sample-nps-data-alternative.json`
A JSON file with a different format structure to demonstrate AI-powered mapping capabilities.

**Structure:**
```json
{
  "surveys": [
    {
      "id": "survey_id",
      "name": "Survey Name",
      "questions": [...],
      "responses": [...]
    }
  ]
}
```

**Question Types Supported:**
- `nps`: Net Promoter Score (0-10 scale)
- `open`: Open-ended text responses
- `select`: Single-choice selection
- `multi_select`: Multiple-choice selection

**Usage:**
- Upload via `POST /api/v1/nps/upload/json`
- Send as JSON payload in request body

## Data Processing

The system uses **AI-powered data mapping** to automatically detect and convert your data format to our standard NPS format.

### 🔍 **AI Mapping Examples**

The AI system can handle various data formats automatically:

**Format 1: Standard Survey Structure**
```json
{
  "surveys": [...],
  "responses": [...]
}
```

**Format 2: Alternative Feedback Structure**
```json
{
  "metadata": {...},
  "feedback_data": [...]
}
```

**AI Automatically Maps:**
- `nps_rating` → `nps_score`
- `submission_time` → `timestamp`
- `customer_email` → `customerId`
- `improvement_suggestions` → `open_text` question
- `overall_satisfaction` → `single_select` question
- `would_recommend` → `boolean` question

### 🤖 AI-Powered Format Detection

When you upload data, our system:
1. **Analyzes your data structure** using advanced AI
2. **Automatically maps fields** to our standard format
3. **Detects question types** (NPS, open text, select, etc.)
4. **Handles different timestamp formats** (ISO, US, EU, Unix)
5. **Provides confidence scores** for the mapping quality

### 🔄 Fallback Processing

If AI mapping fails, the system falls back to traditional parsing methods to ensure your data is processed.

### 📊 Data Processing Pipeline

The system will:
1. Process the uploaded data in batches to manage memory efficiently
2. Generate NPS insights including:
   - Current NPS score
   - NPS change over time
   - Response rate
   - Segment breakdown (promoters, passives, detractors)
   - Trends analysis
   - AI-generated insights and recommendations
3. Store insights in the database (not raw responses)
4. Provide access to insights via API endpoints

## Supported Data Formats

### 📁 CSV Files
The system automatically detects common CSV formats from:
- **Google Forms**: Timestamp, Email Address, NPS Score, Feedback
- **Typeform**: submitted_at, user_id, nps_rating, comments
- **SurveyMonkey**: Start Date, End Date, Email, NPS, Open Feedback
- **Custom Systems**: Any CSV with timestamp and response columns

### 🔗 JSON Data
Supports various JSON structures:
- Survey + responses format
- Array of responses
- Single response objects
- Custom nested structures

**Example Formats:**

1. **Standard Format** (`sample-nps-data.json`):
   ```json
   {
     "surveys": [...],
     "responses": [...]
   }
   ```

2. **Alternative Format** (`sample-nps-data-alternative.json`):
   ```json
   {
     "metadata": {...},
     "feedback_data": [...]
   }
   ```

3. **Generate 100 Responses**:
   ```bash
   cd server/src/routes/nps/v1/example
   node generate-100-responses.js > sample-nps-data-100-responses.json
   ```

### 🌐 Webhooks
Real-time data ingestion from:
- Form submission webhooks
- Survey tool integrations
- Custom API endpoints
- Third-party platforms

**Authentication Required:**
- `x-organization-id`: Organization identifier
- `x-user-id`: User identifier (must exist in database)
- `x-token-type`: Token type (e.g., 'nps-webhook')
- `Authorization`: Bearer token (webhook token)

## Testing

Use these files to test the NPS endpoints in the Postman collection:
- Test CSV upload with `sample-nps-data.csv`
- Test JSON upload with `sample-nps-data.json`
- Use the `upload_id` from upload responses to test status and management endpoints

## Notes

- Raw response data is not stored permanently
- The system processes data in-memory for performance
- Insights are generated and stored for analysis
- All endpoints require authentication with a valid JWT token
- Organization ID is automatically extracted from the authenticated user context

## Webhook Setup

To use the webhook endpoint, you need to:

1. **Create a webhook token** in your organization
2. **Set the token type** to 'nps-webhook' (or any custom type)
3. **Include required headers** in your webhook requests:
   ```
   x-organization-id: your_org_id
   x-user-id: user_id_from_your_db
   x-token-type: nps-webhook
   Authorization: Bearer your_webhook_token
   ```

The system will automatically:
- Validate the webhook token
- Verify the user exists and belongs to the organization
- Process the NPS data using AI-powered mapping
- Generate insights and store them in your database

