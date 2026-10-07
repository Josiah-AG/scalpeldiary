import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { query } from './database/db';
// ScalpelDiary Backend Server - Notification System
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

import rotationsRoutes from './routes/rotations';
import dutiesRoutes from './routes/duties';
import activitiesRoutes from './routes/activities';
import presentationAssignmentsRoutes from './routes/presentation-assignments';
import generalCommentsRoutes from './routes/general-comments';
import activityMonitorRoutes from './routes/activity-monitor';
import { errorHandler } from './middleware/errorHandler';

dotenv.config({ path: '../.env' });

const app = express();


// CORS configuration
const allowedOrigins = process.env.NODE_ENV === 'production'
  ? [
      process.env.FRONTEND_URL || 'https://scalpeldiary.com',
      'https://scalpeldiary.com',
      'https://www.scalpeldiary.com'
    ]
  : [process.env.FRONTEND_URL || 'http://localhost:5173', 'http://localhost:3000'];

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

app.set('trust proxy', 1);
app.use(helmet({contentSecurityPolicy: process.env.NODE_ENV === 'production' ? undefined : {directives:{'upgrade-insecure-requests':null}}}));
app.use(express.json({limit:'3mb'}));
app.use('/api/auth/login', rateLimit({windowMs:15*60*1000,limit:30,standardHeaders:'draft-8',legacyHeaders:false,skipSuccessfulRequests:true}));
app.get('/ready', async (_req,res) => { try { await query('SELECT 1 FROM schema_migrations LIMIT 1'); res.json({status:'ready'}); } catch { res.status(503).json({status:'unavailable'}); } });

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok',
    release: '2026-10-07-consistency', 
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

app.use('/api/rotations', rotationsRoutes);
app.use('/api/duties', dutiesRoutes);
app.use('/api/activities', activitiesRoutes);
app.use('/api/presentation-assignments', presentationAssignmentsRoutes);
app.use('/api/general-comments', generalCommentsRoutes);
app.use('/api/activity-monitor', activityMonitorRoutes);

app.use(errorHandler);


export default app;
