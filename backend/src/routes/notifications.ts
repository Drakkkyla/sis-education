import express, { Response } from 'express';
import { authenticate, AuthRequest } from '../middleware/auth';
import Notification from '../models/Notification';

const router = express.Router();

// @route   GET /api/notifications
// @desc    Get all notifications for user
// @access  Private
router.get('/', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const userId = String(req.user!._id);
    const { limit = 50, unreadOnly } = req.query;

    const query: any = { user: userId };
    if (unreadOnly === 'true') {
      query.isRead = false;
    }

    const notifications = await Notification.find(query)
      .sort({ createdAt: -1 })
      .limit(Number(limit));

    const unreadCount = await Notification.countDocuments({
      user: userId,
      isRead: false,
    });

    res.json({
      notifications,
      unreadCount,
    });
  } catch (error: any) {
    console.error('Get notifications error:', error);
    res.status(500).json({ message: 'Ошибка сервера' });
  }
});

// @route   PUT /api/notifications/:id/read
// @desc    Mark notification as read
// @access  Private
router.put('/:id/read', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const userId = String(req.user!._id);
    const notification = await Notification.findOne({
      _id: req.params.id,
      user: userId,
    });

    if (!notification) {
      return res.status(404).json({ message: 'Уведомление не найдено' });
    }

    notification.isRead = true;
    notification.readAt = new Date();
    await notification.save();

    res.json(notification);
  } catch (error: any) {
    console.error('Mark notification as read error:', error);
    res.status(500).json({ message: 'Ошибка сервера' });
  }
});

// @route   PUT /api/notifications/read-all
// @desc    Mark all notifications as read
// @access  Private
router.put('/read-all', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const userId = String(req.user!._id);
    const result = await Notification.updateMany(
      { user: userId, isRead: false },
      { isRead: true, readAt: new Date() }
    );

    res.json({ message: 'Все уведомления отмечены как прочитанные', count: result.modifiedCount });
  } catch (error: any) {
    console.error('Mark all notifications as read error:', error);
    res.status(500).json({ message: 'Ошибка сервера' });
  }
});

// @route   DELETE /api/notifications/:id
// @desc    Delete notification
// @access  Private
router.delete('/:id', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const userId = String(req.user!._id);
    const notification = await Notification.findOneAndDelete({
      _id: req.params.id,
      user: userId,
    });

    if (!notification) {
      return res.status(404).json({ message: 'Уведомление не найдено' });
    }

    res.json({ message: 'Уведомление удалено' });
  } catch (error: any) {
    console.error('Delete notification error:', error);
    res.status(500).json({ message: 'Ошибка сервера' });
  }
});

export default router;

