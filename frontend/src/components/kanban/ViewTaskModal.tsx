'use client';

import React, { useState, useEffect } from 'react';
import { X, Calendar, Tag, User, Edit3, Save, X as CloseIcon, Trash2, AlertTriangle } from 'lucide-react';
import { Task, TaskStatus, User as UserType, UpdateTaskData, Role } from '@/types';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import { organizationAPI, taskAPI } from '@/lib/api';
import { useAppSelector } from '@/store/hooks';

interface ViewTaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUpdate: (taskId: string, updates: Partial<Task>) => void;
  onDelete: (taskId: string) => void;
  task: Task | null;
  orgId: string;
  userRole?: Role | null;
}

const ViewTaskModal: React.FC<ViewTaskModalProps> = ({
  isOpen,
  onClose,
  onUpdate,
  onDelete,
  task,
  orgId,
  userRole,
}) => {
  const { user: currentUser } = useAppSelector(state => state.auth);
  const [isEditing, setIsEditing] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [assigneeId, setAssigneeId] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [tags, setTags] = useState('');
  const [status, setStatus] = useState<TaskStatus>(TaskStatus.TODO);
  const [members, setMembers] = useState<UserType[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  useEffect(() => {
    if (task && isOpen) {
      setTitle(task.title);
      setDescription(task.description || '');
      setAssigneeId(task.assigneeId || '');
      setDueDate(task.dueDate || '');
      setTags(task.tags.join(', '));
      setStatus(task.status);
      setIsEditing(false);
      setErrors({});
      setShowDeleteConfirm(false);
    }
  }, [task, isOpen]);

  useEffect(() => {
    const loadMembers = async () => {
      try {
        const orgMembers = await organizationAPI.getMembers(orgId);
        setMembers(orgMembers.map(membership => membership.user).filter(user => user !== undefined));
      } catch (error) {
        console.error('Failed to load organization members:', error);
        setMembers([]);
      }
    };

    if (isOpen && orgId) {
      loadMembers();
    }
  }, [isOpen, orgId]);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    
    if (!title.trim()) {
      newErrors.title = 'Title is required';
    }
    
    if (dueDate && new Date(dueDate) < new Date()) {
      newErrors.dueDate = 'Due date cannot be in the past';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    if (!task || !validateForm()) {
      return;
    }

    setIsLoading(true);
    
    try {
      const taskTags = tags.split(',').map(tag => tag.trim()).filter(tag => tag.length > 0);
      
      const updates: UpdateTaskData = {
        title: title.trim(),
        description: description.trim() || undefined,
        status,
        assigneeId: assigneeId || undefined,
        dueDate: dueDate || undefined,
        tags: taskTags,
      };

      onUpdate(task.id, updates);
      setIsEditing(false);
    } catch (error) {
      console.error('Failed to update task:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    if (task) {
      setTitle(task.title);
      setDescription(task.description || '');
      setAssigneeId(task.assigneeId || '');
      setDueDate(task.dueDate || '');
      setTags(task.tags.join(', '));
      setStatus(task.status);
      setErrors({});
    }
    setIsEditing(false);
  };

  const handleDelete = async () => {
    if (!task) return;
    setShowDeleteConfirm(true);
  };

  const handleDeleteConfirm = async () => {
    if (!task) return;

    setIsLoading(true);
    try {
      onDelete(task.id);
      onClose();
    } catch (error) {
      console.error('Failed to delete task:', error);
    } finally {
      setIsLoading(false);
      setShowDeleteConfirm(false);
    }
  };

  const handleDeleteCancel = () => {
    setShowDeleteConfirm(false);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  if (!isOpen || !task) return null;

  const isAdmin = userRole === 'ADMIN';

  return (
    <>
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
        <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
          <div className="flex items-center justify-between p-6 border-b">
            <div className="flex items-center space-x-3">
              <div className={`w-3 h-3 rounded-full ${
                task.status === TaskStatus.TODO ? 'bg-gray-400' :
                task.status === TaskStatus.IN_PROGRESS ? 'bg-blue-400' :
                task.status === TaskStatus.DONE ? 'bg-green-400' :
                'bg-red-400'
              }`} />
              <h2 className="text-xl font-semibold text-gray-900">Task Details</h2>
            </div>
            <div className="flex items-center space-x-2">
              {isAdmin && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleDelete}
                  disabled={isLoading}
                  className="text-red-600 hover:text-red-700 hover:bg-red-50"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete
                </Button>
              )}
              {!isEditing && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsEditing(true)}
                >
                  <Edit3 className="h-4 w-4 mr-2" />
                  Edit
                </Button>
              )}
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-6 w-6" />
              </button>
            </div>
          </div>

          <div className="p-6">
            {isEditing ? (
              <form className="space-y-4">
                <Input
                  label="Title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Enter task title"
                  error={errors.title}
                  required
                />

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Description
                  </label>
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Enter task description (optional)"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 resize-none"
                    rows={3}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Status
                    </label>
                    <select
                      value={status}
                      onChange={(e) => setStatus(e.target.value as TaskStatus)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    >
                      <option value={TaskStatus.TODO}>To Do</option>
                      <option value={TaskStatus.IN_PROGRESS}>In Progress</option>
                      <option value={TaskStatus.DONE}>Done</option>
                      <option value={TaskStatus.BLOCKED}>Blocked</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Due Date
                    </label>
                    <input
                      type="date"
                      value={dueDate}
                      onChange={(e) => setDueDate(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    />
                    {errors.dueDate && (
                      <p className="mt-1 text-sm text-red-600">{errors.dueDate}</p>
                    )}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Assignee
                  </label>
                  <select
                    value={assigneeId}
                    onChange={(e) => setAssigneeId(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  >
                    <option value="">Unassigned</option>
                    {members.map((member) => {
                      const isCurrentAssignee = task?.assigneeId === member.id;
                      const isCurrentUser = member.id === currentUser?.id;
                      
                      return (
                        <option 
                          key={member.id} 
                          value={member.id}
                          disabled={isCurrentAssignee && isCurrentUser} 
                        >
                          {member.name} 
                          {isCurrentUser ? ' (You)' : ''} 
                          {isCurrentAssignee ? ' (Current)' : ''}
                        </option>
                      );
                    })}
                  </select>
                </div>

                <Input
                  label="Tags"
                  value={tags}
                  onChange={(e) => setTags(e.target.value)}
                  placeholder="Enter tags separated by commas"
                  helperText="Separate multiple tags with commas"
                />

                <div className="flex justify-end space-x-3 pt-4">
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={handleCancel}
                    disabled={isLoading}
                  >
                    <CloseIcon className="h-4 w-4 mr-2" />
                    Cancel
                  </Button>
                  <Button
                    type="button"
                    onClick={handleSave}
                    isLoading={isLoading}
                  >
                    <Save className="h-4 w-4 mr-2" />
                    Save Changes
                  </Button>
                </div>
              </form>
            ) : (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">{task.title}</h3>
                  {task.description && (
                    <p className="text-gray-600 whitespace-pre-wrap">{task.description}</p>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div className="flex items-center space-x-2">
                      <div className={`w-3 h-3 rounded-full ${
                        task.status === TaskStatus.TODO ? 'bg-gray-400' :
                        task.status === TaskStatus.IN_PROGRESS ? 'bg-blue-400' :
                        task.status === TaskStatus.DONE ? 'bg-green-400' :
                        'bg-red-400'
                      }`} />
                      <span className="text-sm font-medium text-gray-700">
                        {task.status.replace('_', ' ')}
                      </span>
                    </div>

                    {task.dueDate && (
                      <div className="flex items-center space-x-2">
                        <Calendar className="h-4 w-4 text-gray-400" />
                        <span className="text-sm text-gray-600">
                          Due: {formatDate(task.dueDate)}
                        </span>
                      </div>
                    )}

                    {task.assignee && (
                      <div className="flex items-center space-x-2">
                        <User className="h-4 w-4 text-gray-400" />
                        <span className="text-sm text-gray-600">
                          Assigned to: {task.assignee.name}
                        </span>
                      </div>
                    )}
                  </div>

                  <div>
                    <div className="text-xs text-gray-500 mb-2">Created</div>
                    <div className="text-sm text-gray-900">
                      {formatDate(task.createdAt)}
                    </div>
                    <div className="text-xs text-gray-500 mt-2">Last updated</div>
                    <div className="text-sm text-gray-900">
                      {formatDate(task.updatedAt)}
                    </div>
                  </div>
                </div>

                {task.tags.length > 0 && (
                  <div>
                    <div className="text-sm font-medium text-gray-700 mb-2">Tags</div>
                    <div className="flex flex-wrap gap-2">
                      {task.tags.map((tag, tagIndex) => (
                        <span
                          key={tagIndex}
                          className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-primary-100 text-primary-800"
                        >
                          <Tag className="h-3 w-3 mr-1" />
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Confirmation Dialog */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-[60]">
          <div className="bg-white rounded-lg max-w-md w-full">
            <div className="p-6">
              <div className="flex items-center space-x-3 mb-4">
                <div className="flex-shrink-0">
                  <AlertTriangle className="h-6 w-6 text-red-600" />
                </div>
                <div>
                  <h3 className="text-lg font-medium text-gray-900">Delete Task</h3>
                  <p className="text-sm text-gray-500 mt-1">
                    Are you sure you want to delete this task? This action cannot be undone.
                  </p>
                </div>
              </div>

              <div className="bg-gray-50 rounded-lg p-4 mb-6">
                <div className="flex items-center space-x-2">
                  <div className={`w-2 h-2 rounded-full ${
                    task.status === TaskStatus.TODO ? 'bg-gray-400' :
                    task.status === TaskStatus.IN_PROGRESS ? 'bg-blue-400' :
                    task.status === TaskStatus.DONE ? 'bg-green-400' :
                    'bg-red-400'
                  }`} />
                  <span className="text-sm font-medium text-gray-900">{task.title}</span>
                </div>
              </div>

              <div className="flex justify-end space-x-3">
                <Button
                  variant="secondary"
                  onClick={handleDeleteCancel}
                  disabled={isLoading}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleDeleteConfirm}
                  isLoading={isLoading}
                  className="bg-red-600 hover:bg-red-700 text-white"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete Task
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default ViewTaskModal;