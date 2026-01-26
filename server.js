import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';

import authRoutes from './routes/auth.js';
import userRoutes from './routes/users.js';
import attendanceRoutes from './routes/attendance.js';
import requestRoutes from './routes/requests.js';
import adminRoutes from './routes/admin.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

/* =========================
   MIDDLEWARE
========================= */
app.use(cors({
   origin: 'http://localhost:3000',
   credentials: true
}));
app.use(express.json());

/* =========================
   DATABASE
========================= */
mongoose
   .connect(process.env.MONGO_URI)
   .then(() => console.log('✅ MongoDB connected'))
   .catch(err => console.error('❌ Mongo error:', err.message));

/* =========================
   ROUTES
========================= */
app.get('/', (req, res) => {
   res.send('AcademiaSync Backend Running');
});

app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/attendance', attendanceRoutes);
app.use('/api/requests', requestRoutes);
app.use('/api/admin', adminRoutes);

/* =========================
   SERVER
========================= */
app.listen(PORT, () => {
   console.log(`🚀 Server running on port ${PORT}`);
});
