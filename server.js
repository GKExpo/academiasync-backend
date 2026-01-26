import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { protect } from './middleware/authMiddleware.js';

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
    .then(() => console.log('MongoDB connected'))
    .catch(err => console.error(err));

/* =========================
   MODELS
========================= */
const userSchema = new mongoose.Schema({
    name: String,
    email: { type: String, unique: true, required: true },
    passwordHash: { type: String, required: true },
    role: [String],
    department: String,
    employeeId: String,
    reportsTo: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    isActive: { type: Boolean, default: true }
}, { timestamps: true });

const attendanceSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    date: String,
    checkIn: String,
    checkOut: String,
    totalHours: Number,
    status: String,
    isEdited: { type: Boolean, default: false }
}, { timestamps: true });

const User = mongoose.model('User', userSchema);
const Attendance = mongoose.model('Attendance', attendanceSchema);

/* =========================
   HEALTH
========================= */
app.get('/', (req, res) => {
    res.send('AcademiaSync Backend Running');
});

/* =========================
   AUTH (PUBLIC)
========================= */
app.post('/api/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        const user = await User.findOne({ email, isActive: true });
        if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        const token = jwt.sign(
            { id: user._id, role: user.role },
            process.env.JWT_SECRET,
            { expiresIn: '1d' }
        );

        res.json({
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                role: user.role
            },
            token
        });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

/* =========================
   USERS (PROTECTED)
========================= */
app.get('/api/users', protect, async (req, res) => {
    const users = await User.find({ isActive: true });
    res.json(users);
});

app.get('/api/users/:id', protect, async (req, res) => {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json(user);
});

app.get('/api/users/:id/subordinates', protect, async (req, res) => {
    const subs = await User.find({ reportsTo: req.params.id, isActive: true });
    res.json(subs);
});

/* =========================
   ATTENDANCE (PROTECTED)
========================= */
app.post('/api/attendance/check-in', protect, async (req, res) => {
    const userId = req.user.id;
    const date = new Date().toISOString().split('T')[0];
    const time = new Date().toTimeString().slice(0, 5);

    const existing = await Attendance.findOne({ userId, date });
    if (existing) {
        return res.status(400).json({ message: 'Already checked in' });
    }

    const record = await Attendance.create({
        userId,
        date,
        checkIn: time,
        status: 'present'
    });

    res.json(record);
});

app.post('/api/attendance/check-out', protect, async (req, res) => {
    const userId = req.user.id;
    const date = new Date().toISOString().split('T')[0];
    const time = new Date().toTimeString().slice(0, 5);

    const record = await Attendance.findOne({ userId, date });
    if (!record) {
        return res.status(400).json({ message: 'No check-in found' });
    }

    const start =
        parseInt(record.checkIn.split(':')[0]) * 60 +
        parseInt(record.checkIn.split(':')[1]);

    const end =
        parseInt(time.split(':')[0]) * 60 +
        parseInt(time.split(':')[1]);

    const hours = (end - start) / 60;

    record.checkOut = time;
    record.totalHours = +hours.toFixed(2);
    record.status = hours >= 8 ? 'full_day' : hours >= 4 ? 'half_day' : 'absent';

    await record.save();
    res.json(record);
});

/* =========================
   SERVER
========================= */
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
