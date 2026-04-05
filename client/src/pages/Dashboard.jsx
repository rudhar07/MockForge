import React, { useEffect, useState, useContext } from 'react';
import { Link } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import {
  Code2,
  BrainCircuit,
  History,
  Trophy,
  Target,
  Flame,
  ChartColumn,
  ArrowRight,
  CalendarDays,
  BookOpenCheck,
  AlertCircle,
} from 'lucide-react';
import API from '../api/axios';


const Dashboard = () => {
  const { user } = useContext(AuthContext);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchHistory = async () => {
      setLoading(true);
      setError('');

      try {
        const config = { headers: { Authorization: `Bearer ${user.token}` } };
        const { data } = await API.get('/submissions/history', config);
        setHistory(data);
      } catch (fetchError) {
        setError(fetchError.response?.data?.message || 'Unable to load your dashboard right now.');
      } finally {
        setLoading(false);
      }
    };
    
    if (user?.token) {
      fetchHistory();
    }
  }, [user]);

  const sortedHistory = [...history].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );

  const totalAttempts = sortedHistory.length;
  const bestSubmission = sortedHistory.reduce((best, attempt) => {
    if (!best) return attempt;
    return attempt.score > best.score ? attempt : best;
  }, null);

  const averagePercentage = totalAttempts
    ? Math.round(
        sortedHistory.reduce((sum, attempt) => {
          if (!attempt.totalPossible) return sum;
          return sum + (attempt.score / attempt.totalPossible) * 100;
        }, 0) / totalAttempts
      )
    : 0;

  const latestAttempt = sortedHistory[0] ?? null;

  const uniqueDays = [...new Set(
    sortedHistory.map((attempt) => new Date(attempt.createdAt).toISOString().slice(0, 10))
  )].sort((a, b) => new Date(b).getTime() - new Date(a).getTime());

  let streak = 0;
  if (uniqueDays.length > 0) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const latestDay = new Date(uniqueDays[0]);
    latestDay.setHours(0, 0, 0, 0);

    const diffFromToday = Math.round((today.getTime() - latestDay.getTime()) / 86400000);

    if (diffFromToday <= 1) {
      streak = 1;
      for (let i = 1; i < uniqueDays.length; i += 1) {
        const prev = new Date(uniqueDays[i - 1]);
        const current = new Date(uniqueDays[i]);
        prev.setHours(0, 0, 0, 0);
        current.setHours(0, 0, 0, 0);

        const diff = Math.round((prev.getTime() - current.getTime()) / 86400000);
        if (diff === 1) {
          streak += 1;
        } else {
          break;
        }
      }
    }
  }

  const topicProgress = Object.values(
    sortedHistory.reduce((acc, attempt) => {
      const percentage = attempt.totalPossible
        ? Math.round((attempt.score / attempt.totalPossible) * 100)
        : 0;

      if (!acc[attempt.topic]) {
        acc[attempt.topic] = {
          topic: attempt.topic,
          attempts: 0,
          totalPercentage: 0,
          bestPercentage: 0,
          lastAttemptAt: attempt.createdAt,
        };
      }

      acc[attempt.topic].attempts += 1;
      acc[attempt.topic].totalPercentage += percentage;
      acc[attempt.topic].bestPercentage = Math.max(acc[attempt.topic].bestPercentage, percentage);

      if (new Date(attempt.createdAt) > new Date(acc[attempt.topic].lastAttemptAt)) {
        acc[attempt.topic].lastAttemptAt = attempt.createdAt;
      }

      return acc;
    }, {})
  )
    .map((entry) => ({
      ...entry,
      averagePercentage: Math.round(entry.totalPercentage / entry.attempts),
    }))
    .sort((a, b) => b.averagePercentage - a.averagePercentage);

  const statCards = [
    {
      label: 'Total Attempts',
      value: totalAttempts,
      helper: totalAttempts ? 'All recorded mock interviews' : 'Start your first session today',
      icon: ChartColumn,
      tone: 'blue',
    },
    {
      label: 'Best Score',
      value: bestSubmission ? `${bestSubmission.score}/${bestSubmission.totalPossible}` : '--',
      helper: bestSubmission ? `${bestSubmission.topic} round` : 'No completed attempts yet',
      icon: Trophy,
      tone: 'amber',
    },
    {
      label: 'Average Accuracy',
      value: totalAttempts ? `${averagePercentage}%` : '--',
      helper: totalAttempts ? 'Across all completed sessions' : 'Build consistency over time',
      icon: Target,
      tone: 'emerald',
    },
    {
      label: 'Current Streak',
      value: `${streak} day${streak === 1 ? '' : 's'}`,
      helper: streak ? 'Keep the practice rhythm going' : 'Practice today to start a streak',
      icon: Flame,
      tone: 'rose',
    },
  ];

  const toneMap = {
    blue: 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-300 border-blue-100 dark:border-blue-900/30',
    amber: 'bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-300 border-amber-100 dark:border-amber-900/30',
    emerald: 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-300 border-emerald-100 dark:border-emerald-900/30',
    rose: 'bg-rose-50 dark:bg-rose-900/20 text-rose-600 dark:text-rose-300 border-rose-100 dark:border-rose-900/30',
  };
  if (loading) {
    return (
      <div className="flex-grow flex items-center justify-center py-24 px-4">
        <div className="text-center">
          <div className="w-16 h-16 mx-auto border-4 border-blue-100 dark:border-blue-900 border-t-blue-600 dark:border-t-blue-400 rounded-full animate-spin" />
          <h2 className="mt-6 text-2xl font-bold text-gray-900 dark:text-white">Loading your dashboard</h2>
          <p className="mt-2 text-gray-500 dark:text-gray-400">Crunching your interview history and progress.</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex-grow flex items-center justify-center py-24 px-4">
        <div className="max-w-lg w-full bg-white dark:bg-gray-800 rounded-3xl border border-red-100 dark:border-red-900/30 shadow-sm p-8 text-center">
          <AlertCircle className="h-12 w-12 mx-auto text-red-500 mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Dashboard unavailable</h2>
          <p className="mt-3 text-gray-600 dark:text-gray-400">{error}</p>
          <Link
            to="/interview"
            className="mt-6 inline-flex items-center justify-center px-5 py-3 rounded-xl bg-slate-900 dark:bg-blue-600 text-white font-semibold"
          >
            Start A Mock Interview
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-grow py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-8">
        <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-700 p-8 lg:p-10 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6 transition-colors duration-300">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-blue-600 dark:text-blue-400">Your Prep Command Center</p>
            <h1 className="mt-3 text-4xl font-black text-gray-900 dark:text-white">Welcome back, {user?.name}.</h1>
            <p className="mt-3 text-lg text-gray-600 dark:text-gray-400 max-w-2xl">
              Track your consistency, see where you&apos;re improving, and jump straight back into another interview round.
            </p>
          </div>
          <div className="hidden lg:flex h-24 w-24 items-center justify-center rounded-3xl bg-blue-50 dark:bg-blue-900/20">
            <BrainCircuit className="h-12 w-12 text-blue-600 dark:text-blue-300" />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-5">
          {statCards.map((card) => {
            const Icon = card.icon;

            return (
              <div key={card.label} className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm p-6">
                <div className={`inline-flex h-12 w-12 items-center justify-center rounded-2xl border ${toneMap[card.tone]}`}>
                  <Icon className="h-6 w-6" />
                </div>
                <p className="mt-5 text-sm font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">{card.label}</p>
                <p className="mt-2 text-3xl font-black text-gray-900 dark:text-white">{card.value}</p>
                <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">{card.helper}</p>
              </div>
            );
          })}
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-[1.4fr_1fr] gap-6">
          <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-700 p-8">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
              <div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Practice Insights</h2>
                <p className="mt-2 text-gray-600 dark:text-gray-400">A quick read on your current momentum and performance.</p>
              </div>
              <Link
                to="/interview"
                className="inline-flex items-center justify-center px-4 py-3 rounded-xl bg-blue-600 text-white font-semibold hover:bg-blue-700 transition-colors"
              >
                Start Interview
                <ArrowRight className="h-4 w-4 ml-2" />
              </Link>
            </div>

            {totalAttempts === 0 ? (
              <div className="rounded-2xl border border-dashed border-gray-200 dark:border-gray-700 bg-slate-50 dark:bg-gray-900/30 p-10 text-center">
                <BookOpenCheck className="h-12 w-12 mx-auto text-blue-500 mb-4" />
                <h3 className="text-xl font-bold text-gray-900 dark:text-white">No interview history yet</h3>
                <p className="mt-3 text-gray-600 dark:text-gray-400 max-w-md mx-auto">
                  Your dashboard will light up with stats, streaks, and topic progress after your first completed interview.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                <div className="rounded-2xl bg-slate-50 dark:bg-gray-900/30 border border-slate-100 dark:border-gray-700 p-5">
                  <div className="flex items-center gap-3">
                    <CalendarDays className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                    <p className="font-semibold text-gray-900 dark:text-white">Latest Activity</p>
                  </div>
                  <p className="mt-4 text-2xl font-black text-gray-900 dark:text-white">
                    {latestAttempt ? new Date(latestAttempt.createdAt).toLocaleDateString() : '--'}
                  </p>
                  <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                    {latestAttempt ? `${latestAttempt.topic} round, ${latestAttempt.score}/${latestAttempt.totalPossible}` : 'No recent attempt yet'}
                  </p>
                </div>

                <div className="rounded-2xl bg-slate-50 dark:bg-gray-900/30 border border-slate-100 dark:border-gray-700 p-5">
                  <div className="flex items-center gap-3">
                    <Flame className="h-5 w-5 text-rose-500 dark:text-rose-400" />
                    <p className="font-semibold text-gray-900 dark:text-white">Consistency</p>
                  </div>
                  <p className="mt-4 text-2xl font-black text-gray-900 dark:text-white">{streak} day streak</p>
                  <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                    {streak ? 'You are building a strong prep rhythm.' : 'One session today starts your streak again.'}
                  </p>
                </div>

                <div className="rounded-2xl bg-slate-50 dark:bg-gray-900/30 border border-slate-100 dark:border-gray-700 p-5">
                  <div className="flex items-center gap-3">
                    <History className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                    <p className="font-semibold text-gray-900 dark:text-white">Best Topic</p>
                  </div>
                  <p className="mt-4 text-2xl font-black text-gray-900 dark:text-white capitalize">
                    {topicProgress[0]?.topic ?? '--'}
                  </p>
                  <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                    {topicProgress[0] ? `${topicProgress[0].averagePercentage}% average across ${topicProgress[0].attempts} attempt${topicProgress[0].attempts === 1 ? '' : 's'}` : 'Complete a few rounds to discover your strengths.'}
                  </p>
                </div>
              </div>
            )}
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-700 p-8">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Topic Progress</h2>
            <p className="mt-2 text-gray-600 dark:text-gray-400">See which topics are improving and where you should focus next.</p>

            <div className="mt-8 space-y-5">
              {topicProgress.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-gray-200 dark:border-gray-700 bg-slate-50 dark:bg-gray-900/30 p-6 text-center text-gray-600 dark:text-gray-400">
                  Topic progress appears after your first few interview attempts.
                </div>
              ) : (
                topicProgress.map((topic) => (
                  <div key={topic.topic} className="rounded-2xl border border-gray-100 dark:border-gray-700 bg-slate-50 dark:bg-gray-900/30 p-5">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="text-lg font-bold text-gray-900 dark:text-white capitalize">{topic.topic}</p>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {topic.attempts} attempt{topic.attempts === 1 ? '' : 's'} • best {topic.bestPercentage}%
                        </p>
                      </div>
                      <span className="text-xl font-black text-gray-900 dark:text-white">{topic.averagePercentage}%</span>
                    </div>
                    <div className="mt-4 h-3 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-blue-500 via-cyan-500 to-emerald-500"
                        style={{ width: `${Math.min(topic.averagePercentage, 100)}%` }}
                      />
                    </div>
                    <p className="mt-3 text-xs text-gray-500 dark:text-gray-400">
                      Last practiced on {new Date(topic.lastAttemptAt).toLocaleDateString()}
                    </p>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {totalAttempts > 0 && (
          <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-700 p-8 transition-colors duration-300">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center">
                <History className="mr-3 text-blue-600 dark:text-blue-400" /> Recent Interviews
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">Newest attempts first</p>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b-2 border-gray-100 dark:border-gray-700 text-gray-500 dark:text-gray-400">
                    <th className="pb-3 px-4">Date</th>
                    <th className="pb-3 px-4">Topic</th>
                    <th className="pb-3 px-4">Score</th>
                    <th className="pb-3 px-4">Accuracy</th>
                  </tr>
                </thead>
                <tbody>
                  {sortedHistory.map((sub) => {
                    const percentage = sub.totalPossible ? Math.round((sub.score / sub.totalPossible) * 100) : 0;

                    return (
                      <tr key={sub._id} className="border-b border-gray-50 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                        <td className="py-4 px-4 text-gray-700 dark:text-gray-300">{new Date(sub.createdAt).toLocaleDateString()}</td>
                        <td className="py-4 px-4 text-gray-700 dark:text-gray-300 capitalize">{sub.topic}</td>
                        <td className="py-4 px-4 font-bold text-blue-600 dark:text-blue-400">{sub.score} / {sub.totalPossible}</td>
                        <td className="py-4 px-4 text-gray-700 dark:text-gray-300">{percentage}%</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Link to="/interview">
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-blue-100 dark:border-gray-700 p-6 cursor-pointer group transition-all duration-300 hover:-translate-y-1 hover:shadow-xl h-full">
              <div className="h-12 w-12 bg-blue-50 dark:bg-blue-900/30 rounded-lg flex items-center justify-center mb-4 group-hover:bg-blue-600 transition-colors">
                <Code2 className="h-6 w-6 text-blue-600 dark:text-blue-400 group-hover:text-white transition-colors" />
              </div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">Start Mock Interview</h2>
              <p className="mt-2 text-gray-600 dark:text-gray-400">Choose your next topic and keep your streak alive.</p>
            </div>
          </Link>

          <Link to="/leaderboard">
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-amber-100 dark:border-gray-700 p-6 cursor-pointer group transition-all duration-300 hover:-translate-y-1 hover:shadow-xl h-full">
              <div className="h-12 w-12 bg-amber-50 dark:bg-amber-900/30 rounded-lg flex items-center justify-center mb-4 group-hover:bg-amber-500 transition-colors">
                <Trophy className="h-6 w-6 text-amber-600 dark:text-amber-400 group-hover:text-white transition-colors" />
              </div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">Check Leaderboard</h2>
              <p className="mt-2 text-gray-600 dark:text-gray-400">See how your recent progress stacks up against the best scores.</p>
            </div>
          </Link>
        </div>
      </div>
    </div>
  );
};
export default Dashboard;
