# Messaging Feature

Organization-scoped conversations between members. Supports multi-participant conversations and messages.

## Database

Prisma models added:
- `Conversation`
- `ConversationParticipant`
- `Message`

Run migrations:
```bash
cd backend
npx prisma generate
npx prisma migrate dev --name add_messaging
```

## REST API

All endpoints require Bearer auth and membership in `:orgId`.

- List conversations
  - GET `/api/orgs/:orgId/messages/conversations`
- Start conversation
  - POST `/api/orgs/:orgId/messages/conversations`
  - Body: `{ "participantIds": string[] }` (current user is auto-included)
- List messages
  - GET `/api/orgs/:orgId/messages/conversations/:conversationId/messages`
- Send message
  - POST `/api/orgs/:orgId/messages/conversations/:conversationId/messages`
  - Body: `{ "content": string }`

## Frontend

- Page: `src/app/messages/page.tsx`
- State: `src/store/slices/messagesSlice.ts` (registered in `src/store/index.ts`)
- API: `src/lib/api.ts` (`messagingAPI`)
- Nav: Sidebar includes a Messages link

## Notes

- Access control ensures only org members and conversation participants can access messages.
- `updatedAt` on `Conversation` is bumped on new messages to sort by activity.
