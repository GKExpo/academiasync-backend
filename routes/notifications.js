import express from 'express';
import Notification from '../models/Notification.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

// Get my notifications
router.get('/', protect, async (req, res) => {
    const notifications = await Notification
        .find({ userId: req.user.id })
        .sort({ createdAt: -1 })
        .limit(20);

    res.json(notifications);
});

// Mark as read
router.patch('/:id/read', protect, async (req, res) => {
    await Notification.findByIdAndUpdate(req.params.id, {
        isRead: true
    });

    res.json({ message: "Marked as read" });
});

export default router;
