import React, { useState } from 'react';
import { Cycle, CycleStatus, Task } from '../types';

interface CycleManagerProps {
  isOpen: boolean;
  onClose: () => void;
  cycles: Cycle[];
  tasks: Task[];
  onAddCycle: (cycle: Cycle) => void;
  onUpdateCycle: (cycle: Cycle) => void;
  onDeleteCycle: (cycleId: string) => void;
}

export const CycleManager: React.FC<CycleManagerProps> = ({
  isOpen,
  onClose,
  cycles,
  tasks,
  onAddCycle,
  onUpdateCycle,
  onDeleteCycle
}) => {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<Partial<Cycle>>({});
  const [isAdding, setIsAdding] = useState(false);

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
      id: `c-${Date.now()}`,
      name: '',
      startDate: new Date().toISOString().split('T')[0],
      endDate: '',
      status: CycleStatus.ACTIVE
    });
  };

  const startEdit = (cycle: Cycle) => {
    setIsAdding(false);
    setEditingId(cycle.id);
    setFormData({ ...cycle });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name) return;

    const cycleData = formData as Cycle;
    if (isAdding) {
      onAddCycle(cycleData);
    } else {
      onUpdateCycle(cycleData);
    }
    resetForm();
  };

  const handleDelete = (id: string) => {
    // Check if tasks exist in this cycle
    const count = tasks.filter(t => t.cycleId === id).length;
    if (count > 0) {
      alert(`无法删除：该周期下包含 ${count} 个任务。请先将任务转移到其他周期或删除任务。`);
      return;
    }
    if (window.confirm('确定要删除这个周期吗？')) {
      onDeleteCycle(id);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl p-6 m-4 max-h-[90vh] flex flex-col">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold text-slate-800">周期与迭代管理</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {!isAdding && !editingId ? (
          <div className="flex-1 overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
               <p className="text-sm text-slate-500">共 {cycles.length} 个周期</p>
               <button 
                 onClick={startAdd}
                 className="bg-slate-800 text-white px-3 py-1.5 rounded-lg hover:bg-slate-700 text-sm font-medium transition-colors"
               >
                 + 新建周期
               </button>
            </div>
            
            <div className="space-y-3">
              {[...cycles].sort((a, b) => (b.startDate || '').localeCompare(a.startDate || '')).map(cycle => {
                const taskCount = tasks.filter(t => t.cycleId === cycle.id).length;
                return (
                  <div key={cycle.id} className="border border-slate-100 rounded-xl p-4 hover:bg-slate-50 transition-colors">
                     <div className="flex justify-between items-start">
                        <div>
                           <div className="flex items-center gap-2 mb-1">
                             <h3 className="font-bold text-slate-800">{cycle.name}</h3>
                             <span className={`text-xs px-2 py-0.5 rounded-full ${
                               cycle.status === CycleStatus.ACTIVE ? 'bg-green-100 text-green-700' : 
                               cycle.status === CycleStatus.COMPLETED ? 'bg-slate-100 text-slate-500' : 'bg-blue-50 text-blue-600'
                             }`}>
                               {cycle.status}
                             </span>
                           </div>
                           <div className="text-xs text-slate-500 flex gap-3">
                             {cycle.startDate && <span>开始: {cycle.startDate}</span>}
                             {cycle.endDate && <span>结束: {cycle.endDate}</span>}
                             <span>· {taskCount} 个任务</span>
                           </div>
                        </div>
                        <div className="flex gap-2">
                           <button onClick={() => startEdit(cycle)} className="p-1.5 text-slate-400 hover:text-primary rounded hover:bg-white">
                             <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                               <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                             </svg>
                           </button>
                           <button onClick={() => handleDelete(cycle.id)} className="p-1.5 text-slate-400 hover:text-red-500 rounded hover:bg-white">
                             <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                               <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                             </svg>
                           </button>
                        </div>
                     </div>
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="animate-[fadeIn_0.2s_ease-out]">
             <h3 className="text-lg font-semibold text-slate-700 mb-4">{isAdding ? '新建周期' : '编辑周期'}</h3>
             <div className="space-y-4">
                <div>
                   <label className="block text-sm font-medium text-slate-700 mb-1">周期名称</label>
                   <input 
                     type="text"
                     value={formData.name || ''}
                     onChange={e => setFormData({...formData, name: e.target.value})}
                     placeholder="e.g. Sprint 24, 2024-Q3"
                     className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary outline-none"
                     required
                   />
                </div>
                <div className="grid grid-cols-2 gap-4">
                   <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">开始日期</label>
                      <input 
                        type="date"
                        value={formData.startDate || ''}
                        onChange={e => setFormData({...formData, startDate: e.target.value})}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary outline-none"
                      />
                   </div>
                   <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">结束日期 (可选)</label>
                      <input 
                        type="date"
                        value={formData.endDate || ''}
                        onChange={e => setFormData({...formData, endDate: e.target.value})}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary outline-none"
                      />
                   </div>
                </div>
                <div>
                   <label className="block text-sm font-medium text-slate-700 mb-1">状态</label>
                   <select 
                     value={formData.status || CycleStatus.ACTIVE}
                     onChange={e => setFormData({...formData, status: e.target.value as CycleStatus})}
                     className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary outline-none bg-white"
                   >
                     {Object.values(CycleStatus).map(s => (
                       <option key={s} value={s}>{s}</option>
                     ))}
                   </select>
                </div>
             </div>
             <div className="flex space-x-3 mt-6">
               <button 
                 type="button" 
                 onClick={resetForm}
                 className="flex-1 px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 font-medium"
               >
                 取消
               </button>
               <button 
                 type="submit" 
                 className="flex-1 px-4 py-2 bg-slate-800 text-white rounded-lg hover:bg-slate-700 font-medium"
               >
                 保存
               </button>
             </div>
          </form>
        )}
      </div>
    </div>
  );
};