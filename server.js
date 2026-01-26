import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';
import authRoutes from './routes/auth.js';
import userRoutes from './routes/users.js';

app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);

/* =========================
   LOAD ENV
========================= */
dotenv.config();

/* =========================
   APP INIT (MUST BE FIRST)
========================= */
const app = express();
const PORT = process.env.PORT || 5000;

/* =========================
   GLOBAL MIDDLEWARE
========================= */
app.use(
   cors({
      origin: 'http://localhost:3000',
      credentials: true
   })
);

app.use(express.json());

/* =========================
   ROUTE IMPORTS
========================= */
import authRoutes from './routes/auth.js';
import userRoutes from './routes/users.js';
import attendanceRoutes from './routes/attendance.js';
import requestRoutes from './routes/requests.js';

/* =========================
   ROUTE MOUNTING
========================= */
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/attendance', attendanceRoutes);
app.use('/api/requests', requestRoutes);

/* =========================
   DATABASE CONNECTION
========================= */
mongoose
   .connect(process.env.MONGO_URI)
   .then(() => console.log('✅ MongoDB connected'))
   .catch(err => {
      console.error('❌ MongoDB connection error:', err);
      process.exit(1);
   });

/* =========================
   HEALTH CHECK
========================= */
app.get('/', (req, res) => {
   res.send('AcademiaSync Backend Running');
});

/* =========================
   404 HANDLER
========================= */
app.use((req, res) => {
   res.status(404).json({ message: 'Route not found' });
});

/* =========================
   SERVER START
========================= */
app.listen(PORT, () => {
   console.log(`🚀 Server running on port ${PORT}`);
});
