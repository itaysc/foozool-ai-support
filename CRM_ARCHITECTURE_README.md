# CRM-Agnostic Architecture Implementation

This document describes the implementation of a CRM-agnostic architecture that allows the application to work with multiple Customer Relationship Management (CRM) systems instead of being hardcoded to Zendesk.

## Overview

The application has been refactored to support multiple CRMs through a pluggable architecture. This allows organizations to:
- Use different CRM systems (Zendesk, Salesforce, HubSpot, etc.)
- Configure CRM-specific settings per organization
- Receive webhooks from different CRM types
- Fetch tickets/cases from the appropriate CRM system

## Architecture Components

### 1. CRM Management

#### CRM Schema (`server/src/schemas/crm.schema.ts`)
- Stores supported CRM types and their configurations
- Includes webhook configuration, API configuration, and validation schemas
- Supports different authentication types (basic, bearer, OAuth2, API key)

#### Organization Schema Integration
- Organizations directly store their CRM type and configuration
- `crmType` field specifies which CRM the organization uses
- `crmConfig` field stores CRM-specific API keys, URLs, and settings
- No separate collection needed - clean, simple architecture

#### CRM Service (`server/src/services/crm/index.ts`)
- Manages CRUD operations for supported CRMs
- Handles organization CRM configuration directly in organization schema
- Validates CRM support and configurations
- Provides methods to get/set organization CRM settings

### 2. Organization Updates

#### Organization Schema Updates
- Added `crmType` field to specify which CRM the organization uses
- Added `crmConfig` field to store CRM-specific configuration
- Added indexes for CRM-based filtering

#### Organization Types Updates
- Updated both server and client type definitions
- Added CRM-related fields to organization interfaces

### 3. Webhook Handling

#### CRM-Agnostic Webhook Service (`server/src/services/tickets/crmWebhook.ts`)
- Routes webhooks to appropriate CRM handlers based on type
- Validates CRM support and organization configuration
- Converts different CRM payloads to a unified format

#### CRM-Specific Handlers
- **Zendesk**: Updated existing handler to work with new architecture
- **Salesforce**: New handler for Salesforce case management
- **Extensible**: Easy to add new CRM handlers

#### Generic CRM Webhook Route (`server/src/routes/webhooks/crm/v1/index.ts`)
- Single endpoint that can handle webhooks from any supported CRM
- Automatically detects CRM type from token or payload
- Validates and routes to appropriate handler

### 4. Ticket Fetching

#### CRM-Agnostic Ticket Service (`server/src/services/tickets/crmTicketService.ts`)
- Fetches tickets from the organization's configured CRM
- Routes to appropriate CRM service based on configuration
- Maintains backward compatibility with existing code

#### CRM-Specific Services
- **Zendesk**: Updated to work with organization-specific configurations
- **Salesforce**: New service for fetching Salesforce cases
- **Extensible**: Easy to add new CRM services

### 5. Token Management

#### Token Schema Updates
- Extended to support multiple CRM types while maintaining flexibility
- Token types are strings that can represent any purpose (webhooks, API access, etc.)
- Common webhook token patterns: `zendesk-webhook`, `salesforce-webhook`, `hubspot-webhook`
- Maintains backward compatibility with existing tokens
- Default token type is `zendesk-webhook` for backward compatibility

#### Authentication Updates
- Updated middleware to support multiple CRM token types
- Validates webhook tokens when they contain `-webhook` suffix
- Supports legacy and new token formats
- Flexible token validation that doesn't restrict token types to specific patterns

## Supported CRM Types

### 1. Zendesk
- **Type**: `zendesk`
- **Token Type**: `zendesk-webhook`
- **Features**: Full webhook support, ticket fetching, comment management
- **Configuration**: URL, username, token, webhook token

### 2. Salesforce
- **Type**: `salesforce`
- **Token Type**: `salesforce-webhook`
- **Features**: Case management, webhook support, API integration
- **Configuration**: Instance URL, access token, API version

### 3. HubSpot (Planned)
- **Type**: `hubspot`
- **Token Type**: `hubspot-webhook`
- **Features**: Ticket management, webhook support
- **Configuration**: API key, portal ID

### 4. Generic
- **Type**: `generic`
- **Token Type**: `generic-webhook`
- **Features**: Basic webhook support for custom integrations
- **Configuration**: Custom fields as needed

## API Endpoints

### CRM Management
- `GET /api/v1/crm` - Get all supported CRMs
- `GET /api/v1/crm/:id` - Get CRM by ID
- `POST /api/v1/crm` - Create new CRM
- `PUT /api/v1/crm/:id` - Update CRM
- `DELETE /api/v1/crm/:id` - Delete CRM
- `GET /api/v1/crm/organization/:organizationId` - Get organization's CRM config
- `POST /api/v1/crm/organization/:organizationId` - Set organization's CRM config

### Webhooks
- `POST /api/v1/webhooks/zendesk` - Zendesk-specific webhook (legacy)
- `POST /api/v1/webhooks/crm` - Generic CRM webhook (recommended)

## Configuration

### Adding a New CRM

1. **Create CRM Definition**
   ```typescript
   const newCRM: ICRM = {
     name: 'New CRM',
     type: 'newcrm',
     displayName: 'New CRM System',
     description: 'Description of the new CRM',
     isActive: true,
     configSchema: {
       // Define configuration schema
     },
     webhookConfig: {
       // Define webhook configuration
     },
     apiConfig: {
       // Define API configuration
     }
   };
   ```

2. **Add to CRM Seed**
   - Update `server/src/seeds/crm.seed.ts`
   - Include the new CRM in the seed data

3. **Create CRM Handler**
   - Implement webhook handler in `server/src/services/tickets/`
   - Implement ticket fetching service
   - Add to CRM routing logic

4. **Update Types**
   - Add new CRM type to token enums
   - Update validation schemas as needed

### Organization CRM Configuration

```typescript
// Set organization's CRM configuration directly
await CRMService.setOrganizationCRM(
  organizationId,
  'zendesk', // CRM type
  {
    url: 'https://api.zendesk.com',
    username: 'your-username',
    token: 'your-api-token'
  }
);

// Get organization's CRM configuration
const crmData = await CRMService.getOrganizationCRM(organizationId);
if (crmData) {
  const { crm, config } = crmData;
  console.log(`Organization uses ${crm.type} CRM`);
  console.log('CRM config:', config);
}
```

## Migration Guide

### From Zendesk-Only to Multi-CRM

1. **Database Migration**
   - Run the new seeds to create CRM definitions
   - Update existing organizations to specify their CRM type
   - Configure CRM-specific settings

2. **Webhook Updates**
   - Update webhook endpoints to use new CRM-agnostic routes
   - Update token types if needed
   - Test webhook processing

3. **Ticket Fetching Updates**
   - Update jobs and services to use new CRM-agnostic ticket service
   - Test ticket fetching from configured CRM
   - Update any hardcoded Zendesk references

### Backward Compatibility

- Existing Zendesk webhooks continue to work
- Legacy `fetchTickets` function maintained for backward compatibility
- Token validation supports both old and new formats
- Gradual migration path available

## Error Handling

### CRM Validation Errors
- **Unsupported CRM**: Returns 400 with clear error message
- **Configuration Missing**: Returns 400 with guidance
- **CRM Type Mismatch**: Returns 400 when webhook CRM doesn't match organization's CRM

### Fallback Behavior
- Falls back to legacy handlers when needed
- Graceful degradation for unsupported features
- Clear error messages for troubleshooting

## Testing

### Webhook Testing
1. Configure organization with specific CRM
2. Send test webhook to generic CRM endpoint
3. Verify routing to correct CRM handler
4. Validate error handling for unsupported CRMs

### Ticket Fetching Testing
1. Test ticket fetching from different CRM types
2. Verify organization-specific configurations
3. Test error handling for missing configurations

## Future Enhancements

### Planned Features
- **CRM Plugin System**: Dynamic CRM loading
- **Advanced Configuration**: UI for CRM setup
- **Webhook Templates**: Pre-built webhook configurations
- **CRM Analytics**: Usage metrics per CRM type
- **Multi-CRM Support**: Organizations using multiple CRMs simultaneously

### Extensibility
- **Custom CRM Adapters**: Framework for custom CRM integrations
- **Webhook Transformers**: Custom payload transformations
- **CRM-Specific Features**: Advanced features per CRM type

## Troubleshooting

### Common Issues

1. **Webhook Not Processing**
   - Check CRM type in token vs. organization configuration
   - Verify CRM is supported and active
   - Check webhook payload format

2. **Ticket Fetching Fails**
   - Verify CRM configuration is complete
   - Check API credentials and permissions
   - Validate CRM service implementation

3. **Type Errors**
   - Ensure all CRM types are properly defined
   - Check token type validation
   - Verify payload schema compatibility

### Debug Information
- Enable detailed logging for CRM operations
- Check CRM service logs for routing decisions
- Validate webhook payload transformations

## Conclusion

This CRM-agnostic architecture provides a solid foundation for supporting multiple CRM systems while maintaining backward compatibility. The modular design makes it easy to add new CRM support and the unified interfaces ensure consistent behavior across different systems.

The implementation follows best practices for extensibility, maintainability, and error handling, making it suitable for production use and future enhancements.
