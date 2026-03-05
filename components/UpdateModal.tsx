
import React, { useState, useEffect } from 'react';
import { Task, ExecutionTask } from '../types';

interface UpdateModalProps {
  subTask: ExecutionTask | null;
  parentTask: Task | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (taskId: string, executionTaskId: string, newProgress: number, note: string) => void;
}

export const UpdateModal: React.FC<UpdateModalProps> = ({ subTask, parentTask, isOpen, onClose, onSave }) => {
  const [progress, setProgress] = useState(0);
  const [note, setNote] = useState('');

  useEffect(() => {
    if (subTask) {
      setProgress(subTask.progress || 0);
      setNote('');
    }
  }, [subTask]);

  if (!isOpen || !subTask || !parentTask) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(parentTask.id, subTask.id, progress, note);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6 m-4 animate-[fadeIn_0.2s_ease-out]">
        <h2 className="text-xl font-bold text-slate-800 mb-1 tracking-tight">维护作战进度</h2>
        <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mb-6">节点: {parentTask.title} / 任务: {subTask.title}</p>

        <form onSubmit={handleSubmit}>
          <div className="mb-8">
            <label className="block text-xs font-black text-slate-500 mb-3 uppercase tracking-widest">
              当前节点达成率: <span className="text-success font-black text-4xl ml-2 drop-shadow-sm">{progress}%</span>
            </label>
            <div className="px-1">
              <input 
                type="range" 
                min="0" 
                max="100" 
                step="5"
                value={progress}
                onChange={(e) => setProgress(Number(e.target.value))}
                className="w-full h-3 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-success"
              />
            </div>
            <div className="flex justify-between text-[10px] text-slate-400 mt-3 font-black uppercase tracking-tighter">
              <span>0% 待启动</span>
              <span className="text-slate-300">|</span>
              <span>50% 关键突破</span>
              <span className="text-slate-300">|</span>
              <span>100% 完美交付</span>
            </div>
          </div>

          <div className="mb-6">
            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">
              今日交付日报 (简述关键产出)
            </label>
            <textarea 
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="请描述今日的实质性进展..."
              className="w-full p-4 border border-slate-200 rounded-xl focus:ring-2 focus:ring-success focus:border-transparent outline-none h-28 resize-none text-sm font-medium"
              required
            ></textarea>
          </div>

          <div className="flex gap-3">
            <button 
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-3 border border-slate-200 text-slate-500 rounded-xl hover:bg-slate-50 font-black text-xs uppercase tracking-widest transition-all"
            >
              取消
            </button>
            <button 
              type="submit"
              className="flex-1 px-4 py-3 bg-slate-900 text-white rounded-xl hover:bg-black font-black text-xs uppercase tracking-widest shadow-xl transition-all"
            >
              提交日报并同步进度
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
