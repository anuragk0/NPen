import { Request, Response} from "express";
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const createProject = async (req: Request, res: Response) => {
    try {
        const { orgId } = req.params; 
        const { name, description } = req.body;
        console.log(0)

        if (!name) {
            return res.status(400).json("Project name is required");
        }

        if (!orgId) {
            return res.status(400).json("Organization ID is required");
        }

        const organization = await prisma.organization.findUnique({
            where: { id: orgId }
        });

        if (!organization) {
            return res.status(404).json("Organization not found");
        }

        const project = await prisma.project.create({
            data: {
                name,
                description,
                organizationId: orgId 
            }
        });

        res.status(201).json(project);

    } catch (error) {
        console.error('Error creating project:', error);
        res.status(500).json("Internal server error");
    }
}

export const listProjects = async (req: Request, res: Response) => {
    try {
        const { orgId } = req.params;

        if (!orgId) {
            return res.status(400).json("Organization ID is required");
        }

        const projects = await prisma.project.findMany({
            where: { organizationId: orgId },
            include: { tasks: true }
        });

        res.status(200).json(projects);

    } catch (error) {
        console.error("Couldn't get any projects", error);
        res.status(500).json("Internal server error"); 
    }
}


export const getProjectById = async (req: Request, res: Response) => {
    try {
        const { orgId, projectId } = req.params;
        
        if (!projectId) {
            return res.status(400).json('Project ID is required');
        }

        if (!orgId) {
            return res.status(400).json('Organization ID is required');
        }

        const project = await prisma.project.findFirst({
            where: { 
                id: projectId,
                organizationId: orgId 
            },
            include: { tasks: true }
        });

        if (!project) {
            return res.status(404).json('Project not found');
        }

        res.status(200).json(project);
    } catch (error) {
        console.error('Error to get this project', error);
        res.status(500).json('Internal server error');
    }
}

export const updateProject = async (req: Request, res: Response) => {
    try {
        const { orgId, projectId } = req.params;
        const {name, description} = req.body;

        if (!orgId) return res.status(400).json('Organization Id is required');

        if (!projectId) return res.status(400).json('Project Id is required');

        const existingProject = await prisma.project.findFirst({
            where: {
                id: projectId,
                organizationId: orgId
            }
        });

        if (!existingProject) return res.status(404).json('Project not found');

        const updatedProject = await prisma.project.update({
            where: {id: projectId}, 
            data: {
                ...(name && { name }),
                ...(description !== undefined && { description })
            }
        });

        res.status(200).json(updatedProject);

    } catch (error) {
        console.error(`Couldn't update project details`, error);
        res.status(500).json('Internal server error');
    }
}

export const deleteProject = async (req: Request, res: Response) => {
    try {
        const { orgId, projectId } = req.params;
        
        if (!orgId) return res.status(400).json('Organization Id is required');

        if (!projectId) return res.status(400).json('Project Id is required');

    
        const existingProject = await prisma.project.findFirst({
            where: {
                id: projectId,
                organizationId: orgId
            }
        });

        if (!existingProject) return res.status(404).json('Project not found');

        const deletedProject = await prisma.project.delete({
            where: {
                id: projectId
            }
        });

        res.status(200).json({ message: 'Project deleted successfully', project: deletedProject });

    } catch (error) {
        console.error('Error deleting project:', error);
        res.status(500).json('Internal server error');
    }
}