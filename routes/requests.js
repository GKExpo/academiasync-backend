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

/* =========================
   APPROVE / REJECT REQUESTS (ADMIN)
========================= */
router.patch(
    '/:type/:id',
    protect,
    allowRoles('admin'),
    async (req, res) => {
        try {
            const { type, id } = req.params;
            const { status } = req.body;

            if (!['approved', 'rejected'].includes(status)) {
                return res.status(400).json({ message: 'Invalid status' });
            }

            /* ---- ATTENDANCE REQUEST ---- */
            if (type === 'attendance') {
                const request = await AttendanceRequest.findById(id);
                if (!request) {
                    return res.status(404).json({ message: 'Request not found' });
                }

                request.status = status;
                request.reviewedBy = req.user.id;
                request.reviewedAt = new Date();
                await request.save();

                if (status === 'approved') {
                    let attendance = await Attendance.findOne({
                        userId: request.userId,
                        date: request.requestedDate
                    });

                    if (!attendance) {
                        attendance = await Attendance.create({
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
                        await attendance.save();
                    }
                }

                return res.json(request);
            }

            /* ---- LEAVE REQUEST ---- */
            if (type === 'leave') {
                const request = await LeaveRequest.findById(id);
                if (!request) {
                    return res.status(404).json({ message: 'Request not found' });
                }

                request.status = status;
                request.reviewedBy = req.user.id;
                request.reviewedAt = new Date();
                await request.save();

                if (status === 'approved') {
                    const start = new Date(request.fromDate);
                    const end = new Date(request.toDate);

                    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
                        const dateStr = d.toISOString().split('T')[0];

                        await Attendance.deleteOne({
                            userId: request.userId,
                            date: dateStr
                        });

                        await Attendance.create({
                            userId: request.userId,
                            date: dateStr,
                            status: 'leave'
                        });
                    }
                }

                return res.json(request);
            }

            res.status(400).json({ message: 'Invalid request type' });

        } catch (err) {
            res.status(500).json({ message: err.message });
        }
    }
);

export default router;
