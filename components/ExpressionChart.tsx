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
import { CohortSample, CohortScope } from '../types';
import { LayoutGrid, Users } from 'lucide-react';

interface ExpressionChartProps {
  cohortData: CohortSample[];
  geneSymbol: string;
  patientId: string;
  cohortScope: CohortScope;
  setCohortScope: (scope: CohortScope) => void;
  cancerType: string;
}

const ExpressionChart: React.FC<ExpressionChartProps> = ({ 
  cohortData, 
  geneSymbol, 
  patientId,
  cohortScope,
  setCohortScope,
  cancerType
}) => {
  // Sort data by expression level for the plot
  // We also prepare a secondary field 'patientExpression' for layering patient samples on top
  const sortedData = useMemo(() => {
    const sorted = [...cohortData].sort((a, b) => a.expression - b.expression);
    return sorted.map(d => ({
        ...d,
        // For the overlay layer: value exists only if it is a patient sample
        patientExpression: d.isCurrentPatient ? d.expression : null
    }));
  }, [cohortData]);

  // Identify patient samples for legend/colors
  const patientSamples = useMemo(() => 
    cohortData.filter(c => c.isCurrentPatient).sort((a, b) => a.sampleId.localeCompare(b.sampleId)),
  [cohortData]);

  const COLORS = ['#ef4444', '#3b82f6', '#10b981', '#f59e0b']; // Red, Blue, Green, Amber

  const getSampleColor = (sampleId: string) => {
    const index = patientSamples.findIndex(s => s.sampleId === sampleId);
    return index >= 0 ? COLORS[index % COLORS.length] : '#94a3b8';
  };

  // Custom tooltip
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      const isPatient = data.isCurrentPatient;
      
      return (
        <div className={`p-3 border shadow-lg rounded text-xs ${isPatient ? 'bg-white border-blue-200' : 'bg-white border-gray-200'}`}>
          <p className={`font-bold ${isPatient ? 'text-blue-800' : 'text-slate-800'}`}>{data.sampleId}</p>
          {data.sampleType && (
             <p className="text-slate-500 italic mb-1">{data.sampleType}</p>
          )}
          <p className="text-slate-600">Expression (Z-Score): <span className="font-mono font-semibold">{data.expression.toFixed(2)}</span></p>
          {isPatient && (
            <p className="text-red-600 font-bold mt-1 text-[10px] uppercase">Patient Sample</p>
          )}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 h-full flex flex-col">
      <div className="flex flex-wrap gap-2 justify-between items-center mb-4">
        <h3 className="text-sm font-semibold text-slate-700">
          mRNA Expression Z-Scores - {geneSymbol}
        </h3>

        {/* Cohort Toggle - Moved here */}
        <div className="flex items-center bg-slate-100 p-0.5 rounded-md border border-slate-200">
            <button 
                onClick={() => setCohortScope('pancancer')}
                className={`flex items-center gap-1 px-2 py-1 text-[10px] font-medium rounded transition-all ${cohortScope === 'pancancer' ? 'bg-white text-blue-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                title="Compare against Pancancer cohort"
            >
                <LayoutGrid size={10} />
                Pancancer
            </button>
            <button 
                onClick={() => setCohortScope('cancer_type')}
                className={`flex items-center gap-1 px-2 py-1 text-[10px] font-medium rounded transition-all ${cohortScope === 'cancer_type' ? 'bg-white text-blue-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                title={`Compare against ${cancerType} cohort`}
            >
                <Users size={10} />
                {cancerType}
            </button>
        </div>
      </div>
      
      <div className="flex-1 w-full min-h-0">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart
            data={sortedData}
            margin={{ top: 20, right: 20, bottom: 20, left: 20 }}
          >
            <CartesianGrid stroke="#f0f0f0" vertical={false} />
            <XAxis 
              dataKey="sampleId" 
              tick={false} 
              label={{ value: 'Cohort Samples (Sorted)', position: 'insideBottom', offset: -10, fontSize: 12, fill: '#64748b' }} 
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

            {/* Layer 1: Background Scatter (All samples, mostly grey) */}
            <Scatter name="Samples" dataKey="expression" shape="circle" isAnimationActive={false}>
               {sortedData.map((entry, index) => (
                 <Cell 
                   key={`cell-${index}`} 
                   fill={entry.isCurrentPatient ? getSampleColor(entry.sampleId) : '#e2e8f0'} 
                   // If it's a patient, we draw it here too, but the overlay layer will handle the "pop"
                   // For non-patients, we just draw grey dots.
                 />
               ))}
            </Scatter>

            {/* Layer 2: Overlay Scatter (Patient samples ONLY) 
                We use 'patientExpression' which is null for non-patients, causing them to be skipped.
                This ensures patient samples are drawn ON TOP of the background samples.
            */}
            <Scatter name="PatientSamples" dataKey="patientExpression" shape="circle" isAnimationActive={false}>
                {sortedData.map((entry, index) => (
                    <Cell 
                        key={`overlay-cell-${index}`} 
                        fill={getSampleColor(entry.sampleId)} 
                        stroke="#fff"
                        strokeWidth={2}
                        r={6} // Make them slightly prominent
                    />
                ))}
            </Scatter>

          </ComposedChart>
        </ResponsiveContainer>
      </div>

      {/* Legend for Patient Samples */}
      <div className="mt-4 pt-3 border-t border-gray-100 flex flex-wrap justify-center gap-4 text-xs">
        <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-slate-200"></span>
            <span className="text-slate-500">Cohort</span>
        </div>
        {patientSamples.map((sample) => (
             <div key={sample.sampleId} className="flex items-center gap-1.5">
                <span 
                    className="w-3 h-3 rounded-full border-2 border-white shadow-sm" 
                    style={{ backgroundColor: getSampleColor(sample.sampleId) }}
                ></span>
                <span className="font-medium text-slate-700">
                    {sample.sampleType || sample.sampleId}
                </span>
             </div>
        ))}
      </div>
    </div>
  );
};

export default ExpressionChart;