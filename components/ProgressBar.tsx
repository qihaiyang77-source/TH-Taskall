
import React from 'react';

interface ProgressBarProps {
  progress: number;
  status?: 'normal' | 'risk' | 'delayed' | 'completed';
  height?: string;
  showLabel?: boolean;
}

export const ProgressBar: React.FC<ProgressBarProps> = ({ 
  progress, 
  status = 'normal', 
  height = 'h-5', // 默认高度提升
  showLabel = true
}) => {
  let colorClass = 'bg-primary';
  if (status === 'risk') colorClass = 'bg-warning';
  if (status === 'delayed') colorClass = 'bg-danger';
  if (status === 'completed') colorClass = 'bg-success';

  return (
    <div className="w-full">
      <div className="flex justify-between mb-1.5">
        {showLabel && <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">进度</span>}
        {showLabel && <span className={`text-sm font-black ${status === 'normal' ? 'text-slate-800' : ''} ${status === 'risk' ? 'text-warning' : ''} ${status === 'delayed' ? 'text-danger' : ''} ${status === 'completed' ? 'text-success' : ''}`}>{progress}%</span>}
      </div>
      <div className={`w-full bg-slate-200/70 rounded-full ${height} overflow-hidden shadow-inner`}>
        <div
          className={`${colorClass} ${height} rounded-full transition-all duration-700 ease-out relative`}
          style={{ width: `${progress}%` }}
        >
          {progress > 15 && height !== 'h-1' && (
            <div className="absolute inset-0 bg-white/10 w-full h-1/2 opacity-50"></div>
          )}
        </div>
      </div>
    </div>
  );
};
