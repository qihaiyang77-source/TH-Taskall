
import React, { useState } from 'react';
import { Task, Member, Group, User, UserRole, ExecutionTask } from '../types';
import { ProgressBar } from './ProgressBar';

interface TaskDetailModalProps {
  task: Task | null;
  allMembers: Member[];
  groups: Group[]; 
  isOpen: boolean;
  currentUser: User | null;
  onClose: () => void;
  onAddExecutionTask: (taskId: string, title: string, outcome: string, assigneeIds: string[], startDate: string, dueDate: string, visibleToIds?: string[]) => void;
  onUpdateExecutionTask: (taskId: string, executionTaskId: string, updates: Partial<ExecutionTask>) => void;
  onUpdateExecutionTaskProgress: (taskId: string, executionTaskId: string, newProgress: number) => void;
  onToggleExecutionTask: (taskId: string, executionTaskId: string) => void;
  onDeleteExecutionTask: (taskId: string, executionTaskId: string) => void;
}

export const TaskDetailModal: React.FC<TaskDetailModalProps> = ({
  task,
  allMembers,
  isOpen,
  currentUser,
  onClose,
  onAddExecutionTask,
  onUpdateExecutionTask,
  onUpdateExecutionTaskProgress,
  onToggleExecutionTask,
  onDeleteExecutionTask
}) => {
  const [newTitle, setNewTitle] = useState('');
  const [newOutcome, setNewOutcome] = useState('');
  const [selectedAssignees, setSelectedAssignees] = useState<string[]>([]);
  const [visibleToIds, setVisibleToIds] = useState<string[]>([]);
  const [subStartDate, setSubStartDate] = useState('');
  const [subDueDate, setSubDueDate] = useState('');
  const [activeTab, setActiveTab] = useState<'plan' | 'logs'>('plan');
  const [isAdding, setIsAdding] = useState(false);
  const [editingETId, setEditingETId] = useState<string | null>(null);

  if (!isOpen || !task) return null;

  const handleStartAdding = () => {
    setSubStartDate(task.startDate);
    setSubDueDate(task.dueDate);
    setNewOutcome('');
    setNewTitle('');
    setSelectedAssignees([]);
    setVisibleToIds([]);
    setEditingETId(null);
    setIsAdding(true);
  };

  const handleEdit = (et: ExecutionTask) => {
    setEditingETId(et.id);
    setNewTitle(et.title);
    setNewOutcome(et.outcome || '');
    setSelectedAssignees(et.assigneeIds || []);
    setVisibleToIds(et.visibleToIds || []);
    setSubStartDate(et.startDate);
    setSubDueDate(et.dueDate);
    setIsAdding(true);
  };

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !newOutcome.trim()) {
      alert('任务标题和交付愿景均为必填项');
      return;
    }

    if (subStartDate > subDueDate) {
      alert('子任务启动日期不能晚于截止日期');
      return;
    }

    if (subStartDate < task.startDate || subDueDate > task.dueDate) {
        alert(`执行项时间越界：必须在父节点范围 (${task.startDate} ~ ${task.dueDate}) 内`);
        return;
    }

    if (editingETId) {
      onUpdateExecutionTask(task.id, editingETId, {
        title: newTitle,
        outcome: newOutcome,
        assigneeIds: selectedAssignees,
        startDate: subStartDate,
        dueDate: subDueDate,
        visibleToIds: visibleToIds.length > 0 ? visibleToIds : []
      });
    } else {
      onAddExecutionTask(task.id, newTitle, newOutcome, selectedAssignees, subStartDate, subDueDate, visibleToIds.length > 0 ? visibleToIds : undefined);
    }
    
    setNewTitle('');
    setNewOutcome('');
    setSelectedAssignees([]);
    setVisibleToIds([]);
    setIsAdding(false);
    setEditingETId(null);
  };

  const toggleSelectedAssignee = (id: string) => {
    setSelectedAssignees(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  const toggleVisibleTo = (id: string) => {
    setVisibleToIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  const isAdmin = currentUser?.role === UserRole.ADMIN;

  const filteredExecutionTasks = (task.executionTasks || []).filter(et => {
    if (isAdmin) return true;
    if (!et.visibleToIds || et.visibleToIds.length === 0) return true;
    return currentUser?.memberId && et.visibleToIds.includes(currentUser.memberId);
  });

  const totalCount = task.executionTasks?.length || 0;
  const aggregatePercentage = totalCount > 0 
    ? Math.round((task.executionTasks?.reduce((acc, curr) => acc + (curr.progress || 0), 0) || 0) / totalCount)
    : task.progress;

  const managers = allMembers.filter(m => (task.managerIds || []).includes(m.id));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-2xl p-8 m-4 animate-[fadeIn_0.2s_ease-out] flex flex-col max-h-[90vh] scrollbar-hide">
        
        <div className="flex justify-between items-start mb-6">
          <div className="flex-1">
            <div className="flex flex-wrap items-center gap-2 mb-2">
               <span className="text-[10px] px-3 py-1 bg-slate-900 text-warning rounded-full font-black uppercase tracking-widest shadow-sm">作战指挥 · 执行穿透</span>
               <div className="flex items-center gap-1 bg-warning/10 border border-warning/20 px-2 py-1 rounded-full">
                  <span className="text-[9px] font-black text-warning uppercase">指挥官:</span>
                  <div className="flex -space-x-1.5">
                    {managers.map(m => (
                      <img key={m.id} src={m.avatar} title={m.name} className="h-4 w-4 rounded-full border border-white shadow-sm" />
                    ))}
                  </div>
               </div>
            </div>
            <h2 className="text-2xl font-black text-slate-800 tracking-tight">{task.title}</h2>
            <div className="flex items-center space-x-8 mt-6 border-b border-slate-100 w-full">
               <button onClick={() => setActiveTab('plan')} className={`text-xs font-black uppercase tracking-widest pb-4 border-b-4 transition-colors ${activeTab === 'plan' ? 'border-success text-slate-800' : 'border-transparent text-slate-400 hover:text-slate-600'}`}>执行项分解 ({totalCount})</button>
               <button onClick={() => setActiveTab('logs')} className={`text-xs font-black uppercase tracking-widest pb-4 border-b-4 transition-colors ${activeTab === 'logs' ? 'border-success text-slate-800' : 'border-transparent text-slate-400 hover:text-slate-600'}`}>交付日志归档 ({task.logs?.length || 0})</button>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 p-2 bg-slate-50 rounded-full transition-all shrink-0">
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>

        <div className="bg-slate-50 p-6 rounded-[2rem] border border-slate-100 mb-6 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-2 h-full bg-warning"></div>
          <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">父节点作战窗口约束</h3>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-slate-700">
             <span className="text-xs font-black bg-white px-3 py-1.5 rounded-xl border border-slate-200 shadow-sm">{task.startDate} 至 {task.dueDate}</span>
             <div className="flex items-center gap-4">
               <span className="text-[10px] font-black text-slate-500 uppercase">综合进度 {aggregatePercentage}%</span>
               <div className="w-40"><ProgressBar progress={aggregatePercentage} height="h-2.5" showLabel={false} /></div>
             </div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto min-h-0 pr-2 scrollbar-hide">
           {activeTab === 'plan' && (
             <div className="space-y-6">
               <div className="space-y-5 mb-4">
                 {filteredExecutionTasks.map(et => {
                    const assignees = allMembers.filter(m => (et.assigneeIds || []).includes(m.id));
                    const visibleMembers = allMembers.filter(m => (et.visibleToIds || []).includes(m.id));
                    return (
                      <div key={et.id} className="group flex flex-col p-5 border border-slate-100 rounded-[1.5rem] hover:bg-slate-50 transition-all shadow-sm bg-white hover:border-success/30">
                         <div className="flex justify-between items-start mb-2">
                           <div className="flex items-center gap-4">
                             <input 
                               type="checkbox" 
                               checked={et.isCompleted} 
                               onChange={() => onToggleExecutionTask(task.id, et.id)}
                               className="w-5 h-5 rounded-lg border-slate-300 text-success focus:ring-success cursor-pointer"
                             />
                             <div className="flex flex-col">
                                <div className="flex items-center gap-2">
                                  <h4 className={`text-base font-black ${et.isCompleted ? 'text-slate-400 line-through' : 'text-slate-800'}`}>{et.title}</h4>
                                  {et.visibleToIds && et.visibleToIds.length > 0 && (
                                    <span className="text-[8px] px-1.5 py-0.5 bg-amber-100 text-amber-700 rounded font-black uppercase tracking-tighter">私密</span>
                                  )}
                                </div>
                                {et.outcome && (
                                  <p className="text-[11px] text-slate-400 italic font-medium mt-1 leading-tight">交付愿景: "{et.outcome}"</p>
                                )}
                             </div>
                           </div>
                            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all">
                              {isAdmin && (
                                <button onClick={() => handleEdit(et)} className="text-slate-300 hover:text-success p-1.5" title="修改配置">
                                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                                </button>
                              )}
                              <button onClick={() => onDeleteExecutionTask(task.id, et.id)} className="text-slate-300 hover:text-danger p-1.5" title="删除执行项">
                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                              </button>
                            </div>
                         </div>
                         <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mt-4 pt-4 border-t border-slate-50">
                            <div className="flex flex-col gap-2.5">
                               <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                                  执行窗口: {et.startDate} ~ {et.dueDate}
                               </div>
                               <div className="flex flex-wrap gap-2">
                                  {assignees.map(m => (
                                    <div key={m.id} className="flex items-center gap-2 bg-slate-100 border border-slate-200 px-3 py-1 rounded-xl shadow-sm">
                                       <img src={m.avatar} className="h-4 w-4 rounded-full" />
                                       <span className="text-[11px] font-black text-slate-700">{m.name}</span>
                                    </div>
                                  ))}
                                  {assignees.length === 0 && <span className="text-[10px] text-slate-300 font-black uppercase italic tracking-widest">待领用/全员</span>}
                               </div>
                               {et.visibleToIds && et.visibleToIds.length > 0 && (
                                 <div className="flex items-center gap-2 mt-1">
                                    <span className="text-[8px] font-black text-amber-500 uppercase tracking-widest">仅限可见:</span>
                                    <div className="flex -space-x-1">
                                      {visibleMembers.map(m => (
                                        <img key={m.id} src={m.avatar} title={m.name} className="h-3.5 w-3.5 rounded-full border border-white shadow-sm" />
                                      ))}
                                    </div>
                                 </div>
                               )}
                            </div>
                            <div className="w-full sm:w-auto flex flex-col items-end gap-2">
                               <div className="flex items-center gap-2">
                                  <span className="text-xs font-black text-success uppercase">{et.progress || 0}% 达成率</span>
                               </div>
                               <input type="range" min="0" max="100" step="5" value={et.progress || 0} onChange={(e) => onUpdateExecutionTaskProgress(task.id, et.id, parseInt(e.target.value))} className="w-32 h-1.5 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-success" />
                            </div>
                         </div>
                      </div>
                    );
                 })}
                 
                 {filteredExecutionTasks.length === 0 && (
                    <div className="text-center py-20 text-slate-400 text-[11px] font-black uppercase tracking-[0.2em] border-2 border-dashed border-slate-100 rounded-[2rem] bg-slate-50/50">
                      尚未进行执行项分解或无权查看
                    </div>
                 )}
               </div>

               {!isAdding ? (
                 <button onClick={handleStartAdding} className="w-full py-6 border-2 border-dashed border-slate-200 rounded-[2rem] text-slate-400 hover:text-success hover:border-success/50 transition-all flex items-center justify-center gap-3 text-xs font-black uppercase tracking-widest group shadow-sm">
                    <div className="p-1.5 bg-slate-100 rounded-lg group-hover:bg-success group-hover:text-white transition-all shadow-sm">
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" /></svg>
                    </div>
                    分解新的作战执行项
                 </button>
               ) : (
                 <div className="bg-slate-50 p-6 rounded-[2rem] border border-slate-200 animate-[fadeIn_0.2s_ease-out] space-y-5 shadow-inner">
                    <div>
                       <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">执行项名称</label>
                       <input autoFocus type="text" value={newTitle} onChange={e => setNewTitle(e.target.value)} placeholder="请定义具体的交付动作..." className="w-full px-5 py-3 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-success outline-none text-sm font-black text-slate-700 shadow-sm" />
                    </div>

                    <div>
                       <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">预期产出愿景</label>
                       <textarea value={newOutcome} onChange={e => setNewOutcome(e.target.value)} placeholder="完成后该如何衡量其价值？" className="w-full px-5 py-3 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-success outline-none text-xs font-bold text-slate-600 shadow-sm h-20 resize-none" />
                    </div>
                    
                    <div className="grid grid-cols-2 gap-5">
                       <div>
                          <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">启动 (最小 {task.startDate})</label>
                          <input type="date" value={subStartDate} min={task.startDate} max={task.dueDate} onChange={e => setSubStartDate(e.target.value)} className="w-full px-4 py-2 border border-slate-200 rounded-xl text-xs font-black outline-none focus:ring-1 focus:ring-success" />
                       </div>
                       <div>
                          <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">交付 (最大 {task.dueDate})</label>
                          <input type="date" value={subDueDate} min={subStartDate || task.startDate} max={task.dueDate} onChange={e => setSubDueDate(e.target.value)} className="w-full px-4 py-2 border border-slate-200 rounded-xl text-xs font-black outline-none focus:ring-1 focus:ring-success" />
                       </div>
                    </div>

                    <div>
                       <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">责任人员指派 (从节点团队中选择)</label>
                       <div className="flex flex-wrap gap-3 max-h-40 overflow-y-auto pr-2 scrollbar-hide">
                          {allMembers.filter(m => (task.assigneeIds || []).includes(m.id)).map(m => (
                            <div key={m.id} onClick={() => toggleSelectedAssignee(m.id)} className={`flex items-center gap-3 px-4 py-2 rounded-2xl cursor-pointer border-2 transition-all ${selectedAssignees.includes(m.id) ? 'bg-success/10 border-success shadow-md text-slate-900' : 'bg-white border-slate-100 hover:border-slate-300 text-slate-500'}`}>
                               <img src={m.avatar} className="w-5 h-5 rounded-full" />
                               <span className="text-[11px] font-black">{m.name}</span>
                            </div>
                          ))}
                       </div>
                    </div>

                    {isAdmin && (
                      <div>
                        <label className="block text-[10px] font-black text-amber-500 uppercase tracking-widest mb-3">指定可见人员 (默认全员可见，指定后仅限指定人员)</label>
                        <div className="flex flex-wrap gap-3 max-h-40 overflow-y-auto pr-2 scrollbar-hide">
                            {allMembers.map(m => (
                              <div key={m.id} onClick={() => toggleVisibleTo(m.id)} className={`flex items-center gap-3 px-4 py-2 rounded-2xl cursor-pointer border-2 transition-all ${visibleToIds.includes(m.id) ? 'bg-amber-50 border-amber-500 shadow-md text-slate-900' : 'bg-white border-slate-100 hover:border-slate-300 text-slate-500'}`}>
                                  <img src={m.avatar} className="w-5 h-5 rounded-full" />
                                  <span className="text-[11px] font-black">{m.name}</span>
                              </div>
                            ))}
                        </div>
                      </div>
                    )}

                    <div className="flex gap-4 pt-4 border-t border-slate-200">
                       <button onClick={() => { setIsAdding(false); setEditingETId(null); }} className="flex-1 py-3 px-6 bg-white border border-slate-300 text-slate-400 rounded-2xl text-[10px] font-black uppercase hover:bg-slate-100 transition-all">放弃</button>
                       <button onClick={handleAdd} disabled={!newTitle.trim() || !newOutcome.trim()} className="flex-1 py-3 px-6 bg-slate-900 text-white rounded-2xl text-[10px] font-black uppercase hover:bg-black disabled:opacity-50 transition-all shadow-xl">
                         {editingETId ? '更新指令' : '下达指令'}
                       </button>
                    </div>
                 </div>
               )}
             </div>
           )}

           {activeTab === 'logs' && (
             <div className="space-y-6 pt-4">
                {([...(task.logs || [])] as any[]).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).map(log => (
                  <div key={log.id} className="flex gap-6 group">
                     <div className="flex flex-col items-center">
                        <div className="w-3 h-3 rounded-full bg-slate-200 group-hover:bg-warning transition-colors mt-2 ring-4 ring-white"></div>
                        <div className="w-0.5 flex-1 bg-slate-100 my-2"></div>
                     </div>
                     <div className="flex-1 pb-8">
                        <div className="flex items-center justify-between mb-2">
                           <span className="text-[10px] text-slate-400 font-black tracking-widest uppercase">{new Date(log.date).toLocaleString()}</span>
                           <span className="text-[10px] font-black text-warning bg-warning/10 px-3 py-1 rounded-full border border-warning/20 uppercase tracking-widest shadow-sm">进度快照 {log.progressSnapshot}%</span>
                        </div>
                        <div className="text-sm text-slate-600 font-bold leading-relaxed bg-slate-50/80 p-5 rounded-[1.5rem] border border-slate-100 italic shadow-sm">"{log.note}"</div>
                     </div>
                  </div>
                ))}
                {((task.logs || []) as any[]).length === 0 && <div className="text-center py-20 text-slate-400 text-[11px] font-black uppercase tracking-widest italic border-2 border-dashed border-slate-100 rounded-[2rem]">暂无相关交付动态存档</div>}
             </div>
           )}
        </div>
      </div>
    </div>
  );
};
