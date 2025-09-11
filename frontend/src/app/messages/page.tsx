"use client";
import { useEffect, useState } from 'react';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { fetchConversationsAsync, fetchMessagesAsync, sendMessageAsync, setActiveConversationId, startConversationAsync } from '@/store/slices/messagesSlice';
import { useRouter } from 'next/navigation';
import { organizationAPI } from '@/lib/api';
import { Organization, Membership } from '@/types';
import { Plus, Users, MessageSquare, X, Check, Send, Building2, ChevronDown } from 'lucide-react';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import DashboardLayout from '@/components/layout/DashboardLayout';

export default function MessagesPage() {
  const dispatch = useAppDispatch();
  const router = useRouter();
  const { currentOrganization } = useAppSelector((s) => s.organizations);
  const { user: currentUser } = useAppSelector((s) => s.auth);
  const { conversations, messagesByConversationId, activeConversationId } = useAppSelector((s) => s.messages);
  const [newMessage, setNewMessage] = useState("");
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [selectedOrgId, setSelectedOrgId] = useState<string | null>(null);
  const [isNewConversationModalOpen, setIsNewConversationModalOpen] = useState(false);
  const [availableMembers, setAvailableMembers] = useState<Membership[]>([]);
  const [selectedMemberIds, setSelectedMemberIds] = useState<string[]>([]);

  useEffect(() => {
    const loadOrganizations = async () => {
      try {
        const orgs = await organizationAPI.list();
        setOrganizations(orgs);
        if (orgs.length > 0 && !selectedOrgId) {
          setSelectedOrgId(orgs[0].id);
        }
      } catch (error) {
        console.error('Failed to load organizations:', error);
      }
    };
    loadOrganizations();
  }, []);

 
  useEffect(() => {
    if (selectedOrgId) {
      dispatch(fetchConversationsAsync({ orgId: selectedOrgId }));
    }
  }, [selectedOrgId, dispatch]);


  useEffect(() => {
    if (selectedOrgId && activeConversationId) {
      dispatch(fetchMessagesAsync({ orgId: selectedOrgId, conversationId: activeConversationId }));
    }
  }, [selectedOrgId, activeConversationId, dispatch]);

  const handleStartNewConversation = async () => {
    if (!selectedOrgId) return;
    
    try {
      const members = await organizationAPI.getMembers(selectedOrgId);
      const otherMembers = members.filter(member => member.userId !== currentUser?.id);
      setAvailableMembers(otherMembers);
      setSelectedMemberIds([]);
      setIsNewConversationModalOpen(true);
    } catch (error) {
      console.error('Failed to load members:', error);
    }
  };

  const handleCreateConversation = async () => {
    if (!selectedOrgId || selectedMemberIds.length === 0) return;
    
    try {
      const conversation = await dispatch(startConversationAsync({ 
        orgId: selectedOrgId, 
        participantIds: selectedMemberIds 
      })).unwrap();
      
      dispatch(setActiveConversationId(conversation.id));
      setIsNewConversationModalOpen(false);
      setSelectedMemberIds([]);
    } catch (error: any) {
      console.error('Failed to create conversation:', error);
    }
  };

  const toggleMemberSelection = (memberId: string) => {
    setSelectedMemberIds(prev => 
      prev.includes(memberId) 
        ? prev.filter(id => id !== memberId)
        : [...prev, memberId]
    );
  };

  if (organizations.length === 0) {
    return (
      <div className="p-6">
        <div className="text-sm text-gray-500">No organizations available. Create an organization first.</div>
      </div>
    );
  }

  const messages = activeConversationId ? messagesByConversationId[activeConversationId] || [] : [];

  return (

      <DashboardLayout>
      <div className="flex h-[calc(100vh-80px)]">
        <aside className="w-80 bg-white border-r border-gray-200 flex flex-col">
          <div className="p-4 border-b border-gray-200 bg-gray-50">
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">Organization</label>
              <div className="relative">
                <select 
                  value={selectedOrgId || ''} 
                  onChange={(e) => setSelectedOrgId(e.target.value)}
                  className="w-full p-3 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 appearance-none bg-white"
                >
                  {organizations.map(org => (
                    <option key={org.id} value={org.id}>{org.name}</option>
                  ))}
                </select>
                <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
              </div>
            </div>
            <Button 
              onClick={handleStartNewConversation}
              className="w-full"
              size="sm"
            >
              <Plus className="h-4 w-4 mr-2" />
              New Conversation
            </Button>
          </div>
          
          <div className="flex-1 overflow-y-auto">
            <div className="p-4">
              <h3 className="text-sm font-semibold text-gray-900 mb-3">Conversations</h3>
              {conversations.length === 0 ? (
                <div className="text-center py-8">
                  <MessageSquare className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                  <p className="text-sm text-gray-500">No conversations yet</p>
                  <p className="text-xs text-gray-400">Start a new conversation to begin messaging</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {conversations.map((c) => (
                    <div
                      key={c.id}
                      className={`p-3 rounded-lg cursor-pointer transition-colors ${
                        activeConversationId === c.id 
                          ? 'bg-blue-50 border border-blue-200' 
                          : 'hover:bg-gray-50 border border-transparent'
                      }`}
                      onClick={() => dispatch(setActiveConversationId(c.id))}
                    >
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                          <Users className="h-5 w-5 text-blue-600" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-medium text-gray-900 truncate">
                            {c.participants.map((p) => p.user?.name || 'Unknown User').join(', ')}
                          </div>
                          <div className="text-xs text-gray-500">
                            {new Date(c.updatedAt).toLocaleDateString()}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </aside>

        <main className="flex-1 flex flex-col bg-white">
          {activeConversationId ? (
            <>
              <div className="border-b border-gray-200 p-4 bg-gray-50">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                    <Users className="h-4 w-4 text-blue-600" />
                  </div>
                  <div>
                    <h2 className="font-medium text-gray-900">
                      {conversations.find(c => c.id === activeConversationId)?.participants
                        .map((p) => p.user?.name || 'Unknown User').join(', ') || 'Conversation'}
                    </h2>
                    <p className="text-sm text-gray-500">
                      {conversations.find(c => c.id === activeConversationId)?.participants.length} participants
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
                {messages.map((m) => (
                  <div key={m.id} className={`flex ${m.senderId === currentUser?.id ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-xs lg:max-w-md ${m.senderId === currentUser?.id ? 'items-end' : 'items-start'} flex flex-col`}>
                      {m.senderId !== currentUser?.id && (
                        <div className="text-xs text-gray-500 mb-1 px-1">
                          {m.sender?.name || 'Unknown User'}
                        </div>
                      )}
                      <div className={`px-4 py-2 rounded-lg ${
                        m.senderId === currentUser?.id 
                          ? 'bg-blue-600 text-white' 
                          : 'bg-white text-gray-900 border border-gray-200'
                      }`}>
                        <div className="text-sm whitespace-pre-wrap">{m.content}</div>
                        <div className={`text-xs mt-1 ${
                          m.senderId === currentUser?.id ? 'text-blue-100' : 'text-gray-500'
                        }`}>
                          {new Date(m.createdAt).toLocaleTimeString()}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="border-t border-gray-200 p-4 bg-white">
                <form
                  className="flex space-x-3"
                  onSubmit={(e) => {
                    e.preventDefault();
                    if (!newMessage.trim()) return;
                    dispatch(sendMessageAsync({ orgId: selectedOrgId!, conversationId: activeConversationId, content: newMessage.trim() }));
                    setNewMessage("");
                  }}
                >
                  <input
                    className="flex-1 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Type a message..."
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                  />
                  <Button type="submit" disabled={!newMessage.trim()}>
                    <Send className="h-4 w-4" />
                  </Button>
                </form>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center bg-gray-50">
              <div className="text-center">
                <MessageSquare className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No conversation selected</h3>
                <p className="text-gray-500">Choose a conversation from the sidebar to start messaging</p>
              </div>
            </div>
          )}
        </main>
      </div>

      {isNewConversationModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold">Start New Conversation</h2>
              <button
                onClick={() => setIsNewConversationModalOpen(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            
            <div className="mb-4">
              <p className="text-sm text-gray-600 mb-3">Select members to include in the conversation:</p>
              <div className="max-h-60 overflow-y-auto space-y-2">
                {availableMembers.map((member) => (
                  <div
                    key={member.id}
                    className={`flex items-center justify-between p-3 border rounded-lg cursor-pointer hover:bg-gray-50 ${
                      selectedMemberIds.includes(member.userId) ? 'bg-blue-50 border-blue-200' : ''
                    }`}
                    onClick={() => toggleMemberSelection(member.userId)}
                  >
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
                        <Users className="h-4 w-4 text-gray-600" />
                      </div>
                      <div>
                        <div className="font-medium">{member.user?.name || 'Unknown User'}</div>
                        <div className="text-sm text-gray-500">{member.user?.email || 'No email'}</div>
                      </div>
                    </div>
                    {selectedMemberIds.includes(member.userId) && (
                      <Check className="h-5 w-5 text-blue-600" />
                    )}
                  </div>
                ))}
              </div>
            </div>
            
            <div className="flex space-x-3">
              <Button
                variant="secondary"
                onClick={() => setIsNewConversationModalOpen(false)}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                onClick={handleCreateConversation}
                disabled={selectedMemberIds.length === 0}
                className="flex-1"
              >
                <MessageSquare className="h-4 w-4 mr-2" />
                Start Conversation
              </Button>
            </div>
          </div>
        </div>
      )}
      </DashboardLayout>

  );
}


