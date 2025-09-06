import express from 'express';
import cors from 'cors';
import authRoutes from './routes/auth';
import orgRoutes from './routes/org';
import projectRoutes from './routes/proj';
import taskRoutes from './routes/task';

const app = express();

app.use(cors());
app.use(express.json());

app.use('/api/auth', authRoutes);
app.use('/api/orgs', orgRoutes);
app.use('/api/orgs/:orgId/projects', projectRoutes);
app.use('/api/orgs/:orgId/projects/:projectId/tasks', taskRoutes);

export default app; 
