import React from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
  ReferenceLine
} from 'recharts';
import { GTExData } from '../types';

interface GTExChartProps {
  data: GTExData[];
  geneSymbol: string;
  highlightTissue?: string;
}

const GTExChart: React.FC<GTExChartProps> = ({ data, geneSymbol, highlightTissue }) => {
  // Sort data desc by expression
  const sortedData = [...data].sort((a, b) => b.expression - a.expression);

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const isHighlighted = label === highlightTissue;
      return (
        <div className={`p-3 border shadow-lg rounded text-xs ${isHighlighted ? 'bg-red-50 border-red-200' : 'bg-white border-gray-200'}`}>
          <p className={`font-bold ${isHighlighted ? 'text-red-700' : 'text-slate-800'}`}>
            {label} {isHighlighted && "(Tumor Site)"}
          </p>
          <p className="text-slate-600">Median TPM: <span className="font-mono font-semibold">{payload[0].value.toFixed(1)}</span></p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 h-full flex flex-col">
      <div className="flex justify-between items-center mb-2">
        <div>
            <h3 className="text-sm font-semibold text-slate-700">
            GTEx Normal Tissue Expression - {geneSymbol}
            </h3>
            <p className="text-[10px] text-slate-400">Median Gene-Level TPM by Tissue</p>
        </div>
      </div>
      
      <div className="flex-1 w-full min-h-0">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={sortedData}
            layout="vertical"
            margin={{ top: 5, right: 30, left: 40, bottom: 5 }}
            barSize={20}
          >
            <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f0f0f0" />
            <XAxis type="number" hide />
            <YAxis 
                type="category" 
                dataKey="tissue" 
                width={90} 
                tick={{fontSize: 10, fill: '#64748b'}} 
                interval={0}
            />
            <Tooltip content={<CustomTooltip />} cursor={{fill: '#f8fafc'}} />
            <Bar dataKey="expression" radius={[0, 4, 4, 0]}>
                {sortedData.map((entry, index) => (
                    <Cell 
                        key={`cell-${index}`} 
                        fill={entry.tissue === highlightTissue ? '#ef4444' : '#cbd5e1'} 
                    />
                ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
       <div className="mt-2 flex justify-between items-center text-[10px] text-slate-400">
            <span>Source: GTEx V8 Release</span>
            {highlightTissue && (
                <div className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 bg-red-500 rounded-sm"></span>
                    <span className="text-slate-500">Matches Tumor Site ({highlightTissue})</span>
                </div>
            )}
       </div>
    </div>
  );
};

export default GTExChart;