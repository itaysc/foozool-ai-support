import { Router } from 'express';
import swaggerUi from 'swagger-ui-express';
import { generateOpenApiDocument } from '../../../config/openapi';

const router = Router();

// Serve Swagger UI
router.use('/', swaggerUi.serve);
router.get('/', (req, res) => {
  const openApiDocument = generateOpenApiDocument();
  swaggerUi.setup(openApiDocument, {
    explorer: true,
    customCss: '.swagger-ui .topbar { display: none }',
    customSiteTitle: 'Foozool Support AI API Documentation',
  })(req, res);
});

// Serve OpenAPI JSON
router.get('/json', (req, res) => {
  const openApiDocument = generateOpenApiDocument();
  res.setHeader('Content-Type', 'application/json');
  res.send(openApiDocument);
});

export default router; 