import express, { Request, Response } from 'express';
import { body, validationResult } from 'express-validator';
import jwt, { SignOptions } from 'jsonwebtoken';
import User from '../models/User';
import { authenticate, AuthRequest } from '../middleware/auth';

const router = express.Router();

// Generate JWT token
const generateToken = (userId: string): string => {
  const secret = (process.env.JWT_SECRET || 'secret') as string;
  const expiresIn = (process.env.JWT_EXPIRE || '7d') as string | number;
  
  return jwt.sign(
    { userId },
    secret,
    { expiresIn } as SignOptions
  );
};

// @route   POST /api/auth/register
// @desc    Register a new user
// @access  Public
router.post(
  '/register',
  [
    body('username')
      .isLength({ min: 3, max: 30 })
      .matches(/^[a-zA-Z0-9_]+$/)
      .withMessage('Логин должен содержать только буквы, цифры и подчеркивание (3-30 символов)'),
    body('password').isLength({ min: 6 }),
    body('email').optional().isEmail().normalizeEmail(),
    body('firstName').optional().trim(),
    body('lastName').optional().trim(),
    body('group')
      .optional({ checkFalsy: true, values: 'falsy' })
      .custom((value) => {
        if (value && !['haitech', 'promdesign', 'promrobo', 'energy', 'bio', 'aero', 'media', 'vrar'].includes(value)) {
          throw new Error('Некорректный квантум');
        }
        return true;
      }),
  ],
  async (req: Request, res: Response) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        console.error('Registration validation errors:', errors.array());
        return res.status(400).json({ 
          message: 'Ошибка валидации',
          errors: errors.array() 
        });
      }

      const { username, email, password, firstName, lastName, role, group } = req.body;
      console.log('Registration attempt:', { username, email: email ? 'provided' : 'not provided', hasGroup: !!group, group });

      // Check if user already exists
      const existingUser = await User.findOne({ username: username.toLowerCase() });
      if (existingUser) {
        return res.status(400).json({ message: 'Пользователь с таким логином уже существует' });
      }

      // Check email if provided
      if (email) {
        const existingEmail = await User.findOne({ email });
        if (existingEmail) {
          return res.status(400).json({ message: 'Пользователь с таким email уже существует' });
        }
      }

      // Create new user - don't include email field if not provided
      const userData: any = {
        username: username.toLowerCase(),
        password,
        firstName: firstName || 'Пользователь',
        lastName: lastName || '',
        role: role || 'student',
      };
      // Only include email if it's actually provided and not empty
      if (email && email.trim()) {
        userData.email = email.toLowerCase().trim();
      }
      // Include group if provided and not empty
      if (group && group.trim() && ['haitech', 'promdesign', 'promrobo', 'energy', 'bio', 'aero', 'media', 'vrar'].includes(group)) {
        userData.group = group;
      }
      const user = new User(userData);

      await user.save();

      // Generate token
      const token = generateToken(String(user._id));

      res.status(201).json({
        token,
        user: {
          id: user._id,
          username: user.username,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          role: user.role,
          group: user.group,
        },
      });
    } catch (error: any) {
      console.error('Registration error:', error);
      if (error.code === 11000) {
        return res.status(400).json({ message: 'Пользователь с таким логином уже существует' });
      }
      res.status(500).json({ message: 'Ошибка сервера при регистрации' });
    }
  }
);

// @route   POST /api/auth/login
// @desc    Login user
// @access  Public
router.post(
  '/login',
  [
    body('username').notEmpty().withMessage('Логин обязателен'),
    body('password').notEmpty().withMessage('Пароль обязателен'),
  ],
  async (req: Request, res: Response) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { username, password } = req.body;

      // Find user by username
      const user = await User.findOne({ username: username.toLowerCase() });
      if (!user) {
        return res.status(401).json({ message: 'Неверный логин или пароль' });
      }

      // Check password
      const isMatch = await user.comparePassword(password);
      if (!isMatch) {
        return res.status(401).json({ message: 'Неверный логин или пароль' });
      }

      // Check if user is active
      if (!user.isActive) {
        return res.status(401).json({ message: 'Аккаунт деактивирован' });
      }

      // Generate token
      const token = generateToken(String(user._id));

      res.json({
        token,
        user: {
          id: user._id,
          username: user.username,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          role: user.role,
          group: user.group,
          avatar: user.avatar,
        },
      });
    } catch (error: any) {
      console.error('Login error:', error);
      res.status(500).json({ message: 'Ошибка сервера при входе' });
    }
  }
);

// @route   GET /api/auth/me
// @desc    Get current user
// @access  Private
router.get('/me', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const user = await User.findById(String(req.user!._id)).select('-password');
    res.json(user);
  } catch (error: any) {
    console.error('Get user error:', error);
    res.status(500).json({ message: 'Ошибка сервера' });
  }
});

export default router;

