
import React from 'react';
import { Member, Task } from '../types';
import { ProgressBar } from './ProgressBar';

interface TeamStatusProps {
  members: Member[];
  tasks: Task[];
}

export const TeamStatus: React.FC<TeamStatusProps> = ({ members, tasks }) => {
  return (
    <div className="mb-8 animate-[fadeIn_0.3s_ease-out]">
      {/* 标题与统计解释 */}
      <div className="flex flex-col md:flex-row md:items-end justify-between mb-4 gap-3">
        <div className="flex items-center">
          <div className="w-1.5 h-6 bg-warning rounded-full mr-3 shadow-sm shadow-warning/20"></div>
          <div>
            <h2 className="text-lg font-black text-slate-800 tracking-tight uppercase tracking-widest">核心成员战力看板</h2>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-0.5">实时穿透全员作战饱和度与交付质量</p>
          </div>
        </div>
        
        {/* 指标说明图例 */}
        <div className="flex items-center gap-4 bg-slate-50 px-4 py-2 rounded-xl border border-slate-100">
           <div className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full bg-success"></div>
              <span className="text-[9px] font-black text-slate-500 uppercase tracking-tighter">已交付</span>
           </div>
           <div className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full bg-slate-300"></div>
              <span className="text-[9px] font-black text-slate-500 uppercase tracking-tighter">作战总数</span>
           </div>
           <div className="w-px h-3 bg-slate-200 mx-1"></div>
           <div className="text-[9px] font-black text-slate-400 italic">
             平均达成率 = (负责节点进度 + 执行项进度) / 总数
           </div>
        </div>
      </div>
      
      {members.length === 0 ? (
          <div className="p-10 text-center bg-slate-50 rounded-[2rem] border-2 border-dashed border-slate-200 text-slate-400 text-[10px] font-black uppercase tracking-[0.2em]">
             指挥部暂未录入作战人员
          </div>
      ) : (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4">
        {members.map(member => {
          // 穿透计算：成员负责的所有 Task (核心节点) 和 ExecutionTask (执行子项)
          const directTasks = tasks.filter(t => (t.assigneeIds || []).includes(member.id));
          const subTasks = tasks.flatMap(t => (t.executionTasks || []).filter(et => (et.assigneeIds || []).includes(member.id)));
          
          const totalCombatUnits = directTasks.length + subTasks.length;
          const completedUnits = directTasks.filter(t => t.progress === 100).length + subTasks.filter(st => st.progress === 100).length;
          
          // 计算加权平均进度
          const totalProgressSum = directTasks.reduce((acc, t) => acc + t.progress, 0) + subTasks.reduce((acc, st) => acc + st.progress, 0);
          const overallProgress = totalCombatUnits > 0 ? Math.round(totalProgressSum / totalCombatUnits) : 0;

          // 风险状态研判
          const today = new Date().toISOString().split('T')[0];
          const hasOverdue = directTasks.some(t => t.progress < 100 && t.dueDate < today);
          
          let statusLabel = "正常推进";
          let statusColor = "text-slate-400";
          let statusBg = "bg-slate-50";

          if (hasOverdue) {
            statusLabel = "逾期警告";
            statusColor = "text-danger";
            statusBg = "bg-danger/5 border-danger/20";
          } else if (totalCombatUnits > 0 && overallProgress === 100) {
            statusLabel = "全面达成";
            statusColor = "text-success";
            statusBg = "bg-success/5 border-success/20";
          } else if (overallProgress >= 80) {
            statusLabel = "高效冲刺";
            statusColor = "text-warning";
            statusBg = "bg-warning/5 border-warning/20";
          }

          return (
            <div key={member.id} className={`p-4 rounded-[1.5rem] border transition-all hover:shadow-xl hover:translate-y-[-2px] group relative overflow-hidden ${hasOverdue ? 'bg-red-50/30 border-red-100' : 'bg-white border-slate-100'}`}>
              
              <div className="flex items-start justify-between mb-4">
                 <div className="flex items-center gap-3 min-w-0">
                    <div className="relative shrink-0">
                       <img src={member.avatar} className="w-10 h-10 lg:w-11 lg:h-11 rounded-2xl border-2 border-white shadow-sm object-cover" />
                       <div className={`absolute -bottom-1 -right-1 w-3.5 h-3.5 rounded-full border-2 border-white ${overallProgress === 100 ? 'bg-success' : 'bg-warning animate-pulse'}`}></div>
                    </div>
                    <div className="min-w-0">
                      <div className="font-black text-slate-800 text-xs lg:text-sm truncate leading-none mb-1.5">{member.name}</div>
                      <div className="text-[8px] text-slate-400 font-black uppercase tracking-widest truncate bg-slate-100 px-1.5 py-0.5 rounded w-fit">{member.role}</div>
                    </div>
                 </div>
                 <div className={`px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-widest border ${statusBg} ${statusColor}`}>
                    {statusLabel}
                 </div>
              </div>

              <div className="grid grid-cols-2 gap-2 mb-4">
                 <div className="bg-slate-50/50 p-2 rounded-xl border border-slate-100 flex flex-col items-center">
                    <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">已交付</span>
                    <span className="text-sm font-black text-success tracking-tighter">{completedUnits}</span>
                 </div>
                 <div className="bg-slate-50/50 p-2 rounded-xl border border-slate-100 flex flex-col items-center">
                    <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">作战总计</span>
                    <span className="text-sm font-black text-slate-800 tracking-tighter">{totalCombatUnits}</span>
                 </div>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between items-end">
                   <span className="text-[9px] text-slate-500 font-black uppercase tracking-widest">平均达成率</span>
                   <span className={`text-xs font-black ${hasOverdue ? 'text-danger' : 'text-slate-900'}`}>{overallProgress}%</span>
                </div>
                <ProgressBar progress={overallProgress} status={hasOverdue ? 'delayed' : (overallProgress === 100 ? 'completed' : 'normal')} height="h-3" showLabel={false} />
              </div>

              {hasOverdue && (
                <div className="mt-3 py-1 px-2 bg-danger text-white text-[8px] font-black uppercase tracking-[0.2em] rounded text-center animate-pulse">
                   阻断性风险存在 · 需干预
                </div>
              )}
            </div>
          );
        })}
      </div>
      )}
    </div>
  );
};
