import express from 'express';
import cors from 'cors';
import authRoutes from './routes/auth';
import orgRoutes from './routes/org';
import projectRoutes from './routes/proj';
import taskRoutes from './routes/task';
import messageRoutes from './routes/message';

const app = express();

app.use(cors({
  origin: 'https://jocular-donut-c0ff86.netlify.app',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
}))

app.use(express.json());

app.use('/api/auth', authRoutes);
app.use('/api/orgs', orgRoutes);
app.use('/api/orgs/:orgId/projects', projectRoutes);
app.use('/api/orgs/:orgId/projects/:projectId/tasks', taskRoutes);
app.use('/api/orgs/:orgId/messages', messageRoutes);

export default app; 
