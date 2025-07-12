import { OpenAPIRegistry, OpenApiGeneratorV3 } from '@asteasolutions/zod-to-openapi';

// Create a registry to hold all schemas and routes
export const registry = new OpenAPIRegistry();

// Create the OpenAPI document
export const generator = new OpenApiGeneratorV3(registry.definitions);

// Function to generate OpenAPI document after all schemas are registered
export const generateOpenApiDocument = () => {
  return generator.generateDocument({
    openapi: '3.0.0',
    info: {
      title: 'TKTAI Support AI API',
      version: '1.0.0',
      description: 'API documentation for Foozool Support AI backend services',
      contact: {
        name: 'API Support',
        email: 'support@tktai.com',
      },
    },
    servers: [
      {
        url: process.env.NODE_ENV === 'production' 
          ? 'https://tktai.up.railway.app' 
          : 'http://localhost:3000',
        description: process.env.NODE_ENV === 'production' ? 'Production server' : 'Development server',
      },
    ],
    tags: [
      { name: 'Authentication', description: 'Authentication endpoints' },
      { name: 'Users', description: 'User management endpoints' },
      { name: 'Tickets', description: 'Ticket management endpoints' },
      { name: 'Webhooks', description: 'Webhook endpoints' },
      { name: 'Model Training', description: 'AI model training endpoints' },
      { name: 'Health', description: 'Health check endpoints' },
    ],
  });
};

// Initial document (will be regenerated after schemas are registered)
export let openApiDocument = generateOpenApiDocument(); 