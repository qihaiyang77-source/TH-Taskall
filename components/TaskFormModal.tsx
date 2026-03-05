
import React, { useState, useEffect, useMemo } from 'react';
import { Task, Member, Project, Group } from '../types';

interface TaskFormModalProps {
  task?: Task | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (task: Partial<Task>) => void;
  members: Member[];
  groups: Group[];
  projects: Project[];
  currentProjectId?: string;
}

export const TaskFormModal: React.FC<TaskFormModalProps> = ({ 
  task, 
  isOpen, 
  onClose, 
  onSave, 
  members,
  groups,
  projects,
  currentProjectId
}) => {
  const [formData, setFormData] = useState<Partial<Task>>({
    title: '',
    outcome: '',
    projectId: '',
    assigneeIds: [],
    managerIds: [],
    startDate: new Date().toISOString().split('T')[0],
    dueDate: new Date().toISOString().split('T')[0],
    progress: 0,
    logs: [],
    executionTasks: []
  });

  const selectedProject = useMemo(() => {
    return projects.find(p => p.id === formData.projectId) || null;
  }, [formData.projectId, projects]);

  useEffect(() => {
    if (selectedProject) {
      setFormData(prev => {
        let newStart = prev.startDate || '';
        let newDue = prev.dueDate || '';
        
        if (newStart < selectedProject.startDate) newStart = selectedProject.startDate;
        if (selectedProject.endDate && newStart > selectedProject.endDate) newStart = selectedProject.endDate;
        
        if (newDue < newStart) newDue = newStart;
        if (selectedProject.endDate && newDue > selectedProject.endDate) newDue = selectedProject.endDate;
        
        return { ...prev, startDate: newStart, dueDate: newDue };
      });
    }
  }, [formData.projectId, selectedProject]);

  const availableMembersByGroup = useMemo(() => {
    const memberPool = (selectedProject && selectedProject.memberIds && selectedProject.memberIds.length > 0)
      ? members.filter(m => selectedProject.memberIds.includes(m.id))
      : [];
    
    const map: Record<string, Member[]> = {};
    groups.forEach(g => map[g.id] = []);
    map['unassigned'] = [];

    memberPool.forEach(m => {
      if (m.groupId && map[m.groupId]) {
        map[m.groupId].push(m);
      } else {
        map['unassigned'].push(m);
      }
    });
    return map;
  }, [selectedProject, members, groups]);

  useEffect(() => {
    if (task) {
      setFormData({ 
        ...task, 
        assigneeIds: task.assigneeIds || [],
        managerIds: task.managerIds || []
      });
    } else if (isOpen) {
      let defaultProject = (currentProjectId && currentProjectId !== 'all') ? currentProjectId : (projects[0]?.id || 'default_project');
      const proj = projects.find(p => p.id === defaultProject);
      
      setFormData({
        id: Date.now().toString(),
        title: '',
        outcome: '',
        projectId: defaultProject,
        assigneeIds: [],
        managerIds: [],
        startDate: proj?.startDate || new Date().toISOString().split('T')[0],
        dueDate: proj?.endDate || proj?.startDate || new Date().toISOString().split('T')[0],
        progress: 0,
        logs: [],
        executionTasks: []
      });
    }
  }, [task, isOpen, projects, currentProjectId]);

  if (!isOpen) return null;

  const toggleAssignee = (id: string) => {
    const current = formData.assigneeIds || [];
    if (current.includes(id)) {
      setFormData({ ...formData, assigneeIds: current.filter(x => x !== id) });
    } else {
      setFormData({ ...formData, assigneeIds: [...current, id] });
    }
  };

  const toggleManager = (id: string) => {
    const current = formData.managerIds || [];
    if (current.includes(id)) {
      setFormData({ ...formData, managerIds: current.filter(x => x !== id) });
    } else {
      setFormData({ ...formData, managerIds: [...current, id] });
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.managerIds || formData.managerIds.length === 0) {
      alert('请至少指派一名作战指挥官（负责人）');
      return;
    }

    if (formData.startDate && formData.dueDate && formData.startDate > formData.dueDate) {
      alert('节点启动日期不能晚于交付日期');
      return;
    }

    if (selectedProject) {
      if (formData.startDate && formData.startDate < selectedProject.startDate) {
        alert(`节点时间非法：不能早于项目启动时间 (${selectedProject.startDate})`);
        return;
      }
      if (selectedProject.endDate && formData.dueDate && formData.dueDate > selectedProject.endDate) {
        alert(`节点时间非法：不能晚于项目交付时间 (${selectedProject.endDate})`);
        return;
      }
    }

    onSave(formData);
    onClose();
  };

  const hasAnyMembers = (Object.values(availableMembersByGroup) as Member[][]).some(arr => arr.length > 0);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-xl p-6 m-4 animate-[fadeIn_0.2s_ease-out] overflow-y-auto max-h-[90vh] scrollbar-hide">
        <h2 className="text-xl font-bold text-slate-800 mb-6 border-l-4 border-warning pl-4">{task ? '编辑作战节点' : '定义核心作战节点'}</h2>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-xs font-black text-slate-400 mb-1.5 uppercase tracking-widest">节点名称</label>
            <input 
              type="text" 
              value={formData.title} 
              onChange={e => setFormData({...formData, title: e.target.value})}
              placeholder="例如：核心数据库迁移..."
              className="w-full px-4 py-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-warning outline-none font-bold text-slate-700 shadow-sm"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-black text-slate-400 mb-1.5 uppercase tracking-widest">交付目标愿景</label>
            <textarea 
              value={formData.outcome} 
              onChange={e => setFormData({...formData, outcome: e.target.value})}
              placeholder="请描述该节点的具体交付物或预期达成效果..."
              className="w-full px-4 py-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-warning outline-none font-bold text-slate-700 h-24 resize-none shadow-sm"
              required
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-black text-slate-400 mb-1.5 uppercase tracking-widest">所属立项项目</label>
              <select 
                value={formData.projectId} 
                onChange={e => setFormData({...formData, projectId: e.target.value, assigneeIds: [], managerIds: []})}
                className="w-full px-4 py-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-warning outline-none bg-white font-bold text-slate-700 shadow-sm"
                required
              >
                {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
            </div>
             <div className="flex flex-col justify-center">
              {selectedProject && (
                <div className="flex items-center gap-2 px-3 py-2 bg-slate-50 rounded-xl border border-slate-100">
                    <div className="w-1.5 h-1.5 rounded-full bg-warning animate-pulse"></div>
                    <span className="text-[9px] text-slate-500 font-bold uppercase tracking-widest leading-none">
                      项目窗口: <span className="text-warning">{selectedProject.startDate}</span> ~ <span className="text-warning">{selectedProject.endDate || '无'}</span>
                    </span>
                </div>
              )}
            </div>
          </div>

          {/* 管理负责人选择：金黄色高亮，代表核心管理权 */}
          <div>
            <label className="flex items-center justify-between mb-2">
               <span className="text-xs font-black text-warning uppercase tracking-widest">作战节点指挥官 (管理负责人)</span>
               <span className="text-[8px] font-black text-slate-400 uppercase">拥有日志查看与最高管理权</span>
            </label>
            <div className="border-2 border-warning/20 rounded-xl p-4 bg-warning/5 max-h-40 overflow-y-auto space-y-4 scrollbar-hide">
               {hasAnyMembers ? (
                 <>
                   {groups.map(group => {
                     const groupMembers = availableMembersByGroup[group.id] || [];
                     if (groupMembers.length === 0) return null;
                     return (
                       <div key={`mgr-${group.id}`}>
                          <div className="text-[9px] font-black text-warning/60 uppercase tracking-widest mb-1.5 px-1">{group.name}</div>
                          <div className="grid grid-cols-2 gap-2">
                             {groupMembers.map(m => (
                               <div 
                                 key={`mgr-${m.id}`} 
                                 onClick={() => toggleManager(m.id)}
                                 className={`flex items-center gap-2 p-1.5 rounded-lg cursor-pointer border-2 transition-all ${
                                   formData.managerIds?.includes(m.id) 
                                   ? 'bg-warning border-warning shadow-lg text-slate-900 scale-[1.02]' 
                                   : 'bg-white border-slate-100 hover:border-warning/30 text-slate-400'
                                 }`}
                               >
                                  <img src={m.avatar} className={`w-5 h-5 rounded-full border ${formData.managerIds?.includes(m.id) ? 'border-white' : 'border-slate-100'}`} />
                                  <span className="text-[10px] font-black truncate">{m.name}</span>
                               </div>
                             ))}
                          </div>
                       </div>
                     );
                   })}
                 </>
               ) : (
                 <p className="text-center py-4 text-[10px] text-slate-400 italic font-black uppercase tracking-widest">请先在立项管理中分配项目成员</p>
               )}
            </div>
          </div>

          <div>
            <label className="block text-xs font-black text-slate-400 mb-2 uppercase tracking-widest">执行团队成员</label>
            <div className="border border-slate-200 rounded-xl p-4 bg-slate-50/50 max-h-40 overflow-y-auto space-y-4 scrollbar-hide">
               {hasAnyMembers ? (
                 <>
                   {groups.map(group => {
                     const groupMembers = availableMembersByGroup[group.id] || [];
                     if (groupMembers.length === 0) return null;
                     return (
                       <div key={`assign-${group.id}`}>
                          <div className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1.5 px-1">{group.name}</div>
                          <div className="grid grid-cols-2 gap-2">
                             {groupMembers.map(m => (
                               <div 
                                 key={`assign-${m.id}`} 
                                 onClick={() => toggleAssignee(m.id)}
                                 className={`flex items-center gap-2 p-1.5 rounded-lg cursor-pointer border transition-all ${
                                   formData.assigneeIds?.includes(m.id) 
                                   ? 'bg-slate-900 border-slate-900 shadow-md text-white' 
                                   : 'bg-white border-slate-100 hover:border-slate-300 text-slate-400'
                                 }`}
                               >
                                  <img src={m.avatar} className="w-5 h-5 rounded-full" />
                                  <span className="text-[10px] font-black truncate">{m.name}</span>
                               </div>
                             ))}
                          </div>
                       </div>
                     );
                   })}
                 </>
               ) : (
                 <p className="text-center py-4 text-[10px] text-slate-400 italic font-black uppercase tracking-widest">请先在立项管理中分配项目成员</p>
               )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-black text-slate-400 mb-1.5 uppercase tracking-widest">节点启动</label>
              <input 
                type="date" 
                value={formData.startDate} 
                min={selectedProject?.startDate}
                max={selectedProject?.endDate || undefined}
                onChange={e => setFormData({...formData, startDate: e.target.value})} 
                className="w-full px-4 py-2 border border-slate-300 rounded-xl outline-none font-bold text-slate-700 focus:ring-2 focus:ring-warning shadow-sm" 
                required 
              />
            </div>
            <div>
              <label className="block text-xs font-black text-slate-400 mb-1.5 uppercase tracking-widest">最终交付</label>
              <input 
                type="date" 
                value={formData.dueDate} 
                min={formData.startDate || selectedProject?.startDate}
                max={selectedProject?.endDate || undefined}
                onChange={e => setFormData({...formData, dueDate: e.target.value})} 
                className="w-full px-4 py-2 border border-slate-300 rounded-xl outline-none font-bold text-slate-700 focus:ring-2 focus:ring-warning shadow-sm" 
                required 
              />
            </div>
          </div>

          <div className="flex space-x-3 mt-4 pt-4 border-t border-slate-100">
            <button type="button" onClick={onClose} className="flex-1 px-4 py-3 border border-slate-300 text-slate-500 rounded-xl font-black text-xs uppercase tracking-widest hover:bg-slate-50 transition-all">取消</button>
            <button type="submit" className="flex-1 px-4 py-3 bg-slate-900 text-white rounded-xl font-black text-xs uppercase tracking-widest hover:bg-black shadow-2xl transition-all">确认部署节点</button>
          </div>
        </form>
      </div>
    </div>
  );
};
