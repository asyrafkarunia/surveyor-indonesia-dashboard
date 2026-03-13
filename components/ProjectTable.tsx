
import React from 'react';

interface ProjectTableProps {
  projects?: Array<{
    id: string | number;
    name: string;
    client: string;
    status: string;
    progress: number;
  }>;
  onSelectProjectId?: (projectId: string | number) => void;
}

const ProjectTable: React.FC<ProjectTableProps> = ({ projects = [], onSelectProjectId }) => {
  const getStatusStyle = (status: string) => {
    switch(status) {
      case 'In Progress': return 'bg-blue-100 text-blue-800';
      case 'Completed': return 'bg-green-100 text-green-800';
      case 'Delayed': return 'bg-red-100 text-red-800';
      case 'Pending': return 'bg-amber-100 text-amber-800';
      default: return 'bg-slate-100 text-slate-800 dark:text-slate-200';
    }
  };

  const getProgressColor = (status: string) => {
    switch(status) {
      case 'Completed': return 'bg-green-600';
      case 'Delayed': return 'bg-red-600';
      case 'Pending': return 'bg-amber-500';
      default: return 'bg-blue-600';
    }
  };

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left text-sm">
        <thead className="bg-slate-50 dark:bg-slate-900 text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
          <tr>
            <th className="px-6 py-4">Project Name</th>
            <th className="px-6 py-4">Client</th>
            <th className="px-6 py-4">Status</th>
            <th className="px-6 py-4">Progress</th>
            <th className="px-6 py-4 text-right">Action</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {projects.length === 0 ? (
            <tr>
              <td colSpan={5} className="px-6 py-8 text-center text-sm text-slate-500 dark:text-slate-400">
                Tidak ada data proyek
              </td>
            </tr>
          ) : (
            projects.map((project) => (
            <tr
              key={project.id}
              className={`transition-colors hover:bg-slate-50 dark:bg-slate-900 ${onSelectProjectId ? 'cursor-pointer' : ''}`}
              onClick={() => onSelectProjectId?.(project.id)}
            >
              <td className="whitespace-nowrap px-6 py-4 font-medium text-slate-900 dark:text-white">
                {project.name}
              </td>
              <td className="px-6 py-4 text-slate-600 dark:text-slate-300">{project.client}</td>
              <td className="px-6 py-4">
                <span className={`inline-flex rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${getStatusStyle(project.status)}`}>
                  {project.status}
                </span>
              </td>
              <td className="px-6 py-4">
                <div className="flex w-48 items-center gap-3">
                  <div className="h-1.5 w-full rounded-full bg-slate-100">
                    <div 
                      className={`h-1.5 rounded-full transition-all duration-500 ${getProgressColor(project.status)}`}
                      style={{ width: `${project.progress}%` }}
                    ></div>
                  </div>
                  <span className="text-[11px] font-semibold text-slate-600 dark:text-slate-300">{project.progress}%</span>
                </div>
              </td>
              <td className="px-6 py-4 text-right">
                <button className="text-slate-400 hover:text-slate-600 dark:text-slate-300">
                  <span className="material-symbols-outlined text-[20px]">more_vert</span>
                </button>
              </td>
            </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
};

export default ProjectTable;
