import { Router } from 'express';
import { authenticate } from '../middlewares/authMiddleware';
import { requireRole } from '../middlewares/roleMiddleware';
import { listConversations, startConversation, listMessages, sendMessage } from '../controllers/messageController';

const router = Router({ mergeParams: true });

router.get('/conversations', authenticate, requireRole('MEMBER'), listConversations);
router.post('/conversations', authenticate, requireRole('ADMIN'), startConversation);

router.get('/conversations/:conversationId/messages', authenticate, requireRole('MEMBER'), listMessages);
router.post('/conversations/:conversationId/messages', authenticate, requireRole('MEMBER'), sendMessage);

export default router;