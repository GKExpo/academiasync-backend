import express from 'express';
import Attendance from '../models/Attendance.js';
import AttendanceRequest from '../models/AttendanceRequest.js';
import LeaveRequest from '../models/LeaveRequest.js';
import User from '../models/User.js';
import { protect } from '../middleware/authMiddleware.js';
import { allowRoles } from '../middleware/roleMiddleware.js';

const router = express.Router();

/* =========================
   CREATE ATTENDANCE EDIT REQUEST (USER)
========================= */
router.post(
    '/attendance',
    protect,
    allowRoles('user'),
    async (req, res) => {
        try {
            const {
                attendanceId,
                requestedDate,
                requestedCheckIn,
                requestedCheckOut,
                reason
            } = req.body;

            const request = await AttendanceRequest.create({
                attendanceId,
                userId: req.user.id,
                requestedDate,
                requestedCheckIn,
                requestedCheckOut,
                reason
            });

            res.status(201).json(request);
        } catch (err) {
            res.status(500).json({ message: err.message });
        }
    }
);

/* =========================
   CREATE LEAVE REQUEST (USER)
========================= */
router.post(
    '/leave',
    protect,
    allowRoles('user'),
    async (req, res) => {
        try {
            const {
                fromDate,
                toDate,
                leaveType,
                reason
            } = req.body;

            const request = await LeaveRequest.create({
                userId: req.user.id,
                fromDate,
                toDate,
                leaveType,
                reason
            });

            res.status(201).json(request);
        } catch (err) {
            res.status(500).json({ message: err.message });
        }
    }
);

/* =========================
   GET PENDING REQUESTS (ADMIN)
========================= */
router.get(
    '/pending',
    protect,
    allowRoles('admin'),
    async (req, res) => {
        try {
            const attendance = await AttendanceRequest.find({ status: 'pending' });
            const leave = await LeaveRequest.find({ status: 'pending' });

            res.json({ attendance, leave });
        } catch (err) {
            res.status(500).json({ message: err.message });
        }
    }
);

// Approve / Reject leave (ADMIN)
router.patch(
    '/leave/:id',
    protect,
    allowRoles('admin'),
    async (req, res) => {
        try {
            const { status } = req.body;

            const request = await LeaveRequest.findById(req.params.id);
            if (!request) {
                return res.status(404).json({ message: 'Request not found' });
            }

            request.status = status;
            request.reviewedBy = req.user.id;
            await request.save();

            // If approved → create attendance leave entries
            if (status === 'approved') {
                let start = new Date(request.fromDate);
                let end = new Date(request.toDate);

                for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
                    const date = d.toISOString().split('T')[0];

                    await Attendance.findOneAndUpdate(
                        { userId: request.userId, date },
                        {
                            userId: request.userId,
                            date,
                            status: 'leave'
                        },
                        { upsert: true }
                    );
                }
            }

            res.json(request);
        } catch (err) {
            res.status(500).json({ message: err.message });
        }
    }
);

// Apply leave
router.post('/leave', protect, async (req, res) => {
    try {
        const leave = await LeaveRequest.create({
            userId: req.user.id,
            fromDate: req.body.fromDate,
            toDate: req.body.toDate,
            reason: req.body.reason
        });

        res.status(201).json(leave);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
})

export default router;
