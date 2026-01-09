export interface Patient {
  id: string;
  studyId: string;
  cancerType: string;
  age: number;
  sex: 'Male' | 'Female';
  mutationCount: number;
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
}

export interface CohortSample {
  sampleId: string;
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
