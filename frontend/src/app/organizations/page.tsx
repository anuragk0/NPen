'use client';

import React, { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Organization, CreateOrganizationData } from '@/types';
import { Plus, Building2, Users, Calendar, Edit, Trash2, MoreVertical, UserPlus } from 'lucide-react';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import Input from '@/components/ui/Input';
import { organizationAPI } from '@/lib/api';

interface CreateOrgModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: CreateOrganizationData) => Promise<void>;
}

const CreateOrgModal: React.FC<CreateOrgModalProps> = ({ isOpen, onClose, onSubmit }) => {
  const [name, setName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error('Organization name is required');
      return;
    }

    setIsSubmitting(true);
    try {
      await onSubmit({ name: name.trim() });
      setName('');
      onClose();
    } catch (error) {
      console.error('Failed to create organization:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
        <h2 className="text-xl font-semibold mb-4">Create Organization</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="orgName" className="block text-sm font-medium text-gray-700 mb-2">
              Organization Name
            </label>
            <Input
              id="orgName"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter organization name"
              required
            />
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
              {isSubmitting ? 'Creating...' : 'Create'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

interface EditOrgModalProps {
  isOpen: boolean;
  onClose: () => void;
  organization: Organization | null;
  onSubmit: (id: string, data: { name: string }) => Promise<void>;
}

const EditOrgModal: React.FC<EditOrgModalProps> = ({ isOpen, onClose, organization, onSubmit }) => {
  const [name, setName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (organization) {
      setName(organization.name);
    }
  }, [organization]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!organization || !name.trim()) {
      toast.error('Organization name is required');
      return;
    }

    setIsSubmitting(true);
    try {
      await onSubmit(organization.id, { name: name.trim() });
      onClose();
    } catch (error) {
      console.error('Failed to update organization:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen || !organization) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
        <h2 className="text-xl font-semibold mb-4">Edit Organization</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="editOrgName" className="block text-sm font-medium text-gray-700 mb-2">
              Organization Name
            </label>
            <Input
              id="editOrgName"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter organization name"
              required
            />
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
              {isSubmitting ? 'Updating...' : 'Update'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

interface DeleteConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  organization: Organization | null;
  onConfirm: (id: string) => Promise<void>;
}

const DeleteConfirmModal: React.FC<DeleteConfirmModalProps> = ({ isOpen, onClose, organization, onConfirm }) => {
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    if (!organization) return;

    setIsDeleting(true);
    try {
      await onConfirm(organization.id);
      onClose();
    } catch (error) {
      console.error('Failed to delete organization:', error);
    } finally {
      setIsDeleting(false);
    }
  };

  if (!isOpen || !organization) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
        <h2 className="text-xl font-semibold mb-4 text-red-600">Delete Organization</h2>
        <p className="text-gray-600 mb-6">
          Are you sure you want to delete "{organization.name}"? This action cannot be undone and will remove all associated projects and tasks.
        </p>
        <div className="flex space-x-3">
          <Button
            type="button"
            variant="secondary"
            onClick={onClose}
            className="flex-1"
            disabled={isDeleting}
          >
            Cancel
          </Button>
                            <Button
                    type="button"
                    variant="danger"
                    onClick={handleDelete}
                    className="flex-1"
                    disabled={isDeleting}
                  >
            {isDeleting ? 'Deleting...' : 'Delete'}
          </Button>
        </div>
      </div>
    </div>
  );
};

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
    } catch (error) {
      console.error('Failed to invite member:', error);
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

export default function OrganizationsPage() {
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [selectedOrganization, setSelectedOrganization] = useState<Organization | null>(null);
  const [memberCounts, setMemberCounts] = useState<Record<string, number>>({});

  const loadOrganizations = async () => {
    try {
      setIsLoading(true);
      const orgs = await organizationAPI.list();
      if (Array.isArray(orgs)) {
        setOrganizations(orgs);

        const counts: Record<string, number> = {};
        for (const org of orgs) {
          try {
            const members = await organizationAPI.getMembers(org.id);
            counts[org.id] = Array.isArray(members) ? members.length : 0;
          } catch (error) {
            console.warn(`Failed to load members for org ${org.id}:`, error);
            counts[org.id] = 0;
          }
        }
        setMemberCounts(counts);
      } else {
        console.error('Expected organizations array, got:', orgs);
        setOrganizations([]);
        toast.error('Invalid data format received');
      }
    } catch (error) {
      console.error('Failed to load organizations:', error);
      toast.error('Failed to load organizations');
      setOrganizations([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadOrganizations();
  }, []);

  const handleCreateOrganization = async (data: CreateOrganizationData) => {
    try {
      const newOrg = await organizationAPI.create(data);
      setOrganizations(prev => [...prev, newOrg]);
      setMemberCounts(prev => ({ ...prev, [newOrg.id]: 1 })); 
      toast.success('Organization created successfully!');
    } catch (error) {
      console.error('Failed to create organization:', error);
      toast.error('Failed to create organization');
      throw error;
    }
  };

  const handleEditOrganization = async (id: string, data: { name: string }) => {
    try {
      const updatedOrg = await organizationAPI.update(id, data);
      setOrganizations(prev => prev.map(org => org.id === id ? updatedOrg : org));
      toast.success('Organization updated successfully!');
    } catch (error) {
      console.error('Failed to update organization:', error);
      toast.error('Failed to update organization');
      throw error;
    }
  };

  const handleDeleteOrganization = async (id: string) => {
    try {
      await organizationAPI.delete(id);
      setOrganizations(prev => prev.filter(org => org.id !== id));
      setMemberCounts(prev => {
        const newCounts = { ...prev };
        delete newCounts[id];
        return newCounts;
      });
      toast.success('Organization deleted successfully!');
    } catch (error) {
      console.error('Failed to delete organization:', error);
      toast.error('Failed to delete organization');
      throw error;
    }
  };

  const openEditModal = (org: Organization) => {
    setSelectedOrganization(org);
    setIsEditModalOpen(true);
  };

  const openDeleteModal = (org: Organization) => {
    setSelectedOrganization(org);
    setIsDeleteModalOpen(true);
  };

  const openInviteModal = (org: Organization) => {
    setSelectedOrganization(org);
    setIsInviteModalOpen(true);
  };

  const handleInviteMember = async (orgId: string, email: string) => {
    try {
      await organizationAPI.inviteUser(orgId, email);
      toast.success('Member added successfully!');
      

      const members = await organizationAPI.getMembers(orgId);
      setMemberCounts(prev => ({
        ...prev,
        [orgId]: Array.isArray(members) ? members.length : 0
      }));
    } catch (error: any) {
      const errorMessage = error?.response?.data?.error || 'Failed to add member';
      toast.error(errorMessage);
      throw error;
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
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Organizations</h1>
            <p className="text-gray-600">Manage your organizations and teams</p>
          </div>
          <Button onClick={() => setIsCreateModalOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Create Organization
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {organizations.map((org) => (
            <Card key={org.id} className="hover:shadow-md transition-shadow duration-200">
              <div className="flex items-start justify-between mb-4">
                <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center">
                  <Building2 className="h-6 w-6 text-primary-600" />
                </div>
                <div className="relative">
                  <button 
                    className="text-gray-400 hover:text-gray-600 p-1 rounded"
                    onClick={() => {
                      setSelectedOrganization(org);
                    }}
                  >
                    <MoreVertical className="h-4 w-4" />
                  </button>
                </div>
              </div>
              
              <h3 className="text-lg font-semibold text-gray-900 mb-2">{org.name}</h3>
              
              <div className="space-y-2 text-sm text-gray-600">
                <div className="flex items-center space-x-2">
                  <Users className="h-4 w-4" />
                  <span>{memberCounts[org.id] || 0} members</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Calendar className="h-4 w-4" />
                  <span>Created {new Date(org.createdAt).toLocaleDateString()}</span>
                </div>
              </div>
              
              <div className="mt-4 pt-4 border-t border-gray-100">
                <div className="flex space-x-2">
                  <Button 
                    variant="secondary" 
                    size="sm" 
                    className="flex-1"
                    onClick={() => openEditModal(org)}
                  >
                    <Edit className="h-3 w-3 mr-1" />
                    Edit
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={() => openDeleteModal(org)}
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={() => openInviteModal(org)}
                  >
                    <UserPlus className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>

        {organizations.length === 0 && (
          <Card className="text-center py-12">
            <Building2 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No organizations yet</h3>
            <p className="text-gray-600 mb-6">
              Create your first organization to start collaborating with your team
            </p>
            <Button onClick={() => setIsCreateModalOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Create Organization
            </Button>
          </Card>
        )}
      </div>


      <CreateOrgModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSubmit={handleCreateOrganization}
      />

      <EditOrgModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        organization={selectedOrganization}
        onSubmit={handleEditOrganization}
      />

      <DeleteConfirmModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        organization={selectedOrganization}
        onConfirm={handleDeleteOrganization}
      />

      <InviteMemberModal
        isOpen={isInviteModalOpen}
        onClose={() => setIsInviteModalOpen(false)}
        organization={selectedOrganization}
        onSubmit={handleInviteMember}
      />
    </DashboardLayout>
  );
}