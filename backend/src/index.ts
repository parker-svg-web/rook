import express from 'express';
import cors from 'cors';
import path from 'path';
import { initDb } from './models/database';
import { runMigrations } from './migrations/run';
import authRoutes from './routes/auth';
import dashboardRoutes from './routes/dashboard';
import adminRoutes from './routes/admin';
import providerRoutes from './routes/providers';
import billingRoutes from './routes/billing';
import gatewayRoutes from './routes/gateway';
import './providers/twilio';
import './providers/sendgrid';
import './providers/openai';

const app = express();
const PORT = parseInt(process.env.PORT || '4000', 10);

app.use(cors());
app.use(express.json());

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', service: 'rook-backend', version: '0.1.0' });
});

app.use('/api/auth', authRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/providers', providerRoutes);
app.use('/api/billing', billingRoutes);
app.use('/api/v1', gatewayRoutes);

const frontendDist = path.join(process.cwd(), 'frontend', 'dist');
app.use(express.static(frontendDist));
app.get('*', (_req, res) => {
  res.sendFile(path.join(frontendDist, 'index.html'));
});

async function start() {
  await initDb();
  await runMigrations();
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[rook] Server running on http://0.0.0.0:${PORT}`);
  });
}
start().catch((err) => {
  console.error('[rook] Failed to start:', err);
  process.exit(1);
});
