// Basic OpenAPI document without schema registration
export const generateOpenApiDocument = () => {
  return {
    openapi: '3.0.0',
    info: {
      title: 'TKTAI Support AI API',
      version: '1.0.0',
      description: 'API documentation for TKTAI Support AI backend services',
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
    paths: {
      '/api/v1/auth/token': {
        post: {
          tags: ['Authentication'],
          summary: 'Authenticate user and get access token',
          description: 'Authenticate a user with email and password to receive an access token',
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    email: {
                      type: 'string',
                      format: 'email',
                      description: 'User email address'
                    },
                    password: {
                      type: 'string',
                      description: 'User password'
                    }
                  },
                  required: ['email', 'password']
                }
              }
            }
          },
          responses: {
            '200': {
              description: 'Authentication successful',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      status: { type: 'string' },
                      token: { type: 'string' },
                      user: {
                        type: 'object',
                        properties: {
                          id: { type: 'string' },
                          email: { type: 'string' },
                          firstName: { type: 'string' },
                          lastName: { type: 'string' }
                        }
                      }
                    }
                  }
                }
              }
            },
            '400': {
              description: 'Bad request - validation error'
            },
            '401': {
              description: 'Unauthorized - invalid credentials'
            }
          }
        }
      }
    }
  };
};

// Initial document
export let openApiDocument = generateOpenApiDocument(); 