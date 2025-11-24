import express, { Response } from 'express';
import { authenticate, authorize, AuthRequest } from '../middleware/auth';
import User from '../models/User';

const router = express.Router();

// @route   GET /api/users/profile
// @desc    Get user profile
// @access  Private
router.get('/profile', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const user = await User.findById(String(req.user!._id)).select('-password');
    if (!user) {
      return res.status(404).json({ message: 'Пользователь не найден' });
    }
    res.json(user);
  } catch (error: any) {
    console.error('Get profile error:', error);
    if (error.name === 'CastError') {
      return res.status(400).json({ message: 'Неверный формат ID' });
    }
    res.status(500).json({ message: 'Ошибка сервера' });
  }
});

// @route   PUT /api/users/profile
// @desc    Update user profile
// @access  Private
router.put('/profile', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { firstName, lastName, avatar, group } = req.body;
    const updateData: any = {};
    
    if (firstName !== undefined) {
      updateData.firstName = firstName && firstName.trim() ? firstName.trim() : undefined;
    }
    if (lastName !== undefined) {
      updateData.lastName = lastName && lastName.trim() ? lastName.trim() : undefined;
    }
    if (avatar !== undefined) {
      updateData.avatar = avatar;
    }
    if (group !== undefined) {
      updateData.group = group || null;
    }

    const user = await User.findByIdAndUpdate(
      String(req.user!._id),
      updateData,
      { new: true, runValidators: true }
    ).select('-password');

    if (!user) {
      return res.status(404).json({ message: 'Пользователь не найден' });
    }

    res.json(user);
  } catch (error: any) {
    console.error('Update profile error:', error);
    if (error.name === 'ValidationError') {
      return res.status(400).json({ message: error.message });
    }
    res.status(500).json({ message: 'Ошибка сервера' });
  }
});

// @route   GET /api/users
// @desc    Get all users (admin/teacher only)
// @access  Private (Admin/Teacher)
router.get('/', authenticate, authorize('admin', 'teacher'), async (req: AuthRequest, res: Response) => {
  try {
    const users = await User.find().select('-password').sort({ createdAt: -1 });
    res.json(users);
  } catch (error: any) {
    console.error('Get users error:', error);
    res.status(500).json({ message: 'Ошибка сервера' });
  }
});

export default router;

