import express from 'express';
import bcrypt from 'bcrypt';
import User from '../models/User.js';
import { protect } from '../middleware/authMiddleware.js';
import { allowRoles } from '../middleware/roleMiddleware.js';

const router = express.Router();

/* =========================
   GET ALL USERS (ADMIN ONLY)
========================= */
router.get(
    '/',
    protect,
    allowRoles('admin'),
    async (req, res) => {
        try {
            const users = await User.find({ isActive: true });
            res.json(users);
        } catch (err) {
            res.status(500).json({ message: err.message });
        }
    }
);

/* =========================
   GET USER BY ID (ADMIN OR SELF)
========================= */
router.get(
    '/:id',
    protect,
    allowRoles('admin', 'user'),
    async (req, res) => {
        try {
            // Normal user can access only their own data
            if (
                !req.user.role.includes('admin') &&
                req.user.id !== req.params.id
            ) {
                return res.status(403).json({ message: 'Access denied' });
            }

            const user = await User.findById(req.params.id);
            if (!user) {
                return res.status(404).json({ message: 'User not found' });
            }

            res.json(user);
        } catch (err) {
            res.status(500).json({ message: err.message });
        }
    }
);

/* =========================
   GET SUBORDINATES (ADMIN ONLY)
========================= */
router.get(
    '/:id/subordinates',
    protect,
    allowRoles('admin'),
    async (req, res) => {
        try {
            const subordinates = await User.find({
                reportsTo: req.params.id,
                isActive: true
            });

            res.json(subordinates);
        } catch (err) {
            res.status(500).json({ message: err.message });
        }
    }
);

/* =========================
   CREATE USER (ADMIN ONLY)
========================= */
router.post(
    '/',
    protect,
    allowRoles('admin'),
    async (req, res) => {
        try {
            const {
                name,
                email,
                password,
                role,
                department,
                employeeId,
                reportsTo
            } = req.body;

            if (!email || !password) {
                return res.status(400).json({ message: 'Email and password required' });
            }

            const existing = await User.findOne({ email });
            if (existing) {
                return res.status(400).json({ message: 'User already exists' });
            }

            const passwordHash = await bcrypt.hash(password, 10);

            const user = await User.create({
                name,
                email,
                passwordHash,
                role,
                department,
                employeeId,
                reportsTo: reportsTo || null,
                createdBy: req.user.id
            });

            res.status(201).json({
                id: user._id,
                name: user.name,
                email: user.email,
                role: user.role
            });
        } catch (err) {
            res.status(500).json({ message: err.message });
        }
    }
);

export default router;
