import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { spawn, ChildProcess } from 'child_process';
import http from 'http';
import { createProxyMiddleware } from 'http-proxy-middleware';
import { createServer as createViteServer } from 'vite';

const PORT = 3000;
const FASTAPI_PORT = 8001;
const FASTAPI_URL = `http://127.0.0.1:${FASTAPI_PORT}`;

let pythonProcess: ChildProcess | null = null;

function isFastApiRunning(): Promise<boolean> {
  return new Promise((resolve) => {
    const req = http.get(`${FASTAPI_URL}/api/health`, (res) => {
      resolve(res.statusCode === 200);
    });
    req.on('error', () => resolve(false));
    req.setTimeout(1000, () => {
      req.destroy();
      resolve(false);
    });
  });
}

async function ensureFastApiBackend(): Promise<void> {
  const running = await isFastApiRunning();
  if (running) {
    console.log(`[Backend] FastAPI backend already running on port ${FASTAPI_PORT}`);
    return;
  }

  console.log(`[Backend] Spawning Python FastAPI backend on 127.0.0.1:${FASTAPI_PORT}...`);
  pythonProcess = spawn('python3', [
    '-m', 'uvicorn',
    'backend.main:app',
    '--host', '127.0.0.1',
    '--port', String(FASTAPI_PORT)
  ], {
    cwd: process.cwd(),
    stdio: 'inherit',
    env: { ...process.env, PYTHONUNBUFFERED: '1' }
  });

  pythonProcess.on('error', (err) => {
    console.error('[Backend] Failed to start Python process:', err);
  });

  pythonProcess.on('exit', (code, signal) => {
    console.log(`[Backend] Python process exited with code ${code}, signal ${signal}`);
  });

  // Wait up to 15 seconds for FastAPI to become ready
  for (let i = 0; i < 30; i++) {
    await new Promise((r) => setTimeout(r, 500));
    if (await isFastApiRunning()) {
      console.log(`[Backend] FastAPI backend ready at ${FASTAPI_URL}`);
      // Seed sample data if empty on first launch
      try {
        const checkReq = http.get(`${FASTAPI_URL}/api/health`, (res) => {
          let data = '';
          res.on('data', chunk => data += chunk);
          res.on('end', () => {
            try {
              const parsed = JSON.parse(data);
              if (parsed.expense_count === 0) {
                console.log('[Backend] Initializing with realistic seed data...');
                const seedReq = http.request(`${FASTAPI_URL}/api/seed`, { method: 'POST' });
                seedReq.end();
              }
            } catch (e) {
              // ignore
            }
          });
        });
        checkReq.end();
      } catch (err) {
        // ignore
      }
      return;
    }
  }

  console.warn('[Backend] Warning: FastAPI did not respond within timeout, will continue starting proxy');
}

async function startServer() {
  const app = express();

  // Ensure FastAPI backend is alive
  await ensureFastApiBackend();

  // Proxy API and documentation routes to Python FastAPI backend
  const apiProxy = createProxyMiddleware({
    target: FASTAPI_URL,
    changeOrigin: true,
    ws: false,
    on: {
      error: (err, req, res: any) => {
        console.error('[Proxy Error]:', err.message);
        if (res && !res.headersSent && typeof res.writeHead === 'function') {
          res.writeHead(502, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'Backend service unavailable. Please retry in a moment.' }));
        }
      }
    }
  });

  app.use('/api', apiProxy);
  app.use('/docs', apiProxy);
  app.use('/openapi.json', apiProxy);

  // Vite integration
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  const server = app.listen(PORT, '0.0.0.0', () => {
    console.log(`[Personal Expense Tracker] Unified server running on http://0.0.0.0:${PORT}`);
  });

  const cleanup = () => {
    if (pythonProcess) {
      console.log('[Server] Terminating child Python FastAPI process...');
      pythonProcess.kill();
    }
    server.close();
    process.exit(0);
  };

  process.on('SIGINT', cleanup);
  process.on('SIGTERM', cleanup);
}

startServer().catch((err) => {
  console.error('[Fatal] Server failed to start:', err);
  process.exit(1);
});
