import express, { type Request, type Response } from 'express';
import path, { dirname } from 'path';
import { fileURLToPath } from 'url';
import { checkDbConnection } from './db';
import { migrate } from './migrate';
import { seed } from './seed';
import apiRoutes from './routes/api';

const __filename = fileURLToPath(import.meta.url);
const __dirname = typeof import.meta.dirname === 'string' ? import.meta.dirname : dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3001;

app.use(express.json());

// Serve static files from the React app
app.use(express.static(path.join(__dirname, '../dist')));

// API routes
app.use('/api', apiRoutes);

// The "catchall" handler: for any request that doesn't
// match one above, send back React's index.html file.
app.get('*', (_req: Request, res: Response) => {
  res.sendFile(path.join(__dirname, '../dist/index.html'));
});

export const startServer = async (): Promise<void> => {
  const { connected } = await checkDbConnection();

  if (!connected) {
    console.warn("Database connection skipped or unavailable. Running in local-first standalone mode.");
  } else {
    try {
      await migrate();
      await seed();
      console.log("Database connected, migrated and seeded successfully.");
    } catch (err) {
      console.error("Error during startup migration or seeding:", err);
    }
  }

  app.listen(PORT, () => {
    console.log(`Server listening on port ${PORT} (http://localhost:${PORT})`);
  });
};

startServer();
