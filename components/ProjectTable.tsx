
import React from 'react';

interface ProjectTableProps {
  projects?: Array<{
    id: string | number;
    name: string;
    client: string;
    status: string;
    progress: number;
    budgetFormatted?: string;
    endDate?: string;
    pic?: string;
  }>;
  onSelectProjectId?: (projectId: string | number) => void;
}

const ProjectTable: React.FC<ProjectTableProps> = ({ projects = [], onSelectProjectId }) => {
  const getStatusConfig = (status: string) => {
    switch(status) {
      case 'RUNNING': 
      case 'In Progress': 
        return { label: 'Berjalan', bg: 'bg-blue-50', text: 'text-blue-700', dot: 'bg-blue-500', progressColor: 'bg-blue-500' };
      case 'DONE': 
      case 'Completed': 
        return { label: 'Selesai', bg: 'bg-emerald-50', text: 'text-emerald-700', dot: 'bg-emerald-500', progressColor: 'bg-emerald-500' };
      case 'Delayed': 
        return { label: 'Terlambat', bg: 'bg-red-50', text: 'text-red-700', dot: 'bg-red-500', progressColor: 'bg-red-500' };
      case 'PENDING': 
      case 'Pending': 
        return { label: 'Pending', bg: 'bg-amber-50', text: 'text-amber-700', dot: 'bg-amber-500', progressColor: 'bg-amber-400' };
      default: 
        return { label: status, bg: 'bg-slate-50', text: 'text-slate-600', dot: 'bg-slate-400', progressColor: 'bg-slate-400' };
    }
  };

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return '-';
    try {
      const date = new Date(dateStr);
      return date.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });
    } catch {
      return dateStr;
    }
  };

  const isOverdue = (dateStr?: string) => {
    if (!dateStr) return false;
    try {
      return new Date(dateStr) < new Date();
    } catch {
      return false;
    }
  };

  if (projects.length === 0) {
    return (
      <div className="px-6 py-10 text-center">
        <span className="material-symbols-outlined text-3xl text-slate-300 mb-2 block">folder_open</span>
        <p className="text-sm text-slate-400">Tidak ada data proyek</p>
      </div>
    );
  }

  return (
    <div className="divide-y divide-slate-100 dark:divide-slate-700">
      {projects.map((project) => {
        const statusConfig = getStatusConfig(project.status);
        const overdue = isOverdue(project.endDate) && project.status !== 'DONE' && project.status !== 'Completed';
        
        return (
          <div
            key={project.id}
            onClick={() => onSelectProjectId?.(project.id)}
            className={`px-6 py-4 transition-all hover:bg-slate-50 dark:hover:bg-slate-800/50 ${onSelectProjectId ? 'cursor-pointer' : ''} group`}
          >
            {/* Top row: Name + Status */}
            <div className="flex items-start justify-between gap-4 mb-2.5">
              <div className="flex-1 min-w-0">
                <h4 className="text-sm font-semibold text-slate-800 dark:text-white group-hover:text-primary transition-colors leading-snug truncate">
                  {project.name}
                </h4>
                <div className="flex items-center gap-3 mt-1">
                  <span className="text-xs text-slate-500 dark:text-slate-400 truncate">{project.client}</span>
                  {project.pic && (
                    <>
                      <span className="text-slate-300">·</span>
                      <span className="text-xs text-slate-400 dark:text-slate-500 truncate flex items-center gap-1">
                        <span className="material-symbols-outlined text-[14px]">person</span>
                        {project.pic}
                      </span>
                    </>
                  )}
                </div>
              </div>
              <span className={`shrink-0 inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider ${statusConfig.bg} ${statusConfig.text}`}>
                <span className={`w-1.5 h-1.5 rounded-full ${statusConfig.dot}`} />
                {statusConfig.label}
              </span>
            </div>

            {/* Bottom row: Progress + Metadata */}
            <div className="flex items-center gap-4">
              {/* Progress bar */}
              <div className="flex-1 flex items-center gap-2.5">
                <div className="flex-1 h-1.5 rounded-full bg-slate-100 dark:bg-slate-700 overflow-hidden">
                  <div 
                    className={`h-full rounded-full transition-all duration-500 ${statusConfig.progressColor}`}
                    style={{ width: `${project.progress}%` }}
                  />
                </div>
                <span className="text-[11px] font-bold text-slate-600 dark:text-slate-300 w-10 text-right shrink-0">
                  {project.progress}%
                </span>
              </div>

              {/* Budget */}
              {project.budgetFormatted && (
                <span className="hidden sm:flex items-center gap-1 text-[11px] font-semibold text-slate-500 dark:text-slate-400 shrink-0">
                  <span className="material-symbols-outlined text-[14px]">payments</span>
                  {project.budgetFormatted}
                </span>
              )}

              {/* Deadline */}
              <span className={`hidden md:flex items-center gap-1 text-[11px] font-semibold shrink-0 ${
                overdue ? 'text-red-500' : 'text-slate-400 dark:text-slate-500'
              }`}>
                <span className="material-symbols-outlined text-[14px]">schedule</span>
                {formatDate(project.endDate)}
              </span>

              {/* Arrow indicator */}
              <span className="material-symbols-outlined text-[18px] text-slate-300 dark:text-slate-600 group-hover:text-primary transition-colors shrink-0 opacity-0 group-hover:opacity-100">
                chevron_right
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default ProjectTable;
