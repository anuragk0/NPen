/// <reference path="../types/express/index.d.ts" />
import { Request, Response, NextFunction } from "express";
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const requireRole = (role: 'ADMIN' | 'MEMBER' | 'GUEST') => {
    return async(req: Request, res: Response, next: NextFunction) => {
        try {
            const userId = req.user?.id;
            const { orgId } = req.params; 
            console.log(req.params);
            console.log(userId);
            console.log(orgId);

            if (!userId || !orgId) return res.status(403).json("Unauthorized");

            const membership = await prisma.membership.findUnique({
                where: { userId_organizationId: { userId, organizationId: orgId } }
            });
            
            if (!membership) return res.status(403).json("Not a member of this organisation");

            const roles: string[] = ['GUEST', 'MEMBER', 'ADMIN'];   

            if (roles.indexOf(membership.role) < roles.indexOf(role)){
                return res.status(403).json(`You don't have sufficient access`)
            }
            
            next();
        } catch (error) {
            console.error('Error in requireRole middleware:', error);
            return res.status(500).json("Internal server error");
        }
    }
}