import React, { useEffect, useState, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import API from '../api/axios';
import { Trophy, Medal, Star } from 'lucide-react';

const Leaderboard = () => {
  const { user } = useContext(AuthContext);
  const [leaders, setLeaders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLeaderboard = async () => {
      try {
        const config = { headers: { Authorization: `Bearer ${user.token}` } };
        const { data } = await API.get('/submissions/leaderboard', config);
        setLeaders(data);
        setLoading(false);
      } catch (error) {
        console.error("Error fetching leaderboard", error);
        setLoading(false);
      }
    };
    if (user?.token) fetchLeaderboard();
  }, [user]);

  if (loading) {
    return (
      <div className="flex-grow flex items-center justify-center py-32">
        <div className="w-16 h-16 border-4 border-yellow-200 dark:border-yellow-900 border-t-yellow-500 dark:border-t-yellow-400 rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="flex-grow py-10 px-4 sm:px-6 lg:px-8 bg-gray-50 dark:bg-gray-900 transition-colors duration-300">
      <div className="max-w-4xl mx-auto">
        
        {/* Golden Banner */}
        <div className="bg-gradient-to-r from-yellow-500 to-yellow-600 dark:from-yellow-600 dark:to-amber-700 rounded-xl shadow-lg p-8 flex items-center justify-between text-white mb-8">
          <div>
            <h1 className="text-4xl font-extrabold flex items-center">
              <Trophy className="h-10 w-10 mr-3 text-yellow-200" /> Global Hall of Fame
            </h1>
            <p className="mt-2 text-yellow-100 text-lg">The absolute highest interview scores in MockForge history.</p>
          </div>
        </div>

        {/* Dynamic Leaderboard Row Generator */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden transition-colors duration-300">
          {leaders.map((sub, index) => (
            <div 
              key={sub._id} 
              className={`flex items-center justify-between p-6 border-b border-gray-50 dark:border-gray-700 transition-colors hover:bg-gray-50 dark:hover:bg-gray-700/50 ${index < 3 ? 'bg-yellow-50/30 dark:bg-yellow-900/10' : ''}`}
            >
              <div className="flex items-center">
                {/* Ranks 1, 2, and 3 get special shiny medals! */}
                {index === 0 && <Trophy className="h-8 w-8 text-yellow-500 mr-4" />}
                {index === 1 && <Medal className="h-8 w-8 text-gray-400 mr-4" />}
                {index === 2 && <Medal className="h-8 w-8 text-amber-700 dark:text-amber-500 mr-4" />}
                {index > 2 && <span className="text-xl font-bold text-gray-400 dark:text-gray-500 w-8 mr-4 text-center">#{index + 1}</span>}
                
                <div>
                  <h3 className={`text-xl font-bold ${index === 0 ? 'text-yellow-600 dark:text-yellow-400' : 'text-gray-900 dark:text-white'}`}>
                    {sub.user?.name || 'Unknown Candidate'}
                  </h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Topic: <span className="capitalize">{sub.topic}</span></p>
                </div>
              </div>

              <div className="text-right">
                <div className="text-2xl font-black text-gray-900 dark:text-white flex items-center justify-end">
                  {sub.score} <span className="text-sm text-gray-500 dark:text-gray-400 font-normal ml-1">/ {sub.totalPossible} pts</span>
                </div>
                <div className="text-xs text-gray-400 dark:text-gray-500 flex items-center justify-end mt-1">
                  <Star className="h-3 w-3 mr-1 text-yellow-400" /> Rank #{index + 1} Overall
                </div>
              </div>
            </div>
          ))}
        </div>

      </div>
    </div>
  );
};
export default Leaderboard;
