import swaggerJsdoc from 'swagger-jsdoc';
import env from './env';

console.log('Initializing Swagger configuration...');

// Create a variable to hold our swagger spec
let swaggerSpec: any;

// Add error handling to inspect paths
try {
  console.log('Setting up Swagger options...');
  const options = {
    definition: {
      openapi: '3.0.0',
      info: {
        title: 'Warranty Activation System API',
        version: '1.0.0',
        description: 'API for managing product warranties',
        contact: {
          name: 'API Support',
          email: 'support@example.com',
        },
      },
      servers: [
        {
          url: `http://localhost:${env.port}/api`,
          description: 'Development server',
        },
        {
          url: `https://backend-1qyd.onrender.com/api`,
          description: 'Production server',
        },
      ],
      components: {
        securitySchemes: {
          bearerAuth: {
            type: 'http',
            scheme: 'bearer',
            bearerFormat: 'JWT',
          },
        },
      },
      tags: [
        {
          name: 'Auth',
          description: 'Authentication endpoints',
        },
        {
          name: 'Warranties',
          description: 'Warranty management endpoints',
        },
        {
          name: 'Users',
          description: 'User management endpoints',
        },
      ],
    },
    // Change the way swagger loads route files to avoid path-to-regexp error
    apis: ['./src/routes/**/*.ts'], // Changed path pattern
  };

  console.log('Generating Swagger specification...');
  swaggerSpec = swaggerJsdoc(options);
  console.log('Swagger specification generated successfully');
} catch (error) {
  console.error('Error generating Swagger specification:', error);
  // Create empty spec if swagger fails
  swaggerSpec = {
    openapi: '3.0.0',
    info: {
      title: 'API Documentation Unavailable',
      version: '1.0.0',
      description: 'Documentation failed to load due to an error',
    },
    paths: {},
  };
}

export default swaggerSpec; 