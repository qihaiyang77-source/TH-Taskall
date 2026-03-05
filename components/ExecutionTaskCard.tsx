
import React from 'react';
import { Task, Member, ExecutionTask } from '../types';
import { ProgressBar } from './ProgressBar';

interface ExecutionTaskCardProps {
  subTask: ExecutionTask;
  parentTask: Task;
  projectName?: string;
  allMembers: Member[];
  onUpdateClick: (subTask: ExecutionTask, parentTask: Task) => void;
  onDetailClick: (parentTask: Task) => void;
}

export const ExecutionTaskCard: React.FC<ExecutionTaskCardProps> = ({ 
  subTask, 
  parentTask, 
  projectName,
  allMembers,
  onUpdateClick,
  onDetailClick
}) => {
  const daysLeft = Math.ceil((new Date(parentTask.dueDate).getTime() - new Date().getTime()) / (1000 * 3600 * 24));
  
  let status: 'normal' | 'risk' | 'delayed' | 'completed' = 'normal';
  if (subTask.progress === 100) status = 'completed';
  else if (daysLeft < 0) status = 'delayed';
  else if (daysLeft <= 3 && subTask.progress < 80) status = 'risk';

  const assignees = allMembers.filter(m => (subTask.assigneeIds || []).includes(m.id));

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4 hover:shadow-lg hover:translate-y-[-2px] transition-all group flex flex-col h-full border-b-4 border-b-slate-100">
      <div className="flex justify-between items-start mb-3">
        <div className="flex-1 min-w-0 pr-2">
          <div className="flex flex-wrap items-center gap-1.5 mb-1.5">
             <span className="text-[8px] px-2 py-0.5 bg-slate-900 text-warning rounded font-black uppercase tracking-wider truncate max-w-[90px]">{projectName || '常规'}</span>
             <span className="text-[8px] px-2 py-0.5 bg-slate-100 text-slate-500 rounded font-black uppercase tracking-wider truncate max-w-[100px]">节点: {parentTask.title}</span>
          </div>
          <h3 className="font-black text-slate-800 text-xs leading-tight mb-1 group-hover:text-success transition-colors cursor-pointer truncate" onClick={() => onDetailClick(parentTask)} title={subTask.title}>{subTask.title}</h3>
          <p className="text-[9px] text-slate-400 font-black uppercase">截止日期: {parentTask.dueDate}</p>
        </div>
        
        <span className={`px-2 py-0.5 text-[8px] rounded-lg font-black tracking-widest uppercase shrink-0
          ${status === 'normal' ? 'bg-green-50 text-success border border-success/20' : ''}
          ${status === 'risk' ? 'bg-yellow-50 text-yellow-700 border border-yellow-200' : ''}
          ${status === 'delayed' ? 'bg-red-50 text-red-700 border border-red-200' : ''}
          ${status === 'completed' ? 'bg-green-50 text-success border border-success/20' : ''}
        `}>
          {status === 'completed' ? '达成' : (status === 'delayed' ? '延期' : '进行')}
        </span>
      </div>

      {subTask.outcome && (
        <p className="text-[10px] text-slate-500 italic font-medium mb-4 line-clamp-2 leading-tight bg-slate-50/80 p-2 rounded-xl border border-slate-100/50">
          "{subTask.outcome}"
        </p>
      )}

      <div className="mb-5 bg-slate-50 p-2.5 rounded-xl border border-slate-100/50 mt-auto">
        <ProgressBar progress={subTask.progress} status={status} height="h-2.5" showLabel={false} />
        <div className="flex justify-between mt-2 items-end">
           <span className="text-[10px] font-black text-slate-900 leading-none">{subTask.progress}%</span>
           <span className="text-[8px] font-black text-slate-300 uppercase tracking-widest">执行进度</span>
        </div>
      </div>

      <div className="flex flex-col gap-3 pt-3 border-t border-slate-100">
        <div className="flex flex-wrap gap-1.5">
          {assignees.map(m => (
            <div key={m.id} className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 px-2 py-0.5 rounded-lg shadow-sm">
               <img src={m.avatar} alt={m.name} className="h-3.5 w-3.5 rounded-full object-cover" />
               <span className="text-[10px] font-black text-slate-700">{m.name}</span>
            </div>
          ))}
          {assignees.length === 0 && <span className="text-[9px] text-slate-300 font-black italic uppercase tracking-widest">全员或待领用</span>}
        </div>
        <button 
          onClick={() => onUpdateClick(subTask, parentTask)}
          className="w-full bg-slate-900 text-white text-[9px] font-black uppercase tracking-widest py-2.5 rounded-xl hover:bg-black transition-all shadow-md"
        >
          进度维护
        </button>
      </div>
    </div>
  );
};
