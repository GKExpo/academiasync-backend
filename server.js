import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';

/* =========================
   ROUTE IMPORTS
========================= */
import userRoutes from './routes/users.js';
import attendanceRoutes from './routes/attendance.js';
import requestRoutes from './routes/requests.js';
import authRoutes from './routes/auth.js';

app.use('/api/auth', authRoutes);

dotenv.config();

/* =========================
   APP INIT
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
   API ROUTES
========================= */
app.use('/api/users', userRoutes);
app.use('/api/attendance', attendanceRoutes);
app.use('/api/requests', requestRoutes);

/* =========================
   404 HANDLER
========================= */
app.use((req, res) => {
   res.status(404).json({ message: 'Route not found' });
});

/* =========================
   GLOBAL ERROR HANDLER
========================= */
app.use((err, req, res, next) => {
   console.error(err.stack);
   res.status(500).json({ message: 'Internal server error' });
});

/* =========================
   SERVER START
========================= */
app.listen(PORT, () => {
   console.log(`🚀 Server running on port ${PORT}`);
});
