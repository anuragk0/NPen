import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { messagingAPI } from '@/lib/api';

interface UserSummary { id: string; name: string; email: string }
interface ConversationParticipant { id: string; user: UserSummary }
interface Message { id: string; conversationId: string; senderId: string; content: string; createdAt: string; sender?: UserSummary }
interface Conversation { id: string; participants: ConversationParticipant[]; messages?: Message[]; updatedAt: string }

interface MessagesState {
  conversations: Conversation[];
  messagesByConversationId: Record<string, Message[]>;
  activeConversationId: string | null;
  isLoading: boolean;
  error: string | null;
}

const initialState: MessagesState = {
  conversations: [],
  messagesByConversationId: {},
  activeConversationId: null,
  isLoading: false,
  error: null,
};

export const fetchConversationsAsync = createAsyncThunk(
  'messages/fetchConversations',
  async ({ orgId }: { orgId: string }, { rejectWithValue }) => {
    try {
      return await messagingAPI.listConversations(orgId);
    } catch (e: any) {
      return rejectWithValue(e.response?.data?.error || 'Failed to fetch conversations');
    }
  }
);

export const fetchMessagesAsync = createAsyncThunk(
  'messages/fetchMessages',
  async ({ orgId, conversationId }: { orgId: string; conversationId: string }, { rejectWithValue }) => {
    try {
      return { conversationId, messages: await messagingAPI.listMessages(orgId, conversationId) };
    } catch (e: any) {
      return rejectWithValue(e.response?.data?.error || 'Failed to fetch messages');
    }
  }
);

export const sendMessageAsync = createAsyncThunk(
  'messages/sendMessage',
  async ({ orgId, conversationId, content }: { orgId: string; conversationId: string; content: string }, { rejectWithValue }) => {
    try {
      return await messagingAPI.sendMessage(orgId, conversationId, content);
    } catch (e: any) {
      return rejectWithValue(e.response?.data?.error || 'Failed to send message');
    }
  }
);

export const startConversationAsync = createAsyncThunk(
  'messages/startConversation',
  async ({ orgId, participantIds }: { orgId: string; participantIds: string[] }, { rejectWithValue }) => {
    try {
      return await messagingAPI.startConversation(orgId, participantIds);
    } catch (e: any) {
      return rejectWithValue(e.response?.data?.error || 'Failed to start conversation');
    }
  }
);

const messagesSlice = createSlice({
  name: 'messages',
  initialState,
  reducers: {
    setActiveConversationId: (state, action: PayloadAction<string | null>) => {
      state.activeConversationId = action.payload;
    },
    clearMessagesError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchConversationsAsync.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(fetchConversationsAsync.fulfilled, (state, action) => {
        state.isLoading = false;
        state.conversations = action.payload;
      })
      .addCase(fetchConversationsAsync.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      .addCase(fetchMessagesAsync.fulfilled, (state, action) => {
        const { conversationId, messages } = action.payload as { conversationId: string; messages: Message[] };
        state.messagesByConversationId[conversationId] = messages;
      })
      .addCase(sendMessageAsync.fulfilled, (state, action) => {
        const message = action.payload as Message;
        if (!state.messagesByConversationId[message.conversationId]) {
          state.messagesByConversationId[message.conversationId] = [];
        }
        state.messagesByConversationId[message.conversationId].push(message);
      })
      .addCase(startConversationAsync.fulfilled, (state, action) => {
        const conversation = action.payload as Conversation;
        state.conversations.unshift(conversation);
      });
  },
});

export const { setActiveConversationId, clearMessagesError } = messagesSlice.actions;
export default messagesSlice.reducer;


