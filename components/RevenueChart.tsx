
import React from 'react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  Cell 
} from 'recharts';

interface RevenueChartProps {
  data?: Array<{
    month: string;
    projection: number;
    realization: number;
  }>;
}

const RevenueChart: React.FC<RevenueChartProps> = ({ data = [] }) => {
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const formatCurrency = (value: number) => {
        if (value >= 1000000000) {
          return `Rp ${(value / 1000000000).toFixed(1)}M`;
        } else if (value >= 1000000) {
          return `Rp ${(value / 1000000).toFixed(1)}M`;
        } else {
          return `Rp ${value.toLocaleString('id-ID')}`;
        }
      };
      
      return (
        <div className="rounded-xl border border-slate-100 dark:border-slate-700 bg-white/90 backdrop-blur-md dark:bg-slate-800/90 p-4 shadow-xl">
          <p className="mb-3 text-sm font-bold text-slate-900 dark:text-white border-b border-slate-100 dark:border-slate-700 pb-2">{label}</p>
          <div className="space-y-2.5">
            <div className="flex items-center justify-between gap-6 text-xs text-slate-600 dark:text-slate-300">
              <span className="flex items-center gap-2">
                <span className="h-2.5 w-2.5 rounded-full bg-slate-200"></span>
                <span>Nilai Kontrak</span>
              </span>
              <span className="font-bold text-slate-900 dark:text-white">{formatCurrency(payload[0]?.value || 0)}</span>
            </div>
            <div className="flex items-center justify-between gap-6 text-xs text-slate-600 dark:text-slate-300">
              <span className="flex items-center gap-2">
                <span className="h-2.5 w-2.5 rounded-full bg-primary ring-2 ring-primary/20"></span>
                <span>Realisasi</span>
              </span>
              <span className="font-bold text-primary">{formatCurrency(payload[1]?.value || 0)}</span>
            </div>
          </div>
        </div>
      );
    }
    return null;
  };

  // Calculate max value for Y-axis
  const maxValue = Math.max(
    ...data.map(d => Math.max(d.projection, d.realization)),
    0
  );
  const yAxisMax = maxValue > 0 ? Math.ceil(maxValue * 1.1) : 100;

  if (data.length === 0) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="text-sm text-slate-500 dark:text-slate-400">Tidak ada data untuk ditampilkan</div>
      </div>
    );
  }

  return (
    <div className="h-full w-full">
      <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
        <BarChart
          data={data}
          margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
          barGap={6}
        >
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f8fafc" className="dark:stroke-slate-700" />
          <XAxis 
            dataKey="month" 
            axisLine={false} 
            tickLine={false} 
            tick={{ fill: '#64748b', fontSize: 11, fontWeight: 500 }}
            dy={10}
          />
          <YAxis 
            axisLine={false} 
            tickLine={false} 
            tick={{ fill: '#64748b', fontSize: 11, fontWeight: 500 }}
            domain={[0, yAxisMax]}
            tickFormatter={(value) => {
              if (value >= 1000000000) return `${(value / 1000000000).toFixed(1)}M`;
              if (value >= 1000000) return `${(value / 1000000).toFixed(1)}M`;
              return value.toString();
            }}
          />
          <Tooltip 
            content={<CustomTooltip />} 
            cursor={{ fill: 'rgba(241, 245, 249, 0.4)' }} 
          />
          
          <Bar 
            dataKey="projection" 
            fill="#e2e8f0" 
            radius={[4, 4, 0, 0]} 
            barSize={16} 
          />
          <Bar 
            dataKey="realization" 
            radius={[4, 4, 0, 0]} 
            barSize={16}
          >
            {data.map((entry, index) => (
              <Cell 
                key={`cell-${index}`} 
                fill="#003868" 
                fillOpacity={entry.realization === 0 ? 0.2 : 1}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

export default RevenueChart;
