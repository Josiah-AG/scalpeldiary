import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import authRoutes from './routes/auth';
import userRoutes from './routes/users';
import logRoutes from './routes/logs';
import analyticsRoutes from './routes/analytics';
import notificationRoutes from './routes/notifications';
import presentationRoutes from './routes/presentations';
import progressRoutes from './routes/progress';
import migrationsRoutes from './routes/migrations';
import rotationsRoutes from './routes/rotations';
import dutiesRoutes from './routes/duties';
import activitiesRoutes from './routes/activities';
import presentationAssignmentsRoutes from './routes/presentation-assignments';
import { errorHandler } from './middleware/errorHandler';
import { startNotificationScheduler } from './services/dailyNotifications';

dotenv.config({ path: '../.env' });

const app = express();
const PORT = process.env.PORT || 3000;

// CORS configuration
const allowedOrigins = process.env.NODE_ENV === 'production'
  ? [
      process.env.FRONTEND_URL || 'https://scalpeldiary.com',
      'https://scalpeldiary.com',
      'https://www.scalpeldiary.com'
    ]
  : ['http://localhost:5173', 'http://localhost:3000'];

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true
}));

app.use(express.json());

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/logs', logRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/presentations', presentationRoutes);
app.use('/api/progress', progressRoutes);
app.use('/api/migrations', migrationsRoutes);
app.use('/api/rotations', rotationsRoutes);
app.use('/api/duties', dutiesRoutes);
app.use('/api/activities', activitiesRoutes);
app.use('/api/presentation-assignments', presentationAssignmentsRoutes);

app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📝 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🌐 CORS enabled for: ${allowedOrigins.join(', ')}`);
  
  // Start the notification scheduler
  startNotificationScheduler();
  console.log('⏰ Notification scheduler started');
});
