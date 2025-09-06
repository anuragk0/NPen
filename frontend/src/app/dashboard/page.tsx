'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'react-hot-toast';
import DashboardLayout from '@/components/layout/DashboardLayout';
import DashboardStats from '@/components/dashboard/DashboardStats';
import RecentTasks from '@/components/dashboard/RecentTasks';
import { Task, Organization, Project } from '@/types';
import { organizationAPI, projectAPI, taskAPI } from '@/lib/api';

export default function DashboardPage() {
  const [recentTasks, setRecentTasks] = useState<Task[]>([]);
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const loadDashboardData = async () => {
      try {
        setLoading(true);
  
        const orgs = await organizationAPI.list();

        if (Array.isArray(orgs)) {
          setOrganizations(orgs);
        } else {
          console.error('Expected organizations array, got:', orgs);
          setOrganizations([]);
          toast.error('Invalid data format received');
          return;
        }
        
        if (orgs.length > 0) {

          const orgProjects = await projectAPI.list(orgs[0].id);
          setProjects(orgProjects);
          

          const allTasks: Task[] = [];
          for (const project of orgProjects.slice(0, 3)) { 
            try {
              const projectTasks = await taskAPI.list(orgs[0].id, project.id);
              allTasks.push(...projectTasks);
            } catch (error) {
              console.warn(`Failed to load tasks for project ${project.name}:`, error);
            }
          }
          

          const sortedTasks = allTasks
            .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
            .slice(0, 5);
          
          setRecentTasks(sortedTasks);
        }
      } catch (error: any) {
        console.error('Failed to load dashboard data:', error);
        toast.error('Failed to load dashboard data');
      } finally {
        setLoading(false);
      }
    };

    loadDashboardData();
  }, []);

  const handleCreateProject = () => {
    router.push('/projects');
  };

  const handleCreateTask = () => {
    router.push('/tasks');
  };

  const handleInviteTeamMember = () => {
    router.push('/team');
  };

  if (loading) {
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
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Dashboard</h1>
          <p className="text-gray-600">Welcome back! Here's what's happening with your projects.</p>
        </div>
        
        <DashboardStats 
          organizations={organizations?.length ?? 0}
          projects={projects?.length ?? 0}
          tasks={recentTasks?.length ?? 0}
        />
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <RecentTasks tasks={recentTasks} />
          
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
            <div className="space-y-3">
              <button 
                onClick={handleCreateProject}
                className="w-full text-left p-3 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors duration-200"
              >
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                    <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                    </svg>
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">Create new project</p>
                    <p className="text-sm text-gray-500">Start organizing your work</p>
                  </div>
                </div>
              </button>
              
              <button 
                onClick={handleCreateTask}
                className="w-full text-left p-3 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors duration-200"
              >
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                    <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                    </svg>
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">View task</p>
                    <p className="text-sm text-gray-500">See all your tasks</p>
                  </div>
                </div>
              </button>
              
              <button 
                onClick={handleInviteTeamMember}
                className="w-full text-left p-3 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors duration-200"
              >
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                    <svg className="w-4 h-4 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">Invite team member</p>
                    <p className="text-sm text-gray-500">Add someone to your organization</p>
                  </div>
                </div>
              </button>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
