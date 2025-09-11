import axios from 'axios';
import {
  AuthResponse,
  LoginCredentials,
  RegisterCredentials,
  ChangePasswordCredentials,
  Organization,
  Project,
  Task,
  CreateOrganizationData,
  CreateProjectData,
  CreateTaskData,
  UpdateTaskData,
  User,
  Role,
  Membership
} from '@/types';


const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';


const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use((config) => {
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
  if (token) {
    (config.headers as any).Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor to handle auth errors
api.interceptors.response.use(
  (response) => response,
  (error) => {

    const isInitializing = typeof window !== 'undefined' && 
      !localStorage.getItem('user') && 
      !localStorage.getItem('token');
    
    if (error.response?.status === 401 && typeof window !== 'undefined' && !isInitializing) {

      const currentPath = window.location.pathname;
      if (!currentPath.startsWith('/login') && !currentPath.startsWith('/register')) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

// Auth API
export const authAPI = {
  login: async (credentials: LoginCredentials): Promise<AuthResponse> => {
    const response = await api.post('/auth/login', credentials);
    return response.data;
  },

  register: async (credentials: RegisterCredentials): Promise<AuthResponse> => {

    await api.post('/auth/register', credentials);
    const loginRes = await api.post('/auth/login', {
      email: credentials.email,
      password: credentials.password,
    } as LoginCredentials);
    return loginRes.data;
  },

  changePassword: async (credentials: ChangePasswordCredentials): Promise<{ message: string }> => {
    const response = await api.post('/auth/change-password', credentials);
    return response.data;
  },
};


// Organization API
export const organizationAPI = {
  create: async (data: CreateOrganizationData): Promise<Organization> => {
    const response = await api.post('/orgs', data);
    return response.data;
  },

  list: async (): Promise<Organization[]> => {
    const response = await api.get('/orgs');
    return response.data.organizations;
  },

  update: async (id: string, data: { name: string }): Promise<Organization> => {
    const response = await api.put(`/orgs/${id}`, data);
    return response.data;
  },

  delete: async (id: string): Promise<void> => {
    await api.delete(`/orgs/${id}`);
  },

  inviteUser: async (orgId: string, email: string): Promise<void> => {
    await api.post(`/orgs/${orgId}/invite`, { email });
  },

  getMembers: async (orgId: string): Promise<Membership[]> => {
    const response = await api.get(`/orgs/${orgId}/members`);
    return response.data.memberships;
  },

  updateMemberRole: async (orgId: string, userId: string, role: Role): Promise<void> => {
    await api.put(`/orgs/${orgId}/members/${userId}`, { role });
  },
  removeMember: async (orgId: string, userId: string): Promise<void> => {
    await api.delete(`/orgs/${orgId}/members/${userId}`);
  },
};

export const messagingAPI = {
  listConversations: async (orgId: string) => {
    const res = await api.get(`/orgs/${orgId}/messages/conversations`);
    return res.data;
  },
  startConversation: async (orgId: string, participantIds: string[]) => {
    const res = await api.post(`/orgs/${orgId}/messages/conversations`, { participantIds });
    return res.data;
  },
  listMessages: async (orgId: string, conversationId: string) => {
    const res = await api.get(`/orgs/${orgId}/messages/conversations/${conversationId}/messages`);
    return res.data;
  },
  sendMessage: async (orgId: string, conversationId: string, content: string) => {
    const res = await api.post(`/orgs/${orgId}/messages/conversations/${conversationId}/messages`, { content });
    return res.data;
  },
};

// Project API
export const projectAPI = {
  create: async (data: CreateProjectData): Promise<Project> => {
    const response = await api.post(`/orgs/${data.organizationId}/projects`, data);
    return response.data;
  },

  list: async (orgId: string): Promise<Project[]> => {
    const response = await api.get(`/orgs/${orgId}/projects`);
    return response.data;
  },

  getById: async (orgId: string, projectId: string): Promise<Project> => {
    const response = await api.get(`/orgs/${orgId}/projects/${projectId}`);
    return response.data;
  },

  update: async (orgId: string, projectId: string, data: Partial<CreateProjectData>): Promise<Project> => {
    const response = await api.put(`/orgs/${orgId}/projects/${projectId}`, data);
    return response.data;
  },

  delete: async (orgId: string, projectId: string): Promise<void> => {
    await api.delete(`/orgs/${orgId}/projects/${projectId}`);
  },
};

// Task API
export const taskAPI = {
  create: async (orgId: string, data: CreateTaskData): Promise<Task> => {
    const response = await api.post(`/orgs/${orgId}/projects/${data.projectId}/tasks`, data);
    return response.data;
  },

  list: async (orgId: string, projectId: string): Promise<Task[]> => {
    const response = await api.get(`/orgs/${orgId}/projects/${projectId}/tasks`);
    return response.data;
  },

  getById: async (orgId: string, projectId: string, taskId: string): Promise<Task> => {
    const response = await api.get(`/orgs/${orgId}/projects/${projectId}/tasks/${taskId}`);
    return response.data;
  },

  update: async (orgId: string, projectId: string, taskId: string, data: UpdateTaskData): Promise<Task> => {
    const response = await api.put(`/orgs/${orgId}/projects/${projectId}/tasks/${taskId}`, data);
    return response.data;
  },

  delete: async (orgId: string, projectId: string, taskId: string): Promise<void> => {
    await api.delete(`/orgs/${orgId}/projects/${projectId}/tasks/${taskId}`);
  },

  getKanbanBoard: async (orgId: string, projectId: string): Promise<Record<string, Task[]>> => {
    const response = await api.get(`/orgs/${orgId}/projects/${projectId}/tasks/kanban`);
    return response.data.kanbanBoard;
  },
};

export default api;