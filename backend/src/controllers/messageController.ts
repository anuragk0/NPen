/// <reference path="../types/express/index.d.ts" />
import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function ensureUserInOrg(userId: string, organizationId: string) {
  const membership = await prisma.membership.findFirst({ where: { userId, organizationId } });
  return Boolean(membership);
}

export const listConversations = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id as string;
    const { orgId } = req.params as { orgId: string };

    if (!userId) return res.status(401).json({ error: 'Unauthorized' });
    const inOrg = await ensureUserInOrg(userId, orgId);
    if (!inOrg) return res.status(403).json({ error: 'Forbidden' });

    const conversations = await prisma.conversation.findMany({
      where: { organizationId: orgId, participants: { some: { userId } } },
      include: {
        participants: { include: { user: { select: { id: true, name: true, email: true } } } },
        messages: { take: 1, orderBy: { createdAt: 'desc' } },
      },
      orderBy: { updatedAt: 'desc' },
    });

    res.json(conversations);
  } catch (err) {
    const error = err instanceof Error ? err : new Error('Unknown error');
    res.status(500).json({ error: 'Failed to list conversations', details: error.message });
  }
};

export const startConversation = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id as string;
    const { orgId } = req.params as { orgId: string };
    const { participantIds } = req.body as { participantIds: string[] };

    if (!userId) return res.status(401).json({ error: 'Unauthorized' });
    if (!Array.isArray(participantIds) || participantIds.length === 0) {
      return res.status(400).json({ error: 'participantIds is required' });
    }
    const inOrg = await ensureUserInOrg(userId, orgId);
    if (!inOrg) return res.status(403).json({ error: 'Forbidden' });

    const allIds = Array.from(new Set([userId, ...participantIds]));
    const memberCount = await prisma.membership.count({ where: { organizationId: orgId, userId: { in: allIds } } });
    if (memberCount !== allIds.length) return res.status(400).json({ error: 'One or more users are not in org' });

    const conversation = await prisma.conversation.create({
      data: {
        organizationId: orgId,
        participants: {
          create: allIds.map((id) => ({ userId: id })),
        },
      },
      include: { participants: true },
    });

    res.status(201).json(conversation);
  } catch (err) {
    const error = err instanceof Error ? err : new Error('Unknown error');
    res.status(500).json({ error: 'Failed to start conversation', details: error.message });
  }
};

export const listMessages = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    const { orgId, conversationId } = req.params as { orgId: string; conversationId: string };

    if (!userId) return res.status(401).json({ error: 'Unauthorized' });
    const inOrg = await ensureUserInOrg(userId, orgId);
    if (!inOrg) return res.status(403).json({ error: 'Forbidden' });

    const participant = await prisma.conversationParticipant.findFirst({ where: { conversationId, userId } });
    if (!participant) return res.status(403).json({ error: 'Forbidden' });

    const messages = await prisma.message.findMany({
      where: { conversationId },
      orderBy: { createdAt: 'asc' },
      include: { sender: { select: { id: true, name: true, email: true } } },
    });
    res.json(messages);
  } catch (err) {
    const error = err instanceof Error ? err : new Error('Unknown error');
    res.status(500).json({ error: 'Failed to list messages', details: error.message });
  }
};

export const sendMessage = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id as string;
    const { orgId, conversationId } = req.params as { orgId: string; conversationId: string };
    const { content } = req.body as { content: string };
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });
    if (!content?.trim()) return res.status(400).json({ error: 'Content is required' });

    const inOrg = await ensureUserInOrg(userId, orgId);
    if (!inOrg) return res.status(403).json({ error: 'Forbidden' });

    const participant = await prisma.conversationParticipant.findFirst({ where: { conversationId, userId } });
    if (!participant) return res.status(403).json({ error: 'Forbidden' });

    const message = await prisma.message.create({
      data: { conversationId, senderId: userId, content },
    });
    await prisma.conversation.update({ where: { id: conversationId }, data: { updatedAt: new Date() } });

    res.status(201).json(message);
  } catch (err) {
    const error = err instanceof Error ? err : new Error('Unknown error');
    res.status(500).json({ error: 'Failed to send message', details: error.message });
  }
};


