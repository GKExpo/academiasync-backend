import express from 'express';
import User from '../models/User.js';
import { protect } from '../middleware/authMiddleware.js';
import { allowRoles } from '../middleware/roleMiddleware.js';

const router = express.Router();

/* ===============================
   GET ALL USERS (ADMIN ONLY)
   GET /api/users
================================ */
router.get(
    '/',
    protect,
    allowRoles('admin'),
    async (req, res) => {
        try {
            const users = await User.find({ isActive: true }).select('-passwordHash');
            res.json(users);
        } catch (err) {
            res.status(500).json({ message: 'Server error' });
        }
    }
);

/* ===============================
   GET LOGGED-IN USER PROFILE
   GET /api/users/me
================================ */
router.get(
    '/me',
    protect,
    async (req, res) => {
        try {
            res.json(req.user);
        } catch (err) {
            res.status(500).json({ message: 'Server error' });
        }
    }
);

/* ===============================
   GET USER BY ID
   ADMIN or SELF
   GET /api/users/:id
================================ */
router.get(
    '/:id',
    protect,
    async (req, res) => {
        try {
            // Allow admin or same user
            if (
                !req.user.role.includes('admin') &&
                req.user._id.toString() !== req.params.id
            ) {
                return res.status(403).json({ message: 'Access denied' });
            }

            const user = await User.findById(req.params.id).select('-passwordHash');
            if (!user) {
                return res.status(404).json({ message: 'User not found' });
            }

            res.json(user);
        } catch (err) {
            res.status(500).json({ message: 'Server error' });
        }
    }
);

/* ===============================
   GET SUBORDINATES (ADMIN ONLY)
   GET /api/users/:id/subordinates
================================ */
router.get(
    '/:id/subordinates',
    protect,
    allowRoles('admin'),
    async (req, res) => {
        try {
            const subordinates = await User.find({
                reportsTo: req.params.id,
                isActive: true
            }).select('-passwordHash');

            res.json(subordinates);
        } catch (err) {
            res.status(500).json({ message: 'Server error' });
        }
    }
);

export default router;
