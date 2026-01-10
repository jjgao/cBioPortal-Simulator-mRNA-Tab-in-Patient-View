import React, { useEffect, useState } from 'react';
import { getGeneInsight, SampleContext } from '../services/geminiService';
import { AIAnalysisResult } from '../types';
import { Sparkles, Loader2, AlertCircle, Zap, Copy } from 'lucide-react';

interface GeneInsightCardProps {
  geneSymbol: string;
  cancerType: string;
  samplesData: SampleContext[];
  normalTissueContext?: string;
}

const GeneInsightCard: React.FC<GeneInsightCardProps> = ({ geneSymbol, cancerType, samplesData, normalTissueContext }) => {
  const [insight, setInsight] = useState<AIAnalysisResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Use a ref to track if component is mounted to avoid state updates on unmount
  const [isMounted, setIsMounted] = useState(true);

  useEffect(() => {
    setIsMounted(true);
    return () => setIsMounted(false);
  }, []);

  useEffect(() => {
    const fetchInsight = async () => {
      setLoading(true);
      setError(null);
      setInsight(null);
      
      try {
        const data = await getGeneInsight(geneSymbol, cancerType, samplesData, normalTissueContext);
        if (isMounted) {
            setInsight(data);
        }
      } catch (err) {
        if (isMounted) {
            setError("Failed to generate AI insight.");
        }
      } finally {
        if (isMounted) {
            setLoading(false);
        }
      }
    };

    if (geneSymbol && samplesData.length > 0) {
      fetchInsight();
    }
  }, [geneSymbol, cancerType, JSON.stringify(samplesData), normalTissueContext, isMounted]);

  if (loading) {
    return (
      <div className="bg-gradient-to-br from-indigo-50 to-white p-6 rounded-lg shadow-sm border border-indigo-100 h-full flex flex-col items-center justify-center min-h-[250px]">
        <Loader2 className="animate-spin text-indigo-500 mb-2" size={24} />
        <p className="text-sm text-indigo-700 font-medium">Analyzing {geneSymbol}...</p>
        <p className="text-xs text-indigo-400 mt-1">Checking tumor vs normal tissue context...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 p-6 rounded-lg border border-red-100 h-full flex items-center justify-center">
         <div className="text-center">
            <AlertCircle className="mx-auto text-red-400 mb-2" />
            <p className="text-red-700 text-sm">{error}</p>
         </div>
      </div>
    );
  }

  if (!insight) return null;

  return (
    <div className="bg-white rounded-lg shadow-sm border border-indigo-100 overflow-hidden h-full flex flex-col">
      <div className="bg-indigo-50 px-4 py-3 border-b border-indigo-100 flex items-center justify-between">
        <h3 className="font-semibold text-indigo-900 flex items-center gap-2">
          <Sparkles size={16} className="text-indigo-500" />
          AI Gene Insight
        </h3>
        <span className="text-[10px] uppercase font-bold text-indigo-400 tracking-wider">Powered by Gemini</span>
      </div>
      
      {/* Sample Context Summary */}
      <div className="bg-white px-4 py-2 border-b border-gray-100 flex flex-col gap-2 max-h-32 overflow-y-auto">
        {samplesData.map(s => (
            <div key={s.sampleId} className="flex items-center gap-2 text-xs">
                <span className="font-semibold text-slate-700 min-w-[120px] truncate">{s.sampleId}:</span>
                <div className="flex gap-2">
                    {s.mutation ? (
                        <span className="inline-flex items-center gap-1 text-[10px] font-medium text-green-700 bg-green-50 px-1.5 py-0.5 rounded border border-green-100">
                            <Zap size={8} /> {s.mutation}
                        </span>
                    ) : (
                        <span className="text-slate-400 italic">WT</span>
                    )}
                    {s.cna && s.cna !== 'DIPLOID' && (
                        <span className={`inline-flex items-center gap-1 text-[10px] font-medium px-1.5 py-0.5 rounded border ${
                            s.cna === 'AMP' || s.cna === 'GAIN' ? 'text-red-700 bg-red-50 border-red-100' : 'text-blue-700 bg-blue-50 border-blue-100'
                        }`}>
                            <Copy size={8} /> {s.cna}
                        </span>
                    )}
                </div>
            </div>
        ))}
      </div>

      <div className="p-5 space-y-4 text-sm flex-1 overflow-y-auto">
        <div>
          <h4 className="font-semibold text-slate-800 mb-1">Biological Summary</h4>
          <p className="text-slate-600 leading-relaxed">{insight.summary}</p>
        </div>
        
        <div className="grid grid-cols-1 gap-4 mt-2">
            <div className="bg-blue-50 p-3 rounded-md border border-blue-100">
                <h4 className="font-semibold text-blue-900 mb-1 text-xs uppercase tracking-wide">Therapeutic Implications</h4>
                <p className="text-blue-800 text-xs leading-relaxed">{insight.therapeuticImplications}</p>
            </div>
            
            <div className="bg-emerald-50 p-3 rounded-md border border-emerald-100">
                <h4 className="font-semibold text-emerald-900 mb-1 text-xs uppercase tracking-wide">Prognostic Value</h4>
                <p className="text-emerald-800 text-xs leading-relaxed">{insight.prognosticValue}</p>
            </div>
        </div>
      </div>
      <div className="px-4 py-2 bg-slate-50 border-t border-slate-100 text-xs text-slate-400 text-center">
        AI-generated content. Verify with clinical literature.
      </div>
    </div>
  );
};

export default GeneInsightCard;
