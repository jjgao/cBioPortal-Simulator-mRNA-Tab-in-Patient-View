import React, { useMemo } from 'react';
import {
  ComposedChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Scatter,
  ReferenceLine,
  Cell
} from 'recharts';
import { CohortSample } from '../types';

interface ExpressionChartProps {
  cohortData: CohortSample[];
  geneSymbol: string;
  patientId: string;
}

const ExpressionChart: React.FC<ExpressionChartProps> = ({ cohortData, geneSymbol, patientId }) => {
  // Sort data by expression level for the plot
  const sortedData = useMemo(() => {
    return [...cohortData].sort((a, b) => a.expression - b.expression);
  }, [cohortData]);

  const currentPatientValue = cohortData.find(c => c.isCurrentPatient)?.expression || 0;

  // Custom tooltip
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-white p-3 border border-gray-200 shadow-lg rounded text-xs">
          <p className="font-bold text-slate-800">{data.sampleId}</p>
          <p className="text-slate-600">Expression (Z-Score): <span className="font-mono">{data.expression.toFixed(2)}</span></p>
          {data.isCurrentPatient && (
            <p className="text-red-600 font-bold mt-1">Current Patient</p>
          )}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 h-full">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-sm font-semibold text-slate-700">
          mRNA Expression Z-Scores (Ref: Diploid Samples) - {geneSymbol}
        </h3>
        <div className="flex items-center gap-2 text-xs">
           <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-slate-300"></span> Cohort</span>
           <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-red-500"></span> {patientId}</span>
        </div>
      </div>
      
      <div className="h-[350px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart
            data={sortedData}
            margin={{ top: 20, right: 20, bottom: 20, left: 20 }}
          >
            <CartesianGrid stroke="#f0f0f0" vertical={false} />
            <XAxis 
              dataKey="sampleId" 
              tick={false} 
              label={{ value: 'Samples (Sorted by Expression)', position: 'insideBottom', offset: -10, fontSize: 12, fill: '#64748b' }} 
            />
            <YAxis 
              label={{ value: 'Z-Score', angle: -90, position: 'insideLeft', fontSize: 12, fill: '#64748b' }}
              domain={['auto', 'auto']}
              tick={{fontSize: 11}}
            />
            <Tooltip content={<CustomTooltip />} cursor={{ fill: 'transparent' }} />
            <ReferenceLine y={2} stroke="#cbd5e1" strokeDasharray="3 3" label={{ value: '+2 SD', fontSize: 10, fill: '#94a3b8' }} />
            <ReferenceLine y={-2} stroke="#cbd5e1" strokeDasharray="3 3" label={{ value: '-2 SD', fontSize: 10, fill: '#94a3b8' }} />
            <ReferenceLine y={0} stroke="#94a3b8" strokeWidth={1} />

            {/* We use Scatter for the points to mimic a strip plot */}
            <Scatter name="Samples" dataKey="expression" fill="#94a3b8" shape="circle" r={3}>
               {sortedData.map((entry, index) => (
                 <Cell 
                   key={`cell-${index}`} 
                   fill={entry.isCurrentPatient ? '#ef4444' : '#94a3b8'} 
                   r={entry.isCurrentPatient ? 6 : 3}
                 />
               ))}
            </Scatter>
          </ComposedChart>
        </ResponsiveContainer>
      </div>
      <div className="mt-2 text-xs text-slate-500 text-center">
        This plot shows the distribution of mRNA expression z-scores for {geneSymbol} across the study cohort. 
        The current patient is highlighted in <span className="text-red-500 font-bold">red</span>.
      </div>
    </div>
  );
};

export default ExpressionChart;
