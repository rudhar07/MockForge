import React, { useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import { Code2, BrainCircuit, History } from 'lucide-react';

const Dashboard = () => {
  const { user } = useContext(AuthContext);

  return (
    <div className="flex-grow py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* Welcome Banner */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Welcome back, {user?.name}!</h1>
            <p className="mt-2 text-gray-600">Ready to crush your next technical interview?</p>
          </div>
          <BrainCircuit className="h-16 w-16 text-blue-500 opacity-20 hidden sm:block" />
        </div>

        {/* Action Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          
          <div className="bg-white rounded-xl shadow-sm border border-blue-100 p-6 hover:shadow-md transition-shadow cursor-pointer group">
            <div className="h-12 w-12 bg-blue-50 rounded-lg flex items-center justify-center mb-4 group-hover:bg-blue-600 transition-colors">
              <Code2 className="h-6 w-6 text-blue-600 group-hover:text-white transition-colors" />
            </div>
            <h2 className="text-xl font-bold text-gray-900">Start Mock Interview</h2>
            <p className="mt-2 text-gray-600">Choose a topic like Arrays or Graphs and test your knowledge against the clock.</p>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-shadow cursor-pointer group">
            <div className="h-12 w-12 bg-gray-50 rounded-lg flex items-center justify-center mb-4 group-hover:bg-gray-800 transition-colors">
              <History className="h-6 w-6 text-gray-600 group-hover:text-white transition-colors" />
            </div>
            <h2 className="text-xl font-bold text-gray-900">Attempt History</h2>
            <p className="mt-2 text-gray-600">Review your past scores and see detailed answer explanations to improve.</p>
          </div>

        </div>
      </div>
    </div>
  );
};

export default Dashboard;
