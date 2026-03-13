
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
        <div className="rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-3 shadow-lg">
          <p className="mb-2 text-xs font-bold text-slate-900 dark:text-white">{label}</p>
          <div className="space-y-1">
            <p className="flex items-center gap-2 text-[11px] text-slate-600 dark:text-slate-300">
              <span className="h-2 w-2 rounded-full bg-slate-300"></span>
              Proyeksi: <span className="font-bold">{formatCurrency(payload[0].value)}</span>
            </p>
            <p className="flex items-center gap-2 text-[11px] text-slate-600 dark:text-slate-300">
              <span className="h-2 w-2 rounded-full bg-primary"></span>
              Realisasi: <span className="font-bold text-primary">{formatCurrency(payload[1].value)}</span>
            </p>
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
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={data}
          margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
          barGap={4}
        >
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
          <XAxis 
            dataKey="month" 
            axisLine={false} 
            tickLine={false} 
            tick={{ fill: '#94a3b8', fontSize: 11 }}
            dy={10}
          />
          <YAxis 
            axisLine={false} 
            tickLine={false} 
            tick={{ fill: '#94a3b8', fontSize: 11 }}
            domain={[0, yAxisMax]}
            tickFormatter={(value) => {
              if (value >= 1000000000) return `${(value / 1000000000).toFixed(1)}M`;
              if (value >= 1000000) return `${(value / 1000000).toFixed(1)}M`;
              return value.toString();
            }}
          />
          <Tooltip content={<CustomTooltip />} cursor={{ fill: 'transparent' }} />
          
          <Bar 
            dataKey="projection" 
            fill="#e2e8f0" 
            radius={[2, 2, 0, 0]} 
            barSize={12} 
          />
          <Bar 
            dataKey="realization" 
            radius={[2, 2, 0, 0]} 
            barSize={12}
          >
            {data.map((entry, index) => (
              <Cell 
                key={`cell-${index}`} 
                fill="#d33131" 
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
