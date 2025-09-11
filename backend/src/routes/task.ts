import { Router } from "express";
import {
  createTask,
  listTasks,
  getTaskById,
  updateTask,
  deleteTask,
  getKanbanBoard,
} from "../controllers/taskController";
import { authenticate } from "../middlewares/authMiddleware";
import { requireRole } from "../middlewares/roleMiddleware";

const router = Router({ mergeParams: true });

router.post("/", authenticate, requireRole('MEMBER'), createTask );

router.get("/", authenticate, requireRole('GUEST'), listTasks );

router.get("/kanban", authenticate, requireRole('GUEST'), getKanbanBoard);

router.get("/:taskId", authenticate, requireRole('GUEST'), getTaskById );

router.put("/:taskId", authenticate, requireRole('MEMBER'), updateTask );

router.delete("/:taskId", authenticate, requireRole('ADMIN'), deleteTask );

export default router;
