import React, { useState, useMemo } from 'react';
import { GeneProfile } from '../types';
import { Search, ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react';

interface GeneTableProps {
  genes: GeneProfile[];
  selectedGene: string;
  onSelectGene: (gene: string) => void;
}

type SortField = 'symbol' | 'zScore';
type SortDirection = 'asc' | 'desc';

const GeneTable: React.FC<GeneTableProps> = ({ genes, selectedGene, onSelectGene }) => {
  const [filter, setFilter] = useState('');
  const [sortField, setSortField] = useState<SortField>('zScore');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc'); // Default to showing outliers first

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection(descendingDefault(field) ? 'desc' : 'asc');
    }
  };

  const descendingDefault = (field: SortField) => field === 'zScore';

  const processedGenes = useMemo(() => {
    let data = [...genes];

    // Filter
    if (filter) {
      const lowerFilter = filter.toLowerCase();
      data = data.filter(g => g.symbol.toLowerCase().includes(lowerFilter));
    }

    // Sort
    data.sort((a, b) => {
      let valA: any = a[sortField];
      let valB: any = b[sortField];
      
      // For Z-score sorting, usually we care about magnitude if we want "most altered",
      // but standard sort is typically algebraic. Let's stick to algebraic (-2 < 2).
      
      if (typeof valA === 'string') valA = valA.toLowerCase();
      if (typeof valB === 'string') valB = valB.toLowerCase();

      if (valA < valB) return sortDirection === 'asc' ? -1 : 1;
      if (valA > valB) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });

    return data;
  }, [genes, filter, sortField, sortDirection]);

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) return <ArrowUpDown size={12} className="text-slate-300 ml-1" />;
    return sortDirection === 'asc' 
      ? <ArrowUp size={12} className="text-blue-600 ml-1" />
      : <ArrowDown size={12} className="text-blue-600 ml-1" />;
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
      <div className="grid grid-cols-2 px-4 py-2 bg-gray-50 border-b border-gray-200 text-xs font-semibold text-slate-500 uppercase tracking-wider">
        <div 
            className="flex items-center cursor-pointer hover:text-slate-700"
            onClick={() => handleSort('symbol')}
        >
            Gene <SortIcon field="symbol" />
        </div>
        <div 
            className="flex items-center justify-end cursor-pointer hover:text-slate-700"
            onClick={() => handleSort('zScore')}
        >
            Z-Score <SortIcon field="zScore" />
        </div>
      </div>

      {/* List */}
      <div className="overflow-y-auto flex-1 custom-scrollbar">
        {processedGenes.length === 0 ? (
             <div className="p-4 text-center text-sm text-slate-400">No genes found</div>
        ) : (
            processedGenes.map((gene) => {
              const isSelected = selectedGene === gene.symbol;
              const isHigh = gene.zScore > 1.5;
              const isLow = gene.zScore < -1.5;
              
              return (
                <button
                  key={gene.symbol}
                  onClick={() => onSelectGene(gene.symbol)}
                  className={`
                    w-full grid grid-cols-2 px-4 py-3 text-sm border-b border-gray-100 last:border-0 items-center transition-colors text-left
                    ${isSelected ? 'bg-blue-50 text-blue-800' : 'hover:bg-gray-50 text-slate-700'}
                  `}
                >
                  <div className="font-medium">{gene.symbol}</div>
                  <div className={`text-right font-mono ${isHigh ? 'text-red-600 font-bold' : isLow ? 'text-blue-600 font-bold' : 'text-slate-500'}`}>
                    {gene.zScore > 0 ? '+' : ''}{gene.zScore.toFixed(2)}
                  </div>
                </button>
              );
            })
        )}
      </div>
      <div className="p-2 border-t border-gray-200 bg-gray-50 text-xs text-slate-400 text-center">
        {processedGenes.length} genes listed
      </div>
    </div>
  );
};

export default GeneTable;
