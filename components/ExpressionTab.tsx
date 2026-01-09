import React, { useState, useEffect, useMemo } from 'react';
import { Patient, CohortSample, GeneProfile } from '../types';
import ExpressionChart from './ExpressionChart';
import GeneInsightCard from './GeneInsightCard';
import GeneTable from './GeneTable';
import { Download, Filter } from 'lucide-react';

interface ExpressionTabProps {
  patient: Patient;
}

// Generate a static list of interesting genes with random values for the patient
const generatePatientGeneProfile = (): GeneProfile[] => {
  const genes = [
    'EGFR', 'TP53', 'PTEN', 'MYC', 'KRAS', 'BRCA1', 'BRCA2', 'IDH1', 'IDH2',
    'ATRX', 'TERT', 'CDKN2A', 'RB1', 'MET', 'CDK4', 'MDM2', 'ALK', 'ROS1',
    'RET', 'NTRK1', 'NTRK2', 'NTRK3', 'FGFR1', 'FGFR2', 'FGFR3', 'PIK3CA',
    'AKT1', 'MTOR', 'TSC1', 'TSC2', 'NF1', 'NF2', 'VHL', 'APC', 'CTNNB1',
    'SMAD4', 'ARID1A', 'BAP1', 'PBRM1', 'SETD2', 'KMT2D'
  ];

  return genes.map(symbol => {
    // Generate some "interesting" outliers
    let zScore = (Math.random() * 4) - 2; // -2 to 2 normal dist approximation
    
    // Force some known oncogenes to be high for demo
    if (['EGFR', 'MYC', 'CDK4', 'MDM2'].includes(symbol)) zScore += 1.5;
    // Force tumor suppressors low
    if (['TP53', 'PTEN', 'RB1', 'CDKN2A'].includes(symbol)) zScore -= 1.5;

    // Clamp
    zScore = Math.max(-4, Math.min(4, zScore));

    return { symbol, zScore };
  });
};

// Mock cohort generator that respects the patient's specific value
const generateCohortData = (gene: string, patientValue: number, currentPatientId: string): CohortSample[] => {
  const count = 50;
  const samples: CohortSample[] = [];
  
  for (let i = 0; i < count; i++) {
    if (i === 0) {
      samples.push({
        sampleId: currentPatientId,
        expression: patientValue,
        isCurrentPatient: true
      });
      continue;
    }

    // Generate background cohort data
    // Use a standard normal distribution roughly
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
  
  // Shuffle except the first one (which we want to find easily but chart handles sorting)
  const cohort = samples.slice(1);
  cohort.sort(() => Math.random() - 0.5);
  
  return [samples[0], ...cohort];
};

const ExpressionTab: React.FC<ExpressionTabProps> = ({ patient }) => {
  // Initialize patient's gene profile once
  const [patientGenes] = useState<GeneProfile[]>(() => generatePatientGeneProfile());
  const [selectedGene, setSelectedGene] = useState('EGFR');
  const [cohortData, setCohortData] = useState<CohortSample[]>([]);

  // Find the currently selected gene's data
  const currentGeneData = useMemo(() => 
    patientGenes.find(g => g.symbol === selectedGene) || { symbol: selectedGene, zScore: 0 },
  [patientGenes, selectedGene]);

  useEffect(() => {
    const data = generateCohortData(selectedGene, currentGeneData.zScore, patient.id);
    setCohortData(data);
  }, [selectedGene, currentGeneData.zScore, patient.id]);

  return (
    <div className="h-full">
      <div className="flex flex-col space-y-4">
        
        {/* Header / Options */}
        <div className="flex justify-between items-center bg-white p-3 rounded-lg border border-gray-200 shadow-sm">
             <h2 className="text-sm font-semibold text-slate-700 pl-1">
                mRNA Expression (z-scores relative to diploid samples)
             </h2>
             <div className="flex gap-2">
                <button className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-slate-600 bg-white border border-gray-300 rounded hover:bg-gray-50 transition-colors">
                    <Filter size={14} /> Filter
                </button>
                <button className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-slate-600 bg-white border border-gray-300 rounded hover:bg-gray-50 transition-colors">
                    <Download size={14} /> Download Data
                </button>
            </div>
        </div>

        {/* 3-Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            
            {/* Left Panel: Gene Table */}
            <div className="lg:col-span-3 h-[500px] lg:h-[700px]">
                <GeneTable 
                    genes={patientGenes} 
                    selectedGene={selectedGene} 
                    onSelectGene={setSelectedGene} 
                />
            </div>

            {/* Right Panel: Visualization & Insights */}
            <div className="lg:col-span-9 grid grid-cols-1 lg:grid-cols-3 gap-6">
                
                {/* Center: Chart */}
                <div className="lg:col-span-2 h-[450px]">
                    <ExpressionChart 
                        cohortData={cohortData} 
                        geneSymbol={selectedGene} 
                        patientId={patient.id} 
                    />
                     <div className="mt-4 bg-white p-5 rounded-lg shadow-sm border border-gray-200">
                        <h3 className="text-sm font-semibold text-slate-800 mb-3 border-b border-gray-100 pb-2">Selected Gene: {selectedGene}</h3>
                        <div className="flex justify-between items-end">
                            <div>
                                <p className="text-xs text-slate-500 uppercase tracking-wide font-medium">Patient Expression</p>
                                <div className="flex items-baseline gap-2 mt-1">
                                    <span className={`text-2xl font-bold font-mono ${Math.abs(currentGeneData.zScore) > 1.5 ? (currentGeneData.zScore > 0 ? 'text-red-600' : 'text-blue-600') : 'text-slate-700'}`}>
                                        {currentGeneData.zScore > 0 ? '+' : ''}{currentGeneData.zScore.toFixed(2)}
                                    </span>
                                    <span className="text-sm text-slate-400">Z-Score</span>
                                </div>
                            </div>
                            <div className="text-right">
                                <p className="text-xs text-slate-500 uppercase tracking-wide font-medium">Cohort Percentile</p>
                                <p className="text-lg font-medium text-slate-700 mt-1">
                                     {((cohortData.filter(d => d.expression < currentGeneData.zScore).length / cohortData.length) * 100).toFixed(1)}th
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right: AI Insights */}
                <div className="lg:col-span-1 h-full min-h-[400px]">
                    <GeneInsightCard 
                        geneSymbol={selectedGene} 
                        expressionValue={currentGeneData.zScore} 
                        cancerType={patient.cancerType}
                    />
                </div>
            </div>
        </div>
      </div>
    </div>
  );
};

export default ExpressionTab;
