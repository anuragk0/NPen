'use client';

import React from 'react';
import { 
  Building2, 
  FolderOpen, 
  CheckSquare, 
  Users 
} from 'lucide-react';
import Card from '@/components/ui/Card';

interface StatCardProps {
  title: string;
  value: string | number;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
}

const StatCard: React.FC<StatCardProps> = ({ title, value, icon: Icon, color }) => (
  <Card className="p-6">
    <div className="flex items-center">
      <div className={`p-3 rounded-lg ${color}`}>
        <Icon className="h-6 w-6 text-white" />
      </div>
      <div className="ml-4">
        <p className="text-sm font-medium text-gray-600">{title}</p>
        <p className="text-2xl font-semibold text-gray-900">{value}</p>
      </div>
    </div>
  </Card>
);

interface DashboardStatsProps {
  organizations?: number;
  projects?: number;
  tasks?: number;
  teamMembers?: number;
}

const DashboardStats: React.FC<DashboardStatsProps> = ({ 
  organizations = 0, 
  projects = 0, 
  tasks = 0, 
  teamMembers = 0 
}) => {
  const stats = [
    {
      title: 'Organizations',
      value: (organizations ?? 0).toString(),
      icon: Building2,
      color: 'bg-blue-500',
    },
    {
      title: 'Active Projects',
      value: (projects ?? 0).toString(),
      icon: FolderOpen,
      color: 'bg-green-500',
    },
    {
      title: 'Recent Tasks',
      value: (tasks ?? 0).toString(),
      icon: CheckSquare,
      color: 'bg-purple-500',
    },
    {
      title: 'Team Members',
      value: (teamMembers ?? 0).toString(),
      icon: Users,
      color: 'bg-orange-500',
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      {stats.map((stat, index) => (
        <StatCard key={index} {...stat} />
      ))}
    </div>
  );
};

export default DashboardStats;
