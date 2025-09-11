/// <reference path="../types/express/index.d.ts" />
import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const createOrganization = async (req: Request, res: Response) => {
  try {
    const { name } = req.body;
    const userId = req.user?.id;
    console.log(0);
    if (!name) return res.status(400).json({ error: 'Organization name is required' });
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });
    const org = await prisma.organization.create({
      data: {
        name,
        memberships: {
          create: {
            userId,
            role: 'ADMIN',
          },
        },
      },
    });
    res.status(201).json(org);
  } catch (err) {
    const error = err instanceof Error ? err : new Error('Unknown error');
    res.status(500).json({ error: 'Failed to create organization', details: error.message });
  }
};

export const listOrganizations = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });
    const orgs = await prisma.organization.findMany({
      where: {
        memberships: {
          some: { userId },
        },
      },
      include: {
        memberships: {
          include: {
            user: {
              select: {
                id: true,
                email: true,
                name: true,
                createdAt: true,
                updatedAt: true
              },
            },
          },
        },
      },
    });
    res.status(200).json({ organizations: orgs });
  } catch (err) {
    const error = err instanceof Error ? err : new Error('Unknown error');
    res.status(500).json({ error: 'Failed to list organizations', details: error.message });
  }
};

export const inviteUserToOrganization = async (req: Request, res: Response) => {
  try {
    const { email } = req.body;
    const orgId = req.params.orgId;
    if (!email) return res.status(400).json({ error: 'Email is required' });
    if (!orgId) return res.status(400).json({ error: 'Organization ID is required' });

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) return res.status(404).json({ error: 'User not found' });

    const existing = await prisma.membership.findUnique({
      where: { userId_organizationId: { userId: user.id, organizationId: orgId } },
    });
    if (existing) return res.status(400).json({ error: 'User is already a member' });
    // add as MEMBER, currently directly adding to org without sending invite
    await prisma.membership.create({
      data: {
        userId: user.id,
        organizationId: orgId,
        role: 'MEMBER',
      },
    });
    res.status(200).json({ message: 'User invited and added as member' });
  } catch (err) {
    const error = err instanceof Error ? err : new Error('Unknown error');
    res.status(500).json({ error: 'Failed to invite user', details: error.message });
  }
};

export const listOrganizationMembers = async (req: Request, res: Response) => {
  try {
    const orgId = req.params.orgId;
    if (!orgId) return res.status(400).json({ error: 'Organization ID is required' });

    const memberships = await prisma.membership.findMany({
      where: { organizationId: orgId },
      include: {
        user: {
          select: { 
            id: true, 
            email: true, 
            name: true, 
            createdAt: true, 
            updatedAt: true 
          },
        },
      },
    });
    
    res.status(200).json({ memberships });
  } catch (err) {
    const error = err instanceof Error ? err : new Error('Unknown error');
    console.error('Error fetching organization members:', error);
    res.status(500).json({ error: 'Failed to list members', details: error.message });
  }
};

export const updateMemberRole = async (req: Request, res: Response) => {
  try {
    const { orgId, userId } = req.params;
    const { role } = req.body;
    const currentUserId = req.user?.id;

    if (!orgId || !userId || !role) {
      return res.status(400).json({ error: 'Organization ID, User ID, and role are required' });
    }

    // Check if current user is admin of the organization
    const currentUserMembership = await prisma.membership.findUnique({
      where: { userId_organizationId: { userId: currentUserId as string, organizationId: orgId } },
    });

    if (!currentUserMembership || currentUserMembership.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Only admins can update member roles' });
    }

    // Update the member's role
    const updatedMembership = await prisma.membership.update({
      where: { userId_organizationId: { userId: userId, organizationId: orgId } },
      data: { role: role as 'ADMIN' | 'MEMBER' | 'GUEST' },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            name: true,
            createdAt: true,
            updatedAt: true
          },
        },
      },
    });

    res.status(200).json(updatedMembership);
  } catch (err) {
    const error = err instanceof Error ? err : new Error('Unknown error');
    console.error('Error updating member role:', error);
    res.status(500).json({ error: 'Failed to update member role', details: error.message });
  }
};

export const removeMemberFromOrganization = async (req: Request, res: Response) => {
  try {
    const { orgId, userId } = req.params;
    const currentUserId = req.user?.id;

    if (!orgId || !userId) {
      return res.status(400).json({ error: 'Organization ID and User ID are required' });
    }

  
    const currentUserMembership = await prisma.membership.findUnique({
      where: { userId_organizationId: { userId: currentUserId as string, organizationId: orgId } },
    });

    if (!currentUserMembership || currentUserMembership.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Only admins can remove members' });
    }


    const targetMembership = await prisma.membership.findUnique({
      where: { userId_organizationId: { userId, organizationId: orgId } },
    });

    if (!targetMembership) {
      return res.status(404).json({ error: 'Membership not found' });
    }

    if (targetMembership.role === 'ADMIN') {
      const adminCount = await prisma.membership.count({
        where: { organizationId: orgId, role: 'ADMIN' },
      });
      if (adminCount <= 1) {
        return res.status(400).json({ error: 'Cannot remove the last admin of the organization' });
      }
    }

    await prisma.membership.delete({
      where: { userId_organizationId: { userId, organizationId: orgId } },
    });

    return res.status(200).json({ message: 'Member removed successfully' });
  } catch (err) {
    const error = err instanceof Error ? err : new Error('Unknown error');
    console.error('Error removing member:', error);
    return res.status(500).json({ error: 'Failed to remove member', details: error.message });
  }
};

export const updateOrganization = async (req: Request, res: Response) => {
  try {
    const { orgId } = req.params;
    const { name } = req.body;
    const userId = req.user?.id;

    if (!name) return res.status(400).json({ error: 'Organization name is required' });
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });
    if (!orgId) return res.status(400).json({ error: 'Organization ID is required' });

    const updatedOrg = await prisma.organization.update({
      where: { id: orgId },
      data: { name },
    });

    res.status(200).json(updatedOrg);
  } catch (err) {
    const error = err instanceof Error ? err : new Error('Unknown error');
    res.status(500).json({ error: 'Failed to update organization', details: error.message });
  }
};

export const deleteOrganization = async (req: Request, res: Response) => {
  try {
    const { orgId } = req.params;
    console.log(req.user);
    const userId = req.user?.id;

    if (!userId) return res.status(401).json({ error: 'Unauthorized' });
    if (!orgId) return res.status(400).json({ error: 'Organization ID is required' });

    await prisma.organization.delete({
      where: { id: orgId },
    });

    res.status(200).json({ message: 'Organization deleted successfully' });
  } catch (err) {
    const error = err instanceof Error ? err : new Error('Unknown error');
    res.status(500).json({ error: 'Failed to delete organization', details: error.message });
  }
};