import express from 'express';
import User from '../models/User.js';
import AttendanceRequest from '../models/AttendanceRequest.js';
import LeaveRequest from '../models/LeaveRequest.js';
import { protect } from '../middleware/authMiddleware.js';
import { allowRoles } from '../middleware/roleMiddleware.js';

const router = express.Router();

/**
 * GET /api/admin/subordinates
 * Principal → sees HODs
 * HOD → sees Staff
 */
router.get(
    '/subordinates',
    protect,
    allowRoles('principal', 'admin'), // adjust if needed
    async (req, res) => {
        try {
            let filter = {};

            if (req.user.role === 'principal') {
                filter = { role: 'hod' }; // principal sees HODs
            } else if (req.user.role === 'hod') {
                filter = { role: 'staff', department: req.user.department };
            } else {
                return res.status(403).json({ message: 'Access denied' });
            }

            const users = await User.find(filter).select('-passwordHash');

            res.json(users);
        } catch (err) {
            console.error(err);
            res.status(500).json({ message: 'Server error' });
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
