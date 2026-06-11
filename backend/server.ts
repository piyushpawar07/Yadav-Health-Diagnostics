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
const DEFAULT_PORT = Number(process.env.PORT || 3000);

const allowedOrigins = [
  'http://localhost:5173',
  'https://yadav-health-diagnostics.netlify.app',
  process.env.RENDER_FRONTEND_URL,
  process.env.APP_URL,
].filter(Boolean);

app.use(
  cors((req, callback) => {
    const origin = req.header('Origin');
    const requestOrigin = origin?.toString() || '';
    const serverOrigin = `${req.protocol}://${req.get('host')}`;

    const corsOptions = {
      origin: false,
      credentials: true,
    };

    if (!requestOrigin || requestOrigin === serverOrigin || allowedOrigins.includes(requestOrigin)) {
      corsOptions.origin = true;
    }

    callback(null, corsOptions);
  })
);

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
    const publicPath = path.join(process.cwd(), 'backend', 'public');
    app.use(express.static(publicPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(publicPath, 'index.html'));
    });
  }

  let port = DEFAULT_PORT;
  const maxAttempts = 5;
  for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
    try {
      await new Promise<void>((resolve, reject) => {
        const server = app.listen(port, '0.0.0.0', () => {
          resolve();
        });
        server.once('error', reject);
      });
      if (port !== DEFAULT_PORT) {
        console.warn(`[Yadav Labs Server] Default port ${DEFAULT_PORT} in use, listening on fallback port ${port} instead.`);
      }
      console.log(`[Yadav Labs Server] Express pipeline live on http://0.0.0.0:${port}`);
      break;
    } catch (err: any) {
      if (err?.code === 'EADDRINUSE') {
        port += 1;
        continue;
      }
      throw err;
    }
  }
}

startServer().catch(err => {
  console.error('Critical failure initiating Yadav Diagnostics Service Engine:', err);
});
