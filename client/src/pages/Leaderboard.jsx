import React, { useEffect, useState, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import API from '../api/axios';
import { Trophy, Medal, Star } from 'lucide-react';

const LeaderboardSkeleton = () => (
  <div className="flex-grow py-10 px-4 sm:px-6 lg:px-8 bg-gray-50 dark:bg-gray-900 transition-colors duration-300 animate-pulse">
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="rounded-xl shadow-lg p-8 bg-gradient-to-r from-yellow-500/90 to-yellow-600/90 dark:from-yellow-600/80 dark:to-amber-700/80">
        <div className="space-y-4">
          <div className="h-10 w-72 rounded-2xl bg-white/25" />
          <div className="h-5 w-96 rounded-full bg-white/20" />
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden transition-colors duration-300">
        {[...Array(6)].map((_, index) => (
          <div
            key={index}
            className={`flex items-center justify-between p-6 border-b border-gray-50 dark:border-gray-700 ${
              index < 3 ? 'bg-yellow-50/30 dark:bg-yellow-900/10' : ''
            }`}
          >
            <div className="flex items-center gap-4">
              <div className="h-8 w-8 rounded-full bg-gray-200 dark:bg-gray-700" />
              <div className="space-y-3">
                <div className="h-6 w-48 rounded-2xl bg-gray-200 dark:bg-gray-700" />
                <div className="h-4 w-28 rounded-full bg-gray-200 dark:bg-gray-700" />
              </div>
            </div>
            <div className="space-y-3 text-right">
              <div className="h-8 w-32 rounded-2xl bg-gray-200 dark:bg-gray-700" />
              <div className="h-4 w-24 rounded-full bg-gray-200 dark:bg-gray-700 ml-auto" />
              <div className="h-4 w-20 rounded-full bg-gray-200 dark:bg-gray-700 ml-auto" />
            </div>
          </div>
        ))}
      </div>
    </div>
  </div>
);

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
    return <LeaderboardSkeleton />;
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
                <div className="mt-1 text-sm font-semibold text-blue-600 dark:text-blue-400">
                  {sub.percentage ?? 0}% accuracy
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
