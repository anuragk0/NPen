/// <reference path="../types/express/index.d.ts" />
import { Request, Response, NextFunction } from "express";
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const requireRole = (role: 'ADMIN' | 'MEMBER' | 'GUEST') => {
    return async(req: Request, res: Response, next: NextFunction) => {
        try {
            const userId = req.user?.id;
            const { orgId } = req.params; 

            if (!userId) {
                return res.status(401).json({ error: 'User not authenticated' });
            }

            if (!orgId) {
                return res.status(400).json({ error: 'Organization ID is required' });
            }

            const membership = await prisma.membership.findFirst({
                where: { userId, organizationId: orgId }
            });
            
            if (!membership) {
                return res.status(403).json({ error: 'Not a member of this organization' });
            }

            const roles: string[] = ['GUEST', 'MEMBER', 'ADMIN'];   

            if (roles.indexOf(membership.role) < roles.indexOf(role)){
                return res.status(403).json({ 
                    error: `Insufficient permissions. Required: ${role}, Current: ${membership.role}` 
                });
            }
            
            next();
        } catch (error) {
            console.error('Error in requireRole middleware:', error);
            return res.status(500).json({ error: 'Internal server error' });
        }
    }
}