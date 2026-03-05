
import React, { useState, useMemo } from 'react';
import { Project, ProjectStatus, Task, Member, Group } from '../types';

interface ProjectManagerProps {
  isOpen: boolean;
  onClose: () => void;
  projects: Project[];
  tasks: Task[];
  allMembers: Member[];
  groups: Group[]; // Added: need groups for categorization
  onAddProject: (project: Project) => void;
  onUpdateProject: (project: Project) => void;
  onDeleteProject: (projectId: string) => void;
}

export const ProjectManager: React.FC<ProjectManagerProps> = ({
  isOpen,
  onClose,
  projects,
  tasks,
  allMembers,
  groups,
  onAddProject,
  onUpdateProject,
  onDeleteProject
}) => {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<Partial<Project>>({});
  const [isAdding, setIsAdding] = useState(false);

  // 按分组对成员进行归类
  const membersByGroup = useMemo(() => {
    const map: Record<string, Member[]> = {};
    groups.forEach(g => map[g.id] = []);
    map['unassigned'] = [];

    allMembers.forEach(m => {
      if (m.groupId && map[m.groupId]) {
        map[m.groupId].push(m);
      } else {
        map['unassigned'].push(m);
      }
    });
    return map;
  }, [allMembers, groups]);

  if (!isOpen) return null;

  const resetForm = () => {
    setEditingId(null);
    setIsAdding(false);
    setFormData({});
  };

  const startAdd = () => {
    setIsAdding(true);
    setEditingId(null);
    setFormData({
      id: `p-${Date.now()}`,
      name: '',
      description: '',
      status: ProjectStatus.ACTIVE,
      startDate: new Date().toISOString().split('T')[0],
      endDate: '',
      memberIds: []
    });
  };

  const startEdit = (project: Project) => {
    setIsAdding(false);
    setEditingId(project.id);
    setFormData({ ...project, memberIds: project.memberIds || [] });
  };

  const toggleMember = (memberId: string) => {
    const currentIds = formData.memberIds || [];
    if (currentIds.includes(memberId)) {
      setFormData({ ...formData, memberIds: currentIds.filter(id => id !== memberId) });
    } else {
      setFormData({ ...formData, memberIds: [...currentIds, memberId] });
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name) return;
    const projectData = formData as Project;
    if (isAdding) {
      onAddProject(projectData);
    } else {
      onUpdateProject(projectData);
    }
    resetForm();
  };

  const handleDelete = (id: string) => {
    const count = tasks.filter(t => t.projectId === id).length;
    if (count > 0) {
      alert(`无法删除：该项目下包含 ${count} 个任务。请先转移或删除任务。`);
      return;
    }
    if (window.confirm('确定要删除这个项目吗？')) {
      onDeleteProject(id);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-4xl p-6 m-4 max-h-[95vh] flex flex-col">
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center space-x-2">
            <div className="p-2 bg-warning/10 text-warning rounded-lg">
               <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
               </svg>
            </div>
            <h2 className="text-xl font-bold text-slate-800">项目立项管理</h2>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {!isAdding && !editingId ? (
          <div className="flex-1 overflow-y-auto pr-2">
            <div className="flex justify-between items-center mb-4 sticky top-0 bg-white pb-2 z-10 border-b border-slate-50">
              <p className="text-sm text-slate-500">共 {projects.length} 个立项项目</p>
              <button 
                onClick={startAdd}
                className="bg-primary text-white px-4 py-2 rounded-lg hover:bg-blue-600 text-sm font-bold transition-colors flex items-center gap-2 shadow-md shadow-blue-500/20"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M12 4v16m8-8H4" /></svg>
                发起新项目
              </button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {projects.map(project => {
                const taskCount = tasks.filter(t => t.projectId === project.id).length;
                const projectMembers = allMembers.filter(m => (project.memberIds || []).includes(m.id));
                
                return (
                  <div key={project.id} className="border border-slate-100 rounded-xl p-4 hover:border-primary/30 transition-all bg-slate-50/50 flex flex-col h-full">
                    <div className="flex justify-between items-start mb-2">
                       <h3 className="font-bold text-slate-800 line-clamp-1">{project.name}</h3>
                       <div className="flex gap-1 shrink-0">
                          <button onClick={() => startEdit(project)} className="p-1 text-slate-400 hover:text-primary"><svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg></button>
                          <button onClick={() => handleDelete(project.id)} className="p-1 text-slate-400 hover:text-red-500"><svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg></button>
                       </div>
                    </div>
                    <p className="text-xs text-slate-500 line-clamp-2 mb-3 h-8">{project.description || '暂无项目描述'}</p>
                    
                    <div className="mb-4">
                       <div className="text-[10px] text-slate-400 font-bold uppercase mb-1 tracking-wider">项目组 ({projectMembers.length})</div>
                       <div className="flex -space-x-2 overflow-hidden">
                          {projectMembers.slice(0, 5).map(m => (
                            <img key={m.id} src={m.avatar} title={m.name} className="inline-block h-6 w-6 rounded-full ring-2 ring-white" alt={m.name} />
                          ))}
                          {projectMembers.length > 5 && (
                            <div className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-slate-200 text-[10px] font-bold text-slate-500 ring-2 ring-white">+{projectMembers.length - 5}</div>
                          )}
                       </div>
                    </div>

                    <div className="flex items-center justify-between mt-auto pt-3 border-t border-slate-100">
                       <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                         project.status === ProjectStatus.ACTIVE ? 'bg-green-100 text-green-700' : 'bg-slate-200 text-slate-600'
                       }`}>{project.status}</span>
                       <span className="text-[10px] text-slate-400 uppercase font-mono">{taskCount} 个任务</span>
                    </div>
                  </div>
                );
              })}
            </div>
            {projects.length === 0 && <div className="text-center py-20 text-slate-400 text-sm">暂无立项项目，请点击上方按钮新建。</div>}
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="animate-[fadeIn_0.2s_ease-out] flex flex-col gap-6 overflow-hidden">
             <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 overflow-y-auto pr-2 pb-4">
                <div className="space-y-4">
                  <div>
                    <h3 className="text-sm font-bold text-slate-800 mb-4 border-l-4 border-warning pl-3">基本信息</h3>
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">项目名称</label>
                        <input 
                          type="text"
                          value={formData.name || ''}
                          onChange={e => setFormData({...formData, name: e.target.value})}
                          placeholder="例如：2025 品牌升级计划"
                          className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary outline-none"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">项目愿景/目标</label>
                        <textarea 
                          value={formData.description || ''}
                          onChange={e => setFormData({...formData, description: e.target.value})}
                          placeholder="简述项目核心目标和交付价值..."
                          className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary outline-none h-24 resize-none"
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-slate-700 mb-1">启动日期</label>
                          <input 
                            type="date"
                            value={formData.startDate || ''}
                            onChange={e => setFormData({...formData, startDate: e.target.value})}
                            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary outline-none"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-slate-700 mb-1">交付日期</label>
                          <input 
                            type="date"
                            value={formData.endDate || ''}
                            onChange={e => setFormData({...formData, endDate: e.target.value})}
                            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary outline-none"
                          />
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">项目状态</label>
                        <select 
                          value={formData.status || ProjectStatus.ACTIVE}
                          onChange={e => setFormData({...formData, status: e.target.value as ProjectStatus})}
                          className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary outline-none bg-white"
                        >
                          {Object.values(ProjectStatus).map(s => <option key={s} value={s}>{s}</option>)}
                        </select>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col h-full">
                   <h3 className="text-sm font-bold text-slate-800 mb-4 border-l-4 border-primary pl-3">项目组人员 (按分组定位)</h3>
                   <div className="flex-1 border border-slate-100 rounded-xl p-4 bg-slate-50/30 overflow-y-auto space-y-6">
                      {groups.map(group => {
                        const members = membersByGroup[group.id] || [];
                        if (members.length === 0) return null;
                        return (
                          <div key={group.id}>
                             <div className="flex items-center gap-2 mb-3">
                                <div className="w-1 h-3 bg-warning rounded-full"></div>
                                <span className="text-[10px] font-black text-slate-800 uppercase tracking-widest">{group.name}</span>
                             </div>
                             <div className="grid grid-cols-2 gap-3">
                                {members.map(member => {
                                  const isSelected = (formData.memberIds || []).includes(member.id);
                                  return (
                                    <div 
                                      key={member.id} 
                                      onClick={() => toggleMember(member.id)}
                                      className={`flex items-center p-2 rounded-lg cursor-pointer border transition-all
                                        ${isSelected 
                                          ? 'bg-primary/10 border-primary shadow-sm' 
                                          : 'bg-white border-slate-100 hover:border-slate-300'}`}
                                    >
                                       <div className="relative">
                                          <img src={member.avatar} alt={member.name} className="w-8 h-8 rounded-full border border-slate-100" />
                                          {isSelected && (
                                            <div className="absolute -top-1 -right-1 bg-primary text-white rounded-full p-0.5 shadow-sm">
                                               <svg className="w-2 h-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={4}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                                            </div>
                                          )}
                                       </div>
                                       <div className="ml-2 overflow-hidden">
                                          <div className={`text-xs font-bold truncate ${isSelected ? 'text-primary' : 'text-slate-700'}`}>{member.name}</div>
                                          <div className="text-[10px] text-slate-400 truncate">{member.role}</div>
                                       </div>
                                    </div>
                                  );
                                })}
                             </div>
                          </div>
                        );
                      })}
                      
                      {membersByGroup['unassigned']?.length > 0 && (
                        <div>
                           <div className="flex items-center gap-2 mb-3">
                              <div className="w-1 h-3 bg-slate-400 rounded-full"></div>
                              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">未分配成员</span>
                           </div>
                           <div className="grid grid-cols-2 gap-3">
                              {membersByGroup['unassigned'].map(member => {
                                const isSelected = (formData.memberIds || []).includes(member.id);
                                return (
                                  <div 
                                    key={member.id} 
                                    onClick={() => toggleMember(member.id)}
                                    className={`flex items-center p-2 rounded-lg cursor-pointer border transition-all
                                      ${isSelected ? 'bg-primary/10 border-primary shadow-sm' : 'bg-white border-slate-100 hover:border-slate-300'}`}
                                  >
                                     <img src={member.avatar} alt={member.name} className="w-8 h-8 rounded-full border border-slate-100" />
                                     <div className="ml-2 overflow-hidden">
                                        <div className={`text-xs font-bold truncate ${isSelected ? 'text-primary' : 'text-slate-700'}`}>{member.name}</div>
                                        <div className="text-[10px] text-slate-400 truncate">{member.role}</div>
                                     </div>
                                  </div>
                                );
                              })}
                           </div>
                        </div>
                      )}
                      
                      {allMembers.length === 0 && <p className="text-center py-10 text-slate-400 text-xs italic">暂无可选成员，请先管理团队人员。</p>}
                   </div>
                   <div className="mt-3 text-[10px] text-slate-400 italic">
                      选中的成员将组成该项目的“临时项目组”，在筛选项目视图时可精准查看这些人员的进度。
                   </div>
                </div>
             </div>
             
             <div className="flex space-x-3 mt-2 border-t border-slate-100 pt-6">
               <button type="button" onClick={resetForm} className="flex-1 px-4 py-3 border border-slate-300 text-slate-700 rounded-xl font-bold hover:bg-slate-50 transition-all">放弃修改</button>
               <button type="submit" className="flex-1 px-4 py-3 bg-primary text-white rounded-xl font-bold hover:bg-blue-600 shadow-lg shadow-blue-500/30 transition-all">保存立项配置</button>
             </div>
          </form>
        )}
      </div>
    </div>
  );
};
