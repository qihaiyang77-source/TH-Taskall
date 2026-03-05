
import React, { useState, useEffect } from 'react';
import { getConfig, saveConfig, checkDbConnection, fetchSetting, saveSetting } from '../services/dataService';
import { AiProvider, AiConfig } from '../types';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfigSaved: () => void;
  hideDbTab?: boolean;
  hideAiTab?: boolean;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose, onConfigSaved, hideDbTab = false, hideAiTab = false }) => {
  // DB Config State
  const [config, setConfig] = useState({
    host: 'localhost',
    port: 3306,
    user: 'root',
    password: '',
    database: 'taskpulse'
  });
  
  // AI Config State
  const [aiConfig, setAiConfig] = useState<AiConfig>({
    provider: AiProvider.GEMINI,
    difyEndpoint: '',
    difyKey: ''
  });

  const [activeTab, setActiveTab] = useState<'db' | 'ai'>(hideDbTab ? 'ai' : 'db');
  const [status, setStatus] = useState<'idle' | 'checking' | 'success' | 'error'>('idle');
  const [statusMessage, setStatusMessage] = useState('');
  const [dbVersion, setDbVersion] = useState<number | null>(null);

  useEffect(() => {
    if (isOpen) {
      loadAllConfig();
      if (hideDbTab) setActiveTab('ai');
      if (hideAiTab) setActiveTab('db');
    }
  }, [isOpen, hideDbTab, hideAiTab]);

  const loadAllConfig = async () => {
    try {
      // Load DB Config
      const res = await getConfig();
      if (res.config && Object.keys(res.config).length > 0) {
        setConfig(prev => ({ ...prev, ...res.config }));
      }
      
      // Load AI Config from Server
      const aiSettings = await fetchSetting('ai_config');
      if (aiSettings) {
        setAiConfig(aiSettings);
      }

      // Try to get DB version if DB is configured
      if (res.config?.host) {
        try {
          const versionRes = await fetch('/api/db/version');
          const versionData = await versionRes.json();
          if (versionData.version !== undefined) {
            setDbVersion(versionData.version);
          }
        } catch (e) {
          console.error('Failed to fetch DB version:', e);
        }
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleDbChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setConfig(prev => ({
      ...prev,
      [name]: name === 'port' ? parseInt(value) : value
    }));
  };

  const handleAiChange = (name: keyof AiConfig, value: string) => {
    setAiConfig(prev => ({ ...prev, [name]: value }));
  };

  const handleSaveAll = async () => {
    setStatus('checking');
    setStatusMessage('正在保存配置...');
    try {
      // 1. Save DB Config
      await saveConfig(config);
      
      // 2. Save AI Config to Server (Only if not hidden)
      if (!hideAiTab) {
        await saveSetting('ai_config', aiConfig);
      }
      
      // 3. Test Connection
      setStatusMessage('正在验证连接...');
      const isConnected = await checkDbConnection();
      
      if (isConnected) {
        setStatus('success');
        setStatusMessage('所有配置已成功保存！');
        
        // Refresh version
        try {
          const versionRes = await fetch('/api/db/version');
          const versionData = await versionRes.json();
          if (versionData.version !== undefined) setDbVersion(versionData.version);
        } catch (e) {}

        setTimeout(() => {
          onConfigSaved();
          onClose();
        }, 1500);
      } else {
        throw new Error('数据库连接失败，但 AI 配置可能已保存');
      }
    } catch (error: any) {
      setStatus('error');
      setStatusMessage(error.message || '保存过程中出现异常');
    }
  };

  const handleInitDb = async () => {
    setStatus('checking');
    setStatusMessage('正在执行数据库迁移...');
    try {
      await saveConfig(config);
      const res = await fetch('/api/init', { method: 'POST' });
      const data = await res.json();
      
      if (data.success) {
        setDbVersion(data.currentVersion);
        setStatus('success');
        setStatusMessage(`数据库初始化/升级成功！已应用 ${data.appliedCount} 个更新，当前版本: v${data.currentVersion}`);
      } else {
        throw new Error(data.error || '初始化失败');
      }
    } catch (error: any) {
      setStatus('error');
      setStatusMessage(`初始化失败: ${error.message}`);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-lg p-0 overflow-hidden animate-[fadeIn_0.2s_ease-out] border border-slate-200">
        
        {/* Header */}
        <div className="bg-slate-50 px-8 pt-8 pb-4 flex justify-between items-start">
           <div>
             <h2 className="text-2xl font-black text-slate-800 tracking-tight">系统中心</h2>
             <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mt-1">控制 T&H 数字化基础设施</p>
           </div>
           <button onClick={onClose} className="p-2 bg-white rounded-full shadow-sm text-slate-400 hover:text-slate-800 transition-all">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="bg-slate-50 px-8 pb-4 flex gap-6">
           {!hideDbTab && (
             <button 
               onClick={() => setActiveTab('db')}
               className={`pb-2 text-xs font-black uppercase tracking-widest border-b-4 transition-all ${activeTab === 'db' ? 'border-warning text-slate-800' : 'border-transparent text-slate-400'}`}
             >
               数据库 (DB)
             </button>
           )}
           {!hideAiTab && (
             <button 
               onClick={() => setActiveTab('ai')}
               className={`pb-2 text-xs font-black uppercase tracking-widest border-b-4 transition-all ${activeTab === 'ai' ? 'border-success text-slate-800' : 'border-transparent text-slate-400'}`}
             >
               AI 引擎 (Dify)
             </button>
           )}
        </div>

        <div className="p-8 max-h-[60vh] overflow-y-auto">
          {activeTab === 'db' ? (
            <div className="space-y-5">
              <div className="grid grid-cols-2 gap-4">
                 <div className="col-span-2">
                    <label className="block text-[10px] font-black text-slate-400 uppercase mb-1.5 tracking-wider">Host 地址</label>
                    <input name="host" type="text" value={config.host} onChange={handleDbChange} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-warning outline-none font-bold text-slate-700" />
                 </div>
                 <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase mb-1.5 tracking-wider">端口</label>
                    <input name="port" type="number" value={config.port} onChange={handleDbChange} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-warning outline-none font-bold text-slate-700" />
                 </div>
                 <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase mb-1.5 tracking-wider">数据库名</label>
                    <input name="database" type="text" value={config.database} onChange={handleDbChange} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-warning outline-none font-bold text-slate-700" />
                 </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                 <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase mb-1.5 tracking-wider">用户名</label>
                    <input name="user" type="text" value={config.user} onChange={handleDbChange} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-warning outline-none font-bold text-slate-700" />
                 </div>
                 <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase mb-1.5 tracking-wider">密码</label>
                    <input name="password" type="password" value={config.password} onChange={handleDbChange} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-warning outline-none font-bold text-slate-700" />
                 </div>
              </div>
              <div className="pt-4 p-4 bg-slate-50 rounded-2xl border border-slate-100">
                 <div className="flex items-center justify-between mb-3">
                    <div className="flex flex-col">
                       <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">数据库版本</span>
                       <span className="text-lg font-black text-slate-800">v{dbVersion !== null ? dbVersion : '未知'}</span>
                    </div>
                    <button 
                      onClick={handleInitDb}
                      className="px-4 py-2 bg-warning text-slate-900 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-warning/80 transition-all shadow-lg shadow-warning/20"
                    >
                      检查并升级数据库
                    </button>
                 </div>
                 <p className="text-[9px] text-slate-400 leading-relaxed">
                   点击“检查并升级”将自动对比当前数据库结构与系统最新版本，安全执行缺失的迁移脚本。
                 </p>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
               <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase mb-3 tracking-wider">AI 驱动提供商</label>
                  <div className="grid grid-cols-2 gap-3">
                     <button 
                       onClick={() => handleAiChange('provider', AiProvider.GEMINI)}
                       className={`flex items-center justify-center gap-2 py-3 rounded-xl border-2 transition-all font-black text-[10px] uppercase ${aiConfig.provider === AiProvider.GEMINI ? 'border-warning bg-warning/5 text-slate-900' : 'border-slate-100 text-slate-400 hover:border-slate-200'}`}
                     >
                        <div className={`w-2 h-2 rounded-full ${aiConfig.provider === AiProvider.GEMINI ? 'bg-warning animate-pulse' : 'bg-slate-200'}`}></div>
                        Google Gemini
                     </button>
                     <button 
                       onClick={() => handleAiChange('provider', AiProvider.DIFY)}
                       className={`flex items-center justify-center gap-2 py-3 rounded-xl border-2 transition-all font-black text-[10px] uppercase ${aiConfig.provider === AiProvider.DIFY ? 'border-success bg-success/5 text-slate-900' : 'border-slate-100 text-slate-400 hover:border-slate-200'}`}
                     >
                        <div className={`w-2 h-2 rounded-full ${aiConfig.provider === AiProvider.DIFY ? 'bg-success animate-pulse' : 'bg-slate-200'}`}></div>
                        Dify 自部署
                     </button>
                  </div>
               </div>

               {aiConfig.provider === AiProvider.DIFY ? (
                 <div className="space-y-5 animate-[fadeIn_0.3s_ease-out]">
                    <div>
                       <label className="block text-[10px] font-black text-slate-400 uppercase mb-1.5 tracking-wider">Dify API Endpoint</label>
                       <input 
                         type="text" 
                         value={aiConfig.difyEndpoint || ''} 
                         onChange={e => handleAiChange('difyEndpoint', e.target.value)}
                         placeholder="https://api.dify.ai/v1"
                         className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-success outline-none font-bold text-slate-700" 
                       />
                       <p className="text-[9px] text-slate-400 mt-1.5">例如: 您的 Dify 后端域名，必须包含 http/https</p>
                    </div>
                    <div>
                       <label className="block text-[10px] font-black text-slate-400 uppercase mb-1.5 tracking-wider">App API Key</label>
                       <input 
                         type="password" 
                         value={aiConfig.difyKey || ''} 
                         onChange={e => handleAiChange('difyKey', e.target.value)}
                         placeholder="app-xxxxxxxxxxxx"
                         className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-success outline-none font-bold text-slate-700" 
                       />
                    </div>
                 </div>
               ) : (
                 <div className="p-6 bg-slate-50 rounded-2xl border border-dashed border-slate-200 text-center animate-[fadeIn_0.3s_ease-out]">
                    <p className="text-xs text-slate-400 font-bold leading-relaxed uppercase">
                      Gemini 引擎由系统全局环境变量支持<br/>
                      无需在前端进行额外配置。
                    </p>
                 </div>
               )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-8 bg-slate-50 border-t border-slate-100">
           {status !== 'idle' && (
             <div className={`mb-4 p-3 rounded-xl text-[10px] font-black uppercase flex items-center gap-2 ${
               status === 'success' ? 'bg-green-100 text-green-700' : 
               status === 'error' ? 'bg-red-100 text-red-700' : 'bg-blue-100 text-blue-700'
             }`}>
                {status === 'checking' && <div className="w-3 h-3 border-2 border-blue-700 border-t-transparent rounded-full animate-spin"></div>}
                {statusMessage}
             </div>
           )}
           <div className="flex gap-3">
              <button onClick={onClose} className="flex-1 py-4 px-6 bg-white border border-slate-200 rounded-2xl text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-slate-800 transition-all">取消</button>
              <button 
                onClick={handleSaveAll}
                className="flex-1 py-4 px-6 bg-slate-900 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-black transition-all shadow-xl shadow-slate-200"
              >
                保存所有配置项
              </button>
           </div>
        </div>
      </div>
    </div>
  );
};
