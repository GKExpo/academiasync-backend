import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';
import bcrypt from 'bcrypt';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors({
    origin: 'http://localhost:3000', // Vite port as configured
    credentials: true
}));
app.use(express.json());

app.get('/', (req, res) => {
    res.send('AcademiaSync Backend Running');
});

// MongoDB Connection
mongoose.connect(process.env.MONGO_URI)
    .catch(err => console.error('MongoDB connection error:', err));

// Schemas
const userSchema = new mongoose.Schema({
    name: String,
    email: { type: String, unique: true },
    passwordHash: String,
    role: [String],
    department: String,
    employeeId: String,
    reportsTo: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    isActive: { type: Boolean, default: true },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
});

const attendanceSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    date: { type: String, required: true }, // YYYY-MM-DD
    checkIn: String, // HH:mm
    checkOut: String, // HH:mm
    totalHours: Number,
    status: { type: String, enum: ['full_day', 'half_day', 'leave', 'absent', 'present'], required: true },
    isEdited: { type: Boolean, default: false },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
});

const attendanceRequestSchema = new mongoose.Schema({
    attendanceId: { type: mongoose.Schema.Types.ObjectId, ref: 'Attendance' },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    requestedDate: { type: String, required: true },
    requestedCheckIn: { type: String, required: true },
    requestedCheckOut: { type: String, required: true },
    reason: String,
    status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
    reviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    reviewedAt: Date,
    createdAt: { type: Date, default: Date.now }
});

const leaveRequestSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    fromDate: { type: String, required: true },
    toDate: { type: String, required: true },
    leaveType: { type: String, enum: ['single', 'multiple'], required: true },
    reason: String,
    status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
    reviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    reviewedAt: Date,
    createdAt: { type: Date, default: Date.now }
});

const notificationSchema = new mongoose.Schema({
    recipientId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    type: { type: String, enum: ['attendance_edit', 'leave_request'], required: true },
    referenceId: { type: mongoose.Schema.Types.ObjectId, required: true },
    message: String,
    isRead: { type: Boolean, default: false },
    createdAt: { type: Date, default: Date.now }
});

// Models
const User = mongoose.model('User', userSchema);
const Attendance = mongoose.model('Attendance', attendanceSchema);
const AttendanceRequest = mongoose.model('AttendanceRequest', attendanceRequestSchema);
const LeaveRequest = mongoose.model('LeaveRequest', leaveRequestSchema);
const Notification = mongoose.model('Notification', notificationSchema);

// API Routes

// POST /api/login
app.post('/api/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        const user = await User.findOne({ email, isActive: true });
        if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// GET /api/users/:id
app.get('/api/users/:id', async (req, res) => {
    try {
        const user = await User.findById(req.params.id);
        if (!user) return res.status(404).json({ error: 'User not found' });
        res.json(user);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// GET /api/users
app.get('/api/users', async (req, res) => {
    try {
        const users = await User.find({ isActive: true });
        res.json(users);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// GET /api/users/:id/subordinates
app.get('/api/users/:id/subordinates', async (req, res) => {
    try {
        const subordinates = await User.find({ reportsTo: req.params.id, isActive: true });
        res.json(subordinates);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// POST /api/attendance/check-in
app.post('/api/attendance/check-in', async (req, res) => {
    try {
        const { userId } = req.body;
        const date = new Date().toISOString().split('T')[0];
        const time = new Date().toTimeString().slice(0, 5);

        const existing = await Attendance.findOne({ userId, date });
        if (existing) return res.status(400).json({ error: 'Already checked in' });

        const newRecord = new Attendance({
            userId,
            date,
            checkIn: time,
            status: 'present'
        });

        await newRecord.save();
        res.json(newRecord);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// POST /api/attendance/check-out
app.post('/api/attendance/check-out', async (req, res) => {
    try {
        const { userId } = req.body;
        const date = new Date().toISOString().split('T')[0];
        const time = new Date().toTimeString().slice(0, 5);

        const record = await Attendance.findOne({ userId, date });
        if (!record) return res.status(400).json({ error: 'No check-in found for today' });

        record.checkOut = time;
        record.updatedAt = new Date();

        // Calculate status
        const start = parseInt(record.checkIn.split(':')[0]) * 60 + parseInt(record.checkIn.split(':')[1]);
        const end = parseInt(time.split(':')[0]) * 60 + parseInt(time.split(':')[1]);
        const hours = (end - start) / 60;
        record.totalHours = parseFloat(hours.toFixed(2));

        if (hours >= 8) record.status = 'full_day';
        else if (hours >= 4) record.status = 'half_day';
        else record.status = 'absent';

        await record.save();
        res.json(record);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// GET /api/attendance/:userId?month=YYYY-MM
app.get('/api/attendance/:userId', async (req, res) => {
    try {
        const { userId } = req.params;
        const { month } = req.query;
        const records = await Attendance.find({
            userId,
            date: { $regex: `^${month}` }
        });
        res.json(records);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// GET /api/requests/pending/:managerId
app.get('/api/requests/pending/:managerId', async (req, res) => {
    try {
        const subordinates = await User.find({ reportsTo: req.params.managerId, isActive: true });
        const subIds = subordinates.map(s => s._id);

        const attendance = await AttendanceRequest.find({
            userId: { $in: subIds },
            status: 'pending'
        });

        const leave = await LeaveRequest.find({
            userId: { $in: subIds },
            status: 'pending'
        });

        res.json({ attendance, leave });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// POST /api/requests/attendance
app.post('/api/requests/attendance', async (req, res) => {
    try {
        const newRequest = new AttendanceRequest(req.body);
        await newRequest.save();
        res.status(201).json(newRequest);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// POST /api/requests/leave
app.post('/api/requests/leave', async (req, res) => {
    try {
        const newRequest = new LeaveRequest(req.body);
        await newRequest.save();
        res.status(201).json(newRequest);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// PATCH /api/requests/:type/:id
app.patch('/api/requests/:type/:id', async (req, res) => {
    try {
        const { type, id } = req.params;
        const { status, adminId } = req.body;

        if (type === 'attendance') {
            const request = await AttendanceRequest.findById(id);
            if (!request) return res.status(404).json({ error: 'Request not found' });

            request.status = status;
            request.reviewedBy = adminId;
            request.reviewedAt = new Date();
            await request.save();

            if (status === 'approved') {
                // Update or create attendance record
                let attendance = await Attendance.findOne({ userId: request.userId, date: request.requestedDate });
                if (!attendance) {
                    attendance = new Attendance({
                        userId: request.userId,
                        date: request.requestedDate,
                        checkIn: request.requestedCheckIn,
                        checkOut: request.requestedCheckOut,
                        status: 'full_day',
                        isEdited: true
                    });
                } else {
                    attendance.checkIn = request.requestedCheckIn;
                    attendance.checkOut = request.requestedCheckOut;
                    attendance.status = 'full_day';
                    attendance.isEdited = true;
                    attendance.updatedAt = new Date();
                }
                await attendance.save();
            }

            res.json(request);
        } else if (type === 'leave') {
            const request = await LeaveRequest.findById(id);
            if (!request) return res.status(404).json({ error: 'Request not found' });

            request.status = status;
            request.reviewedBy = adminId;
            request.reviewedAt = new Date();
            await request.save();

            if (status === 'approved') {
                // Create leave records
                const start = new Date(request.fromDate);
                const end = new Date(request.toDate);

                for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
                    const dateStr = d.toISOString().split('T')[0];
                    // Remove existing attendance if any
                    await Attendance.deleteOne({ userId: request.userId, date: dateStr });

                    const leaveRecord = new Attendance({
                        userId: request.userId,
                        date: dateStr,
                        status: 'leave'
                    });
                    await leaveRecord.save();
                }
            }

            res.json(request);
        } else {
            res.status(400).json({ error: 'Invalid request type' });
        }
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// GET /api/notifications/:userId
app.get('/api/notifications/:userId', async (req, res) => {
    try {
        const notifications = await Notification.find({
            recipientId: req.params.userId,
            isRead: false
        });
        res.json(notifications);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// POST /api/notifications
app.post('/api/notifications', async (req, res) => {
    try {
        const newNotification = new Notification(req.body);
        await newNotification.save();
        res.status(201).json(newNotification);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});