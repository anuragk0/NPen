/// <reference path="../types/express/index.d.ts" />
import { Router } from 'express';

import { createOrganization, listOrganizations, updateOrganization, deleteOrganization, inviteUserToOrganization, listOrganizationMembers, updateMemberRole } from '../controllers/orgController';
import { authenticate } from '../middlewares/authMiddleware';
import { requireRole } from '../middlewares/roleMiddleware';

const router = Router();

router.post('/', authenticate, createOrganization);

router.get('/', authenticate, listOrganizations);

router.put('/:orgId', authenticate, requireRole('ADMIN'), updateOrganization);

router.delete('/:orgId', authenticate, requireRole('ADMIN'), deleteOrganization);

router.post('/:orgId/invite', authenticate, requireRole('ADMIN'), inviteUserToOrganization);

router.get('/:orgId/members', authenticate, listOrganizationMembers);

router.put('/:orgId/members/:userId', authenticate, requireRole('ADMIN'), updateMemberRole);

export default router;