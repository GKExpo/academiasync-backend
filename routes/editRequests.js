import express from 'express';
import AttendanceEditRequest from '../models/AttendanceEditRequest.js';
import Attendance from '../models/Attendance.js';
import { protect } from '../middleware/authMiddleware.js';
import { allowRoles } from '../middleware/roleMiddleware.js';

const router = express.Router();

/* =========================
   USER SUBMITS EDIT REQUEST
========================= */
router.post(
    '/attendance-edit',
    protect,
    async (req, res) => {
        try {
            const {
                attendanceId,
                requestedCheckIn,
                requestedCheckOut,
                reason,
            } = req.body;

            const request = await AttendanceEditRequest.create({
                userId: req.user.id,
                attendanceId,
                requestedCheckIn,
                requestedCheckOut,
                reason,
            });

            res.json(request);
        } catch (err) {
            res.status(500).json({ message: err.message });
        }
    }
);

/* =========================
   ADMIN APPROVES REQUEST
========================= */
router.put(
    '/attendance-edit/:id/approve',
    protect,
    allowRoles('admin'),
    async (req, res) => {
        try {
            const request = await AttendanceEditRequest.findById(
                req.params.id
            );

            if (!request)
                return res.status(404).json({ message: 'Not found' });

            request.status = 'approved';

            const attendance = await Attendance.findById(
                request.attendanceId
            );

            attendance.checkIn = request.requestedCheckIn;
            attendance.checkOut = request.requestedCheckOut;

            await attendance.save();
            await request.save();

            res.json({ message: 'Approved and updated' });
        } catch (err) {
            res.status(500).json({ message: err.message });
        }
    }
);

export default router;
