import React, {useEffect, useState, useContext } from 'react'; // importkiya useEffect and useState
import { Link } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { Code2, BrainCircuit, History } from 'lucide-react';
import API from '../api/axios';


const Dashboard = () => {
  const { user } = useContext(AuthContext);
  const [history, setHistory] = useState([]);
  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const config = { headers: { Authorization: `Bearer ${user.token}` } };
        const { data } = await API.get('/submissions/history', config);
        setHistory(data);
      } catch (error) {
        console.error("Error fetching history", error);
      }
    };
    
    // Safety check so it only fetches if user actually exists
    if (user?.token) {
      fetchHistory();
    }
  }, [user]);
  return (
    <div className="flex-grow py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* Welcome Banner */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-8 flex items-center justify-between transition-colors duration-300">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Welcome back, {user?.name}!</h1>
            <p className="mt-2 text-gray-600 dark:text-gray-400">Ready to crush your next technical interview?</p>
          </div>
          <BrainCircuit className="h-16 w-16 text-blue-500 dark:text-blue-400 opacity-20 hidden sm:block" />
        </div>
        {/* Action Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          
          <Link to="/interview">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-blue-100 dark:border-gray-700 p-6 cursor-pointer group transition-all duration-300 hover:-translate-y-1 hover:shadow-xl h-full">
              <div className="h-12 w-12 bg-blue-50 dark:bg-blue-900/30 rounded-lg flex items-center justify-center mb-4 group-hover:bg-blue-600 transition-colors">
                <Code2 className="h-6 w-6 text-blue-600 dark:text-blue-400 group-hover:text-white transition-colors" />
              </div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">Start Mock Interview</h2>
              <p className="mt-2 text-gray-600 dark:text-gray-400">Choose a topic like Arrays or Graphs and test your knowledge against the clock.</p>
            </div>
          </Link>
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-blue-100 dark:border-gray-700 p-6 cursor-pointer group transition-all duration-300 hover:-translate-y-1 hover:shadow-xl h-full">
            <div className="h-12 w-12 bg-gray-50 dark:bg-gray-700 rounded-lg flex items-center justify-center mb-4 group-hover:bg-gray-800 dark:group-hover:bg-gray-600 transition-colors">
              <History className="h-6 w-6 text-gray-600 dark:text-gray-400 group-hover:text-white transition-colors" />
            </div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">Attempt History</h2>
            <p className="mt-2 text-gray-600 dark:text-gray-400">Review your past scores and see detailed answer explanations to improve.</p>
          </div>
        </div>
        {/* Attempt History Table! */}
        {history.length > 0 && (
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-8 mt-8 transition-colors duration-300">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6 flex items-center">
              <History className="mr-2 text-blue-600 dark:text-blue-400" /> Your Recent Interviews
            </h2>
            
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b-2 border-gray-100 dark:border-gray-700 text-gray-500 dark:text-gray-400">
                    <th className="pb-3 px-4">Date</th>
                    <th className="pb-3 px-4">Topic</th>
                    <th className="pb-3 px-4">Score</th>
                  </tr>
                </thead>
                <tbody>
                  {history.map((sub) => (
                    <tr key={sub._id} className="border-b border-gray-50 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                      <td className="py-4 px-4 text-gray-700 dark:text-gray-300">{new Date(sub.createdAt).toLocaleDateString()}</td>
                      <td className="py-4 px-4 text-gray-700 dark:text-gray-300 capitalize">{sub.topic}</td>
                      <td className="py-4 px-4 font-bold text-blue-600 dark:text-blue-400">{sub.score} / {sub.totalPossible}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
export default Dashboard;
