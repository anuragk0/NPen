'use client';

import React, { useState, useEffect } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Project, Organization, CreateProjectData } from '@/types';
import { Plus, FolderOpen, Calendar, CheckSquare, Building2, MoreVertical } from 'lucide-react';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import Input from '@/components/ui/Input';
import { projectAPI, organizationAPI, taskAPI } from '@/lib/api';
import { toast } from 'react-hot-toast';
import Link from 'next/link';

interface CreateProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: CreateProjectData) => Promise<void>;
  selectedOrgId: string;
}

const CreateProjectModal: React.FC<CreateProjectModalProps> = ({ isOpen, onClose, onSubmit, selectedOrgId }) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error('Project name is required');
      return;
    }

    setIsSubmitting(true);
    try {
      await onSubmit({
        name: name.trim(),
        description: description.trim() || undefined,
        organizationId: selectedOrgId
      });
      setName('');
      setDescription('');
      onClose();
    } catch (error) {
      console.error('Failed to create project:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
        <h2 className="text-xl font-semibold mb-4">Create Project</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="projectName" className="block text-sm font-medium text-gray-700 mb-2">
              Project Name
            </label>
            <Input
              id="projectName"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter project name"
              required
            />
          </div>
          <div>
            <label htmlFor="projectDescription" className="block text-sm font-medium text-gray-700 mb-2">
              Description (Optional)
            </label>
            <textarea
              id="projectDescription"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Enter project description"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              rows={3}
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

export default function ProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [selectedOrgId, setSelectedOrgId] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [projectStats, setProjectStats] = useState<Record<string, { taskCount: number; completedCount: number }>>({});

  const loadOrganizations = async () => {
    try {
      const orgs = await organizationAPI.list();
      if (Array.isArray(orgs) && orgs.length > 0) {
        setOrganizations(orgs);
        if (!selectedOrgId) {
          setSelectedOrgId(orgs[0].id);
        }
      } else {
        setOrganizations([]);
      }
    } catch (error) {
      console.error('Failed to load organizations:', error);
      toast.error('Failed to load organizations');
    }
  };

  const loadProjects = async (orgId: string) => {
    try {
      const orgProjects = await projectAPI.list(orgId);
      setProjects(orgProjects);

      const stats: Record<string, { taskCount: number; completedCount: number }> = {};
      for (const project of orgProjects) {
        try {
          const tasks = await taskAPI.list(orgId, project.id);
          stats[project.id] = {
            taskCount: tasks.length,
            completedCount: tasks.filter(task => task.status === 'DONE').length
          };
        } catch (error) {
          console.warn(`Failed to load tasks for project ${project.name}:`, error);
          stats[project.id] = { taskCount: 0, completedCount: 0 };
        }
      }
      setProjectStats(stats);
    } catch (error) {
      console.error('Failed to load projects:', error);
      toast.error('Failed to load projects');
      setProjects([]);
    }
  };

  useEffect(() => {
    const initialize = async () => {
      setIsLoading(true);
      await loadOrganizations();
      setIsLoading(false);
    };
    initialize();
  }, []);

  useEffect(() => {
    if (selectedOrgId) {
      loadProjects(selectedOrgId);
    }
  }, [selectedOrgId]);

  const handleCreateProject = async (data: CreateProjectData) => {
    try {
      const newProject = await projectAPI.create(data);
      setProjects(prev => [...prev, newProject]);
      setProjectStats(prev => ({
        ...prev,
        [newProject.id]: { taskCount: 0, completedCount: 0 }
      }));
      toast.success('Project created successfully!');
    } catch (error) {
      console.error('Failed to create project:', error);
      toast.error('Failed to create project');
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

  if (organizations.length === 0) {
    return (
      <DashboardLayout>
        <Card className="text-center py-12">
          <Building2 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No organizations found</h3>
          <p className="text-gray-600 mb-6">
            You need to create an organization first before creating projects
          </p>
          <Link href="/organizations">
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Create Organization
            </Button>
          </Link>
        </Card>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Projects</h1>
            <p className="text-gray-600">Manage your projects and track progress</p>
          </div>
          <Button onClick={() => setIsCreateModalOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Create Project
          </Button>
        </div>

        <div className="flex items-center space-x-2">
          <Building2 className="h-5 w-5 text-gray-500" />
          <select
            value={selectedOrgId}
            onChange={(e) => setSelectedOrgId(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
          >
            {organizations.map((org) => (
              <option key={org.id} value={org.id}>
                {org.name}
              </option>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {projects.map((project) => {
            const stats = projectStats[project.id] || { taskCount: 0, completedCount: 0 };
            return (
              <Card key={project.id} className="hover:shadow-md transition-shadow duration-200">
                <div className="flex items-start justify-between mb-4">
                  <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                    <FolderOpen className="h-6 w-6 text-blue-600" />
                  </div>
                  <button className="text-gray-400 hover:text-gray-600">
                    <MoreVertical className="h-5 w-5" />
                  </button>
                </div>
                
                <h3 className="text-lg font-semibold text-gray-900 mb-2">{project.name}</h3>
                
                {project.description && (
                  <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                    {project.description}
                  </p>
                )}
                
                <div className="space-y-2 text-sm text-gray-600 mb-4">
                  <div className="flex items-center space-x-2">
                    <CheckSquare className="h-4 w-4" />
                    <span>{stats.taskCount} tasks • {stats.completedCount} completed</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Calendar className="h-4 w-4" />
                    <span>Created {new Date(project.createdAt).toLocaleDateString()}</span>
                  </div>
                </div>
                
                <div className="pt-4 border-t border-gray-100">
                  <div className="flex space-x-2">
                    <Link href={`/tasks?orgId=${selectedOrgId}&projectId=${project.id}`}>
                      <Button variant="secondary" size="sm" className="flex-1">
                        View Tasks
                      </Button>
                    </Link>
                    <Button variant="ghost" size="sm">
                      Settings
                    </Button>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>

        {projects.length === 0 && (
          <Card className="text-center py-12">
            <FolderOpen className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No projects yet</h3>
            <p className="text-gray-600 mb-6">
              Create your first project to start organizing your work
            </p>
            <Button onClick={() => setIsCreateModalOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Create Project
            </Button>
          </Card>
        )}
      </div>

      <CreateProjectModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSubmit={handleCreateProject}
        selectedOrgId={selectedOrgId}
      />
    </DashboardLayout>
  );
}
