
import React, { useState } from 'react';
import { User } from '../types';
import { login, setDemoMode } from '../services/dataService';

interface LoginProps {
  onLoginSuccess: (user: User) => void;
  onOpenSettings: () => void;
  dbStatus: 'OK' | 'NEED_CONFIG' | 'ERROR' | 'CHECKING';
}

export const Login: React.FC<LoginProps> = ({ onLoginSuccess, onOpenSettings, dbStatus }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      setDemoMode(false);
      const user = await login(username, password);
      onLoginSuccess(user);
    } catch (err: any) {
      setError(err.message || '接入作战系统失败，请核验授权信息');
    } finally {
      setLoading(false);
    }
  };

  const handleDemoMode = () => {
    setDemoMode(true);
    onLoginSuccess({ id: 'demo-user', username: '演示指挥官', role: 'ADMIN' as any });
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4">
      <div className="max-w-md w-full animate-[fadeIn_0.5s_ease-out]">
        <div className="bg-white rounded-[2.5rem] shadow-2xl overflow-hidden border border-slate-100">
          <div className="bg-slate-900 p-8 text-center relative overflow-hidden">
             {/* 装饰性光晕 */}
             <div className="absolute top-0 right-0 w-32 h-32 bg-warning/10 rounded-full -mr-16 -mt-16 blur-2xl"></div>
             
             <div className="w-16 h-16 bg-warning text-slate-900 rounded-2xl flex items-center justify-center mx-auto mb-6 text-3xl font-black shadow-lg shadow-warning/20 relative z-10">T</div>
             <h1 className="text-2xl font-black text-white tracking-tighter relative z-10">
               <span className="text-warning">T&H</span> <span className="text-success">INTERNATIONAL</span>
             </h1>
             <div className="mt-2 flex items-center justify-center gap-2 relative z-10">
               <div className={`w-2 h-2 rounded-full ${
                 dbStatus === 'OK' ? 'bg-success animate-pulse' : 
                 dbStatus === 'CHECKING' ? 'bg-warning animate-spin' : 'bg-danger'
               }`}></div>
               <span className="text-[9px] font-black uppercase tracking-widest text-slate-400">
                 {dbStatus === 'OK' ? '数据库已就绪' : 
                  dbStatus === 'CHECKING' ? '正在校验环境...' : '数据库未连接'}
               </span>
             </div>
             <p className="text-slate-500 text-[10px] font-black uppercase tracking-[0.3em] mt-2 relative z-10">作战指挥中心 · 接入授权</p>
          </div>
          
          <div className="p-8 lg:p-10">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">指挥官账号</label>
                <input 
                  type="text" 
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-warning outline-none font-bold text-slate-700 transition-all"
                  placeholder="Username"
                  required
                />
              </div>
              
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">授权密钥</label>
                <input 
                  type="password" 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-warning outline-none font-bold text-slate-700 transition-all"
                  placeholder="Password"
                  required
                />
              </div>

              {error && (
                <div className="bg-danger/10 text-danger text-[10px] font-black uppercase p-3 rounded-xl border border-danger/20 animate-shake">
                  {error}
                </div>
              )}

              <button 
                type="submit" 
                disabled={loading || dbStatus !== 'OK'}
                className="w-full py-4 bg-slate-900 text-white rounded-2xl font-black text-xs uppercase tracking-[0.2em] shadow-xl hover:bg-black transition-all flex items-center justify-center gap-2 group disabled:opacity-50"
              >
                {loading ? (
                  <div className="w-4 h-4 border-2 border-warning border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  <>
                    接入作战环境
                    <svg className="w-4 h-4 text-warning group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
                  </>
                )}
              </button>
            </form>

            {dbStatus !== 'OK' && (
              <div className="mt-4">
                <button 
                  onClick={handleDemoMode}
                  className="w-full py-3 bg-white border-2 border-slate-900 text-slate-900 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-slate-50 transition-all flex items-center justify-center gap-2"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                  演示模式 (无需数据库)
                </button>
              </div>
            )}
            
            <div className="mt-8 pt-6 border-t border-slate-100 flex flex-col items-center gap-4">
              <button 
                onClick={onOpenSettings}
                className="text-[10px] font-black text-slate-400 uppercase tracking-widest hover:text-warning transition-colors flex items-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924-1.756-3.35 0a1.724 1.724 0 00-2.573-1.066-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /></svg>
                系统环境配置
              </button>
              <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest text-center">
                内部战略资源系统，未经授权严禁访问<br/>
                © T&H STRATEGIC COMMAND CENTER
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
