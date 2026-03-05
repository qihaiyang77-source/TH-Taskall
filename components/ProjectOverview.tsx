
import React, { useState, useMemo, useRef, useEffect } from 'react';
import { Project, Task, Member } from '../types';

interface ProjectOverviewProps {
  projects: Project[];
  tasks: Task[];
  allMembers: Member[];
  onProjectClick: (projectId: string) => void;
  onNavigateToTask: (projectId: string, taskId: string) => void; 
  onAddNewProject: () => void;
}

const getDaysDiff = (start: string, end: string) => {
  const s = new Date(start);
  const e = new Date(end);
  return Math.ceil((e.getTime() - s.getTime()) / (1000 * 3600 * 24));
};

export const ProjectOverview: React.FC<ProjectOverviewProps> = ({ 
  projects, 
  tasks, 
  allMembers,
  onProjectClick, 
  onNavigateToTask,
  onAddNewProject 
}) => {
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
  const [hoveredKey, setHoveredKey] = useState<string | null>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (projects.length > 0) {
      const allIds = new Set<string>();
      projects.forEach(p => allIds.add(p.id));
      tasks.forEach(t => allIds.add(t.id));
      setExpandedIds(allIds);
    }
  }, [projects.length, tasks.length]);

  const timelineRange = useMemo(() => {
    const today = new Date();
    let minDate = new Date(today.getTime() - 7 * 24 * 3600 * 1000);
    let maxDate = new Date(today.getTime() + 45 * 24 * 3600 * 1000);

    const allDates = [
      ...projects.map(p => p.startDate),
      ...projects.map(p => p.endDate || p.startDate),
      ...tasks.map(t => t.startDate),
      ...tasks.map(t => t.dueDate)
    ].filter(Boolean).map(d => new Date(d));

    if (allDates.length > 0) {
      const dataMin = new Date(Math.min(...allDates.map(d => d.getTime())));
      const dataMax = new Date(Math.max(...allDates.map(d => d.getTime())));
      if (dataMin < minDate) minDate = new Date(dataMin.getTime() - 3 * 24 * 3600 * 1000);
      if (dataMax > maxDate) maxDate = new Date(dataMax.getTime() + 7 * 24 * 3600 * 1000);
    }

    const days: string[] = [];
    const curr = new Date(minDate);
    while (curr <= maxDate) {
      days.push(curr.toISOString().split('T')[0]);
      curr.setDate(curr.getDate() + 1);
    }

    return { days, start: minDate.toISOString().split('T')[0], end: maxDate.toISOString().split('T')[0] };
  }, [projects, tasks]);

  // 固定单日宽度为 80，提供极佳的可视空间
  const dayWidth = 80;
  const chartWidth = timelineRange.days.length * dayWidth;

  useEffect(() => {
    if (scrollContainerRef.current) {
      const todayIdx = timelineRange.days.indexOf(new Date().toISOString().split('T')[0]);
      if (todayIdx > -1) {
        scrollContainerRef.current.scrollLeft = todayIdx * dayWidth - scrollContainerRef.current.offsetWidth / 2 + 100;
      }
    }
  }, [timelineRange]);

  const toggleExpand = (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    const next = new Set(expandedIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setExpandedIds(next);
  };

  const renderBar = (
    start: string, 
    end: string, 
    progress: number, 
    type: 'project' | 'task' | 'sub', 
    status: 'normal' | 'risk' | 'delayed' | 'completed',
    onClick?: () => void
  ) => {
    const width = Math.max(dayWidth, (getDaysDiff(start, end) + 1) * dayWidth);
    let progressColor = 'bg-success';
    if (status === 'delayed') progressColor = 'bg-danger';
    if (status === 'risk') progressColor = 'bg-warning';
    
    const heightClass = type === 'project' ? 'h-9' : type === 'task' ? 'h-7' : 'h-5';
    const textClass = type === 'project' ? 'text-sm' : type === 'task' ? 'text-xs' : 'text-[10px]';

    return (
      <div 
        onClick={onClick}
        className={`relative ${heightClass} bg-slate-300 rounded-xl overflow-hidden shadow-[inset_0_2px_4px_rgba(0,0,0,0.2)] transition-all hover:brightness-110 active:scale-[0.98] cursor-pointer border border-slate-400/30 group/bar`} 
        style={{ width }}
      >
        <div className={`absolute top-0 left-0 h-full ${progressColor} transition-all duration-700 shadow-[inset_0_1px_2px_rgba(255,255,255,0.4)]`} style={{ width: `${progress}%` }}>
           {/* 条纹质感层 */}
           <div className="absolute inset-0 opacity-10 bg-[linear-gradient(45deg,rgba(255,255,255,.2)_25%,transparent_25%,transparent_50%,rgba(255,255,255,.2)_50%,rgba(255,255,255,.2)_75%,transparent_75%,transparent)] bg-[length:20px_20px]"></div>
           {/* 玻璃高光层 */}
           <div className="absolute inset-0 bg-gradient-to-b from-white/30 to-transparent h-1/2"></div>
        </div>
        {/* 高对比度百分比文字 */}
        <span className={`absolute inset-0 flex items-center justify-center ${textClass} font-black text-white tracking-widest drop-shadow-[0_1.5px_1.5px_rgba(0,0,0,0.95)]`}>
          {progress}%
        </span>
      </div>
    );
  };

  const renderMemberNames = (ids: string[]) => {
    const names = allMembers.filter(m => ids.includes(m.id)).map(m => m.name);
    if (names.length === 0) return null;
    return (
      <div className="ml-auto shrink-0 pl-3 flex items-center gap-1">
        <span className="text-[10px] font-black text-slate-500 uppercase tracking-tighter truncate max-w-[100px] sm:max-w-[150px] bg-slate-200/50 px-2 py-0.5 rounded-md border border-slate-300/30">
          {names.join(', ')}
        </span>
      </div>
    );
  };

  const getStatus = (end: string, progress: number) => {
    const today = new Date().toISOString().split('T')[0];
    if (progress === 100) return 'completed';
    if (end < today) return 'delayed';
    const daysToDue = getDaysDiff(today, end);
    if (daysToDue <= 3 && progress < 80) return 'risk';
    return 'normal';
  };

  const getPos = (date: string) => (getDaysDiff(timelineRange.start, date) * dayWidth);

  return (
    <div className="flex flex-col h-full animate-[fadeIn_0.5s_ease-out]">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
        <div>
          <h2 className="text-2xl font-black text-slate-800 tracking-tight">战略指挥中心 <span className="text-success font-black tracking-tighter">GANTT</span></h2>
          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-0.5">多层级深度透视 · 宽屏作战视图</p>
        </div>
        <button onClick={onAddNewProject} className="w-full sm:w-auto px-6 py-2.5 bg-slate-900 text-white rounded-xl font-black text-xs uppercase tracking-widest shadow-xl flex items-center justify-center gap-2 hover:bg-black transition-all">
          <svg className="w-4 h-4 text-warning" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" /></svg>
          发起新立项
        </button>
      </div>

      <div className="bg-white rounded-[2rem] shadow-xl border border-slate-100 overflow-hidden flex flex-col border-b-8 border-slate-900">
        <div className="flex overflow-hidden">
          {/* 左侧架构树：保持品牌色 */}
          <div className="w-52 xs:w-64 sm:w-[22rem] flex-shrink-0 border-r border-slate-200 bg-slate-50/50 z-20 shadow-md">
            <div className="h-12 sm:h-14 border-b border-slate-200 flex items-center px-4 sm:px-6 bg-white sticky top-0">
               <span className="text-[10px] sm:text-xs font-black text-slate-400 uppercase tracking-widest whitespace-nowrap">作战架构 / 责任人员</span>
            </div>
            <div className="overflow-y-auto max-h-[60vh] lg:max-h-[65vh] scrollbar-hide">
              {projects.map(p => {
                const pTasks = tasks.filter(t => t.projectId === p.id);
                const isExpanded = expandedIds.has(p.id);
                const currentKey = `project-${p.id}`;
                return (
                  <React.Fragment key={p.id}>
                    <div 
                      className={`h-14 sm:h-16 flex items-center px-3 sm:px-4 border-b border-slate-100 group cursor-pointer transition-all ${hoveredKey === currentKey ? 'bg-warning/10' : 'hover:bg-white'}`}
                      onMouseEnter={() => setHoveredKey(currentKey)}
                      onMouseLeave={() => setHoveredKey(null)}
                    >
                      <div className={`mr-2 transition-colors p-1.5 rounded-lg ${hoveredKey === currentKey ? 'text-warning bg-white shadow-sm' : 'text-slate-300 group-hover:text-warning'}`} onClick={(e) => toggleExpand(p.id, e)}>
                        {isExpanded ? '▼' : '▶'}
                      </div>
                      <div className="flex-1 min-w-0 flex items-center overflow-hidden" onClick={() => onProjectClick(p.id)}>
                        <div className={`text-xs sm:text-sm font-black truncate uppercase tracking-tight transition-colors ${hoveredKey === currentKey ? 'text-slate-900' : 'text-slate-800 group-hover:text-success'}`}>{p.name}</div>
                        {renderMemberNames(p.memberIds || [])}
                      </div>
                    </div>
                    {isExpanded && pTasks.map(t => {
                      const isTaskExpanded = expandedIds.has(t.id);
                      const subTasks = t.executionTasks || [];
                      const taskKey = `task-${t.id}`;
                      return (
                        <React.Fragment key={t.id}>
                          <div 
                            className={`h-12 sm:h-14 flex items-center pl-6 sm:pl-10 pr-4 border-b border-slate-100 cursor-pointer group transition-all ${hoveredKey === taskKey ? 'bg-warning/10' : 'bg-slate-50/30 hover:bg-white'}`}
                            onMouseEnter={() => setHoveredKey(taskKey)}
                            onMouseLeave={() => setHoveredKey(null)}
                          >
                            <div className={`mr-2 text-xs transition-colors ${hoveredKey === taskKey ? 'text-warning' : 'text-slate-300'}`} onClick={(e) => toggleExpand(t.id, e)}>
                              {subTasks.length > 0 ? (isTaskExpanded ? '▼' : '▶') : '•'}
                            </div>
                            <div className="flex-1 min-w-0 flex items-center overflow-hidden" onClick={() => onNavigateToTask(p.id, t.id)}>
                              <div className={`text-[10px] sm:text-xs font-bold truncate transition-colors ${hoveredKey === taskKey ? 'text-slate-900' : 'text-slate-600 group-hover:text-primary'}`}>{t.title}</div>
                              {renderMemberNames(t.assigneeIds || [])}
                            </div>
                          </div>
                          {isTaskExpanded && subTasks.map(st => {
                            const stKey = `subtask-${t.id}-${st.id}`;
                            return (
                              <div 
                                key={st.id} 
                                className={`h-10 sm:h-12 flex items-center pl-10 sm:pl-16 pr-4 border-b border-slate-50 cursor-pointer transition-all ${hoveredKey === stKey ? 'bg-warning/10' : 'bg-slate-50/80 hover:bg-white'}`} 
                                onMouseEnter={() => setHoveredKey(stKey)}
                                onMouseLeave={() => setHoveredKey(null)}
                                onClick={() => onNavigateToTask(p.id, t.id)}
                              >
                                 <div className="flex-1 min-w-0 flex items-center overflow-hidden">
                                   <div className={`text-[9px] sm:text-[11px] font-medium truncate italic transition-colors ${hoveredKey === stKey ? 'text-slate-900' : 'text-slate-400'}`}>{st.title}</div>
                                   {renderMemberNames(st.assigneeIds || [])}
                                 </div>
                              </div>
                            );
                          })}
                        </React.Fragment>
                      )
                    })}
                  </React.Fragment>
                );
              })}
            </div>
          </div>

          {/* 右侧时间轴主体 */}
          <div ref={scrollContainerRef} className="flex-1 overflow-x-auto relative scrollbar-hide bg-slate-100/30">
             <div className="h-12 sm:h-14 border-b border-slate-200 flex sticky top-0 z-10 bg-white" style={{ width: chartWidth }}>
                {timelineRange.days.map(day => {
                   const d = new Date(day);
                   const isWeekend = d.getDay() === 0 || d.getDay() === 6;
                   const isToday = day === new Date().toISOString().split('T')[0];
                   return (
                     <div key={day} className={`flex-shrink-0 flex flex-col items-center justify-center border-r border-slate-100 text-[10px] sm:text-xs font-black ${isWeekend ? 'bg-slate-50 text-slate-300' : 'text-slate-500'} ${isToday ? 'bg-warning/10 text-warning ring-1 ring-inset ring-warning/20' : ''}`} style={{ width: dayWidth }}>
                       <span className="opacity-50 text-[8px] uppercase">{['日','一','二','三','四','五','六'][d.getDay()]}</span>
                       <span className="mt-0.5">{d.getDate()}</span>
                     </div>
                   )
                })}
             </div>

             <div className="relative" style={{ width: chartWidth }}>
                {/* 今日红色虚线 */}
                <div className="absolute top-0 bottom-0 z-10 border-l-4 border-dashed border-warning pointer-events-none opacity-60" style={{ left: getPos(new Date().toISOString().split('T')[0]) + dayWidth / 2 }} />
                
                <div className="overflow-y-auto max-h-[60vh] lg:max-h-[65vh] scrollbar-hide">
                  {projects.map(p => {
                    const pTasks = tasks.filter(t => t.projectId === p.id);
                    const isExpanded = expandedIds.has(p.id);
                    const avgProg = pTasks.length > 0 ? Math.round(pTasks.reduce((acc, t) => acc + t.progress, 0) / pTasks.length) : 0;
                    const currentKey = `project-${p.id}`;
                    return (
                      <React.Fragment key={p.id}>
                        <div 
                          className={`h-14 sm:h-16 flex items-center border-b border-slate-100 px-4 transition-all ${hoveredKey === currentKey ? 'bg-warning/10' : ''}`}
                          onMouseEnter={() => setHoveredKey(currentKey)}
                          onMouseLeave={() => setHoveredKey(null)}
                        >
                           <div style={{ marginLeft: getPos(p.startDate) }}>
                              {renderBar(p.startDate, p.endDate || p.startDate, avgProg, 'project', getStatus(p.endDate || p.startDate, avgProg), () => onProjectClick(p.id))}
                           </div>
                        </div>
                        {isExpanded && pTasks.map(t => {
                          const isTaskExpanded = expandedIds.has(t.id);
                          const subTasks = t.executionTasks || [];
                          const taskKey = `task-${t.id}`;
                          return (
                            <React.Fragment key={t.id}>
                              <div 
                                className={`h-12 sm:h-14 flex items-center border-b border-slate-100 px-4 transition-all ${hoveredKey === taskKey ? 'bg-warning/10' : ''}`}
                                onMouseEnter={() => setHoveredKey(taskKey)}
                                onMouseLeave={() => setHoveredKey(null)}
                              >
                                 <div style={{ marginLeft: getPos(t.startDate) }}>
                                    {renderBar(t.startDate, t.dueDate, t.progress, 'task', getStatus(t.dueDate, t.progress), () => onNavigateToTask(p.id, t.id))}
                                 </div>
                              </div>
                              {isTaskExpanded && subTasks.map(st => {
                                const stKey = `subtask-${t.id}-${st.id}`;
                                return (
                                  <div 
                                    key={st.id} 
                                    className={`h-10 sm:h-12 flex items-center border-b border-slate-100 px-4 transition-all ${hoveredKey === stKey ? 'bg-warning/10' : ''}`}
                                    onMouseEnter={() => setHoveredKey(stKey)}
                                    onMouseLeave={() => setHoveredKey(null)}
                                  >
                                     <div style={{ marginLeft: getPos(st.startDate || t.startDate) }}>
                                        {renderBar(st.startDate || t.startDate, st.dueDate || t.dueDate, st.progress, 'sub', getStatus(st.dueDate || t.dueDate, st.progress), () => onNavigateToTask(p.id, t.id))}
                                     </div>
                                  </div>
                                );
                              })}
                            </React.Fragment>
                          );
                        })}
                      </React.Fragment>
                    );
                  })}
                </div>
             </div>
          </div>
        </div>
      </div>
    </div>
  );
};
