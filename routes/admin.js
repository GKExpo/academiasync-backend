import express from 'express';
import User from '../models/User.js';
import AttendanceRequest from '../models/AttendanceRequest.js';
import LeaveRequest from '../models/LeaveRequest.js';
import { protect } from '../middleware/authMiddleware.js';
import Attendance from '../models/Attendance.js';
import { allowRoles } from '../middleware/roleMiddleware.js';


const router = express.Router();

/**
 * ===============================
 * GET /api/admin/subordinates
 * Principal → sees HODs
 * HOD → sees Staff
 * ===============================
 */
router.get('/subordinates', protect, async (req, res) => {
    try {
        const currentUser = req.user;

        let subordinates = [];

        // PRINCIPAL (only admin role)
        if (
            currentUser.role.length === 1 &&
            currentUser.role.includes('admin')
        ) {
            // Show all HODs (admin + user)
            subordinates = await User.find({
                role: { $all: ['admin', 'user'] }
            }).select('-passwordHash');
        }

        // HOD (admin + user)
        else if (
            currentUser.role.includes('admin') &&
            currentUser.role.includes('user')
        ) {
            // Show staff reporting to this HOD
            subordinates = await User.find({
                reportsTo: currentUser._id,
                role: { $all: ['user'] }
            }).select('-passwordHash');
        }

        else {
            return res.status(403).json({ message: 'Access denied' });
        }

        res.json(subordinates);

    } catch (err) {
        console.error('Subordinates error:', err);
        res.status(500).json({ message: 'Failed to load subordinates' });
    }
});


/**
 * ===============================
 * GET /api/admin/attendance-requests
 * ===============================
 */
router.get('/attendance-requests', protect, async (req, res) => {
    try {
        const requests = await AttendanceRequest.find({
            status: 'pending'
        });

        res.json(requests);
    } catch (err) {
        console.error('Attendance request error:', err);
        res.status(500).json({ message: 'Failed to load attendance requests' });
    }
});


/**
 * ===============================
 * GET /api/admin/leave-requests
 * ===============================
 */
router.get('/leave-requests', protect, async (req, res) => {
    try {
        const requests = await LeaveRequest.find({
            status: 'pending'
        });

        res.json(requests);
    } catch (err) {
        console.error('Leave request error:', err);
        res.status(500).json({ message: 'Failed to load leave requests' });
    }
});


/**
 * ===============================
 * PATCH /api/admin/attendance/:id
 * ===============================
 */
router.patch('/attendance/:id', protect, async (req, res) => {
    try {
        const { status } = req.body;

        const updated = await AttendanceRequest.findByIdAndUpdate(
            req.params.id,
            {
                status,
                approvedBy: req.user._id
            },
            { new: true }
        );

        res.json(updated);

    } catch (err) {
        console.error('Attendance update error:', err);
        res.status(500).json({ message: 'Failed to update attendance request' });
    }
});


/**
 * ===============================
 * PATCH /api/admin/leave/:id
 * ===============================
 */
router.patch('/leave/:id', protect, async (req, res) => {
    try {
        const { status } = req.body;

        const updated = await LeaveRequest.findByIdAndUpdate(
            req.params.id,
            {
                status,
                approvedBy: req.user._id
            },
            { new: true }
        );

        res.json(updated);

    } catch (err) {
        console.error('Leave update error:', err);
        res.status(500).json({ message: 'Failed to update leave request' });
    }
});

router.get(
    '/user-attendance/:id',
    protect,
    allowRoles('admin'),
    async (req, res) => {
        try {
            const records = await Attendance.find({
                userId: req.params.id
            }).sort({ date: -1 });

            res.json(records);
        } catch (err) {
            res.status(500).json({ message: 'Failed to load attendance' });
        }
    }
);

export default router;
