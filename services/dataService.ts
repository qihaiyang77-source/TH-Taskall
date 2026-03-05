
import { Task, Member, Group, Project, ProjectStatus, User } from '../types';
import { INITIAL_TASKS, MOCK_MEMBERS, MOCK_GROUPS } from '../constants';

const API_BASE = '/api';
const STORAGE_KEY = 'taskpulse_data_cache';
const DEMO_MODE_KEY = 'th_demo_mode';

const getAuthHeaders = (): Record<string, string> => {
  const userStr = localStorage.getItem('th_user');
  if (!userStr) return {};
  try {
    const user = JSON.parse(userStr);
    return { 'X-Commander-ID': user.id };
  } catch (e) {
    return {};
  }
};

export interface AppData {
  tasks: Task[];
  members: Member[];
  groups: Group[];
  projects: Project[];
}

export interface SaveResult {
  success: boolean;
  mode: 'server' | 'local';
}

const DEFAULT_PROJECTS: Project[] = [
  {
    id: 'default_project',
    name: '常规项目',
    description: '默认任务归属',
    status: ProjectStatus.ACTIVE,
    startDate: new Date().toISOString().split('T')[0],
    endDate: '',
    memberIds: []
  }
];

const getDefaultData = (): AppData => ({
  tasks: INITIAL_TASKS,
  members: MOCK_MEMBERS,
  groups: MOCK_GROUPS,
  projects: DEFAULT_PROJECTS
});

export const isDemoMode = () => localStorage.getItem(DEMO_MODE_KEY) === 'true';
export const setDemoMode = (val: boolean) => localStorage.setItem(DEMO_MODE_KEY, val.toString());

export const login = async (username: string, password: string): Promise<User> => {
  if (isDemoMode()) {
    return { id: 'demo-user', username: '体验官', role: 'ADMIN' as any };
  }
  const res = await fetch(`${API_BASE}/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password })
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || '登录失败');
  }
  const data = await res.json();
  return data.user;
};

export const changePassword = async (userId: string, newPassword: string): Promise<boolean> => {
  if (isDemoMode()) return true;
  const res = await fetch(`${API_BASE}/change-password`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userId, newPassword })
  });
  return res.ok;
};

export const getConfig = async () => {
  try {
    const res = await fetch(`${API_BASE}/config`);
    if (!res.ok) throw new Error('Failed to fetch config');
    return await res.json();
  } catch (error) {
    return { config: {} };
  }
};

export const saveConfig = async (config: any) => {
  const res = await fetch(`${API_BASE}/config`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(config)
  });
  if (!res.ok) throw new Error('Failed to save config');
  return await res.json();
};

export const fetchSetting = async (key: string) => {
  if (isDemoMode()) {
    const localVal = localStorage.getItem(`th_setting_${key}`);
    return localVal ? JSON.parse(localVal) : null;
  }
  try {
    const res = await fetch(`${API_BASE}/settings/${key}`, {
      headers: getAuthHeaders()
    });
    if (!res.ok) return null;
    const data = await res.json();
    return data.value;
  } catch (error) {
    return null;
  }
};

export const saveSetting = async (key: string, value: any) => {
  if (isDemoMode()) {
    localStorage.setItem(`th_setting_${key}`, JSON.stringify(value));
    return true;
  }
  try {
    const res = await fetch(`${API_BASE}/settings/${key}`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        ...getAuthHeaders()
      },
      body: JSON.stringify(value)
    });
    return res.ok;
  } catch (error) {
    return false;
  }
};

export const initDb = async () => {
  const res = await fetch(`${API_BASE}/init`, { method: 'POST' });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Init failed');
  return data;
};

export const checkDbConnection = async (): Promise<boolean> => {
  try {
    const res = await fetch(`${API_BASE}/health`);
    const data = await res.json();
    return data.status === 'OK';
  } catch {
    return false;
  }
};

export const fetchData = async (): Promise<AppData> => {
  if (isDemoMode()) {
    const cached = localStorage.getItem(STORAGE_KEY + '_demo');
    return cached ? JSON.parse(cached) : getDefaultData();
  }
  
  try {
    const response = await fetch(`${API_BASE}/data`, {
      headers: getAuthHeaders()
    });
    if (response.status === 401 || response.status === 503) {
       throw new Error('DB_NOT_CONFIGURED');
    }
    if (!response.ok) {
       const err = await response.json().catch(() => ({}));
       if (err.error === 'DB_NOT_CONFIGURED') throw new Error('DB_NOT_CONFIGURED');
       throw new Error('Server response not ok');
    }
    const data = await response.json();
    if (!data.projects?.length) data.projects = DEFAULT_PROJECTS;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    return data;
  } catch (error: any) {
    if (error.message === 'DB_NOT_CONFIGURED') throw error;
    const cached = localStorage.getItem(STORAGE_KEY);
    if (cached) {
      try { return JSON.parse(cached); } catch (e) {}
    }
    return getDefaultData();
  }
};

export const saveData = async (data: AppData): Promise<SaveResult> => {
  if (isDemoMode()) {
    localStorage.setItem(STORAGE_KEY + '_demo', JSON.stringify(data));
    return { success: true, mode: 'local' };
  }
  
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  try {
    const response = await fetch(`${API_BASE}/data`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        ...getAuthHeaders()
      },
      body: JSON.stringify(data),
    });
    return response.ok ? { success: true, mode: 'server' } : { success: false, mode: 'local' };
  } catch (error) {
    return { success: true, mode: 'local' };
  }
};
