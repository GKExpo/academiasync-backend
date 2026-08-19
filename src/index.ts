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
    "https://academiasync-backend.onrender.com"
  ],
  credentials: true
}));

app.get('/', (c) => {
  return c.text('AcademiaSync Backend (Cloudflare Workers) Running');
});

app.route('/api/auth', authRoutes);
app.route('/api/users', userRoutes);
app.route('/api/attendance', attendanceRoutes);
app.route('/api/requests', requestRoutes);
app.route('/api/admin', adminRoutes);

export default app;
