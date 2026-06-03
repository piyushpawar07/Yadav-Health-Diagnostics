import dotenv from 'dotenv';
// Load environment variables immediately
dotenv.config();

import express from 'express';
import cors from 'cors';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import apiRouter from './routes';
import { initMongoDB } from './models/db';

const app = express();
const PORT = Number(process.env.PORT || 3000);

// Enable Cross-Origin Resource Sharing (CORS)
app.use(cors());

app.use(express.json({ limit: '10mb' }));

// 1. Mount modularized API Routes
app.use('/api', apiRouter);

// 2. Initialize Database Fallbacks & MongoDB Connection
initMongoDB();

// 3. Integrate SPA interface serving or Dev pipeline middleware
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    // Standalone Production Serve flow
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[Yadav Labs Server] Express pipeline live on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch(err => {
  console.error('Critical failure initiating Yadav Diagnostics Service Engine:', err);
});
