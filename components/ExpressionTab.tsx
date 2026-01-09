import React, { useState, useEffect, useMemo } from 'react';
import { Patient, CohortSample, GeneProfile } from '../types';
import ExpressionChart from './ExpressionChart';
import GeneInsightCard from './GeneInsightCard';
import GeneTable from './GeneTable';
import { Download, Filter, Zap, Copy, GitMerge } from 'lucide-react';

interface ExpressionTabProps {
  patient: Patient;
}

// Generate gene profile based on Sample ID to simulate tumor evolution
const generatePatientGeneProfile = (sampleId: string): GeneProfile[] => {
  const genes = [
    'EGFR', 'TP53', 'PTEN', 'MYC', 'KRAS', 'BRCA1', 'BRCA2', 'IDH1', 'IDH2',
    'ATRX', 'TERT', 'CDKN2A', 'RB1', 'MET', 'CDK4', 'MDM2', 'ALK', 'ROS1',
    'RET', 'NTRK1', 'NTRK2', 'NTRK3', 'FGFR1', 'FGFR2', 'FGFR3', 'PIK3CA',
    'AKT1', 'MTOR', 'TSC1', 'TSC2', 'NF1', 'NF2', 'VHL', 'APC', 'CTNNB1',
    'SMAD4', 'ARID1A', 'BAP1', 'PBRM1', 'SETD2', 'KMT2D'
  ];

  // Check if this is the primary or recurrent sample
  // Primary usually ends in -01 in TCGA, Recurrent in -02
  const isRecurrent = sampleId.endsWith('-02');

  return genes.map(symbol => {
    // Default base profile
    let zScore = (Math.random() * 4) - 2; 
    let mutation: string | undefined;
    let cna: GeneProfile['cna'] = 'DIPLOID';
    let structuralVariant: string | undefined;

    // --- PRIMARY TUMOR PROFILE ---
    if (!isRecurrent) {
        if (symbol === 'EGFR') {
            zScore = 3.2; 
            cna = 'AMP'; 
            mutation = 'vIII'; 
        } else if (symbol === 'TP53') {
            zScore = -1.8;
            mutation = 'R273H'; 
            cna = 'HETLOSS';
        } else if (symbol === 'PTEN') {
            zScore = -2.5;
            cna = 'HOMDEL'; 
        } else if (symbol === 'MET') {
            zScore = 0.2; // Normal in primary
            cna = 'DIPLOID';
        }
    } 
    // --- RECURRENT/METASTATIC PROFILE (Evolution) ---
    else {
        if (symbol === 'EGFR') {
            zScore = 1.5; // Decreased expression due to treatment?
            cna = 'GAIN'; // Copy number reduced
            // Mutation might be lost or sub-clonal
        } else if (symbol === 'TP53') {
            zScore = -1.8; // Driver remains
            mutation = 'R273H'; 
            cna = 'HETLOSS';
        } else if (symbol === 'MET') {
            zScore = 4.1; // NEW Resistance mechanism!
            cna = 'AMP';
        } else if (symbol === 'PTEN') {
            zScore = -2.5; // Stays deleted
            cna = 'HOMDEL'; 
        }
    }

    // Common alterations across both
    if (symbol === 'CDKN2A') { zScore = -3.0; cna = 'HOMDEL'; }
    if (symbol === 'CDK4') { zScore = 2.1; cna = 'AMP'; }

    // Random noise cleanup
    if (!cna || cna === 'DIPLOID') {
        const rand = Math.random();
        if (rand > 0.95) cna = 'AMP';
        else if (rand < 0.05) cna = 'HETLOSS';
    }

    // Clamp Z-Score
    zScore = Math.max(-4, Math.min(4, zScore));

    return { symbol, zScore, mutation, cna, structuralVariant };
  });
};

// Mock cohort generator that includes ALL patient samples
const generateCohortData = (gene: string, patientSamples: {id: string, type: string, zScore: number}[]): CohortSample[] => {
  const count = 50;
  const samples: CohortSample[] = [];
  
  // Add Cohort Background
  for (let i = 0; i < count; i++) {
    let u = 0, v = 0;
    while(u === 0) u = Math.random();
    while(v === 0) v = Math.random();
    let z = Math.sqrt( -2.0 * Math.log( u ) ) * Math.cos( 2.0 * Math.PI * v );
    
    samples.push({
      sampleId: `TCGA-XX-${1000 + i}`,
      expression: z,
      isCurrentPatient: false
    });
  }
  
  // Add All Patient Samples
  patientSamples.forEach(ps => {
    samples.push({
      sampleId: ps.id,
      sampleType: ps.type,
      expression: ps.zScore,
      isCurrentPatient: true
    });
  });

  return samples;
};

const ExpressionTab: React.FC<ExpressionTabProps> = ({ patient }) => {
  const [selectedGene, setSelectedGene] = useState('EGFR');
  
  // 1. Get FULL Data for ALL samples (for Chart + Detail Box + AI)
  const allPatientSamplesFullData = useMemo(() => {
    return patient.samples.map(sample => {
        const genes = generatePatientGeneProfile(sample.id);
        const gene = genes.find(g => g.symbol === selectedGene) || { 
            symbol: selectedGene, zScore: 0, cna: 'DIPLOID' 
        };
        return {
            sampleId: sample.id,
            sampleType: sample.sampleType,
            expressionValue: gene.zScore,
            ...gene // symbol, zScore, mutation, cna, etc.
        };
    });
  }, [patient.samples, selectedGene]);

  // 2. Aggregate ALL samples for ALL genes (for Table)
  const aggregatedGeneData = useMemo(() => {
    const map: Record<string, { symbol: string, samples: Record<string, GeneProfile> }> = {};
    
    patient.samples.forEach(sample => {
        const genes = generatePatientGeneProfile(sample.id);
        genes.forEach(gene => {
            if (!map[gene.symbol]) {
                map[gene.symbol] = { symbol: gene.symbol, samples: {} };
            }
            map[gene.symbol].samples[sample.id] = gene;
        });
    });
    
    return Object.values(map);
  }, [patient.samples]);

  const [cohortData, setCohortData] = useState<CohortSample[]>([]);

  useEffect(() => {
    // Map full data to format expected by cohort generator
    const chartSamples = allPatientSamplesFullData.map(s => ({
        id: s.sampleId,
        type: s.sampleType,
        zScore: s.expressionValue
    }));
    const data = generateCohortData(selectedGene, chartSamples);
    setCohortData(data);
  }, [selectedGene, allPatientSamplesFullData]);

  return (
    <div className="h-full">
      <div className="flex flex-col space-y-4">
        
        {/* Header / Options */}
        <div className="flex flex-wrap gap-4 justify-between items-center bg-white p-3 rounded-lg border border-gray-200 shadow-sm">
             <div className="flex items-center gap-4">
                <h2 className="text-sm font-bold text-slate-800">Expression Analysis</h2>

                <div className="hidden md:block h-6 w-px bg-gray-200"></div>

                <div className="flex items-center gap-2 text-xs text-slate-500">
                    <span className="flex items-center gap-1"><Zap size={10} className="text-green-600"/> Mutation</span>
                    <span className="flex items-center gap-1"><Copy size={10} className="text-red-500"/> CNA</span>
                    <span className="flex items-center gap-1"><GitMerge size={10} className="text-purple-500"/> Fusion</span>
                </div>
             </div>
             
             <div className="flex gap-2">
                <button className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-slate-600 bg-white border border-gray-300 rounded hover:bg-gray-50 transition-colors">
                    <Filter size={14} /> Filter
                </button>
                <button className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-slate-600 bg-white border border-gray-300 rounded hover:bg-gray-50 transition-colors">
                    <Download size={14} /> Download
                </button>
            </div>
        </div>

        {/* 3-Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            
            {/* Left Panel: Gene Table */}
            <div className="lg:col-span-5 h-[500px] lg:h-[700px]">
                <GeneTable 
                    data={aggregatedGeneData}
                    samples={patient.samples}
                    selectedGene={selectedGene} 
                    onSelectGene={setSelectedGene} 
                />
            </div>

            {/* Right Panel: Visualization & Insights */}
            <div className="lg:col-span-7 grid grid-cols-1 lg:grid-cols-2 gap-6">
                
                {/* Center: Chart */}
                <div className="lg:col-span-2 h-[450px]">
                    <ExpressionChart 
                        cohortData={cohortData} 
                        geneSymbol={selectedGene} 
                        patientId={patient.id}
                    />
                     <div className="mt-4 bg-white p-5 rounded-lg shadow-sm border border-gray-200">
                        <div className="mb-3 border-b border-gray-100 pb-2">
                            <h3 className="text-sm font-semibold text-slate-800">Selected Gene: {selectedGene}</h3>
                        </div>

                        {/* List all samples */}
                        <div className="grid grid-cols-1 gap-2">
                            {allPatientSamplesFullData.map(sample => (
                                <div key={sample.sampleId} className="flex items-center justify-between p-2 bg-slate-50 rounded border border-slate-100">
                                    <div className="flex flex-col">
                                        <span className="text-xs font-bold text-slate-700">{sample.sampleId}</span>
                                        <span className="text-[10px] text-slate-400">{sample.sampleType}</span>
                                    </div>
                                    
                                    <div className="flex items-center gap-4">
                                        {/* Alterations */}
                                        <div className="flex gap-1">
                                            {sample.mutation && (
                                                <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] font-medium bg-green-100 text-green-700 border border-green-200">
                                                    <Zap size={10} /> {sample.mutation}
                                                </span>
                                            )}
                                            {sample.cna && sample.cna !== 'DIPLOID' && (
                                                <span className={`inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] font-medium border ${
                                                    sample.cna === 'AMP' || sample.cna === 'GAIN' 
                                                        ? 'bg-red-50 text-red-700 border-red-100' 
                                                        : 'bg-blue-50 text-blue-700 border-blue-100'
                                                }`}>
                                                    <Copy size={10} /> {sample.cna}
                                                </span>
                                            )}
                                            {sample.structuralVariant && (
                                                <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] font-medium bg-purple-100 text-purple-700 border border-purple-200">
                                                    <GitMerge size={10} /> Fus
                                                </span>
                                            )}
                                            {!sample.mutation && (!sample.cna || sample.cna === 'DIPLOID') && !sample.structuralVariant && (
                                                <span className="text-[10px] text-slate-300 italic">No alterations</span>
                                            )}
                                        </div>

                                        {/* Z-Score */}
                                        <div className="w-24 text-right">
                                            <span className={`text-lg font-bold font-mono ${Math.abs(sample.expressionValue) > 1.5 ? (sample.expressionValue > 0 ? 'text-red-600' : 'text-blue-600') : 'text-slate-700'}`}>
                                                {sample.expressionValue > 0 ? '+' : ''}{sample.expressionValue.toFixed(2)}
                                            </span>
                                            <span className="text-[10px] text-slate-400 block -mt-1">Z-Score</span>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Bottom: AI Insights */}
                <div className="lg:col-span-2 h-full min-h-[300px]">
                    <GeneInsightCard 
                        geneSymbol={selectedGene}
                        cancerType={patient.cancerType}
                        samplesData={allPatientSamplesFullData}
                    />
                </div>
            </div>
        </div>
      </div>
    </div>
  );
};

export default ExpressionTab;
