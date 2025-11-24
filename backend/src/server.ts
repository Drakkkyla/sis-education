import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import morgan from 'morgan';
import dotenv from 'dotenv';
import path from 'path';

// Load environment variables
dotenv.config();

// Import routes
import authRoutes from './routes/auth';
import userRoutes from './routes/users';
import courseRoutes from './routes/courses';
import lessonRoutes from './routes/lessons';
import quizRoutes from './routes/quizzes';
import progressRoutes from './routes/progress';
import uploadRoutes from './routes/uploads';
import adminRoutes from './routes/admin';
import aiRoutes from './routes/ai';
import achievementRoutes from './routes/achievements';
import notificationRoutes from './routes/notifications';
import bookmarkRoutes from './routes/bookmarks';
import certificateRoutes from './routes/certificates';

const app = express();
const PORT = Number(process.env.PORT) || 5000;

// Middleware
// CORS configuration
const corsOptions = {
  origin: process.env.FRONTEND_URL || (process.env.NODE_ENV === 'production' ? false : 'http://localhost:5173'),
  credentials: true,
};
app.use(cors(corsOptions));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Настройка логирования - игнорируем POST / запросы (это обычно Vite HMR или некорректные запросы)
app.use(morgan('dev', {
  skip: (req) => {
    // Игнорируем логирование для POST запросов на корневой путь
    return req.method === 'POST' && req.path === '/';
  }
}));

// Serve uploaded files
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Serve photo files (logos)
app.use('/photo', express.static(path.join(__dirname, '../../photo')));

// Serve frontend static files in production
if (process.env.NODE_ENV === 'production') {
  const frontendPath = path.join(__dirname, '../../frontend/dist');
  app.use(express.static(frontendPath));
}

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/courses', courseRoutes);
app.use('/api/lessons', lessonRoutes);
app.use('/api/quizzes', quizRoutes);
app.use('/api/progress', progressRoutes);
app.use('/api/uploads', uploadRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/achievements', achievementRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/bookmarks', bookmarkRoutes);
app.use('/api/certificates', certificateRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'Server is running' });
});

// Обработка POST запросов на корневой путь (для Vite HMR и других)
app.post('/', (req, res) => {
  res.status(404).json({ message: 'Not found. Use /api routes.' });
});

// Fallback to index.html for SPA routing (production only)
if (process.env.NODE_ENV === 'production') {
  app.get('*', (req, res) => {
    // Don't serve index.html for API routes
    if (req.path.startsWith('/api')) {
      return res.status(404).json({ message: 'API route not found' });
    }
    // Serve index.html for all other routes (SPA routing)
    res.sendFile(path.join(__dirname, '../../frontend/dist/index.html'));
  });
}

// Connect to MongoDB
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/kvantorium';

mongoose
  .connect(MONGODB_URI)
  .then(async () => {
    console.log('Connected to MongoDB');
    
    // Fix email index if needed
    try {
      const db = mongoose.connection.db;
      if (db) {
        // Check if users collection exists
        const collections = await db.listCollections({ name: 'users' }).toArray();
        if (collections.length > 0) {
          const usersCollection = db.collection('users');
          
          // Check if old index exists
          const indexes = await usersCollection.indexes();
          const emailIndex = indexes.find(idx => idx.name === 'email_1');
          
          if (emailIndex && !emailIndex.partialFilterExpression) {
            console.log('Fixing email index...');
            try {
              await usersCollection.dropIndex('email_1');
              console.log('Dropped old email index');
            } catch (e: any) {
              if (e.codeName !== 'IndexNotFound') {
                console.log('Could not drop old index:', e.message);
              }
            }
            
            // Create new index with partialFilterExpression
            await usersCollection.createIndex(
              { email: 1 },
              {
                unique: true,
                sparse: true,
                partialFilterExpression: { email: { $exists: true, $ne: null } },
              }
            );
            console.log('Created new email index with partialFilterExpression');
            
            // Remove null email fields
            const result = await usersCollection.updateMany(
              { email: null },
              { $unset: { email: '' } }
            );
            if (result.modifiedCount > 0) {
              console.log(`Removed null email from ${result.modifiedCount} documents`);
            }
          }
        } else {
          console.log('Users collection does not exist yet, will be created on first use');
        }
      }
    } catch (error: any) {
      console.log('Index fix warning:', error.message);
      // Don't fail server startup if index fix fails
    }
    
    app.listen(PORT, '0.0.0.0', () => {
      console.log(`Server is running on port ${PORT}`);
      console.log(`Server is accessible at http://localhost:${PORT}`);
      console.log(`Server is accessible from network at http://<your-ip>:${PORT}`);
    });
  })
  .catch((error) => {
    console.error('MongoDB connection error:', error);
    process.exit(1);
  });

export default app;

