
import React, { useState } from 'react';
import { User } from '../types';
import { changePassword } from '../services/dataService';

interface PasswordChangeModalProps {
  user: User;
  isOpen: boolean;
  onClose: () => void;
}

export const PasswordChangeModal: React.FC<PasswordChangeModalProps> = ({ user, isOpen, onClose }) => {
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword.length < 6) {
      setError('密钥长度至少为 6 位');
      return;
    }
    if (newPassword !== confirmPassword) {
      setError('两次输入的密钥不一致');
      return;
    }

    setLoading(true);
    setError('');
    try {
      const success = await changePassword(user.id, newPassword);
      if (success) {
        alert('密钥修改成功，请牢记您的新密钥');
        onClose();
      } else {
        setError('服务器响应异常，请稍后重试');
      }
    } catch (err: any) {
      setError(err.message || '修改失败');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-md">
      <div className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-md p-8 m-4 animate-[fadeIn_0.2s_ease-out]">
        <div className="text-center mb-8">
           <div className="w-16 h-16 bg-slate-900 text-warning rounded-2xl flex items-center justify-center mx-auto mb-4 text-2xl font-black shadow-lg">P</div>
           <h2 className="text-xl font-black text-slate-800 tracking-tight">修改指挥官密钥</h2>
           <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mt-1">账号: {user.username}</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">新密钥 (New Password)</label>
            <input 
              type="password" 
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="w-full px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-warning outline-none font-bold text-slate-700"
              placeholder="请输入新密钥"
              required
            />
          </div>
          
          <div>
            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">确认新密钥 (Confirm Password)</label>
            <input 
              type="password" 
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-warning outline-none font-bold text-slate-700"
              placeholder="请再次确认密钥"
              required
            />
          </div>

          {error && (
            <div className="bg-danger/10 text-danger text-[10px] font-black uppercase p-3 rounded-xl border border-danger/20">
              {error}
            </div>
          )}

          <div className="flex gap-3">
             <button type="button" onClick={onClose} className="flex-1 py-4 bg-slate-50 text-slate-400 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:text-slate-800 transition-all">取消</button>
             <button 
               type="submit" 
               disabled={loading}
               className="flex-1 py-4 bg-slate-900 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl hover:bg-black transition-all flex items-center justify-center gap-2"
             >
               {loading ? <div className="w-3 h-3 border-2 border-warning border-t-transparent rounded-full animate-spin"></div> : '确认修改'}
             </button>
          </div>
        </form>
      </div>
    </div>
  );
};
