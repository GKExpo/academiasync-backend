import { Hono } from 'hono';
import { cors } from 'hono/cors';

import authRoutes from './routes/auth';
import userRoutes from './routes/users';
import attendanceRoutes from './routes/attendance';
import requestRoutes from './routes/requests';
import adminRoutes from './routes/admin';

export type Bindings = {
  DB: D1Database;
  JWT_SECRET: string;
};

const app = new Hono<{ Bindings: Bindings }>();

app.use('*', cors({
  origin: [
    "http://localhost",
    "https://localhost",
    "capacitor://localhost",
    "http://localhost:3000",
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "http://10.0.2.2:5173"
  ],
  credentials: true
}));

app.get('/', (c) => {
  return c.text('AcademiaSync Backend (Cloudflare Workers) Running');
});

app.get('/api/health', (c) => c.json({ status: 'ok' }));

app.get('/api/health/db', async (c) => {
  try {
    await c.env.DB.prepare('SELECT 1').run();
    return c.json({ status: 'ok' });
  } catch (err) {
    return c.json({ status: 'error' }, 500);
  }
});

app.route('/api/auth', authRoutes);
app.route('/api/users', userRoutes);
app.route('/api/attendance', attendanceRoutes);
app.route('/api/requests', requestRoutes);
app.route('/api/admin', adminRoutes);

export default app;
