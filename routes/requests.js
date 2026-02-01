import express from 'express';
import Attendance from '../models/Attendance.js';
import AttendanceRequest from '../models/AttendanceRequest.js';
import LeaveRequest from '../models/LeaveRequest.js';
import User from '../models/User.js';
import { protect } from '../middleware/authMiddleware.js';
import { allowRoles } from '../middleware/roleMiddleware.js';

const router = express.Router();

/* ======================================================
   CREATE ATTENDANCE CORRECTION REQUEST (USER)
====================================================== */
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

            if (!requestedDate || !reason) {
                return res.status(400).json({ message: 'Missing required fields' });
            }

            const request = await AttendanceRequest.create({
                attendanceId,
                userId: req.user._id,
                requestedDate,
                requestedCheckIn,
                requestedCheckOut,
                reason,
                status: 'PENDING'
            });

            res.status(201).json(request);
        } catch (err) {
            res.status(500).json({ message: 'Failed to create request' });
        }
    }
);

/* =========================
   APPLY LEAVE (USER + HOD)
========================= */
router.post(
    '/leave',
    protect,
    allowRoles('user', 'admin'), // HOD also allowed
    async (req, res) => {
        try {
            const { fromDate, toDate, reason } = req.body;

            if (!fromDate || !toDate || !reason) {
                return res.status(400).json({ message: 'All fields are required' });
            }

            const leave = await LeaveRequest.create({
                user: req.user.id,
                fromDate,
                toDate,
                reason,
                status: 'pending'
            });

            res.status(201).json(leave);

        } catch (err) {
            console.error('Leave apply error:', err);
            res.status(500).json({ message: 'Failed to apply leave' });
        }
    }
);


/* ======================================================
   GET PENDING REQUESTS (PRINCIPAL / HOD)
====================================================== */
router.get(
    '/pending',
    protect,
    allowRoles('admin'),
    async (req, res) => {
        try {

            let subordinateIds = [];

            // Principal (only admin)
            if (req.user.role.length === 1 && req.user.role.includes('admin')) {
                const hods = await User.find({
                    role: { $in: ['admin'] },
                    _id: { $ne: req.user._id }
                });

                subordinateIds = hods.map(h => h._id);
            }

            // HOD (admin + user)
            else if (
                req.user.role.includes('admin') &&
                req.user.role.includes('user')
            ) {
                const staff = await User.find({
                    reportsTo: req.user._id
                });

                subordinateIds = staff.map(s => s._id);
            }

            const attendance = await AttendanceRequest.find({
                status: 'pending',
                userId: { $in: subordinateIds }
            });

            const leave = await LeaveRequest.find({
                status: 'pending',
                user: { $in: subordinateIds }
            });

            res.json({ attendance, leave });

        } catch (err) {
            console.error(err);
            res.status(500).json({ message: err.message });
        }
    }
);


/* ======================================================
   APPROVE / REJECT LEAVE (ADMIN / HOD)
====================================================== */
router.patch(
    '/leave/:id',
    protect,
    allowRoles('admin'),
    async (req, res) => {
        try {
            const { status } = req.body;

            if (!['approved', 'rejected'].includes(status)) {
                return res.status(400).json({ message: 'Invalid status value' });
            }

            const request = await LeaveRequest.findById(req.params.id);

            if (!request) {
                return res.status(404).json({ message: 'Request not found' });
            }

            request.status = status;
            request.reviewedBy = req.user.id;
            await request.save();

            // If approved → mark attendance as leave
            if (status === 'approved') {
                let start = new Date(request.fromDate);
                let end = new Date(request.toDate);

                for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
                    const date = d.toISOString().split('T')[0];

                    await Attendance.findOneAndUpdate(
                        { userId: request.user, date },
                        {
                            userId: request.user,
                            date,
                            status: 'leave'
                        },
                        { upsert: true }
                    );
                }
            }

            res.json(request);

        } catch (err) {
            console.error("Leave approval error:", err);
            res.status(500).json({ message: 'Failed to update leave request' });
        }
    }
);


export default router;
