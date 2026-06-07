import express from 'express';
import cors from 'cors';
import path from 'path';
import { initDb, getDb } from './models/database';
import { runMigrations } from './migrations/run';
import authRoutes from './routes/auth';
import dashboardRoutes from './routes/dashboard';
import adminRoutes from './routes/admin';
import providerRoutes from './routes/providers';
import billingRoutes from './routes/billing';
import gatewayRoutes from './routes/gateway';

// Import provider modules to register them in the provider registry
import './providers/twilio';
import './providers/sendgrid';
import './providers/openai';

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
app.use('/api/providers', providerRoutes);
app.use('/api/billing', billingRoutes);
app.use('/api/v1', gatewayRoutes);

// Serve frontend in production
// Try multiple possible paths for the frontend dist directory
const possiblePaths = [
  path.join(__dirname, '..', '..', 'frontend', 'dist'),       // /app/backend/dist -> /app/frontend/dist
  path.join(__dirname, '..', '..', '..', 'frontend', 'dist'), // deeper nesting
  path.join(process.cwd(), 'frontend', 'dist'),               // /app/frontend/dist
  '/app/frontend/dist',                                       // Railway absolute
];
const frontendDist = possiblePaths.find(p => { try { return require('fs').existsSync(p); } catch { return false; } }) || possiblePaths[0];
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