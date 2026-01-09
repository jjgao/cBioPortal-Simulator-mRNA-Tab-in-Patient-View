import React, { useState, useMemo } from 'react';
import { GeneProfile, Sample } from '../types';
import { Search, ArrowUpDown, ArrowUp, ArrowDown, Zap, Copy, GitMerge } from 'lucide-react';

interface GeneRow {
    symbol: string;
    samples: Record<string, GeneProfile>;
}

interface GeneTableProps {
  data: GeneRow[];
  samples: Sample[];
  selectedGene: string;
  onSelectGene: (gene: string) => void;
}

// Sort by symbol or by the zScore of a specific sample
type SortField = 'symbol' | string; // 'symbol' or sampleId
type SortDirection = 'asc' | 'desc';

const GeneTable: React.FC<GeneTableProps> = ({ data, samples, selectedGene, onSelectGene }) => {
  const [filter, setFilter] = useState('');
  // Default sort by the first sample's z-score
  const [sortField, setSortField] = useState<SortField>(samples[0]?.id || 'symbol');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection(descendingDefault(field) ? 'desc' : 'asc');
    }
  };

  const descendingDefault = (field: SortField) => field !== 'symbol';

  const processedData = useMemo(() => {
    let result = [...data];

    // Filter
    if (filter) {
      const lowerFilter = filter.toLowerCase();
      result = result.filter(row => row.symbol.toLowerCase().includes(lowerFilter));
    }

    // Sort
    result.sort((a, b) => {
      let valA: any;
      let valB: any;

      if (sortField === 'symbol') {
         valA = a.symbol;
         valB = b.symbol;
      } else {
         // Sort by zScore of the specific sample
         valA = a.samples[sortField]?.zScore ?? -999;
         valB = b.samples[sortField]?.zScore ?? -999;
      }
      
      if (typeof valA === 'string') valA = valA.toLowerCase();
      if (typeof valB === 'string') valB = valB.toLowerCase();

      if (valA < valB) return sortDirection === 'asc' ? -1 : 1;
      if (valA > valB) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });

    return result;
  }, [data, filter, sortField, sortDirection]);

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) return <ArrowUpDown size={12} className="text-slate-300 ml-1 inline" />;
    return sortDirection === 'asc' 
      ? <ArrowUp size={12} className="text-blue-600 ml-1 inline" />
      : <ArrowDown size={12} className="text-blue-600 ml-1 inline" />;
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 flex flex-col h-full max-h-[850px]">
      <div className="p-3 border-b border-gray-200">
        <div className="relative">
            <input
              type="text"
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-gray-50 border border-gray-200 rounded text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
              placeholder="Filter genes..."
            />
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
        </div>
      </div>
      
      {/* Header */}
      <div className="flex bg-gray-50 border-b border-gray-200 text-xs font-semibold text-slate-500 uppercase tracking-wider sticky top-0 z-10">
        <div 
            className="flex-none w-24 px-4 py-3 flex items-center cursor-pointer hover:text-slate-700 border-r border-gray-100"
            onClick={() => handleSort('symbol')}
        >
            Gene <SortIcon field="symbol" />
        </div>
        
        {/* Dynamic Headers for Samples */}
        {samples.map(sample => (
            <div 
                key={sample.id}
                className="flex-1 px-3 py-3 flex items-center justify-end cursor-pointer hover:text-slate-700 border-r border-gray-100 last:border-0"
                onClick={() => handleSort(sample.id)}
            >
                <div className="flex flex-col items-end truncate">
                    <span className="truncate max-w-[100px]" title={sample.id}>{sample.id}</span>
                    <span className="text-[10px] text-slate-400 font-normal lowercase truncate max-w-[100px]">{sample.sampleType}</span>
                </div>
                <SortIcon field={sample.id} />
            </div>
        ))}
      </div>

      {/* List */}
      <div className="overflow-y-auto flex-1 custom-scrollbar">
        {processedData.length === 0 ? (
             <div className="p-4 text-center text-sm text-slate-400">No genes found</div>
        ) : (
            processedData.map((row) => {
              const isSelected = selectedGene === row.symbol;
              
              return (
                <button
                  key={row.symbol}
                  onClick={() => onSelectGene(row.symbol)}
                  className={`
                    w-full flex text-sm border-b border-gray-100 last:border-0 items-stretch transition-colors text-left
                    ${isSelected ? 'bg-blue-50' : 'hover:bg-gray-50'}
                  `}
                >
                  {/* Gene Symbol */}
                  <div className={`flex-none w-24 px-4 py-3 flex items-center font-medium border-r border-gray-100/50 ${isSelected ? 'text-blue-800' : 'text-slate-700'}`}>
                    {row.symbol}
                  </div>

                  {/* Sample Columns */}
                  {samples.map(sample => {
                      const profile = row.samples[sample.id];
                      const zScore = profile?.zScore;
                      const isHigh = zScore && zScore > 1.5;
                      const isLow = zScore && zScore < -1.5;

                      return (
                        <div key={sample.id} className="flex-1 px-3 py-2 flex flex-col justify-center items-end border-r border-gray-100/50 last:border-0">
                            {profile ? (
                                <>
                                    <div className={`font-mono text-sm ${isHigh ? 'text-red-600 font-bold' : isLow ? 'text-blue-600 font-bold' : 'text-slate-500'}`}>
                                        {zScore > 0 ? '+' : ''}{zScore.toFixed(2)}
                                    </div>
                                    
                                    {/* Badges for this sample */}
                                    <div className="flex flex-wrap gap-1 justify-end mt-1 w-full">
                                        {profile.mutation && (
                                            <span className="inline-flex items-center gap-0.5 px-1 py-0.5 rounded-[3px] text-[9px] font-medium bg-green-100 text-green-700 border border-green-200" title={`Mutation: ${profile.mutation}`}>
                                                <Zap size={8} /> {profile.mutation}
                                            </span>
                                        )}
                                        {profile.cna && profile.cna !== 'DIPLOID' && (
                                            <span className={`inline-flex items-center gap-0.5 px-1 py-0.5 rounded-[3px] text-[9px] font-medium border ${
                                                profile.cna === 'AMP' || profile.cna === 'GAIN' 
                                                    ? 'bg-red-50 text-red-700 border-red-100' 
                                                    : 'bg-blue-50 text-blue-700 border-blue-100'
                                            }`} title={`CNA: ${profile.cna}`}>
                                                <Copy size={8} /> {profile.cna.substring(0,3)}
                                            </span>
                                        )}
                                        {profile.structuralVariant && (
                                            <span className="inline-flex items-center gap-0.5 px-1 py-0.5 rounded-[3px] text-[9px] font-medium bg-purple-100 text-purple-700 border border-purple-200" title={`Fusion: ${profile.structuralVariant}`}>
                                                <GitMerge size={8} /> Fus
                                            </span>
                                        )}
                                    </div>
                                </>
                            ) : (
                                <span className="text-slate-300">-</span>
                            )}
                        </div>
                      );
                  })}
                </button>
              );
            })
        )}
      </div>
      <div className="p-2 border-t border-gray-200 bg-gray-50 text-xs text-slate-400 text-center">
        {processedData.length} genes listed
      </div>
    </div>
  );
};

export default GeneTable;