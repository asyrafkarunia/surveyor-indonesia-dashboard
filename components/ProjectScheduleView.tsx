import React, { useMemo } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface ProjectScheduleViewProps {
  isOpen: boolean;
  onClose: () => void;
  project: any;
}

const ProjectScheduleView: React.FC<ProjectScheduleViewProps> = ({ isOpen, onClose, project }) => {
  // --- Auto Generate Milestones Logic ---
  const milestones = useMemo(() => {
    if (!project) return [];

    const msList = [];
    
    // 1. Project Initialization
    const initDate = project.created_at || project.start_date;
    if (initDate) {
      msList.push({
        date: new Date(initDate).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' }),
        name: 'Inisiasi Proyek',
        targetProg: 0,
        desc: 'Proyek didaftarkan ke sistem',
        status: 'COMPLETED'
      });
    }

    // 2. Map actual progress comments
    const progComments = (project.comments || []).filter((c: any) => c.comment.startsWith('[Sistem] Capaian progres'));
    
    // Sort by oldest first
    progComments.sort((a: any, b: any) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
    
    progComments.forEach((c: any) => {
      const match = c.comment.match(/menjadi (\d+)%/);
      let prog = match ? Number(match[1]) : 0;
      
      const noteMatch = c.comment.split('\nCatatan Tambahan: ');
      const note = noteMatch.length > 1 ? noteMatch[1].trim() : 'Pembaruan data tanpa catatan spesifik.';

      msList.push({
        date: new Date(c.created_at).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' }),
        name: `Pembaruan Capaian (${prog}%)`,
        targetProg: prog,
        desc: note,
        status: 'COMPLETED'
      });
    });

    // 3. Add future target if not done
    const currentProgress = project.progress ?? 0;
    if (currentProgress < 100 && project.end_date) {
      msList.push({
        date: new Date(project.end_date).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' }),
        name: 'Target Penyelesaian',
        targetProg: 100,
        desc: 'Batas penyelesaian sesuai durasi proyek',
        status: 'PENDING'
      });
    }

    // Dedup or handle same percentages if needed, but linear history is fine.
    return msList;
  }, [project]);

  // --- Auto Generate/Read S-Curve Data Logic ---
  const sCurveData = useMemo(() => {
    if (project?.schedule_data?.timeline && project.schedule_data.timeline.length > 0) {
      const timeline = project.schedule_data.timeline;
      
      // Find the last index that has a real recorded progress > 0
      let lastActualIdx = -1;
      for (let i = timeline.length - 1; i >= 0; i--) {
        const val = Number(timeline[i].actual);
        if (!isNaN(val) && val > 0) {
          lastActualIdx = i;
          break;
        }
      }

      return timeline.map((row: any, idx: number) => {
        const rawActual = Number(row.actual);
        let actualVal: number | null = isNaN(rawActual) ? null : rawActual;

        // If this month is after the last recorded progress, or it's 0 after the start, treat as null to break the line
        if (idx > lastActualIdx && lastActualIdx !== -1) {
          actualVal = null;
        } else if (idx > 0 && (actualVal === 0 || actualVal === null)) {
          // If we are before the last actual but this specific month is 0/null, 
          // we keep it as null to avoid dropping to zero unless it's the start
          actualVal = null;
        }

        return {
          name: row.month_label,
          planned: Number(row.planned) || 0,
          actual: actualVal,
        };
      });
    }

    // Fallback if no timeline data
    if (milestones.length === 0) return [];
    
    // Previous simulated s-curve fallback ...
    let data = [];
    const currentProgress = project?.progress ?? 0;
    
    const intervals = 10;
    for (let i = 0; i <= intervals; i++) {
        const percentTime = i / intervals;
        const plannedProg = (Math.pow(percentTime, 2) / (Math.pow(percentTime, 2) + Math.pow(1 - percentTime, 2))) * 100;
        
        let actualProg = null;
        if (i === 0) actualProg = 0;
        else if (i === intervals && currentProgress >= 100) actualProg = 100;
        else if (plannedProg <= currentProgress) actualProg = plannedProg - (plannedProg * 0.05);
        if (actualProg !== null && actualProg > currentProgress) actualProg = currentProgress;

        data.push({
            name: `P-${i}`,
            planned: Math.round(plannedProg),
            actual: actualProg !== null ? Math.round(actualProg) : null,
            target: i === intervals ? 100 : undefined
        });
    }

    if (currentProgress > 0) {
        const idx = data.findIndex(d => d.planned >= currentProgress);
        if (idx !== -1 && idx > 0) {
            data[idx].actual = currentProgress;
        } else {
            data[data.length - 1].actual = currentProgress;
        }
    }

    return data;
  }, [milestones, project]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-60 flex items-center justify-center bg-slate-900/40 backdrop-blur-[2px]" onClick={onClose}>
      <div 
        className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 max-w-5xl w-full mx-4 max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-300"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-6 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 backdrop-blur-xl">
          <div>
            <h2 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-widest flex items-center gap-2">
              <span className="material-symbols-outlined text-teal-600">timeline</span>
              Time Schedule dan Kurva S
            </h2>
            <p className="text-xs font-bold text-slate-400 mt-1 uppercase">Ringkasan Eksekutif Progress</p>
          </div>
          <button 
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors"
          >
            <span className="material-symbols-outlined text-sm">close</span>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-8 custom-scrollbar">
          
          <div className="bg-slate-50 dark:bg-slate-800/50 rounded-2xl p-4 border border-slate-100 dark:border-slate-800">
             <div className="flex justify-between items-center mb-4">
                <span className="text-[10px] font-black uppercase text-slate-500 dark:text-slate-400">Progres Keseluruhan</span>
                <span className="text-lg font-black text-teal-600">{project?.progress ?? 0}%</span>
             </div>
             <div className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-teal-500 rounded-full transition-all duration-1000" 
                  style={{ width: `${project?.progress ?? 0}%` }}
                />
             </div>
          </div>

          <div className="space-y-4">
             <h3 className="text-sm font-black uppercase text-slate-900 dark:text-white tracking-widest flex items-center gap-2">
               <span className="material-symbols-outlined text-[18px] text-blue-500">show_chart</span>
               Diagram Kurva-S
             </h3>
             <div className="w-full bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 p-4 pt-6 overflow-x-auto custom-scrollbar">
                <div style={{ minWidth: sCurveData.length > 8 ? `${sCurveData.length * 80}px` : '100%', height: '300px' }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={sCurveData} margin={{ top: 5, right: 20, left: 0, bottom: 20 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                      <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#64748b', fontWeight: 'bold' }} axisLine={false} tickLine={false} dy={10} />
                      <YAxis tick={{ fontSize: 11, fill: '#64748b', fontWeight: 'bold' }} axisLine={false} tickLine={false} dx={-10} />
                      <Tooltip 
                        contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                        itemStyle={{ fontSize: '13px', fontWeight: 'bold' }}
                        labelStyle={{ fontSize: '11px', color: '#64748b', marginBottom: '4px' }}
                      />
                      <Line type="monotone" dataKey="planned" stroke="#94a3b8" strokeWidth={3} dot={{ r: 4, strokeWidth: 2 }} activeDot={{ r: 6 }} strokeDasharray="5 5" name="Rencana (%)" />
                      <Line type="monotone" dataKey="actual" stroke="#0d9488" strokeWidth={4} activeDot={{ r: 8 }} dot={{ r: 4, strokeWidth: 2 }} name="Realisasi (%)" />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
             </div>
             <div className="flex gap-6 justify-center text-xs font-black uppercase text-slate-500 mt-2">
                <div className="flex items-center gap-2"><div className="w-4 h-0.5 bg-slate-400 border border-slate-400 border-dashed"></div> Rencana</div>
                <div className="flex items-center gap-2"><div className="w-4 h-1 bg-teal-600 rounded"></div> Realisasi</div>
             </div>
          </div>

          <div className="space-y-6 pt-4 border-t border-slate-100 dark:border-slate-800">
             <h3 className="text-xs font-black uppercase text-slate-900 dark:text-white tracking-widest flex items-center gap-2">
               <span className="material-symbols-outlined text-[16px] text-orange-500">history</span>
               Linimasa Progres Aktual
             </h3>

             {milestones.length === 0 ? (
               <div className="text-center py-8 text-xs font-bold text-slate-400 bg-slate-50 dark:bg-slate-800/30 rounded-2xl border border-dashed border-slate-200">
                  Data jadwal tidak valid atau tanggal belum diset
               </div>
             ) : (
               <div className="relative pl-6 space-y-6 max-h-[300px] overflow-y-auto custom-scrollbar pr-2 pb-4">
                  <div className="absolute left-2.5 top-2 bottom-6 w-[2px] bg-slate-100 dark:bg-slate-800 rounded-full" />
                  
                  {milestones.map((ms, idx) => {
                    const isCompleted = ms.status === 'COMPLETED';
                    return (
                      <div key={idx} className="relative">
                        <div className={`absolute -left-[27px] w-5 h-5 rounded-full border-4 border-white dark:border-slate-900 flex items-center justify-center z-10 
                          ${isCompleted ? 'bg-teal-500' : 'bg-slate-200 dark:bg-slate-700'}`} 
                        >
                          {isCompleted && <span className="material-symbols-outlined text-[10px] text-white font-black">check</span>}
                        </div>
                        <div className={`p-4 rounded-2xl border transition-all ${isCompleted ? 'bg-teal-50/50 dark:bg-teal-900/10 border-teal-100 dark:border-teal-800/30' : 'bg-white dark:bg-slate-900 border-slate-100 dark:border-slate-800'}`}>
                           <div className="flex justify-between items-start mb-1">
                              <h4 className={`text-sm font-black uppercase ${isCompleted ? 'text-teal-700 dark:text-teal-400' : 'text-slate-700 dark:text-slate-300'}`}>
                                {ms.name}
                              </h4>
                              <span className="text-xs font-black text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-md">
                                {ms.targetProg}%
                              </span>
                           </div>
                           <p className="text-xs font-bold text-slate-500 dark:text-slate-400 mb-2">{ms.desc}</p>
                           <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 flex items-center gap-1">
                              <span className="material-symbols-outlined text-[12px]">calendar_today</span>
                              {ms.date}
                           </p>
                        </div>
                      </div>
                    );
                  })}
               </div>
             )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProjectScheduleView;
