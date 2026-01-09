import React from 'react';
import { Patient, Tab } from '../types';
import { User, Activity, Dna, FileText, BarChart2, Layers } from 'lucide-react';

interface LayoutProps {
  patient: Patient;
  activeTab: Tab;
  setActiveTab: (tab: Tab) => void;
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ patient, activeTab, setActiveTab, children }) => {
  return (
    <div className="min-h-screen flex flex-col bg-gray-50 text-slate-800">
      {/* Top Navbar */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-14 items-center">
            <div className="flex items-center space-x-3">
              <div className="bg-blue-600 p-1.5 rounded text-white">
                <Dna size={20} />
              </div>
              <span className="font-bold text-lg tracking-tight text-blue-900">cBioPortal <span className="font-normal text-slate-500">Simulator</span></span>
            </div>
            <div className="flex items-center space-x-4 text-sm text-slate-600">
              <span>Study: <span className="font-medium text-slate-900">{patient.studyId}</span></span>
              <div className="h-4 w-px bg-gray-300"></div>
              <span>Logged in as Guest</span>
            </div>
          </div>
        </div>
      </header>

      {/* Patient Banner */}
      <div className="bg-white shadow-sm border-b border-gray-200 pt-6 pb-2">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-start mb-6">
            <div>
              <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
                <User className="text-slate-400" size={24} />
                {patient.id}
              </h1>
              <p className="mt-1 text-sm text-slate-500">{patient.cancerType}</p>
            </div>
            <div className="grid grid-cols-3 gap-6 text-sm">
               <div>
                  <p className="text-slate-500 text-xs uppercase tracking-wider font-semibold">Age</p>
                  <p className="font-medium">{patient.age}</p>
               </div>
               <div>
                  <p className="text-slate-500 text-xs uppercase tracking-wider font-semibold">Sex</p>
                  <p className="font-medium">{patient.sex}</p>
               </div>
               <div>
                  <p className="text-slate-500 text-xs uppercase tracking-wider font-semibold">Mutations</p>
                  <p className="font-medium">{patient.mutationCount}</p>
               </div>
            </div>
          </div>

          {/* Navigation Tabs */}
          <nav className="-mb-px flex space-x-6 overflow-x-auto">
            {[
              { id: Tab.SUMMARY, icon: FileText },
              { id: Tab.CLINICAL, icon: Activity },
              { id: Tab.MUTATIONS, icon: Dna },
              { id: Tab.CNA, icon: Layers },
              { id: Tab.EXPRESSION, icon: BarChart2 },
            ].map((item) => {
              const isActive = activeTab === item.id;
              const Icon = item.icon;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`
                    whitespace-nowrap pb-3 px-1 border-b-2 font-medium text-sm flex items-center gap-2 transition-colors
                    ${isActive
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
                    }
                  `}
                >
                  <Icon size={16} />
                  {item.id}
                </button>
              );
            })}
          </nav>
        </div>
      </div>

      {/* Main Content */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {children}
      </main>
    </div>
  );
};

export default Layout;
