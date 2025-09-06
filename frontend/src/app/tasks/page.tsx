'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import DashboardLayout from '@/components/layout/DashboardLayout';
import KanbanBoard from '@/components/kanban/KanbanBoard';
import { Task, Project, Organization, Role, CreateTaskData, UpdateTaskData } from '@/types';
import Card from '@/components/ui/Card';
import Link from 'next/link';
import { taskAPI, projectAPI, organizationAPI } from '@/lib/api';
import { toast } from 'react-hot-toast';
import { useAppSelector, useAppDispatch } from '@/store/hooks';
import { 
  fetchTasksAsync, 
  createTaskAsync, 
  updateTaskAsync, 
  deleteTaskAsync,
  fetchKanbanBoardAsync 
} from '@/store/slices/tasksSlice';
import { fetchProjectsAsync } from '@/store/slices/projectsSlice';
import { fetchOrganizationsAsync } from '@/store/slices/organizationsSlice';
import { ArrowLeft } from 'lucide-react';
import Button from '@/components/ui/Button';

export default function TasksPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const dispatch = useAppDispatch();
  const { user: currentUser, isAuthenticated, isLoading: authLoading, isInitialized } = useAppSelector(state => state.auth);
  const { tasks, isLoading: tasksLoading, error: tasksError } = useAppSelector(state => state.tasks);
  const { projects, isLoading: projectsLoading } = useAppSelector(state => state.projects);
  const { organizations, isLoading: orgsLoading } = useAppSelector(state => state.organizations);
  
  const orgId = searchParams.get('orgId');
  const projectId = searchParams.get('projectId');
  
  const [project, setProject] = useState<Project | null>(null);
  const [organization, setOrganization] = useState<Organization | null>(null);
  const [userRole, setUserRole] = useState<Role | null>(null);

  const [selectedOrgId, setSelectedOrgId] = useState<string>('');
  const [selectedProjectId, setSelectedProjectId] = useState<string>('');
  const [isSelectionLoading, setIsSelectionLoading] = useState(false);
  const [showSelectionScreen, setShowSelectionScreen] = useState(false);

  const loadProjectsForOrg = async (orgIdParam: string) => {
    try {
      console.log('TasksPage: Loading projects for org:', orgIdParam);
      await dispatch(fetchProjectsAsync(orgIdParam)).unwrap();
      console.log('TasksPage: Projects loaded for selected org');
      const orgProjects = projects.filter(p => p.organizationId === orgIdParam);
      if (orgProjects.length > 0) {
        console.log('TasksPage: Setting selected project to:', orgProjects[0].id);
        setSelectedProjectId(orgProjects[0].id);
      } else {
        console.log('TasksPage: No projects available for selected org');
        setSelectedProjectId('');
      }
    } catch (error: any) {
      console.error('TasksPage: Failed to load projects for selected org:', error);
      toast.error('Failed to load projects');
    }
  };

  useEffect(() => {
    const loadData = async () => {
      console.log('TasksPage: loadData called with orgId:', orgId, 'projectId:', projectId);
      
      if (!isInitialized) {
        console.log('TasksPage: Auth not yet initialized, waiting...');
        return;
      }
      
      if (authLoading) {
        console.log('TasksPage: Auth still loading, waiting...');
        return;
      }
      
      if (!isAuthenticated) {
        console.log('TasksPage: User not authenticated, redirecting to login');
        router.push('/login');
        return;
      }
      
      if (orgId && projectId) {
        console.log('TasksPage: Valid parameters found, resetting selection screen state');
        setShowSelectionScreen(false);
      }
      

      if (!orgId || !projectId) {
        console.log('TasksPage: No orgId/projectId provided, showing selection screen');
        await loadSelectionData();
        return;
      }

      try {
        console.log('TasksPage: Loading project and task data...');
        

        setProject(null);
        setOrganization(null);
        

        console.log('TasksPage: Loading project details for orgId:', orgId, 'projectId:', projectId);
        const projectData = await projectAPI.getById(orgId, projectId);
        console.log('TasksPage: Project data loaded:', projectData);
        setProject(projectData);
        

        console.log('TasksPage: Loading organization details');
        const orgs = await organizationAPI.list();
        const org = orgs.find(o => o.id === orgId);
        console.log('TasksPage: Organization found:', org);
        setOrganization(org || null);


        if (org && currentUser) {
          const userMembership = org.memberships?.find(m => m.userId === currentUser.id);
          setUserRole(userMembership?.role || null);
        }
        

        console.log('TasksPage: Loading tasks for orgId:', orgId, 'projectId:', projectId);
        await dispatch(fetchTasksAsync({ orgId, projectId })).unwrap();
        console.log('TasksPage: Tasks loaded via Redux');
        

        await dispatch(fetchKanbanBoardAsync({ orgId, projectId })).unwrap();
        console.log('TasksPage: Kanban board loaded via Redux');
        
      } catch (error: any) {
        console.error('TasksPage: Failed to load data:', error);
        toast.error('Failed to load project data');
      }
    };

    loadData();
  }, [orgId, projectId, isInitialized, authLoading, isAuthenticated, router]);

  const loadSelectionData = async () => {
    try {
      setIsSelectionLoading(true);
      console.log('TasksPage: Loading selection data...');
      

      await dispatch(fetchOrganizationsAsync()).unwrap();
      console.log('TasksPage: Organizations loaded via Redux');
      
      setShowSelectionScreen(true);
    } catch (error: any) {
      console.error('TasksPage: Failed to load selection data:', error);
      toast.error('Failed to load organizations');
    } finally {
      setIsSelectionLoading(false);
    }
  };


  useEffect(() => {
    if (selectedOrgId && showSelectionScreen) {
      loadProjectsForOrg(selectedOrgId);
    }
  }, [selectedOrgId, showSelectionScreen]);

  const handleTaskUpdate = useCallback(async (taskId: string, updates: Partial<Task>) => {
    if (!orgId || !projectId) {
      console.error('TasksPage: Missing orgId or projectId for task update');
      toast.error('Missing organization or project information');
      return;
    }
    
    try {
      console.log('TasksPage: Starting task update:', taskId, 'with updates:', updates);
      console.log('TasksPage: Using orgId:', orgId, 'projectId:', projectId);
      
      const result = await dispatch(updateTaskAsync({ orgId, projectId, taskId, data: updates })).unwrap();
      console.log('TasksPage: Task update successful:', result);
      toast.success('Task updated successfully!');
    } catch (error: any) {
      console.error('TasksPage: Failed to update task:', error);
      console.error('TasksPage: Error details:', error);
      

      let errorMessage = 'Failed to update task';
      if (error && typeof error === 'string') {
        errorMessage = error;
      } else if (error && error.message) {
        errorMessage = error.message;
      }
      
      toast.error(errorMessage);
    }
  }, [orgId, projectId, dispatch]);

  const handleTaskCreate = useCallback(async (newTask: Omit<Task, 'id' | 'createdAt' | 'updatedAt'>) => {
    if (!orgId || !projectId) return;
    
    try {
      const taskData: CreateTaskData = {
        title: newTask.title,
        description: newTask.description,
        projectId: projectId,
        assigneeId: newTask.assigneeId,
        dueDate: newTask.dueDate,
        tags: newTask.tags
      };
      
      await dispatch(createTaskAsync({ orgId, taskData })).unwrap();
      toast.success('Task created successfully!');
    } catch (error: any) {
      console.error('TasksPage: Failed to create task:', error);
      toast.error('Failed to create task');
    }
  }, [orgId, projectId, dispatch]);

  const handleTaskDelete = useCallback(async (taskId: string) => {
    if (!orgId || !projectId) return;
    
    try {
      console.log('TasksPage: Deleting task:', taskId);
      await dispatch(deleteTaskAsync({ orgId, projectId, taskId })).unwrap();
      toast.success('Task deleted successfully!');
    } catch (error: any) {
      console.error('TasksPage: Failed to delete task:', error);
      toast.error('Failed to delete task');
    }
  }, [orgId, projectId, dispatch]);


  const handleViewTasks = () => {
    if (!selectedOrgId || !selectedProjectId) {
      console.error('TasksPage: Cannot navigate - missing orgId or projectId');
      toast.error('Please select both an organization and project');
      return;
    }

    const targetUrl = `/tasks?orgId=${selectedOrgId}&projectId=${selectedProjectId}`;
    console.log('TasksPage: Navigating to:', targetUrl);
    console.log('TasksPage: Selected orgId:', selectedOrgId, 'projectId:', selectedProjectId);

    try {

      router.push(targetUrl);
      console.log('TasksPage: Router navigation successful');
    } catch (error) {
      console.error('TasksPage: Router navigation failed, trying fallback:', error);
      try {

        window.location.href = targetUrl;
        console.log('TasksPage: Fallback navigation successful');
      } catch (fallbackError) {
        console.error('TasksPage: Fallback navigation also failed:', fallbackError);
        toast.error('Failed to navigate to tasks page');
      }
    }
  };

  const SelectionScreen = () => (
    <div className="space-y-6">
      <Card className="p-6">
        <div className="space-y-4">
          <div>
            <label htmlFor="org-select" className="block text-sm font-medium text-gray-700 mb-2">
              Select Organization
            </label>
            <select
              id="org-select"
              value={selectedOrgId}
              onChange={(e) => setSelectedOrgId(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option value="">Select an organization</option>
              {organizations.map((org) => (
                <option key={org.id} value={org.id}>
                  {org.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="project-select" className="block text-sm font-medium text-gray-700 mb-2">
              Select Project
            </label>
            <select
              id="project-select"
              value={selectedProjectId}
              onChange={(e) => setSelectedProjectId(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
              disabled={projects.length === 0}
            >
              {projects.length === 0 ? (
                <option value="">No projects available</option>
              ) : (
                <>
                  <option value="">Select a project</option>
                  {projects.map((project) => (
                    <option key={project.id} value={project.id}>
                      {project.name}
                    </option>
                  ))}
                </>
              )}
            </select>
          </div>

          <div className="flex space-x-4 pt-4">
            <Button
              className="flex-1"
              disabled={!selectedProjectId}
              onClick={handleViewTasks}
            >
              View Tasks
            </Button>
            <Link href="/projects" className="flex-1">
              <Button variant="secondary" className="w-full">
                Manage Projects
              </Button>
            </Link>
          </div>
        </div>
      </Card>
    </div>
  );

  if (!isInitialized || authLoading || tasksLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
            <p className="text-gray-600">{!isInitialized ? 'Initializing...' : authLoading ? 'Loading...' : 'Loading tasks...'}</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (showSelectionScreen) {
    return (
      <DashboardLayout>
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Tasks</h1>
              <p className="text-gray-600">Select a project to view and manage your tasks</p>
            </div>
          </div>
          
          {isSelectionLoading ? (
            <div className="flex items-center justify-center h-32">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
            </div>
          ) : organizations.length === 0 ? (
            <Card className="text-center py-12">
              <h3 className="text-lg font-medium text-gray-900 mb-2">No organizations found</h3>
              <p className="text-gray-600 mb-6">
                You need to create an organization first before you can manage tasks
              </p>
              <Link href="/organizations">
                <Button>
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Create Organization
                </Button>
              </Link>
            </Card>
          ) : (
            <SelectionScreen />
          )}
        </div>
      </DashboardLayout>
    );
  }

  if (!project || !organization) {
    return (
      <DashboardLayout>
        <Card className="text-center py-12">
          <div className="text-gray-400 mb-4">
            <h3 className="text-lg font-medium text-gray-900 mb-2">Project not found</h3>
            <p className="text-gray-600">
              The project you're looking for doesn't exist or you don't have access to it.
            </p>
          </div>
          <Link href="/projects">
            <Button>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Projects
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
            <div className="flex items-center space-x-2 mb-2">
              <Link href="/projects" className="text-gray-500 hover:text-gray-700">
                <ArrowLeft className="h-4 w-4" />
              </Link>
              <span className="text-gray-500">/</span>
              <span className="text-sm text-gray-500">{organization.name}</span>
              <span className="text-gray-500">/</span>
              <span className="text-sm font-medium text-gray-900">{project.name}</span>
            </div>
            <h1 className="text-3xl font-bold text-gray-900">Tasks</h1>
            <p className="text-gray-600">Manage tasks for {project.name}</p>
          </div>
          
          <div className="text-sm text-gray-500">
            {tasks.length} task{tasks.length !== 1 ? 's' : ''} total
          </div>
        </div>

        <KanbanBoard
          tasks={tasks}
          onTaskUpdate={handleTaskUpdate}
          onTaskCreate={handleTaskCreate}
          onTaskDelete={handleTaskDelete}
          orgId={orgId || ''}
          userRole={userRole}
          currentUser={currentUser}
        />
      </div>
    </DashboardLayout>
  );
}