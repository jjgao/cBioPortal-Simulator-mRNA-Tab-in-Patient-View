export interface Sample {
  id: string;
  sampleType: string; // e.g., 'Primary Solid Tumor', 'Metastasis'
}

export interface Patient {
  id: string;
  studyId: string;
  cancerType: string;
  age: number;
  sex: 'Male' | 'Female';
  mutationCount: number;
  samples: Sample[];
}

export interface GeneExpression {
  hugoGeneSymbol: string;
  entrezGeneId: number;
  expression: number; // Z-score typically
  expressionType: 'mRNA' | 'Protein';
  cohortMean: number;
  cohortStd: number;
}

export interface GeneProfile {
  symbol: string;
  zScore: number;
  cytoband?: string;
  mutation?: string; // e.g., 'V600E', 'Missense'
  cna?: 'AMP' | 'HOMDEL' | 'GAIN' | 'HETLOSS' | 'DIPLOID';
  structuralVariant?: string; // e.g., 'TMPRSS2-ERG'
}

export interface CohortSample {
  sampleId: string;
  sampleType?: string;
  expression: number;
  isCurrentPatient: boolean;
}

export enum Tab {
  SUMMARY = 'Summary',
  CLINICAL = 'Clinical',
  MUTATIONS = 'Mutations',
  EXPRESSION = 'Expression',
  CNA = 'Copy Number',
}

export interface AIAnalysisResult {
  summary: string;
  therapeuticImplications: string;
  prognosticValue: string;
}
