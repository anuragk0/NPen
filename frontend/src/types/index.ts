export interface User {
  id: string;
  email: string;
  name: string;
  createdAt: string;
  updatedAt: string;
}

export interface Organization {
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
  memberships?: Membership[];
}

export interface Membership {
  id: string;
  user?: User;
  userId: string;
  organization: Organization;
  organizationId: string;
  role: Role;
  createdAt: string;
  updatedAt: string;
}

export enum Role {
  ADMIN = 'ADMIN',
  MEMBER = 'MEMBER',
  GUEST = 'GUEST',
}

export interface Project {
  id: string;
  name: string;
  description?: string;
  organization: Organization;
  organizationId: string;
  createdAt: string;
  updatedAt: string;
}

export interface Task {
  id: string;
  title: string;
  description?: string;
  status: TaskStatus;
  dueDate?: string;
  tags: string[];
  project: Project;
  projectId: string;
  assignee?: User;
  assigneeId?: string;
  createdAt: string;
  updatedAt: string;
}

export enum TaskStatus {
  TODO = 'TODO',
  IN_PROGRESS = 'IN_PROGRESS',
  DONE = 'DONE',
  BLOCKED = 'BLOCKED',
}

export interface AuthResponse {
  token: string;
  user: User;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterCredentials {
  name: string;
  email: string;
  password: string;
  // for form validation only, not sent to backend
  confirmPassword?: string;
}

export interface CreateOrganizationData {
  name: string;
}

export interface CreateProjectData {
  name: string;
  description?: string;
  organizationId: string;
}

export interface CreateTaskData {
  title: string;
  description?: string;
  projectId: string;
  assigneeId?: string;
  dueDate?: string;
  tags?: string[];
}

export interface UpdateTaskData {
  title?: string;
  description?: string;
  status?: TaskStatus;
  assigneeId?: string;
  dueDate?: string;
  tags?: string[];
}

export interface ChangePasswordCredentials {
  currentPassword: string;
  newPassword: string;
}