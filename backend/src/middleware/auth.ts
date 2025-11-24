import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import User, { IUser } from '../models/User';

export interface AuthRequest extends Request {
  user?: IUser;
}

export const authenticate = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');

    if (!token) {
      return res.status(401).json({ message: 'Нет токена доступа, авторизация отклонена' });
    }

    const JWT_SECRET: string = process.env.JWT_SECRET || 'secret';
    const decoded = jwt.verify(token, JWT_SECRET) as { userId: string };
    const user = await User.findById(decoded.userId).select('-password');

    if (!user) {
      return res.status(401).json({ message: 'Пользователь не найден' });
    }

    if (!user.isActive) {
      return res.status(401).json({ message: 'Аккаунт деактивирован' });
    }

    req.user = user;
    next();
  } catch (error) {
    res.status(401).json({ message: 'Токен недействителен' });
  }
};

export const authorize = (...roles: string[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ message: 'Доступ запрещен' });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ message: 'Недостаточно прав доступа' });
    }

    next();
  };
};

