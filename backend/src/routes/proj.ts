import { Router } from "express";

import { createProject, listProjects, getProjectById, updateProject, deleteProject } from "../controllers/projectController";
import { requireRole } from "../middlewares/roleMiddleware";
import { authenticate } from "../middlewares/authMiddleware";


const router = Router({ mergeParams: true });

router.post('/', authenticate, requireRole('MEMBER'), createProject);

router.get('/', authenticate, requireRole('GUEST'), listProjects);

router.get('/:projectId', authenticate, requireRole('GUEST'), getProjectById);

router.put('/:projectId', authenticate, requireRole('MEMBER'), updateProject);

router.delete('/:projectId', authenticate, requireRole('ADMIN'), deleteProject);

export default router;