import express from 'express';
import cors from 'cors';
import path from 'path';
import { initDb, getDb } from './models/database';
import { runMigrations } from './migrations/run';
import authRoutes from './routes/auth';
import dashboardRoutes from './routes/dashboard';
import adminRoutes from './routes/admin';

const app = express();
const PORT = parseInt(process.env.PORT || '4000', 10);

// Middleware
app.use(cors());
app.use(express.json());

// Health check (doesn't require DB)
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', service: 'rook-backend', version: '0.1.0' });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/admin', adminRoutes);

// Serve frontend in production
const frontendDist = path.join(__dirname, '..', '..', 'frontend', 'dist');
app.use(express.static(frontendDist));
app.get('*', (_req, res) => {
  res.sendFile(path.join(frontendDist, 'index.html'));
});

// Initialize database then start server
async function start() {
  await initDb();
  await runMigrations();

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[rook-backend] Server running on http://0.0.0.0:${PORT}`);
    console.log(`[rook-backend] API: http://0.0.0.0:${PORT}/api/health`);
  });
}

start().catch((err) => {
  console.error('[rook-backend] Failed to start:', err);
  process.exit(1);
});

export default app;