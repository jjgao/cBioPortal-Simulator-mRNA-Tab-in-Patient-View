import React, { useState } from 'react';
import Layout from './components/Layout';
import ExpressionTab from './components/ExpressionTab';
import { Patient, Tab } from './types';

// Mock Patient Data
const MOCK_PATIENT: Patient = {
  id: 'TCGA-02-0001',
  studyId: 'gbm_tcga',
  cancerType: 'Glioblastoma Multiforme',
  age: 59,
  sex: 'Male',
  mutationCount: 42
};

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<Tab>(Tab.EXPRESSION);

  return (
    <Layout 
      patient={MOCK_PATIENT} 
      activeTab={activeTab} 
      setActiveTab={setActiveTab}
    >
      {activeTab === Tab.EXPRESSION ? (
        <ExpressionTab patient={MOCK_PATIENT} />
      ) : (
        <div className="flex flex-col items-center justify-center h-[400px] text-center p-8 bg-white rounded-lg shadow-sm border border-dashed border-gray-300">
          <h2 className="text-xl font-semibold text-slate-400 mb-2">Tab Under Construction</h2>
          <p className="text-slate-500 max-w-md">
            The <strong>{activeTab}</strong> view is not implemented in this demo. 
            Please switch to the <strong>Expression</strong> tab to see the visualization and AI features.
          </p>
        </div>
      )}
    </Layout>
  );
};

export default App;
