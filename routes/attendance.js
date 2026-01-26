import express from 'express';
import Attendance from '../models/Attendance.js';
import { protect } from '../middleware/authMiddleware.js';
import { allowRoles } from '../middleware/roleMiddleware.js';

const router = express.Router();

/* =========================
   CHECK-IN (USER + ADMIN)
========================= */
router.post(
    '/check-in',
    protect,
    allowRoles('user', 'admin'),
    async (req, res) => {
        try {
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
        } catch (err) {
            res.status(500).json({ message: err.message });
        }
    }
);

/* =========================
   CHECK-OUT (USER + ADMIN)
========================= */
router.post(
    '/check-out',
    protect,
    allowRoles('user', 'admin'),
    async (req, res) => {
        try {
            const userId = req.user.id;
            const date = new Date().toISOString().split('T')[0];
            const time = new Date().toTimeString().slice(0, 5);

            const record = await Attendance.findOne({ userId, date });
            if (!record) {
                return res.status(400).json({ message: 'No check-in found for today' });
            }

            const start =
                parseInt(record.checkIn.split(':')[0]) * 60 +
                parseInt(record.checkIn.split(':')[1]);

            const end =
                parseInt(time.split(':')[0]) * 60 +
                parseInt(time.split(':')[1]);

            const hours = (end - start) / 60;

            record.checkOut = time;
            record.totalHours = Number(hours.toFixed(2));
            record.status =
                hours >= 8 ? 'full_day' :
                    hours >= 4 ? 'half_day' :
                        'absent';

            await record.save();
            res.json(record);
        } catch (err) {
            res.status(500).json({ message: err.message });
        }
    }
);

/* =========================
   GET MY ATTENDANCE (SELF)
========================= */
router.get(
    '/me',
    protect,
    allowRoles('user', 'admin'),
    async (req, res) => {
        try {
            const { month } = req.query; // YYYY-MM
            const userId = req.user.id;

            const query = { userId };
            if (month) {
                query.date = { $regex: `^${month}` };
            }

            const records = await Attendance.find(query).sort({ date: 1 });
            res.json(records);
        } catch (err) {
            res.status(500).json({ message: err.message });
        }
    }
);

/* =========================
   GET USER ATTENDANCE (ADMIN ONLY)
========================= */
router.get(
    '/user/:userId',
    protect,
    allowRoles('admin'),
    async (req, res) => {
        try {
            const { month } = req.query;
            const { userId } = req.params;

            const query = { userId };
            if (month) {
                query.date = { $regex: `^${month}` };
            }

            const records = await Attendance.find(query).sort({ date: 1 });
            res.json(records);
        } catch (err) {
            res.status(500).json({ message: err.message });
        }
    }
);

export default router;
