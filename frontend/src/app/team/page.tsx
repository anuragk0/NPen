'use client';

import React, { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Organization, User, Role, Membership } from '@/types';
import { 
  Plus, 
  Mail, 
  Calendar, 
  User as UserIcon, 
  Building2, 
  Users, 
  Shield, 
  Crown,
  MoreVertical,
  UserPlus,
  Settings,
  Search,
  X,
  MessageSquare
} from 'lucide-react';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import Input from '@/components/ui/Input';
import { organizationAPI, messagingAPI } from '@/lib/api';
import { useAppSelector, useAppDispatch } from '@/store/hooks';
import { startConversationAsync, setActiveConversationId } from '@/store/slices/messagesSlice';
import { useRouter } from 'next/navigation';

interface OrganizationWithMembers {
  organization: Organization;
  members: Membership[];
  memberCount: number;
  currentUserRole: Role;
}

interface InviteMemberModalProps {
  isOpen: boolean;
  onClose: () => void;
  organization: Organization | null;
  onSubmit: (orgId: string, email: string) => Promise<void>;
}

const InviteMemberModal: React.FC<InviteMemberModalProps> = ({ isOpen, onClose, organization, onSubmit }) => {
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!organization || !email.trim()) {
      toast.error('Email is required');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      toast.error('Please enter a valid email address');
      return;
    }

    setIsSubmitting(true);
    try {
      await onSubmit(organization.id, email.trim());
      setEmail('');
      onClose();
    } catch (error: any) {
      const errorMessage = error?.response?.data?.error || 'Failed to add member';
      toast.error(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen || !organization) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
        <h2 className="text-xl font-semibold mb-4">Invite Member to {organization.name}</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="memberEmail" className="block text-sm font-medium text-gray-700 mb-2">
              Email Address
            </label>
            <Input
              id="memberEmail"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter member's email address"
              required
            />
            <p className="text-xs text-gray-500 mt-1">
              The user will be directly added to this organization
            </p>
          </div>
          <div className="flex space-x-3">
            <Button
              type="button"
              variant="secondary"
              onClick={onClose}
              className="flex-1"
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="flex-1"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Adding...' : 'Add Member'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default function TeamPage() {
  const { user: currentUser } = useAppSelector(state => state.auth);
  const dispatch = useAppDispatch();
  const router = useRouter();
  const [organizations, setOrganizations] = useState<OrganizationWithMembers[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [selectedOrganization, setSelectedOrganization] = useState<Organization | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [openMemberMenuId, setOpenMemberMenuId] = useState<string | null>(null);

  const loadOrganizationsWithMembers = async () => {
    try {
      setIsLoading(true);
      const orgs = await organizationAPI.list();
      
      const orgsWithMembers: OrganizationWithMembers[] = [];
      
      for (const org of orgs) {
        try {

          const memberships = org.memberships || [];
          
          const currentUserId = JSON.parse(localStorage.getItem('user') || '{}')?.id;
          const currentUserMembership = memberships.find((m: any) => m.userId === currentUserId);
          const currentUserRole = currentUserMembership?.role || Role.MEMBER;
          
          orgsWithMembers.push({
            organization: org,
            members: memberships,
            memberCount: memberships.length,
            currentUserRole: currentUserRole
          });
        } catch (error) {
          console.warn(`Failed to load members for org ${org.id}:`, error);
          orgsWithMembers.push({
            organization: org,
            members: org.memberships || [],
            memberCount: 0,
            currentUserRole: Role.MEMBER
          });
        }
      }
      
      setOrganizations(orgsWithMembers);
    } catch (error) {
      console.error('Failed to load organizations:', error);
      toast.error('Failed to load organizations');
      setOrganizations([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadOrganizationsWithMembers();
  }, []);


  const filteredOrganizations = organizations.filter((orgData) =>
    orgData.organization.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleInviteMember = async (orgId: string, email: string) => {
    try {
      await organizationAPI.inviteUser(orgId, email);
      toast.success('Member added successfully!');
      await loadOrganizationsWithMembers(); 
    } catch (error: any) {
      const errorMessage = error?.response?.data?.error || 'Failed to add member';
      toast.error(errorMessage);
      throw error;
    }
  };

  const handleUpdateMemberRole = async (orgId: string, userId: string, newRole: Role) => {
    try {
      await organizationAPI.updateMemberRole(orgId, userId, newRole);
      toast.success('Member role updated successfully!');
      await loadOrganizationsWithMembers(); 
    } catch (error: any) {
      const errorMessage = error?.response?.data?.error || 'Failed to update member role';
      toast.error(errorMessage);
    }
  };

  const handleRemoveMember = async (orgId: string, userId: string) => {
    try {
      await organizationAPI.removeMember(orgId, userId);
      toast.success('Member removed successfully!');
      await loadOrganizationsWithMembers();
    } catch (error: any) {
      const errorMessage = error?.response?.data?.error || 'Failed to remove member';
      toast.error(errorMessage);
    }
  };

  const openInviteModal = (org: Organization) => {
    setSelectedOrganization(org);
    setIsInviteModalOpen(true);
  };

  const handleStartConversation = async (orgId: string, userId: string) => {
    try {
      const conversation = await dispatch(startConversationAsync({ 
        orgId, 
        participantIds: [userId] 
      })).unwrap();
 
      dispatch(setActiveConversationId(conversation.id));
      router.push('/messages');
    } catch (error: any) {
      toast.error(error || 'Failed to start conversation');
    }
  };

  const getRoleIcon = (role: Role) => {
    switch (role) {
      case Role.ADMIN:
        return <Crown className="h-4 w-4 text-yellow-500" />;
      case Role.MEMBER:
        return <Shield className="h-4 w-4 text-blue-500" />;
      case Role.GUEST:
        return <UserIcon className="h-4 w-4 text-gray-500" />;
      default:
        return <UserIcon className="h-4 w-4 text-gray-500" />;
    }
  };

  const getRoleBadgeColor = (role: Role) => {
    switch (role) {
      case Role.ADMIN:
        return 'bg-yellow-100 text-yellow-800';
      case Role.MEMBER:
        return 'bg-blue-100 text-blue-800';
      case Role.GUEST:
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Team Management</h1>
            <p className="text-gray-600">Manage team members across all your organizations</p>
          </div>
        </div>

  
        <div className="flex items-center space-x-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              type="text"
              placeholder="Search organizations..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-10"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>

        {filteredOrganizations.length === 0 && organizations.length > 0 ? (
          <Card className="text-center py-12">
            <Search className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No organizations found</h3>
            <p className="text-gray-600 mb-6">
              No organizations match your search "{searchTerm}". Try a different search term.
            </p>
            <Button onClick={() => setSearchTerm('')} variant="secondary">
              Clear Search
            </Button>
          </Card>
        ) : filteredOrganizations.length === 0 ? (
          <Card className="text-center py-12">
            <Building2 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No organizations yet</h3>
            <p className="text-gray-600 mb-6">
              Create your first organization to start managing teams
            </p>
          </Card>
        ) : (
          filteredOrganizations.map((orgData) => (
            <Card key={orgData.organization.id} className="p-6">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-primary-100 rounded-lg flex items-center justify-center">
                    <Building2 className="h-5 w-5 text-primary-600" />
                  </div>
                  <div>
                    <h2 className="text-xl font-semibold text-gray-900">{orgData.organization.name}</h2>
                    <p className="text-sm text-gray-600 flex items-center space-x-2">
                      <Users className="h-4 w-4" />
                      <span>{orgData.memberCount} members</span>
                    </p>
                  </div>
                </div>
                {orgData.currentUserRole === Role.ADMIN && (
                  <Button onClick={() => openInviteModal(orgData.organization)}>
                    <UserPlus className="h-4 w-4 mr-2" />
                    Add Member
                  </Button>
                )}
              </div>

              {orgData.members.length === 0 ? (
                <div className="text-center py-8">
                  <UserIcon className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                  <p className="text-gray-500">No members in this organization yet</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {orgData.members.map((membership) => {
                    const isCurrentUser = membership.userId === currentUser?.id;
                    return (
                      <Card key={membership.id} className="p-4 hover:shadow-md transition-shadow duration-200">
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center space-x-3">
                            <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center">
                              <UserIcon className="h-5 w-5 text-primary-600" />
                            </div>
                            <div className="flex-1">
                              <h4 className="font-medium text-gray-900">
                                {membership.user?.name || 'Unknown User'} 
                                {isCurrentUser && <span className="text-xs text-primary-600 ml-1">(You)</span>}
                              </h4>
                              <p className="text-sm text-gray-500">
                                {membership.user?.email || 'No email'}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center space-x-2">
                            {getRoleIcon(membership.role)}
                            <span className={`px-2 py-1 text-xs font-medium rounded-full ${getRoleBadgeColor(membership.role)}`}>
                              {membership.role}
                            </span>
                          </div>
                        </div>

                        {!isCurrentUser && (
                          <div className="flex items-center justify-between mb-3">
                            <div className="text-xs text-gray-600">
                              Joined {new Date(membership.createdAt).toLocaleDateString()}
                            </div>
                            <button 
                              className="flex items-center justify-center w-8 h-8 bg-gray-100 hover:bg-gray-200 rounded-full transition-colors duration-200"
                              title="Send message"
                              onClick={() => handleStartConversation(orgData.organization.id, membership.userId)}
                            >
                              <MessageSquare className="h-4 w-4 text-gray-600" />
                            </button>
                          </div>
                        )}
                        {isCurrentUser && (
                          <div className="text-xs text-gray-600 mb-3">
                            Joined {new Date(membership.createdAt).toLocaleDateString()}
                          </div>
                        )}

                        {orgData.currentUserRole === Role.ADMIN && membership.role !== Role.ADMIN && membership.user && (
                          <div className="relative">
                            <div className="flex space-x-2">
                              <Button
                                variant="secondary"
                                size="sm"
                                className="flex-1 text-xs"
                                onClick={() => handleUpdateMemberRole(orgData.organization.id, membership.userId, Role.ADMIN)}
                              >
                                <Crown className="h-3 w-3 mr-1" />
                                Make Admin
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setOpenMemberMenuId(openMemberMenuId === membership.id ? null : membership.id)}
                                title="Member settings"
                              >
                                <Settings className="h-3 w-3" />
                              </Button>
                            </div>
                            {openMemberMenuId === membership.id && (
                              <div className="absolute right-0 mt-2 w-40 bg-white border border-gray-200 rounded-md shadow-lg z-10">
                                <button
                                  className="w-full text-left px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-md"
                                  onClick={() => {
                                    setOpenMemberMenuId(null);
                                    handleRemoveMember(orgData.organization.id, membership.userId);
                                  }}
                                >
                                  Remove member
                                </button>
                              </div>
                            )}
                          </div>
                        )}
                      </Card>
                    );
                  })}
                </div>
              )}
            </Card>
          ))
        )}

        <InviteMemberModal
          isOpen={isInviteModalOpen}
          onClose={() => setIsInviteModalOpen(false)}
          organization={selectedOrganization}
          onSubmit={handleInviteMember}
        />
      </div>
    </DashboardLayout>
  );
}