import React, { useState, useEffect, useMemo } from 'react';
import { Patient, CohortSample, GeneProfile, GTExData, CohortScope } from '../types';
import ExpressionChart from './ExpressionChart';
import GTExChart from './GTExChart';
import GeneInsightCard from './GeneInsightCard';
import GeneTable from './GeneTable';
import { Download, Filter, Zap, Copy, GitMerge, Users, LayoutGrid, Activity } from 'lucide-react';

interface ExpressionTabProps {
  patient: Patient;
}

type ViewMode = 'tumor_cohort' | 'normal_tissues';

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

    zScore = Math.max(-4, Math.min(4, zScore));

    return { symbol, zScore, mutation, cna, structuralVariant };
  });
};

const generateCohortData = (
    gene: string, 
    patientSamples: {id: string, type: string, zScore: number}[],
    scope: CohortScope,
    patientCancerType: string
): CohortSample[] => {
  const count = scope === 'pancancer' ? 200 : 60;
  const samples: CohortSample[] = [];
  
  for (let i = 0; i < count; i++) {
    let u = 0, v = 0;
    while(u === 0) u = Math.random();
    while(v === 0) v = Math.random();
    let z = Math.sqrt( -2.0 * Math.log( u ) ) * Math.cos( 2.0 * Math.PI * v );
    
    if (scope === 'cancer_type') {
        z = z * 0.9;
    }

    let sampleTypeLabel = patientCancerType;
    if (scope === 'pancancer') {
        const types = ['BRCA', 'LUAD', 'SKCM', 'COAD', 'PRAD', 'KIRC', patientCancerType];
        sampleTypeLabel = types[Math.floor(Math.random() * types.length)];
    }

    samples.push({
      sampleId: `TCGA-Mock-${1000 + i}`,
      sampleType: sampleTypeLabel,
      expression: z,
      isCurrentPatient: false
    });
  }
  
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

// Generate Mock GTEx Data
const generateGTExData = (gene: string): GTExData[] => {
  const tissues = [
    'Adipose', 'Adrenal', 'Bladder', 'Blood', 'Brain', 'Breast', 'Cervix', 
    'Colon', 'Esophagus', 'Heart', 'Kidney', 'Liver', 'Lung', 'Muscle', 
    'Nerve', 'Ovary', 'Pancreas', 'Prostate', 'Skin', 'Stomach', 'Thyroid', 'Uterus'
  ];

  return tissues.map(tissue => {
    let base = Math.random() * 10;
    
    // Customize specific genes to look realistic
    if (gene === 'EGFR') {
        if (tissue === 'Skin' || tissue === 'Liver') base = 40 + Math.random() * 20;
        if (tissue === 'Brain') base = 5 + Math.random() * 5; // Low in normal brain
    } else if (gene === 'TP53') {
        base = 15 + Math.random() * 10; // Ubiquitous
    } else if (gene === 'PTEN') {
        base = 20 + Math.random() * 10;
        if (tissue === 'Brain') base = 30;
    } else if (gene === 'BRCA1' || gene === 'BRCA2') {
        if (tissue === 'Breast' || tissue === 'Ovary') base = 25 + Math.random() * 10;
    }

    return {
        tissue,
        expression: base, // TPM
        stdDev: base * 0.2
    };
  });
};

const ExpressionTab: React.FC<ExpressionTabProps> = ({ patient }) => {
  const [selectedGene, setSelectedGene] = useState('EGFR');
  const [cohortScope, setCohortScope] = useState<CohortScope>('pancancer');
  const [viewMode, setViewMode] = useState<ViewMode>('tumor_cohort');
  
  // 1. Get FULL Data for ALL samples
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
            ...gene 
        };
    });
  }, [patient.samples, selectedGene]);

  // 2. Aggregate Data for Table
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
  const [gtexData, setGtexData] = useState<GTExData[]>([]);

  useEffect(() => {
    // Cohort Data
    const chartSamples = allPatientSamplesFullData.map(s => ({
        id: s.sampleId,
        type: s.sampleType,
        zScore: s.expressionValue
    }));
    setCohortData(generateCohortData(selectedGene, chartSamples, cohortScope, patient.cancerType));
    
    // GTEx Data
    setGtexData(generateGTExData(selectedGene));
  }, [selectedGene, allPatientSamplesFullData, cohortScope, patient.cancerType]);

  // Determine the relevant normal tissue based on cancer type
  const targetTissue = useMemo(() => {
    const c = patient.cancerType.toLowerCase();
    if (c.includes('glioblastoma') || c.includes('brain') || c.includes('glioma')) return 'Brain';
    if (c.includes('lung')) return 'Lung';
    if (c.includes('breast')) return 'Breast';
    if (c.includes('melanoma') || c.includes('skin')) return 'Skin';
    if (c.includes('renal') || c.includes('kidney')) return 'Kidney';
    if (c.includes('colorectal') || c.includes('colon')) return 'Colon';
    if (c.includes('prostate')) return 'Prostate';
    if (c.includes('pancreas') || c.includes('pancreatic')) return 'Pancreas';
    if (c.includes('liver') || c.includes('hepato')) return 'Liver';
    if (c.includes('ovary') || c.includes('ovarian')) return 'Ovary';
    if (c.includes('thyroid')) return 'Thyroid';
    if (c.includes('stomach') || c.includes('gastric')) return 'Stomach';
    if (c.includes('bladder') || c.includes('urothelial')) return 'Bladder';
    if (c.includes('uterus') || c.includes('uterine') || c.includes('endometrial')) return 'Uterus';
    if (c.includes('cervix') || c.includes('cervical')) return 'Cervix';
    if (c.includes('esophagus') || c.includes('esophageal')) return 'Esophagus';
    return undefined;
  }, [patient.cancerType]);

  // Prepare context string for AI
  const aiNormalContext = useMemo(() => {
    const sortedGtex = [...gtexData].sort((a,b) => b.expression - a.expression);
    const top3 = sortedGtex.slice(0,3).map(g => `${g.tissue} (${g.expression.toFixed(1)} TPM)`).join(', ');
    
    const relevantTissueData = gtexData.find(g => g.tissue === targetTissue);
    
    let context = `In normal tissues (GTEx), highest expression is found in: ${top3}.`;
    if (relevantTissueData) {
        context += ` Normal expression in ${relevantTissueData.tissue} is ${relevantTissueData.expression.toFixed(1)} TPM.`;
    }
    return context;
  }, [gtexData, targetTissue]);

  return (
    <div className="h-full">
      <div className="flex flex-col space-y-4">
        
        {/* Header / Options */}
        <div className="flex flex-wrap gap-4 justify-between items-center bg-white p-3 rounded-lg border border-gray-200 shadow-sm">
             <div className="flex items-center gap-4">
                <h2 className="text-sm font-bold text-slate-800">Expression Analysis</h2>

                <div className="hidden lg:flex items-center gap-2 text-xs text-slate-500">
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
                
                {/* Center: Chart Area (Swappable) */}
                <div className="lg:col-span-2 h-[600px] flex flex-col">
                    {/* View Switcher Tabs */}
                    <div className="flex gap-1 mb-2">
                        <button 
                            onClick={() => setViewMode('tumor_cohort')}
                            className={`px-4 py-2 text-xs font-semibold rounded-t-lg border-t border-x transition-colors ${
                                viewMode === 'tumor_cohort' 
                                ? 'bg-white border-gray-200 text-blue-600 border-b-white -mb-px relative z-10' 
                                : 'bg-gray-50 border-transparent text-slate-500 hover:text-slate-700'
                            }`}
                        >
                            Tumor Cohort (TCGA)
                        </button>
                        <button 
                            onClick={() => setViewMode('normal_tissues')}
                            className={`px-4 py-2 text-xs font-semibold rounded-t-lg border-t border-x transition-colors flex items-center gap-1.5 ${
                                viewMode === 'normal_tissues' 
                                ? 'bg-white border-gray-200 text-blue-600 border-b-white -mb-px relative z-10' 
                                : 'bg-gray-50 border-transparent text-slate-500 hover:text-slate-700'
                            }`}
                        >
                            <Activity size={12} />
                            Normal Tissues (GTEx)
                        </button>
                    </div>

                    <div className="flex-1 bg-white border border-gray-200 rounded-b-lg rounded-tr-lg p-1 shadow-sm relative z-0">
                        {viewMode === 'tumor_cohort' ? (
                            <div className="h-full p-2">
                                <ExpressionChart 
                                    cohortData={cohortData} 
                                    geneSymbol={selectedGene} 
                                    patientId={patient.id}
                                    cohortScope={cohortScope}
                                    setCohortScope={setCohortScope}
                                    cancerType={patient.cancerType}
                                />
                            </div>
                        ) : (
                            <div className="h-full p-2">
                                <GTExChart 
                                    data={gtexData}
                                    geneSymbol={selectedGene}
                                    highlightTissue={targetTissue}
                                />
                            </div>
                        )}
                    </div>

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
                        normalTissueContext={aiNormalContext}
                    />
                </div>
            </div>
        </div>
      </div>
    </div>
  );
};

export default ExpressionTab;