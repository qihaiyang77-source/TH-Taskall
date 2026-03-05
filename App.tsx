
import React, { useState, useMemo, useEffect, useRef } from 'react';
import { Task, Member, DashboardStats, Group, Project, ExecutionTask, AiConfig, AiProvider, User, UserRole } from './types';
import { TaskCard } from './components/TaskCard';
import { ExecutionTaskCard } from './components/ExecutionTaskCard';
import { ProjectProgressTrack } from './components/ProjectProgressTrack';
import { UpdateModal } from './components/UpdateModal';
import { MemberManager } from './components/MemberManager';
import { ProjectManager } from './components/ProjectManager';
import { TaskFormModal } from './components/TaskFormModal';
import { TaskDetailModal } from './components/TaskDetailModal';
import { TeamStatus } from './components/TeamStatus';
import { ProjectOverview } from './components/ProjectOverview';
import { SettingsModal } from './components/SettingsModal';
import { PasswordChangeModal } from './components/PasswordChangeModal';
import { Login } from './components/Login';
import { analyzeProjectHealth } from './services/geminiService';
import { fetchData, saveData, fetchSetting, isDemoMode, setDemoMode } from './services/dataService';
import { marked } from 'marked';

const App: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [groups, setGroups] = useState<Group[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [aiConfig, setAiConfig] = useState<AiConfig>({ provider: AiProvider.GEMINI });
  const [isLoading, setIsLoading] = useState(true);
  const [activeView, setActiveView] = useState<'tasks' | 'overview'>('overview');
  const [saveStatus, setSaveStatus] = useState<'saved' | 'saving' | 'error' | 'local'>('saved');
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [dbStatus, setDbStatus] = useState<'OK' | 'NEED_CONFIG' | 'ERROR' | 'CHECKING'>('CHECKING');
  const [isPasswordChangeOpen, setIsPasswordChangeOpen] = useState(false);
  const initialLoadComplete = useRef(false);
  const executionRef = useRef<HTMLDivElement>(null);
  
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [filterProjectId, setFilterProjectId] = useState<string>('all');
  const [filterGroupId, setFilterGroupId] = useState<string>('all');
  const [filterMemberId, setFilterMemberId] = useState<string>('all');
  
  const [selectedSubTaskForUpdate, setSelectedSubTaskForUpdate] = useState<{task: Task, subTask: ExecutionTask} | null>(null);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [isUpdateModalOpen, setIsUpdateModalOpen] = useState(false);
  const [isMemberManagerOpen, setIsMemberManagerOpen] = useState(false);
  const [isProjectManagerOpen, setIsProjectManagerOpen] = useState(false);
  const [isTaskFormOpen, setIsTaskFormOpen] = useState(false);
  const [isTaskDetailOpen, setIsTaskDetailOpen] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [aiAnalysis, setAiAnalysis] = useState<string | null>(null);

  useEffect(() => {
    const savedUser = localStorage.getItem('th_user');
    if (savedUser) {
      try { 
        setCurrentUser(JSON.parse(savedUser));
      } catch (e) { 
        localStorage.removeItem('th_user');
      }
    }
    checkInitStatus();
  }, []);

  // 监听选中节点变化，自动滚动到底部拆解区
  useEffect(() => {
    if (selectedNodeId && executionRef.current) {
      setTimeout(() => {
        executionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 100);
    }
  }, [selectedNodeId]);

  const checkInitStatus = async () => {
    try {
      if (isDemoMode()) {
        setIsLoading(false);
        setDbStatus('OK');
        return;
      }
      
      setDbStatus('CHECKING');
      const res = await fetch('/api/health');
      const data = await res.json();
      setDbStatus(data.status);
      if (data.status === 'NEED_CONFIG' || data.status === 'ERROR') {
        setIsSettingsOpen(true);
      }
      setIsLoading(false);
    } catch (err: any) {
      setDbStatus('ERROR');
      setIsLoading(false);
    }
  };

  const loadData = async () => {
    if (!currentUser) return;
    setIsLoading(true);
    try {
      const data = await fetchData();
      setTasks(data.tasks);
      setMembers(data.members);
      setGroups(data.groups);
      setProjects(data.projects || []);

      const aiSettings = await fetchSetting('ai_config');
      if (aiSettings) setAiConfig(aiSettings);

      initialLoadComplete.current = true;
    } catch (err: any) {
      if (err.message === 'DB_NOT_CONFIGURED') setIsSettingsOpen(true);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { 
    if (currentUser) loadData(); 
  }, [currentUser]);

  useEffect(() => {
    if (!initialLoadComplete.current || !currentUser) return;
    setSaveStatus('saving');
    const timer = setTimeout(() => {
      saveData({ tasks, members, groups, projects })
        .then((result) => setSaveStatus(result.mode === 'local' ? 'local' : 'saved'))
        .catch(() => setSaveStatus('error'));
    }, 1000); 
    return () => clearTimeout(timer);
  }, [tasks, members, groups, projects, currentUser]);

  const calculateOverallProgress = (executionTasks: ExecutionTask[]): number => {
    if (!executionTasks || executionTasks.length === 0) return 0;
    const total = executionTasks.reduce((acc, curr) => acc + (curr.progress || 0), 0);
    return Math.round(total / executionTasks.length);
  };

  const handleSaveSubTaskProgress = (taskId: string, executionTaskId: string, newProgress: number, note: string) => {
    setTasks(prev => prev.map(t => {
      if (t.id === taskId) {
        const updatedETs = (t.executionTasks || []).map(et => 
          et.id === executionTaskId ? { ...et, progress: newProgress, isCompleted: newProgress === 100 } : et
        );
        const avgProgress = calculateOverallProgress(updatedETs);
        const newLog = { 
          id: Date.now().toString(), 
          date: new Date().toISOString(), 
          progressSnapshot: newProgress, 
          note, 
          executionTaskId 
        };
        return { 
          ...t, 
          executionTasks: updatedETs, 
          progress: avgProgress, 
          logs: [...(t.logs || []), newLog] 
        };
      }
      return t;
    }));
    setIsUpdateModalOpen(false);
  };

  const filteredMembers = useMemo(() => {
    if (filterProjectId !== 'all') {
      const project = projects.find(p => p.id === filterProjectId);
      if (project?.memberIds?.length) {
        let mPool = members.filter(m => project.memberIds.includes(m.id));
        if (filterGroupId !== 'all') mPool = mPool.filter(m => m.groupId === filterGroupId);
        return mPool;
      }
    }
    if (filterGroupId === 'all') return members;
    return members.filter(m => m.groupId === filterGroupId);
  }, [members, projects, filterProjectId, filterGroupId]);

  const filteredNodes = useMemo(() => {
    let result = tasks;
    if (filterProjectId !== 'all') result = result.filter(t => t.projectId === filterProjectId);
    if (filterMemberId !== 'all') {
      result = result.filter(t => (t.assigneeIds || []).includes(filterMemberId) || (t.executionTasks || []).some(et => (et.assigneeIds || []).includes(filterMemberId)));
    } else if (filterGroupId !== 'all') {
      const groupMids = members.filter(m => m.groupId === filterGroupId).map(m => m.id);
      result = result.filter(t => (t.assigneeIds || []).some(aid => groupMids.includes(aid)));
    }
    return result;
  }, [tasks, filterProjectId, filterMemberId, filterGroupId, members]);

  const rawSelectedNode = useMemo(() => tasks.find(t => t.id === selectedNodeId) || null, [tasks, selectedNodeId]);

  const stats: DashboardStats = useMemo(() => {
    let completed = 0, delayed = 0, atRisk = 0;
    const today = new Date();
    filteredNodes.forEach(t => {
      if (t.progress === 100) completed++;
      else {
        const daysLeft = Math.ceil((new Date(t.dueDate).getTime() - today.getTime()) / (1000 * 3600 * 24));
        if (daysLeft < 0) delayed++;
        else if (daysLeft <= 3 && t.progress < 80) atRisk++;
      }
    });
    return { total: filteredNodes.length, completed, delayed, atRisk };
  }, [filteredNodes]);

  const handleAnalyze = async () => {
    setIsAnalyzing(true); setAiAnalysis(null);
    try {
      const result = await analyzeProjectHealth(filteredNodes, members, aiConfig);
      setAiAnalysis(result);
    } catch (error) { console.error(error); } finally { setIsAnalyzing(false); }
  };

  const handleLoginSuccess = (user: User) => {
    setCurrentUser(user);
    localStorage.setItem('th_user', JSON.stringify(user));
  };

  const handleLogout = () => {
    if (window.confirm('确定要注销指挥权限并退出作战系统吗？')) {
      setCurrentUser(null);
      localStorage.removeItem('th_user');
      setDemoMode(false);
      setTasks([]);
      setProjects([]);
      setMembers([]);
      setGroups([]);
      setSelectedNodeId(null);
      setActiveView('overview');
      initialLoadComplete.current = false;
      window.location.reload();
    }
  };

  const MarkdownBody = ({ content }: { content: string }) => {
    const html = marked.parse(content) as string;
    return <div className="ai-report-content text-slate-300 text-sm leading-relaxed border-l-2 border-warning/30 pl-6 py-2" dangerouslySetInnerHTML={{ __html: html }} />;
  };

  if (!currentUser) {
    return (
      <>
        <Login onLoginSuccess={handleLoginSuccess} onOpenSettings={() => setIsSettingsOpen(true)} dbStatus={dbStatus} />
        <SettingsModal isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} onConfigSaved={() => checkInitStatus()} hideAiTab={true} />
      </>
    );
  }

  if (isLoading) return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50">
      <div className="flex flex-col items-center gap-4">
        <div className="w-8 h-8 border-4 border-warning border-t-transparent rounded-full animate-spin"></div>
        <p className="text-slate-500 font-black text-[10px] uppercase tracking-widest text-warning">同步权限并加载视界...</p>
      </div>
    </div>
  );

  const loggedInMember = members.find(m => m.id === currentUser.memberId);

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-900 font-sans selection:bg-warning/30">
      <header className="bg-white border-b border-slate-200 sticky top-0 z-40 shadow-sm transition-all">
        <div className="max-w-[1600px] mx-auto px-4 lg:px-8">
          <div className="h-14 lg:h-16 flex items-center justify-between">
            <div className="flex items-center gap-3 shrink-0 cursor-pointer" onClick={() => setActiveView('overview')}>
              <div className="w-8 h-8 lg:w-9 lg:h-9 bg-slate-900 rounded-xl flex items-center justify-center text-warning font-black text-lg lg:text-xl shadow-lg">T</div>
              <div className="flex flex-col">
                <h1 className="text-sm lg:text-lg font-black tracking-tighter leading-none">
                  <span className="text-warning">T&H</span> <span className="text-success hidden xs:inline">INTERNATIONAL</span>
                </h1>
                <div className="flex items-center gap-1 mt-0.5">
                   <div className={`w-1.5 h-1.5 rounded-full ${saveStatus === 'saving' ? 'bg-warning animate-pulse' : 'bg-success'}`}></div>
                   <span className="text-[8px] lg:text-[9px] font-black uppercase text-slate-400 tracking-wider">
                     {isDemoMode() ? '演示模式' : '实时连接'} · {currentUser.role === UserRole.ADMIN ? '最高权限' : '成员视界'}
                   </span>
                </div>
              </div>
            </div>

            <nav className="hidden md:flex bg-slate-100 p-1 rounded-xl gap-1 mx-4">
              <button onClick={() => setActiveView('overview')} className={`px-5 py-1.5 rounded-lg text-xs font-black uppercase transition-all ${activeView === 'overview' ? 'bg-white text-slate-900 shadow-sm ring-1 ring-slate-200' : 'text-slate-400 hover:text-slate-600'}`}>战略概览</button>
              <button onClick={() => setActiveView('tasks')} className={`px-5 py-1.5 rounded-lg text-xs font-black uppercase transition-all ${activeView === 'tasks' ? 'bg-white text-slate-900 shadow-sm ring-1 ring-slate-200' : 'text-slate-400 hover:text-slate-600'}`}>作战指挥</button>
            </nav>

            <div className="flex items-center gap-2">
              <div 
                className="hidden sm:flex items-center gap-2 mr-2 px-3 py-1.5 bg-slate-50 rounded-xl border border-slate-100 cursor-pointer hover:bg-slate-100 transition-all"
                onClick={() => setIsPasswordChangeOpen(true)}
                title="修改登录密钥"
              >
                 <img src={loggedInMember?.avatar || `https://ui-avatars.com/api/?name=${currentUser.username}`} className="w-6 h-6 rounded-full border border-warning" />
                 <div className="flex flex-col">
                    <span className="text-[10px] font-black text-slate-800 leading-none">{loggedInMember?.name || currentUser.username}</span>
                    <span className="text-[8px] font-black text-slate-400 uppercase">{loggedInMember?.role || (currentUser.role === UserRole.ADMIN ? '指挥官' : '成员')}</span>
                 </div>
              </div>
              
              {currentUser.role === UserRole.ADMIN && (
                <>
                  <button onClick={() => setIsProjectManagerOpen(true)} className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-warning/10 text-warning rounded-lg hover:bg-warning/20 transition-all font-black text-[10px] uppercase border border-warning/20">立项管理</button>
                  <button onClick={() => setIsMemberManagerOpen(true)} className="p-2 bg-slate-50 text-slate-400 hover:bg-success hover:text-white rounded-lg transition-all" title="成员管理"><svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" /></svg></button>
                  <button onClick={() => setIsSettingsOpen(true)} className="p-2 bg-slate-50 text-slate-400 hover:bg-warning hover:text-slate-900 rounded-lg transition-all" title="系统设置"><svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg></button>
                </>
              )}
              
              <button onClick={handleLogout} className="p-2 bg-slate-50 text-danger hover:bg-danger/10 rounded-lg transition-all" title="注销退出"><svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg></button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-[1600px] mx-auto px-4 lg:px-8 py-4 lg:py-6">
        {activeView === 'overview' ? (
          <ProjectOverview 
            projects={projects} tasks={tasks} allMembers={members}
            onProjectClick={(id) => { setFilterProjectId(id); setActiveView('tasks'); }} 
            onNavigateToTask={(pid, tid) => { setFilterProjectId(pid); setSelectedNodeId(tid); setActiveView('tasks'); }}
            onAddNewProject={() => setIsProjectManagerOpen(true)}
          />
        ) : (
          <div className="animate-[fadeIn_0.4s_ease-out]">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 lg:gap-4 mb-6">
              {[
                { label: '核心节点', val: stats.total, color: 'text-slate-800' },
                { label: '节点达成', val: stats.completed, color: 'text-success', border: 'border-b-success' },
                { label: '风险警戒', val: stats.atRisk, color: 'text-warning', border: 'border-b-warning' },
                { label: '逾期攻坚', val: stats.delayed, color: 'text-danger', border: 'border-b-danger' }
              ].map((s, i) => (
                <div key={i} className={`bg-white p-3 lg:p-4 rounded-xl shadow-sm border border-slate-100 ${s.border ? `border-b-4 ${s.border}` : ''}`}>
                  <span className={`text-xl lg:text-3xl font-black tracking-tighter ${s.color}`}>{s.val}</span>
                  <div className="text-[9px] lg:text-[10px] text-slate-400 mt-1 uppercase font-black tracking-widest border-t border-slate-50 pt-1">{s.label}</div>
                </div>
              ))}
            </div>

            <ProjectProgressTrack 
              projects={projects} 
              tasks={tasks} 
              activeProjectId={filterProjectId} 
              onProjectSelect={(id) => { 
                setFilterProjectId(id); 
                setSelectedNodeId(null); 
              }} 
            />

            <TeamStatus members={filteredMembers} tasks={tasks} />

            <div className="mt-6 flex flex-col gap-3 lg:gap-5 bg-white p-4 lg:p-6 rounded-[2rem] shadow-sm border border-slate-100">
               <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-hide">
                <div className="shrink-0 text-[10px] font-black text-slate-300 uppercase tracking-widest px-2">立项指挥</div>
                <button onClick={() => { setFilterProjectId('all'); setSelectedNodeId(null); }} className={`shrink-0 px-4 py-1.5 rounded-xl text-[10px] font-black uppercase transition-all ${filterProjectId === 'all' ? 'bg-success text-white ring-2 ring-success/30 shadow-lg' : 'bg-slate-50 text-slate-400 border border-slate-200 hover:text-slate-600'}`}>全盘概览</button>
                {projects.map(p => (
                  <button key={p.id} onClick={() => { setFilterProjectId(p.id); setSelectedNodeId(null); }} className={`shrink-0 px-4 py-1.5 rounded-xl text-[10px] font-black uppercase transition-all whitespace-nowrap flex items-center gap-2 ${filterProjectId === p.id ? 'bg-slate-900 text-white ring-2 ring-warning shadow-lg' : 'bg-slate-50 text-slate-400 border border-slate-200 hover:text-slate-600'}`}>
                    {p.name}
                  </button>
                ))}
              </div>

              <div className="flex flex-col xl:flex-row gap-4">
                <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-3">
                   <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide bg-slate-50/80 p-2 rounded-xl border border-slate-100">
                      <span className="shrink-0 text-[9px] font-black text-slate-400 uppercase w-10 text-center">组织</span>
                      <button onClick={() => setFilterGroupId('all')} className={`shrink-0 px-3 py-1.5 rounded-lg text-[9px] font-black uppercase transition-all ${filterGroupId === 'all' ? 'bg-slate-800 text-white shadow-md' : 'text-slate-400 hover:bg-white hover:text-slate-600'}`}>全公司</button>
                      {groups.map(g => (
                        <button key={g.id} onClick={() => setFilterGroupId(g.id)} className={`shrink-0 px-3 py-1.5 rounded-lg text-[9px] font-black uppercase transition-all ${filterGroupId === g.id ? 'bg-slate-800 text-white shadow-md ring-1 ring-slate-400' : 'text-slate-400 hover:bg-white hover:text-slate-600'}`}>{g.name}</button>
                      ))}
                   </div>
                   <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide bg-slate-50/80 p-2 rounded-xl border border-slate-100">
                      <span className="shrink-0 text-[9px] font-black text-slate-400 uppercase w-10 text-center">协作</span>
                      <button onClick={() => setFilterMemberId('all')} className={`shrink-0 px-3 py-1.5 rounded-lg text-[9px] font-black uppercase transition-all ${filterMemberId === 'all' ? 'bg-slate-800 text-white shadow-md' : 'text-slate-400 hover:bg-white hover:text-slate-600'}`}>全员</button>
                      {filteredMembers.map(m => (
                        <button key={m.id} onClick={() => setFilterMemberId(m.id)} className={`shrink-0 px-3 py-1.5 rounded-lg text-[9px] font-black flex items-center gap-2 transition-all ${filterMemberId === m.id ? 'bg-success text-white shadow-md ring-1 ring-white' : 'bg-white border border-slate-100 text-slate-400 hover:text-slate-600'}`}>
                          {m.name}
                        </button>
                      ))}
                   </div>
                </div>

                <div className="flex gap-2 shrink-0">
                  <button onClick={handleAnalyze} disabled={isAnalyzing} className="flex-1 sm:flex-none flex items-center justify-center gap-2 border-2 border-slate-900 px-4 py-2 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-slate-50 transition-all disabled:opacity-50">
                    {isAnalyzing ? <div className="w-3 h-3 border-2 border-slate-900 border-t-transparent rounded-full animate-spin"></div> : 'AI 辅助诊断'}
                  </button>
                  {currentUser.role === UserRole.ADMIN && (
                    <button onClick={() => { setEditingTask(null); setIsTaskFormOpen(true); }} className="flex-[1.2] sm:flex-none flex items-center justify-center gap-2 bg-slate-900 text-white px-6 py-2 rounded-xl font-black text-[10px] uppercase tracking-widest shadow-xl hover:bg-black transition-all">
                      <svg className="w-4 h-4 text-warning" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6m0 0v6m0-6h6m-6 0H6" /></svg>
                      定义节点
                    </button>
                  )}
                </div>
              </div>
            </div>

            {aiAnalysis && (
              <div className="mt-6 p-6 bg-slate-900 rounded-[2rem] border-l-8 border-warning animate-[fadeIn_0.5s_ease-out] shadow-2xl relative overflow-hidden">
                <div className="absolute top-0 right-0 p-4 opacity-10">
                   <svg className="w-24 h-24 text-warning" fill="currentColor" viewBox="0 0 24 24"><path d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                </div>
                <div className="flex items-center gap-3 mb-6 relative z-10">
                  <div className="p-2 bg-warning rounded-xl text-slate-900 shadow-lg shadow-warning/20">
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                  </div>
                  <div>
                    <h3 className="font-black uppercase tracking-[0.2em] text-xs text-warning">T&H AI 战略指挥官 · 核心诊断简报</h3>
                    <p className="text-[9px] text-slate-500 font-black uppercase tracking-widest mt-0.5">GENERATED BY GEMINI INTELLIGENCE SYSTEM</p>
                  </div>
                </div>
                <MarkdownBody content={aiAnalysis} />
                <button onClick={() => setAiAnalysis(null)} className="absolute top-4 right-4 text-slate-500 hover:text-white"><svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" /></svg></button>
              </div>
            )}

            <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 lg:gap-5">
              {filteredNodes.map(task => (
                <TaskCard 
                  key={task.id} task={task} allMembers={members} 
                  projectName={projects.find(p => p.id === task.projectId)?.name}
                  onUpdateClick={() => { setSelectedNodeId(task.id); setIsTaskDetailOpen(true); }}
                  onEditTask={(t) => { setEditingTask(t); setIsTaskFormOpen(true); }}
                  onDeleteTask={(id) => { if(window.confirm('销毁节点？')) setTasks(tasks.filter(t => t.id !== id)) }}
                  onDetailClick={(t) => { setSelectedNodeId(t.id); }}
                  isActive={selectedNodeId === task.id}
                />
              ))}
            </div>

            <div ref={executionRef} className="scroll-mt-24">
              {rawSelectedNode && (rawSelectedNode.executionTasks?.length || 0) > 0 && (
                <div className="mt-16 animate-[fadeIn_0.5s_ease-out] pb-20">
                  <div className="flex items-center justify-between mb-6">
                     <div className="flex items-center gap-3">
                        <div className="w-2 h-8 bg-success rounded-full shadow-sm shadow-success/20"></div>
                        <div>
                          <h2 className="text-xl font-black text-slate-800 tracking-tight uppercase tracking-widest">
                             [{rawSelectedNode.title}] · 作战指令穿透
                          </h2>
                          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-0.5">直接维护该节点下的底层执行动作</p>
                        </div>
                     </div>
                     <button 
                       onClick={() => setIsTaskDetailOpen(true)}
                       className="px-4 py-2 bg-slate-50 border border-slate-200 text-slate-500 hover:text-slate-800 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all"
                     >
                       管理分解项
                     </button>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
                    {rawSelectedNode.executionTasks.filter(et => {
                      if (currentUser?.role === UserRole.ADMIN) return true;
                      if (!et.visibleToIds || et.visibleToIds.length === 0) return true;
                      return currentUser?.memberId && et.visibleToIds.includes(currentUser.memberId);
                    }).map(et => (
                      <ExecutionTaskCard 
                        key={et.id}
                        subTask={et}
                        parentTask={rawSelectedNode}
                        allMembers={members}
                        projectName={projects.find(p => p.id === rawSelectedNode.projectId)?.name}
                        onUpdateClick={(st, pt) => {
                          setSelectedSubTaskForUpdate({ task: pt, subTask: st });
                          setIsUpdateModalOpen(true);
                        }}
                        onDetailClick={(pt) => {
                          setSelectedNodeId(pt.id);
                          setIsTaskDetailOpen(true);
                        }}
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </main>

      <ProjectManager isOpen={isProjectManagerOpen} onClose={() => setIsProjectManagerOpen(false)} projects={projects} tasks={tasks} allMembers={members} groups={groups} onAddProject={(p) => setProjects([...projects, p])} onUpdateProject={(p) => setProjects(projects.map(x => x.id === p.id ? p : x))} onDeleteProject={(id) => setProjects(projects.filter(p => p.id !== id))} />
      <MemberManager isOpen={isMemberManagerOpen} onClose={() => setIsMemberManagerOpen(false)} members={members} groups={groups} onAddMember={m => setMembers([...members, m])} onUpdateMember={m => setMembers(members.map(x => x.id === m.id ? m : x))} onDeleteMember={id => setMembers(members.filter(m => m.id !== id))} onAddGroup={g => setGroups([...groups, g])} onUpdateGroup={g => setGroups(groups.map(x => x.id === g.id ? g : x))} onDeleteGroup={id => setGroups(groups.filter(g => g.id !== id))} />
      <TaskFormModal isOpen={isTaskFormOpen} onClose={() => setIsTaskFormOpen(false)} task={editingTask} members={members} groups={groups} projects={projects} currentProjectId={filterProjectId} onSave={(t) => { if (editingTask) setTasks(tasks.map(x => x.id === t.id ? (t as Task) : x)); else setTasks([...tasks, (t as Task)]); setIsTaskFormOpen(false); }} />
      <TaskDetailModal 
        task={rawSelectedNode} allMembers={members} groups={groups} isOpen={isTaskDetailOpen} currentUser={currentUser} onClose={() => setIsTaskDetailOpen(false)} 
        onAddExecutionTask={(taskId, title, outcome, assigneeIds, start, due, visibleToIds) => { 
          setTasks(prev => prev.map(t => {
            if (t.id === taskId) {
              const newETs = [...(t.executionTasks || []), { id: Date.now().toString(), title, outcome, isCompleted: false, progress: 0, assigneeIds, startDate: start, dueDate: due, visibleToIds }];
              return { ...t, executionTasks: newETs, progress: calculateOverallProgress(newETs) };
            }
            return t;
          }));
        }} 
        onUpdateExecutionTask={(taskId, etId, updates) => {
          setTasks(prev => prev.map(t => {
            if (t.id === taskId) {
              const updatedETs = (t.executionTasks || []).map(et => et.id === etId ? { ...et, ...updates } : et);
              return { ...t, executionTasks: updatedETs, progress: calculateOverallProgress(updatedETs) };
            }
            return t;
          }));
        }}
        onUpdateExecutionTaskProgress={(taskId, etId, prog) => { 
          setTasks(prev => prev.map(t => {
            if (t.id === taskId) {
              const updatedETs = (t.executionTasks || []).map(et => et.id === etId ? { ...et, progress: prog, isCompleted: prog === 100 } : et);
              return { ...t, executionTasks: updatedETs, progress: calculateOverallProgress(updatedETs) };
            }
            return t;
          }));
        }} 
        onToggleExecutionTask={(taskId, etId) => { 
          setTasks(prev => prev.map(t => {
            if (t.id === taskId) {
              const updatedETs = (t.executionTasks || []).map(et => et.id === etId ? { ...et, isCompleted: !et.isCompleted, progress: !et.isCompleted ? 100 : 0 } : et);
              return { ...t, executionTasks: updatedETs, progress: calculateOverallProgress(updatedETs) };
            }
            return t;
          }));
        }} 
        onDeleteExecutionTask={(taskId, etId) => { 
          setTasks(prev => prev.map(t => {
            if (t.id === taskId) {
              const updatedETs = (t.executionTasks || []).filter(et => et.id !== etId);
              return { ...t, executionTasks: updatedETs, progress: calculateOverallProgress(updatedETs) };
            }
            return t;
          }));
        }} 
      />
      <UpdateModal subTask={selectedSubTaskForUpdate?.subTask || null} parentTask={selectedSubTaskForUpdate?.task || null} isOpen={isUpdateModalOpen} onClose={() => setIsUpdateModalOpen(false)} onSave={handleSaveSubTaskProgress} />
      <SettingsModal isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} onConfigSaved={() => loadData()} hideDbTab={!!currentUser} hideAiTab={false} />
      {currentUser && (
        <PasswordChangeModal 
          user={currentUser} 
          isOpen={isPasswordChangeOpen} 
          onClose={() => setIsPasswordChangeOpen(false)} 
        />
      )}
    </div>
  );
};

export default App;
