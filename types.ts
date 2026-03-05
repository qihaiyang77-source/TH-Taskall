
export enum TaskStatus {
  ON_TRACK = '正常',
  AT_RISK = '风险',
  DELAYED = '延期',
  COMPLETED = '已完成'
}

export enum ProjectStatus {
  ACTIVE = '进行中',
  COMPLETED = '已完成',
  ON_HOLD = '挂起'
}

export enum CycleStatus {
  ACTIVE = '进行中',
  COMPLETED = '已完成',
  UPCOMING = '未开始'
}

export enum AiProvider {
  GEMINI = 'GEMINI',
  DIFY = 'DIFY'
}

export enum UserRole {
  ADMIN = 'ADMIN',
  MEMBER = 'MEMBER'
}

export interface User {
  id: string;
  username: string;
  role: UserRole;
  memberId?: string;
}

export interface AiConfig {
  provider: AiProvider;
  geminiKey?: string;
  difyEndpoint?: string;
  difyKey?: string;
}

export interface Cycle {
  id: string;
  name: string;
  startDate: string;
  endDate?: string;
  status: CycleStatus;
}

export interface Project {
  id: string;
  name: string;
  description: string;
  status: ProjectStatus;
  startDate: string;
  endDate: string;
  memberIds: string[]; 
}

export interface Group {
  id: string;
  name: string;
}

export interface Member {
  id: string;
  name: string;
  role: string;
  avatar: string;
  groupId: string;
  // 新增账号相关字段
  username?: string;
  password?: string;
}

export interface DailyLog {
  id: string;
  date: string; 
  progressSnapshot: number;
  note: string;
  executionTaskId?: string; 
}

export interface ExecutionTask {
  id: string;
  title: string;
  outcome: string; 
  isCompleted: boolean;
  progress: number; 
  assigneeIds: string[]; 
  startDate: string;
  dueDate: string;
  visibleToIds?: string[]; 
}

export interface Task {
  id: string;
  title: string;
  outcome: string; 
  projectId: string; 
  cycleId?: string; 
  assigneeIds: string[]; 
  managerIds: string[]; 
  startDate: string;
  dueDate: string;
  progress: number; 
  logs: DailyLog[];
  executionTasks: ExecutionTask[];
}

export interface DashboardStats {
  total: number;
  completed: number;
  delayed: number;
  atRisk: number;
}
