
import React from 'react';
import { Project, Task } from '../types';
import { ProgressBar } from './ProgressBar';

interface ProjectProgressTrackProps {
  projects: Project[];
  tasks: Task[];
  activeProjectId: string;
  onProjectSelect: (id: string) => void;
}

export const ProjectProgressTrack: React.FC<ProjectProgressTrackProps> = ({
  projects,
  tasks,
  activeProjectId,
  onProjectSelect
}) => {
  return (
    <div className="mb-8 animate-[fadeIn_0.4s_ease-out]">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-1.5 h-6 bg-success rounded-full shadow-sm shadow-success/20"></div>
        <div>
          <h2 className="text-lg font-black text-slate-800 tracking-tight uppercase tracking-widest">立项战况总览</h2>
          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-0.5">跨项目进度监控与战略达成分析</p>
        </div>
      </div>

      <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide -mx-2 px-2">
        {projects.map(project => {
          const projectTasks = tasks.filter(t => t.projectId === project.id);
          const avgProgress = projectTasks.length > 0 
            ? Math.round(projectTasks.reduce((acc, t) => acc + t.progress, 0) / projectTasks.length)
            : 0;
          
          const isActive = activeProjectId === project.id;
          const isCompleted = avgProgress === 100;

          return (
            <div 
              key={project.id}
              onClick={() => onProjectSelect(project.id)}
              className={`flex-shrink-0 w-64 p-5 rounded-[2rem] border transition-all cursor-pointer relative overflow-hidden group
                ${isActive ? 'bg-slate-900 border-warning shadow-xl ring-2 ring-warning/20' : 'bg-white border-slate-100 hover:border-warning/40 shadow-sm'}
              `}
            >
              {/* 背景装饰 */}
              <div className={`absolute -right-4 -top-4 w-16 h-16 rounded-full blur-3xl transition-opacity ${isActive ? 'bg-warning/20 opacity-100' : 'bg-slate-100 opacity-0 group-hover:opacity-100'}`}></div>

              <div className="flex justify-between items-start mb-4 relative z-10">
                <div className="min-w-0">
                  <h3 className={`text-xs font-black uppercase tracking-tight truncate ${isActive ? 'text-warning' : 'text-slate-800'}`}>
                    {project.name}
                  </h3>
                  <div className="flex items-center gap-1.5 mt-1">
                    <div className={`w-1.5 h-1.5 rounded-full ${isCompleted ? 'bg-success' : 'bg-warning animate-pulse'}`}></div>
                    <span className="text-[9px] font-black text-slate-400 uppercase">{projectTasks.length} 个作战节点</span>
                  </div>
                </div>
                <div className={`text-lg font-black tracking-tighter ${isActive ? 'text-white' : 'text-slate-900'}`}>
                  {avgProgress}<span className="text-[10px] ml-0.5">%</span>
                </div>
              </div>

              <div className="relative z-10">
                <ProgressBar 
                  progress={avgProgress} 
                  status={isCompleted ? 'completed' : 'normal'} 
                  height="h-2.5" 
                  showLabel={false} 
                />
                <div className="flex justify-between mt-2">
                  <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">总体达成</span>
                  {isActive && <span className="text-[8px] font-black text-warning uppercase tracking-widest animate-bounce">正在指挥</span>}
                </div>
              </div>
            </div>
          );
        })}
        {projects.length === 0 && (
          <div className="flex-1 p-8 text-center bg-slate-50 rounded-[2rem] border-2 border-dashed border-slate-200 text-slate-400 text-[10px] font-black uppercase tracking-widest">
            暂无立项数据
          </div>
        )}
      </div>
    </div>
  );
};
