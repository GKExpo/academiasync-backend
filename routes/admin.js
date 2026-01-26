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

export default router;
