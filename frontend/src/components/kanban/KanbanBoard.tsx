'use client';

import React, { useState } from 'react';
import {
  DndContext,
  rectIntersection,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
  useDraggable,
  useDroppable,
} from '@dnd-kit/core';
import { Task, TaskStatus, Role } from '@/types';
import { Plus, MoreVertical, User, Calendar, Tag } from 'lucide-react';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import CreateTaskModal from './CreateTaskModal';
import ViewTaskModal from './ViewTaskModal';
import { toast } from 'react-hot-toast';

interface KanbanBoardProps {
  tasks: Task[];
  onTaskUpdate: (taskId: string, updates: Partial<Task>) => void;
  onTaskCreate: (task: Omit<Task, 'id' | 'createdAt' | 'updatedAt'>) => void;
  onTaskDelete: (taskId: string) => void;
  orgId: string;
  userRole?: Role | null;
  currentUser?: any;
}

const statusColumns = [
  { id: TaskStatus.TODO, title: 'To Do', bgColor: 'bg-gray-200' },
  { id: TaskStatus.IN_PROGRESS, title: 'In Progress', bgColor: 'bg-blue-200' },
  { id: TaskStatus.DONE, title: 'Done', bgColor: 'bg-green-200' },
  { id: TaskStatus.BLOCKED, title: 'Blocked', bgColor: 'bg-red-200' },
];

interface DraggableTaskProps {
  task: Task;
  onViewTask: (task: Task) => void;
  canDrag: boolean; 
}

const DraggableTask: React.FC<DraggableTaskProps> = ({ task, onViewTask, canDrag }) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    isDragging,
  } = useDraggable({
    id: task.id,
    disabled: !canDrag, 
  });

  const style = {
    transform: transform ? `translate3d(${transform.x}px, ${transform.y}px, 0)` : undefined,
    opacity: isDragging ? 0.5 : 1,
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      className={`bg-white p-4 rounded-lg shadow-sm border border-gray-200 mb-3 transition-all ${
        canDrag 
          ? 'cursor-move hover:shadow-md hover:border-primary-300' 
          : 'cursor-not-allowed opacity-75'
      }`}
      title={canDrag ? 'Drag to change status' : 'You cannot change the status of this task'}
    >

      <div className="flex items-start justify-between mb-2">
        <h4 className="font-medium text-gray-900 text-sm flex-1 pr-2">
          {task.title}
        </h4>
        <div className="flex items-center space-x-1">
          <button 
            onClick={(e) => {
              e.stopPropagation();
              console.log('View task button clicked for task:', task.id, task.title);
              onViewTask(task);
            }}
            className="text-gray-400 hover:text-gray-600 p-1 rounded"
            title="View task details"
          >
            <MoreVertical className="h-4 w-4" />
          </button>
        </div>
      </div>
      
      {task.description && (
        <p className="text-sm text-gray-600 mb-3 line-clamp-2">
          {task.description}
        </p>
      )}
      
      <div className="flex items-center justify-between text-xs text-gray-500 mb-3">
        {task.assignee && (
          <div className="flex items-center space-x-1">
            <User className="h-3 w-3" />
            <span>{task.assignee.name}</span>
          </div>
        )}
        
        {task.dueDate && (
          <div className="flex items-center space-x-1">
            <Calendar className="h-3 w-3" />
            <span>{formatDate(task.dueDate)}</span>
          </div>
        )}
      </div>
      
      {task.tags && task.tags.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {task.tags.map((tag, index) => (
            <span
              key={index}
              className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800"
            >
              <Tag className="h-3 w-3 mr-1" />
              {tag}
            </span>
          ))}
        </div>
      )}
      
      {!canDrag && (
        <div className="mt-2 text-xs text-gray-500 flex items-center">
          <span className="mr-1">🔒</span>
          <span>Read-only (not assigned to you)</span>
        </div>
      )}
    </div>
  );
};

interface StatusColumnProps {
  column: { id: TaskStatus; title: string; bgColor: string };
  tasks: Task[];
  onViewTask: (task: Task) => void;
  canUpdateTask: (task: Task) => boolean;
  searchQuery: string;
  assignmentFilter: 'ALL' | 'ASSIGNED_TO_ME';
  currentUser: any;
}

const StatusColumn: React.FC<StatusColumnProps> = ({ 
  column, 
  tasks, 
  onViewTask,
  canUpdateTask,
  searchQuery,
  assignmentFilter,
  currentUser
}) => {
  const { setNodeRef, isOver } = useDroppable({
    id: column.id,
  });

  const allTasksForColumn = tasks.filter(task => task.status === column.id);
 
  let columnTasks = allTasksForColumn;
  

  return (
    <div className="flex-1">
      <div className={`${column.bgColor} px-4 py-3 rounded-t-lg mb-0`}>
        <div className="text-center">
          <h3 className="text-lg font-semibold text-gray-800">{column.title}</h3>
          <span className="text-sm text-gray-600">{columnTasks.length} tasks</span>
        </div>
      </div>
      
      <div
        ref={setNodeRef}
        className={`flex-1 p-4 bg-gray-50 rounded-b-lg min-h-[500px] transition-colors ${
          isOver ? 'bg-gray-100' : ''
        }`}
      >
        {columnTasks.map((task) => (
          <DraggableTask 
            key={task.id} 
            task={task} 
            onViewTask={onViewTask}
            canDrag={canUpdateTask(task)}
          />
        ))}
        
        {columnTasks.length === 0 && (
          <div className="text-center py-8 text-gray-400">
            <p className="text-sm">No {column.title.toLowerCase()} tasks</p>
          </div>
        )}
      </div>
    </div>
  );
};

const KanbanBoard: React.FC<KanbanBoardProps> = ({ 
  tasks, 
  onTaskUpdate, 
  onTaskCreate, 
  onTaskDelete, 
  orgId, 
  userRole,
  currentUser 
}) => {
  const [isCreatingTask, setIsCreatingTask] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<TaskStatus | 'ALL'>('ALL');
  const [assignmentFilter, setAssignmentFilter] = useState<'ALL' | 'ASSIGNED_TO_ME'>('ALL');
  const [viewingTask, setViewingTask] = useState<Task | null>(null);
  const [pendingStatusUpdates, setPendingStatusUpdates] = useState<Map<string, TaskStatus>>(new Map());

  React.useEffect(() => {
    console.log('KanbanBoard: assignmentFilter changed to:', assignmentFilter);
  }, [assignmentFilter]);
  

  const canUpdateTask = (task: Task): boolean => {
    if (!currentUser) return false;
    
    if (userRole === Role.ADMIN) return true;

    if (task.assigneeId === currentUser.id) return true;
    
    return false;
  };

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor)
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    
    if (!over) {
      console.log('Drag ended without over target');
      return;
    }
    
    const taskId = active.id as string;
    const newStatus = over.id as TaskStatus;
    
    console.log('KanbanBoard: Drag end event:', { taskId, newStatus, active, over });
    
    const validStatuses = [TaskStatus.TODO, TaskStatus.IN_PROGRESS, TaskStatus.DONE, TaskStatus.BLOCKED];
    if (!validStatuses.includes(newStatus)) {
      console.error('Invalid status in drag end:', newStatus);
      return;
    }
  
    const task = tasks.find(t => t.id === taskId);
    if (!task) {
      console.error('Task not found for drag end:', taskId);
      return;
    }

    if (!canUpdateTask(task)) {
      console.log('KanbanBoard: User does not have permission to update task:', taskId);
      toast.error('You do not have permission to update this task. Only assignees and admins can change task status.');
      return;
    }
    
    if (task.status !== newStatus) {
      console.log(`KanbanBoard: Updating task ${taskId} status from ${task.status} to ${newStatus}`);
      console.log(`KanbanBoard: Current filters - statusFilter: ${statusFilter}, assignmentFilter: ${assignmentFilter}`);
      

      setPendingStatusUpdates(prev => new Map(prev).set(taskId, newStatus));
      
      onTaskUpdate(taskId, { status: newStatus });
      console.log('KanbanBoard: onTaskUpdate called successfully');
      console.log(`KanbanBoard: After update - statusFilter: ${statusFilter}, assignmentFilter: ${assignmentFilter}`);
     
      setTimeout(() => {
        setPendingStatusUpdates(prev => {
          const newMap = new Map(prev);
          newMap.delete(taskId);
          return newMap;
        });
      }, 2000);
    } else {
      console.log(`Task ${taskId} already has status ${newStatus}, skipping update`);
    }
  };

  const getFilteredTasks = () => {
    let filteredTasks = tasks.map(task => {
      const pendingStatus = pendingStatusUpdates.get(task.id);
      if (pendingStatus) {
        return { ...task, status: pendingStatus };
      }
      return task;
    });

    if (searchQuery) {
      filteredTasks = filteredTasks.filter(task =>
        task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        task.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        task.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))
      );
    }

    if (assignmentFilter === 'ASSIGNED_TO_ME' && currentUser) {
      filteredTasks = filteredTasks.filter(task => task.assigneeId === currentUser.id);
    }

  
    if (statusFilter !== 'ALL') {
      filteredTasks = filteredTasks.filter(task => {
        const pendingStatus = pendingStatusUpdates.get(task.id);
        const effectiveStatus = pendingStatus || task.status;
        return effectiveStatus === statusFilter;
      });
    }

    return filteredTasks;
  };

  const isEmptyState = tasks.length === 0;

  if (isEmptyState) {
    return (
      <div className="h-full flex flex-col items-center justify-center py-12">
        <div className="text-center max-w-md">
          <div className="mx-auto h-24 w-24 text-gray-400 mb-4">
            <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" className="h-full w-full">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1}
                d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01"
              />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No tasks yet</h3>
          <p className="text-gray-600 mb-6">
            Get started by creating your first task. You can organize them using the Kanban board to track progress.
          </p>
          <Button onClick={() => setIsCreatingTask(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Create Your First Task
          </Button>
        </div>
        
        <CreateTaskModal
          isOpen={isCreatingTask}
          onClose={() => setIsCreatingTask(false)}
          onCreate={onTaskCreate}
          orgId={orgId}
        />
      </div>
    );
  }

  const filteredTasks = getFilteredTasks();

  return (
    <div className="h-full">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-4">
          <h2 className="text-2xl font-bold text-gray-900">Kanban Board</h2>
          <span className="text-sm text-gray-500">
            {filteredTasks.length} task{filteredTasks.length !== 1 ? 's' : ''}
          </span>
        </div>
        <Button onClick={() => setIsCreatingTask(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Add Task
        </Button>
      </div>

      <div className="flex items-center space-x-4 mb-6">
        <div className="flex-1 max-w-md">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <input
              type="text"
              placeholder="Search tasks..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            />
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          <label className="text-sm font-medium text-gray-700">Assignment:</label>
          <select
            value={assignmentFilter || 'ALL'}
            onChange={(e) => {
              const newValue = e.target.value as 'ALL' | 'ASSIGNED_TO_ME';
              console.log('Assignment filter select changed to:', newValue);
              setAssignmentFilter(newValue);
            }}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
          >
            <option value="ALL">All Tasks</option>
            <option value="ASSIGNED_TO_ME">Assigned to Me</option>
          </select>
        </div>
        
        <div className="flex items-center space-x-2">
          <label className="text-sm font-medium text-gray-700">Status:</label>
          <select
            value={statusFilter || 'ALL'}
            onChange={(e) => {
              const newValue = e.target.value as TaskStatus | 'ALL';
              console.log('Status filter select changed to:', newValue);
              setStatusFilter(newValue);
            }}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
          >
            <option value="ALL">All Status</option>
            <option value={TaskStatus.TODO}>To Do</option>
            <option value={TaskStatus.IN_PROGRESS}>In Progress</option>
            <option value={TaskStatus.DONE}>Done</option>
            <option value={TaskStatus.BLOCKED}>Blocked</option>
          </select>
        </div>
      </div>

      <DndContext
        sensors={sensors}
        collisionDetection={rectIntersection}
        onDragEnd={handleDragEnd}
      >
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 h-full overflow-hidden">
          {statusColumns.map((column) => (
            <StatusColumn
              key={column.id}
              column={column}
              tasks={filteredTasks}
              onViewTask={setViewingTask}
              canUpdateTask={canUpdateTask}
              searchQuery={searchQuery}
              assignmentFilter={assignmentFilter}
              currentUser={currentUser}
            />
          ))}
        </div>
      </DndContext>

      <CreateTaskModal
        isOpen={isCreatingTask}
        onClose={() => setIsCreatingTask(false)}
        onCreate={onTaskCreate}
        orgId={orgId}
      />
      <ViewTaskModal
        isOpen={!!viewingTask}
        onClose={() => setViewingTask(null)}
        onUpdate={onTaskUpdate}
        onDelete={onTaskDelete}
        task={viewingTask}
        orgId={orgId}
        userRole={userRole}
      />
    </div>
  );
};

export default KanbanBoard;