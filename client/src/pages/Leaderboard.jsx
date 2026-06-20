import React, { useEffect, useState, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import API from '../api/axios';
import { Trophy, Medal, Crown, Sparkles } from 'lucide-react';

// Deterministic avatar color from a name so each player keeps a stable hue.
const AVATAR_COLORS = [
  'from-blue-500 to-indigo-600',
  'from-amber-500 to-orange-600',
  'from-emerald-500 to-teal-600',
  'from-fuchsia-500 to-purple-600',
  'from-rose-500 to-pink-600',
  'from-cyan-500 to-sky-600',
];
const colorFor = (name = '') => {
  let hash = 0;
  for (let i = 0; i < name.length; i += 1) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
};
const initials = (name = '') =>
  name.trim().split(/\s+/).slice(0, 2).map((w) => w[0]?.toUpperCase() ?? '').join('') || '?';

const Avatar = ({ name, size = 'h-12 w-12 text-base' }) => (
  <div className={`${size} rounded-2xl bg-gradient-to-br ${colorFor(name)} flex items-center justify-center font-bold text-white shadow-md shrink-0`}>
    {initials(name)}
  </div>
);

const LeaderboardSkeleton = () => (
  <div className="flex-grow py-10 px-4 sm:px-6 lg:px-8 animate-pulse">
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="h-32 rounded-3xl bg-gray-200/70 dark:bg-gray-800/70" />
      <div className="grid grid-cols-3 gap-4 items-end">
        <div className="h-40 rounded-3xl bg-gray-200/70 dark:bg-gray-800/70" />
        <div className="h-52 rounded-3xl bg-gray-200/70 dark:bg-gray-800/70" />
        <div className="h-36 rounded-3xl bg-gray-200/70 dark:bg-gray-800/70" />
      </div>
      {[...Array(4)].map((_, i) => (
        <div key={i} className="h-20 rounded-2xl bg-gray-200/70 dark:bg-gray-800/70" />
      ))}
    </div>
  </div>
);

const PodiumCard = ({ entry, rank, isYou }) => {
  const styles = {
    1: { height: 'sm:mt-0', icon: Crown, ring: 'ring-2 ring-amber-400/70', glow: 'shadow-[0_20px_50px_rgba(245,158,11,0.35)]', label: 'text-amber-500', medal: 'text-amber-400' },
    2: { height: 'sm:mt-8', icon: Medal, ring: 'ring-1 ring-slate-400/50 dark:ring-slate-300/40', glow: '', label: 'text-slate-500 dark:text-slate-300', medal: 'text-slate-500 dark:text-slate-300' },
    3: { height: 'sm:mt-12', icon: Medal, ring: 'ring-1 ring-amber-700/40', glow: '', label: 'text-amber-700 dark:text-amber-500', medal: 'text-amber-700 dark:text-amber-500' },
  }[rank];
  const Icon = styles.icon;

  return (
    <div className={`surface-card card-hover ${styles.ring} ${styles.glow} ${styles.height} flex flex-col items-center text-center p-5 sm:p-6`}>
      <div className="relative">
        <Avatar name={entry.user?.name} size={rank === 1 ? 'h-16 w-16 text-xl' : 'h-14 w-14 text-lg'} />
        <div className="absolute -top-2 -right-2 h-7 w-7 rounded-full bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 flex items-center justify-center shadow">
          <Icon className={`h-4 w-4 ${styles.medal}`} />
        </div>
      </div>
      <p className={`mt-3 text-xs font-bold uppercase tracking-wider ${styles.label}`}>Rank #{rank}</p>
      <h3 className="mt-1 font-bold text-gray-900 dark:text-white truncate max-w-full">
        {entry.user?.name || 'Unknown'}{isYou && <span className="text-blue-500"> (you)</span>}
      </h3>
      <p className="text-xs text-gray-500 dark:text-gray-400 capitalize mt-0.5">{entry.topic}</p>
      <div className="mt-4 stat-figure">
        <span className="font-playfair italic text-4xl text-gray-900 dark:text-white">{entry.percentage ?? 0}</span>
        <span className="text-lg text-gray-400">%</span>
      </div>
      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{entry.score}/{entry.totalPossible} pts</p>
    </div>
  );
};

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
      } catch (error) {
        console.error('Error fetching leaderboard', error);
      } finally {
        setLoading(false);
      }
    };
    if (user?.token) fetchLeaderboard();
  }, [user]);

  if (loading) return <LeaderboardSkeleton />;

  const top3 = leaders.slice(0, 3);
  const rest = leaders.slice(3);
  // Visual podium order: 2nd, 1st, 3rd.
  const podiumOrder = [top3[1], top3[0], top3[2]].map((entry, i) => ({
    entry,
    rank: [2, 1, 3][i],
  })).filter((p) => p.entry);

  return (
    <div className="flex-grow py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto space-y-8">

        {/* Header */}
        <div className="surface-card anim-up p-8 relative overflow-hidden">
          <div className="hero-grid absolute inset-0 opacity-30 pointer-events-none" />
          <div className="relative flex items-center gap-4">
            <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-amber-400 to-orange-600 flex items-center justify-center shadow-lg shrink-0">
              <Trophy className="h-7 w-7 text-white" />
            </div>
            <div>
              <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white">
                Global <span className="font-playfair italic font-medium text-amber-500">Hall of Fame</span>
              </h1>
              <p className="mt-1 text-gray-500 dark:text-gray-400">The highest interview scores in MockForge history.</p>
            </div>
          </div>
        </div>

        {leaders.length === 0 ? (
          <div className="surface-card anim-up d1 p-12 text-center">
            <Sparkles className="h-10 w-10 mx-auto text-blue-400 mb-4" />
            <h3 className="text-lg font-bold text-gray-900 dark:text-white">No scores yet</h3>
            <p className="mt-2 text-gray-500 dark:text-gray-400">Be the first to complete an interview and claim the top spot.</p>
          </div>
        ) : (
          <>
            {/* Podium */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-end anim-up d1">
              {podiumOrder.map(({ entry, rank }) => (
                <PodiumCard key={entry._id} entry={entry} rank={rank} isYou={entry.user?.name === user?.name} />
              ))}
            </div>

            {/* Ranks 4+ */}
            {rest.length > 0 && (
              <div className="space-y-3 anim-up d2">
                {rest.map((sub, index) => {
                  const rank = index + 4;
                  const isYou = sub.user?.name === user?.name;
                  return (
                    <div
                      key={sub._id}
                      className={`surface-card card-hover flex items-center justify-between p-4 sm:p-5 ${isYou ? 'ring-2 ring-blue-400/70' : ''}`}
                    >
                      <div className="flex items-center gap-4 min-w-0">
                        <span className="w-8 text-center text-lg font-bold text-gray-400 dark:text-gray-500 stat-figure">#{rank}</span>
                        <Avatar name={sub.user?.name} />
                        <div className="min-w-0">
                          <h3 className="font-bold text-gray-900 dark:text-white truncate">
                            {sub.user?.name || 'Unknown'}{isYou && <span className="text-blue-500"> (you)</span>}
                          </h3>
                          <p className="text-sm text-gray-500 dark:text-gray-400 capitalize">{sub.topic}</p>
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <div className="stat-figure text-xl font-black text-gray-900 dark:text-white">
                          {sub.percentage ?? 0}<span className="text-sm text-gray-400 font-normal">%</span>
                        </div>
                        <p className="text-xs text-gray-500 dark:text-gray-400">{sub.score}/{sub.totalPossible} pts</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default Leaderboard;
