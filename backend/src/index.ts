import express, { Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import swaggerUi from 'swagger-ui-express';
import fs from 'fs';

import env from './config/env';
import swaggerSpec from './config/swagger';
import { testConnection } from './config/database';
import { syncDatabase } from './models';

import routes from './routes';
const app = express();


app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const uploadsDir = env.uploadDir;
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
  console.log(`Created uploads directory at ${uploadsDir}`);
} else {
  console.log(`Uploads directory found at ${uploadsDir}`);
}

app.use('/uploads', express.static(uploadsDir));
app.use('/api', routes);
app.use('/api-docs', helmet({ contentSecurityPolicy: false }), swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// Handle 404 routes
app.use((req: Request, res: Response) => {
  res.status(404).json({ message: `404 Not found: ${req.originalUrl}` });
});

const startServer = async () => {
  try {
    await testConnection();
    
    await syncDatabase(true);
    
    app.listen(env.port, () => {
      console.log(`Server running on port ${env.port}`);
      console.log(`Swagger documentation available at http://localhost:${env.port}/api-docs`);
    });
  } catch (error) {
    console.error('Failed to start server: ', error);
    process.exit(1);
  }
};

startServer(); 