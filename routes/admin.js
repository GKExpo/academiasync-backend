import express from 'express';
import User from '../models/User.js';
import AttendanceRequest from '../models/AttendanceRequest.js';
import LeaveRequest from '../models/LeaveRequest.js';
import { protect } from '../middleware/authMiddleware.js';
import { allowRoles } from '../middleware/roleMiddleware.js';

const router = express.Router();

/**
 * GET /api/admin/subordinates
 * Admin → get all users (students/staff)
 */
router.get(
    '/subordinates',
    protect,
    async (req, res) => {
        try {
            const currentUser = req.user; // comes from protect middleware

            let users = [];

            // ✅ PRINCIPAL → ONLY HODs
            if (currentUser.role === 'admin') {
                users = await User.find({ role: 'hod' })
                    .select('-passwordHash');
            }

            // ✅ HOD → ONLY STAFF
            else if (currentUser.role === 'hod') {
                users = await User.find({
                    role: 'staff',
                    department: currentUser.department
                }).select('-passwordHash');
            }

            // ❌ STAFF → NO SUBORDINATES
            else {
                return res.status(403).json({
                    message: 'No subordinates for this role'
                });
            }

            res.json(users);
        } catch (err) {
            console.error(err);
            res.status(500).json({ message: 'Failed to load subordinates' });
        }
    }
);


/**
 * GET /api/admin/attendance-requests
 * Admin → pending attendance correction requests
 */
router.get(
    '/attendance-requests',
    protect,
    allowRoles('admin'),
    async (req, res) => {
        try {
            const requests = await AttendanceRequest.find({
                status: 'pending'
            });

            res.json(requests);
        } catch (err) {
            res.status(500).json({ message: 'Failed to load attendance requests' });
        }
    }
);

/**
 * GET /api/admin/leave-requests
 * Admin → pending leave requests
 */
router.get(
    '/leave-requests',
    protect,
    allowRoles('admin'),
    async (req, res) => {
        try {
            const requests = await LeaveRequest.find({
                status: 'pending'
            });

            res.json(requests);
        } catch (err) {
            res.status(500).json({ message: 'Failed to load leave requests' });
        }
    }
);

/**
 * POST /api/admin/attendance-requests/:id
 * Approve / Reject attendance request
 */
router.post(
    '/attendance-requests/:id',
    protect,
    allowRoles('admin'),
    async (req, res) => {
        const { status } = req.body;

        try {
            const request = await AttendanceRequest.findByIdAndUpdate(
                req.params.id,
                { status, approvedBy: req.user.id },
                { new: true }
            );

            res.json(request);
        } catch (err) {
            res.status(500).json({ message: 'Failed to update request' });
        }
    }
);

/**
 * POST /api/admin/leave-requests/:id
 * Approve / Reject leave request
 */
router.post(
    '/leave-requests/:id',
    protect,
    allowRoles('admin'),
    async (req, res) => {
        const { status } = req.body;

        try {
            const request = await LeaveRequest.findByIdAndUpdate(
                req.params.id,
                { status, approvedBy: req.user.id },
                { new: true }
            );

            res.json(request);
        } catch (err) {
            res.status(500).json({ message: 'Failed to update request' });
        }
    }
);

export default router;
