'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { Task, TaskStatus } from '@/types';
import { formatDistanceToNow } from 'date-fns';
import { Clock, User, Tag, Eye } from 'lucide-react';
import Card from '@/components/ui/Card';
import { useAppDispatch } from '@/store/hooks';
import { setCurrentOrganization } from '@/store/slices/organizationsSlice';
import { setCurrentProject } from '@/store/slices/projectsSlice';

interface RecentTasksProps {
  tasks: Task[];
}

const getStatusColor = (status: TaskStatus) => {
  switch (status) {
    case TaskStatus.TODO:
      return 'bg-gray-100 text-gray-800';
    case TaskStatus.IN_PROGRESS:
      return 'bg-blue-100 text-blue-800';
    case TaskStatus.DONE:
      return 'bg-green-100 text-green-800';
    case TaskStatus.BLOCKED:
      return 'bg-red-100 text-red-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
};

const RecentTasks: React.FC<RecentTasksProps> = ({ tasks }) => {
  const router = useRouter();
  const dispatch = useAppDispatch();

  const handleViewAllTasks = () => {

    if (tasks.length > 0) {
      const firstTask = tasks[0];

      if (firstTask.project && firstTask.project.organizationId) {
        router.push(`/tasks?orgId=${firstTask.project.organizationId}&projectId=${firstTask.projectId}`);
      } else {

        router.push('/tasks');
      }
    } else {

      router.push('/tasks');
    }
  };

  const handleViewTask = (task: Task) => {

    if (task.project && task.project.organization) {
      dispatch(setCurrentOrganization(task.project.organization));
      dispatch(setCurrentProject(task.project));
    }
   
    if (task.project && task.project.organizationId) {
      router.push(`/tasks?orgId=${task.project.organizationId}&projectId=${task.projectId}`);
    } else {

      router.push('/tasks');
    }
  };

  return (
    <Card>
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-900">Recent Tasks</h3>
        <button 
          onClick={handleViewAllTasks}
          className="text-sm text-primary-600 hover:text-primary-700 font-medium transition-colors duration-200"
        >
          View all
        </button>
      </div>
      
      <div className="space-y-4">
        {tasks.slice(0, 5).map((task) => (
          <div 
            key={task.id} 
            onClick={() => handleViewTask(task)}
            className="flex items-start space-x-3 p-3 rounded-lg hover:bg-gray-50 transition-colors duration-200 cursor-pointer group"
          >
            <div className="flex-shrink-0">
              <div className={`w-3 h-3 rounded-full ${getStatusColor(task.status)}`} />
            </div>
            
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-gray-900 truncate group-hover:text-primary-700 transition-colors duration-200">
                  {task.title}
                </p>
                <Eye className="h-4 w-4 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
              </div>
              <div className="flex items-center space-x-4 mt-1 text-xs text-gray-500">
                <div className="flex items-center space-x-1">
                  <Clock className="h-3 w-3" />
                  <span>
                    {task.dueDate 
                      ? formatDistanceToNow(new Date(task.dueDate), { addSuffix: true })
                      : 'No due date'
                    }
                  </span>
                </div>
                
                {task.assignee && (
                  <div className="flex items-center space-x-1">
                    <User className="h-3 w-3" />
                    <span>{task.assignee.name}</span>
                  </div>
                )}
                
                {task.tags.length > 0 && (
                  <div className="flex items-center space-x-1">
                    <Tag className="h-3 w-3" />
                    <span>{task.tags[0]}</span>
                    {task.tags.length > 1 && <span>+{task.tags.length - 1}</span>}
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
        
        {tasks.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            <div className="flex flex-col items-center space-y-4">
              <div className="text-4xl">📋</div>
              <div>
                <p className="font-medium text-gray-900 mb-1">No tasks yet</p>
                <p className="text-sm">Get started by creating your first task</p>
              </div>
              <button
                onClick={() => router.push('/tasks')}
                className="text-sm text-primary-600 hover:text-primary-700 font-medium transition-colors duration-200"
              >
                Create your first task →
              </button>
            </div>
          </div>
        )}
      </div>
    </Card>
  );
};

export default RecentTasks;

