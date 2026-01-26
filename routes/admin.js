import express from 'express';
import User from '../models/User.js';
import { protect } from '../middleware/authMiddleware.js';
import { allowRoles } from '../middleware/roleMiddleware.js';

const router = express.Router();

router.get(
    '/users',
    protect,
    allowRoles('admin'),
    async (req, res) => {
        const users = await User.find();
        res.json(users);
    }
);

router.get(
    '/attendance-stats',
    protect,
    allowRoles('admin'),
    async (req, res) => {
        try {
            const { month } = req.query;

            const records = await Attendance.find({
                date: { $regex: `^${month}` }
            });

            const stats = {
                totalRecords: records.length,
                fullDay: records.filter(r => r.status === 'full_day').length,
                halfDay: records.filter(r => r.status === 'half_day').length,
                leave: records.filter(r => r.status === 'leave').length,
                absent: records.filter(r => r.status === 'absent').length
            };

            res.json(stats);
        } catch (err) {
            res.status(500).json({ message: err.message });
        }
    }
);

export default router;
