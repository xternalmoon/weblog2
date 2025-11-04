import express from 'express';
import Notification from '../models/Notification.js';
import { verifyToken } from '../middleware/auth.js';

const router = express.Router();

// Get new notification status
router.get('/new-notification', verifyToken, async (req, res) => {
  try {
    const userId = req.user._id;
    
    const unreadCount = await Notification.countDocuments({
      notification_for: userId,
      seen: false
    });

    res.json({ new_notification_available: unreadCount > 0 });
  } catch (error) {
    console.error('New notification error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get notifications
router.post('/notifications', verifyToken, async (req, res) => {
  try {
    const userId = req.user._id;
    const { page = 1, filter, deletedDocCount = 0 } = req.body;
    const perPage = 10;
    const skip = (page - 1) * perPage - deletedDocCount;

    let query = { notification_for: userId };
    
    // support filters: all | like | comment | reply | read | unread
    if (filter === 'unread') {
      query.seen = false;
    } else if (filter === 'read') {
      query.seen = true;
    } else if (filter === 'like' || filter === 'comment' || filter === 'reply') {
      query.type = filter;
    }

    const notifications = await Notification.find(query)
      .populate('blog', 'title blog_id')
      .populate('user', 'personal_info.fullname personal_info.username personal_info.profile_img')
      .populate('comment', 'comment')
      .sort({ createdAt: -1 })
      .skip(Math.max(0, skip))
      .limit(perPage);

    // Mark as read
    const notificationIds = notifications.filter(n => !n.seen).map(n => n._id);
    if (notificationIds.length > 0) {
      await Notification.updateMany(
        { _id: { $in: notificationIds } },
        { seen: true }
      );
    }

    res.json({ notifications });
  } catch (error) {
    console.error('Get notifications error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Count notifications for pagination based on filter
router.post('/all-notifications-count', verifyToken, async (req, res) => {
  try {
    const userId = req.user._id;
    const { filter } = req.body || {};

    const query = { notification_for: userId };

    if (filter === 'unread') {
      query.seen = false;
    } else if (filter === 'read') {
      query.seen = true;
    } else if (filter === 'like' || filter === 'comment' || filter === 'reply') {
      query.type = filter;
    }

    const totalDocs = await Notification.countDocuments(query);
    res.json({ totalDocs });
  } catch (error) {
    console.error('All notifications count error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;

