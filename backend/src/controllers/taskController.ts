import { Request, Response } from "express";
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const VALID_TASK_STATUSES = ['TODO', 'IN_PROGRESS', 'DONE', 'BLOCKED'];

export const createTask = async (req: Request, res: Response) => {
    try {
        const { orgId, projectId } = req.params;
        const { title, description, dueDate, tags, assigneeId } = req.body;

        if (!orgId) {
            return res.status(400).json("Organization ID is required");
        }

        if (!projectId) {
            return res.status(400).json("Project ID is required");
        }

        if (!title) {
            return res.status(400).json("Task title is required");
        }

        const project = await prisma.project.findFirst({
            where: {
                id: projectId,
                organizationId: orgId
            }
        });

        if (!project) {
            return res.status(404).json("Project not found");
        }

        if (assigneeId) {
            const assignee = await prisma.user.findUnique({
                where: { id: assigneeId }
            });
            if (!assignee) {
                return res.status(404).json("Assignee not found");
            }
        }

        const task = await prisma.task.create({
            data: {
                title,
                description: description || "",
                dueDate: dueDate ? new Date(dueDate) : null,
                tags: tags || [],
                projectId,
                assigneeId
            },
            include: {
                assignee: {
                    select: {
                        id: true,
                        name: true,
                        email: true
                    }
                },
                project: true
            }
        });

        res.status(201).json(task);

    } catch (error) {
        console.error('Error creating task:', error);
        res.status(500).json("Internal server error");
    }
};

export const listTasks = async (req: Request, res: Response) => {
    try {
        const { orgId, projectId } = req.params;

        if (!orgId) {
            return res.status(400).json("Organization ID is required");
        }

        if (!projectId) {
            return res.status(400).json("Project ID is required");
        }

        const project = await prisma.project.findFirst({
            where: {
                id: projectId,
                organizationId: orgId
            }
        });

        if (!project) {
            return res.status(404).json("Project not found");
        }

        const tasks = await prisma.task.findMany({
            where: { projectId },
            include: {
                assignee: {
                    select: {
                        id: true,
                        name: true,
                        email: true
                    }
                }
            },
            orderBy: {
                createdAt: 'desc'
            }
        });

        res.status(200).json(tasks);

    } catch (error) {
        console.error("Error fetching tasks:", error);
        res.status(500).json("Internal server error");
    }
};

export const getTaskById = async (req: Request, res: Response) => {
    try {
        const { orgId, projectId, taskId } = req.params;

        if (!orgId) {
            return res.status(400).json("Organization ID is required");
        }

        if (!projectId) {
            return res.status(400).json("Project ID is required");
        }

        if (!taskId) {
            return res.status(400).json("Task ID is required");
        }

        const project = await prisma.project.findFirst({
            where: {
                id: projectId,
                organizationId: orgId
            }
        });

        if (!project) {
            return res.status(404).json("Project not found");
        }

        const task = await prisma.task.findFirst({
            where: {
                id: taskId,
                projectId
            },
            include: {
                assignee: {
                    select: {
                        id: true,
                        name: true,
                        email: true
                    }
                },
                project: true
            }
        });

        if (!task) {
            return res.status(404).json("Task not found");
        }

        res.status(200).json(task);

    } catch (error) {
        console.error('Error fetching task:', error);
        res.status(500).json('Internal server error');
    }
};

export const updateTask = async (req: Request, res: Response) => {
    try {
        const { orgId, projectId, taskId } = req.params;
        const { title, description, status, dueDate, tags, assigneeId } = req.body;
        const userId = req.user?.id;

        if (!orgId) {
            return res.status(400).json('Organization ID is required');
        }

        if (!projectId) {
            return res.status(400).json('Project ID is required');
        }

        if (!taskId) {
            return res.status(400).json('Task ID is required');
        }

        if (!userId) {
            return res.status(401).json('User not authenticated');
        }

        const project = await prisma.project.findFirst({
            where: {
                id: projectId,
                organizationId: orgId
            }
        });

        if (!project) {
            return res.status(404).json('Project not found');
        }

        const existingTask = await prisma.task.findFirst({
            where: {
                id: taskId,
                projectId
            }
        });

        if (!existingTask) {
            return res.status(404).json('Task not found');
        }

        if (assigneeId) {
            const assignee = await prisma.user.findFirst({
                where: {
                    id: assigneeId,
                    memberships: {
                        some: { organizationId: orgId }
                    }
                }
            });
            if (!assignee) {
                return res.status(404).json("Assignee not found");
            }
        }

        if (status && !VALID_TASK_STATUSES.includes(status)) {
            return res.status(400).json({ 
                error: `Invalid status value. Must be one of: ${VALID_TASK_STATUSES.join(', ')}` 
            });
        }

        if (status !== undefined) {
            const isAssignee = existingTask.assigneeId === userId;

            const membership = await prisma.membership.findUnique({
                where: { 
                    userId_organizationId: { 
                        userId, 
                        organizationId: orgId 
                    } 
                }
            });
            
            const isAdmin = membership?.role === 'ADMIN';
            
            if (!isAssignee && !isAdmin) {
                return res.status(403).json({ 
                    error: 'Only the task assignee or an admin can change task status' 
                });
            }
        }

        const updatedTask = await prisma.task.update({
            where: { id: taskId },
            data: {
                ...(title && { title }),
                ...(description !== undefined && { description }),
                ...(status && { status }),
                ...(dueDate !== undefined && { dueDate: dueDate ? new Date(dueDate) : null }),
                ...(tags !== undefined && { tags }),
                ...(assigneeId !== undefined && { assigneeId })
            },
            include: {
                assignee: {
                    select: {
                        id: true,
                        name: true,
                        email: true
                    }
                },
                project: true
            }
        });

        res.status(200).json(updatedTask);

    } catch (error) {
        console.error('Error updating task:', error);
        console.error('Request params:', req.params);
        console.error('Request body:', req.body);
        res.status(500).json('Internal server error');
    }
};

export const deleteTask = async (req: Request, res: Response) => {
    try {
        const { orgId, projectId, taskId } = req.params;

        if (!orgId) {
            return res.status(400).json('Organization ID is required');
        }

        if (!projectId) {
            return res.status(400).json('Project ID is required');
        }

        if (!taskId) {
            return res.status(400).json('Task ID is required');
        }

        const project = await prisma.project.findFirst({
            where: {
                id: projectId,
                organizationId: orgId
            }
        });

        if (!project) {
            return res.status(404).json('Project not found');
        }

        const existingTask = await prisma.task.findFirst({
            where: {
                id: taskId,
                projectId
            }
        });

        if (!existingTask) {
            return res.status(404).json('Task not found');
        }

        const deletedTask = await prisma.task.delete({
            where: {
                id: taskId
            }
        });

        res.status(200).json({ message: 'Task deleted successfully', task: deletedTask });

    } catch (error) {
        console.error('Error deleting task:', error);
        res.status(500).json('Internal server error');
    }
};

export const getKanbanBoard = async (req: Request, res: Response) => {
    try {
        const { orgId, projectId } = req.params;

        if (!orgId) {
            return res.status(400).json("Organization ID is required");
        }

        if (!projectId) {
            return res.status(400).json("Project ID is required");
        }

        const project = await prisma.project.findFirst({
            where: {
                id: projectId,
                organizationId: orgId
            }
        });

        if (!project) {
            return res.status(404).json("Project not found");
        }

        const tasks = await prisma.task.findMany({
            where: { projectId },
            include: {
                assignee: {
                    select: {
                        id: true,
                        name: true,
                        email: true
                    }
                }
            },
            orderBy: [
                { status: 'asc' },
                { createdAt: 'desc' }
            ]
        });

        if (!tasks) return res.status(404).json('No task found');

        const kanbanBoard = {
            TODO: tasks.filter((task: typeof tasks[0]) => task.status === 'TODO'),
            IN_PROGRESS: tasks.filter((task: typeof tasks[0]) => task.status === 'IN_PROGRESS'),
            DONE: tasks.filter((task: typeof tasks[0]) => task.status === 'DONE'),
            BLOCKED: tasks.filter((task: typeof tasks[0]) => task.status === 'BLOCKED')
        };

        res.status(200).json({
            project: {
                id: project.id,
                name: project.name,
                description: project.description
            },
            kanbanBoard
        });

    } catch (error) {
        console.error("Error fetching Kanban board:", error);
        res.status(500).json("Internal server error");
    }
};
