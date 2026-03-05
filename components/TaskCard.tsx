
import React from 'react';
import { Task, Member, TaskStatus } from '../types';
import { ProgressBar } from './ProgressBar';

interface TaskCardProps {
  task: Task;
  allMembers: Member[];
  projectName?: string;
  onUpdateClick: (task: Task) => void;
  onEditTask: (task: Task) => void;
  onDeleteTask: (taskId: string) => void;
  onDetailClick: (task: Task) => void;
  isActive?: boolean;
}

export const TaskCard: React.FC<TaskCardProps> = ({ 
  task, 
  allMembers, 
  projectName,
  onUpdateClick,
  onEditTask,
  onDeleteTask,
  onDetailClick,
  isActive = false
}) => {
  const today = new Date();
  const dueDate = new Date(task.dueDate);
  const daysLeft = Math.ceil((dueDate.getTime() - today.getTime()) / (1000 * 3600 * 24));
  
  let computedStatus: 'normal' | 'risk' | 'delayed' | 'completed' = 'normal';
  let statusLabel = TaskStatus.ON_TRACK;
  
  if (task.progress === 100) {
    computedStatus = 'completed';
    statusLabel = TaskStatus.COMPLETED;
  } else if (daysLeft < 0) {
    computedStatus = 'delayed';
    statusLabel = TaskStatus.DELAYED;
  } else if (daysLeft <= 3 && task.progress < 80) {
    computedStatus = 'risk';
    statusLabel = TaskStatus.AT_RISK;
  }

  const executionTasksTotal = task.executionTasks?.length || 0;
  const executionTasksCompleted = task.executionTasks?.filter(m => m.isCompleted).length || 0;
  
  const managers = allMembers.filter(m => (task.managerIds || []).includes(m.id));
  const nodeAssignees = allMembers.filter(m => (task.assigneeIds || []).includes(m.id));

  return (
    <div 
      className={`bg-white rounded-2xl shadow-sm border transition-all relative overflow-hidden group cursor-pointer flex flex-col p-5
        ${isActive ? 'ring-2 ring-warning border-transparent shadow-xl translate-y-[-2px]' : 'border-slate-200 hover:shadow-lg hover:translate-y-[-2px]'}
      `}
      onClick={() => onDetailClick(task)}
    >
      <div className={`absolute top-0 left-0 w-1.5 h-full 
        ${computedStatus === 'normal' || computedStatus === 'completed' ? 'bg-success' : ''}
        ${computedStatus === 'risk' ? 'bg-warning' : ''}
        ${computedStatus === 'delayed' ? 'bg-danger' : ''}
      `} />

      <div className="flex justify-between items-start mb-3">
        <div className="flex-1 min-w-0 pr-2">
          <div className="flex items-center gap-1.5 mb-1.5">
             <span className="text-[9px] px-2 py-0.5 bg-slate-900 text-warning rounded font-black uppercase truncate max-w-[120px] shadow-sm">{projectName || '常规项目'}</span>
          </div>
          <h3 className={`font-black text-base leading-tight mb-1 truncate transition-colors ${isActive ? 'text-warning' : 'text-slate-800 group-hover:text-success'}`}>{task.title}</h3>
          <p className="text-[10px] text-slate-400 font-black uppercase tracking-wider">
            交付期限: {task.dueDate} {daysLeft >= 0 ? `(剩 ${daysLeft} 天)` : `(逾期 ${Math.abs(daysLeft)} 天)`}
          </p>
        </div>
        
        <div className="flex flex-col items-end gap-1.5 shrink-0">
           <div className={`flex gap-1.5 transition-opacity ${isActive ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}>
              <button onClick={(e) => { e.stopPropagation(); onEditTask(task); }} className="p-1.5 bg-slate-50 text-slate-400 hover:text-primary rounded-lg transition-colors border border-slate-100 shadow-sm"><svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15.232 5.232l3.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg></button>
              <button onClick={(e) => { e.stopPropagation(); onDeleteTask(task.id); }} className="p-1.5 bg-slate-50 text-slate-400 hover:text-danger rounded-lg transition-colors border border-slate-100 shadow-sm"><svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg></button>
           </div>
           <span className={`px-2.5 py-0.5 text-[9px] rounded-lg font-black tracking-widest uppercase shadow-sm
            ${computedStatus === 'normal' || computedStatus === 'completed' ? 'bg-green-50 text-success border border-success/20' : ''}
            ${computedStatus === 'risk' ? 'bg-yellow-50 text-yellow-700 border border-yellow-200' : ''}
            ${computedStatus === 'delayed' ? 'bg-red-50 text-red-700 border border-red-200' : ''}
           `}>
             {statusLabel}
           </span>
        </div>
      </div>

      <p className="text-[11px] text-slate-500 line-clamp-2 italic font-medium leading-relaxed mb-4 h-8 overflow-hidden">
        "{task.outcome}"
      </p>
      
      {/* 管理员/指挥官 展示区 */}
      <div className="mb-3 flex items-center gap-2">
         <span className="text-[8px] font-black text-warning bg-warning/10 px-2 py-0.5 rounded border border-warning/20 uppercase shrink-0">指挥官</span>
         <div className="flex flex-wrap gap-1">
            {managers.map(m => (
              <div key={`mgr-${m.id}`} className="flex items-center gap-1 bg-warning/20 border border-warning/40 px-1.5 py-0.5 rounded shadow-sm">
                 <img src={m.avatar} className="h-3 w-3 rounded-full object-cover" />
                 <span className="text-[9px] font-black text-slate-800">{m.name}</span>
              </div>
            ))}
            {managers.length === 0 && <span className="text-[9px] text-slate-300 italic font-black uppercase">未设定主负责人</span>}
         </div>
      </div>

      <div className="mb-4 flex items-center justify-between gap-3">
         <span className="text-[9px] font-black text-slate-400 bg-slate-50 px-2 py-0.5 rounded border border-slate-100 uppercase shrink-0">
            执行项达成: {executionTasksCompleted}/{executionTasksTotal}
         </span>
         <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden shadow-inner">
            <div className={`h-full ${computedStatus === 'delayed' ? 'bg-danger' : 'bg-slate-400'} rounded-full transition-all duration-500`} style={{ width: executionTasksTotal > 0 ? `${(executionTasksCompleted / executionTasksTotal) * 100}%` : '0%' }}></div>
         </div>
      </div>

      <div className="mb-4 bg-slate-50/50 p-3 rounded-2xl border border-slate-100/50">
        <ProgressBar progress={task.progress} status={computedStatus} height="h-3" showLabel={false} />
        <div className="flex justify-between mt-2 items-end">
          <span className={`text-sm font-black leading-none ${isActive ? 'text-warning' : 'text-slate-900'}`}>{task.progress}%</span>
          <span className="text-[9px] text-slate-300 tracking-widest font-black uppercase">综合达成率</span>
        </div>
      </div>

      <div className="flex flex-col gap-3 pt-4 border-t border-slate-100 mt-auto">
        <div className="flex flex-wrap gap-1.5">
          <span className="text-[8px] font-black text-slate-400 uppercase w-full mb-1">执行团队:</span>
          {nodeAssignees.map(m => (
            <div key={m.id} className="flex items-center gap-1.5 bg-slate-100 border border-slate-200 px-2.5 py-1 rounded-lg transition-all hover:bg-white hover:border-warning/40 shadow-sm">
               <img src={m.avatar} className="h-4 w-4 rounded-full object-cover" />
               <span className="text-[10px] font-black text-slate-700">{m.name}</span>
            </div>
          ))}
          {nodeAssignees.length === 0 && <span className="text-[10px] text-slate-300 italic font-black uppercase tracking-widest">暂未指派执行人员</span>}
        </div>
        <button 
          onClick={(e) => { e.stopPropagation(); onUpdateClick(task); }}
          className={`w-full text-[10px] py-2.5 rounded-xl font-black uppercase tracking-widest transition-all shadow-md
            ${isActive ? 'bg-warning text-slate-900' : 'bg-slate-900 text-white hover:bg-black'}
          `}
        >
          提交日报
        </button>
      </div>
    </div>
  );
};
