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
  TrendingUp,
  TrendingDown,
  Sparkles,
} from 'lucide-react';
import API from '../api/axios';

// Local-time date helpers. We deliberately avoid toISOString() (which is UTC):
// mixing a UTC date string with local-midnight iteration causes an off-by-one
// for users east/west of UTC, so today's attempt wouldn't light up the grid.
const toDayKey = (value) => {
  const d = new Date(value);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};
const fromDayKey = (key) => {
  const [y, m, d] = key.split('-').map(Number);
  return new Date(y, m - 1, d); // local midnight, timezone-safe
};

// Animate a number from 0 → target with an ease-out cubic. Used on stat cards.
const useCountUp = (target, duration = 900) => {
  const [val, setVal] = useState(0);
  useEffect(() => {
    if (typeof target !== 'number' || Number.isNaN(target)) {
      setVal(target);
      return undefined;
    }
    let raf;
    const start = performance.now();
    const tick = (now) => {
      const p = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - p, 3);
      setVal(Math.round(target * eased));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, duration]);
  return val;
};

const CountUp = ({ value, className }) => {
  const n = useCountUp(value);
  return <span className={className}>{n}</span>;
};

// GitHub-style practice heatmap: last 84 days, colored by attempts that day.
const StreakHeatmap = ({ countsByDay }) => {
  const [hovered, setHovered] = useState(null);

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const cells = [];
  for (let i = 83; i >= 0; i -= 1) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    const key = toDayKey(d); // local key — matches countsByDay
    cells.push({ key, count: countsByDay[key] || 0, date: d });
  }
  const levelClass = (c) => {
    if (c === 0) return 'bg-gray-100 dark:bg-gray-800';
    if (c === 1) return 'bg-blue-300 dark:bg-blue-900';
    if (c === 2) return 'bg-blue-500 dark:bg-blue-600';
    return 'bg-blue-600 dark:bg-blue-400';
  };
  const fmt = (date) => date.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });

  return (
    <div>
      {/* Live hover label — updates immediately as you move across cells. */}
      <div className="mb-3 h-5 text-sm text-gray-500 dark:text-gray-400">
        {hovered
          ? `${fmt(hovered.date)} — ${hovered.count} session${hovered.count === 1 ? '' : 's'}`
          : 'Hover a day to see details'}
      </div>
      <div className="grid grid-rows-7 grid-flow-col gap-1 w-max">
        {cells.map((c) => (
          <div
            key={c.key}
            role="img"
            aria-label={`${fmt(c.date)} — ${c.count} session${c.count === 1 ? '' : 's'}`}
            onMouseEnter={() => setHovered(c)}
            onMouseLeave={() => setHovered(null)}
            title={`${fmt(c.date)} — ${c.count} session${c.count === 1 ? '' : 's'}`}
            className={`h-3 w-3 rounded-[3px] transition-transform hover:scale-125 hover:ring-1 hover:ring-blue-400 ${levelClass(c.count)}`}
          />
        ))}
      </div>
      <div className="mt-3 flex items-center gap-2 text-xs text-gray-400 dark:text-gray-500">
        <span>Less</span>
        <div className="h-3 w-3 rounded-[3px] bg-gray-100 dark:bg-gray-800" />
        <div className="h-3 w-3 rounded-[3px] bg-blue-300 dark:bg-blue-900" />
        <div className="h-3 w-3 rounded-[3px] bg-blue-500 dark:bg-blue-600" />
        <div className="h-3 w-3 rounded-[3px] bg-blue-600 dark:bg-blue-400" />
        <span>More</span>
      </div>
    </div>
  );
};

// SVG progress ring for topic mastery.
const Ring = ({ percentage, tone, label, sub }) => {
  const r = 34;
  const circumference = 2 * Math.PI * r;
  const offset = circumference * (1 - Math.min(percentage, 100) / 100);
  const strokeColor = tone === 'emerald' ? '#10b981' : tone === 'blue' ? '#3b82f6' : '#f43f5e';
  return (
    <div className="surface-soft p-4 flex flex-col items-center text-center">
      <div className="relative h-24 w-24">
        <svg aria-hidden="true" className="h-24 w-24 -rotate-90" viewBox="0 0 80 80">
          <circle cx="40" cy="40" r={r} fill="none" strokeWidth="8" className="stroke-gray-200 dark:stroke-gray-700" />
          <circle
            cx="40"
            cy="40"
            r={r}
            fill="none"
            strokeWidth="8"
            stroke={strokeColor}
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            style={{ transition: 'stroke-dashoffset 1s cubic-bezier(0.16,1,0.3,1)' }}
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="stat-figure text-xl font-black text-gray-900 dark:text-white">{percentage}%</span>
        </div>
      </div>
      <p className="mt-2 font-bold capitalize text-gray-900 dark:text-white">{label}</p>
      <p className="text-xs text-gray-500 dark:text-gray-400">{sub}</p>
    </div>
  );
};

const DashboardSkeleton = () => (
  <div className="flex-grow py-10 px-4 sm:px-6 lg:px-8 animate-pulse">
    <div className="max-w-7xl mx-auto space-y-8">
      <div className="h-40 rounded-3xl bg-gray-200/70 dark:bg-gray-800/70" />
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-5">
        {[...Array(4)].map((_, i) => <div key={i} className="h-40 rounded-2xl bg-gray-200/70 dark:bg-gray-800/70" />)}
      </div>
      <div className="grid grid-cols-1 xl:grid-cols-[1.4fr_1fr] gap-6">
        <div className="h-72 rounded-3xl bg-gray-200/70 dark:bg-gray-800/70" />
        <div className="h-72 rounded-3xl bg-gray-200/70 dark:bg-gray-800/70" />
      </div>
    </div>
  </div>
);

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

  // Attempts per LOCAL day — powers both the streak math and the heatmap.
  const countsByDay = sortedHistory.reduce((acc, attempt) => {
    const key = toDayKey(attempt.createdAt);
    acc[key] = (acc[key] || 0) + 1;
    return acc;
  }, {});

  // Newest day first. YYYY-MM-DD sorts chronologically as plain strings.
  const uniqueDays = Object.keys(countsByDay).sort((a, b) => b.localeCompare(a));

  let streak = 0;
  if (uniqueDays.length > 0) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const latestDay = fromDayKey(uniqueDays[0]); // already local midnight
    const diffFromToday = Math.round((today.getTime() - latestDay.getTime()) / 86400000);

    // Count the streak if the most recent practice was today or yesterday.
    if (diffFromToday <= 1) {
      streak = 1;
      for (let i = 1; i < uniqueDays.length; i += 1) {
        const prev = fromDayKey(uniqueDays[i - 1]);
        const current = fromDayKey(uniqueDays[i]);
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
          recentPercentages: [],
        };
      }

      acc[attempt.topic].attempts += 1;
      acc[attempt.topic].totalPercentage += percentage;
      acc[attempt.topic].bestPercentage = Math.max(acc[attempt.topic].bestPercentage, percentage);
      acc[attempt.topic].recentPercentages.push(percentage);

      if (new Date(attempt.createdAt) > new Date(acc[attempt.topic].lastAttemptAt)) {
        acc[attempt.topic].lastAttemptAt = attempt.createdAt;
      }

      return acc;
    }, {})
  )
    .map((entry) => ({
      ...entry,
      averagePercentage: Math.round(entry.totalPercentage / entry.attempts),
      recentPercentages: entry.recentPercentages.slice(0, 3),
    }))
    .map((entry) => {
      const latestPercentage = entry.recentPercentages[0] ?? entry.averagePercentage;
      const baselineWindow = entry.recentPercentages.slice(1);
      const baseline = baselineWindow.length
        ? Math.round(baselineWindow.reduce((sum, value) => sum + value, 0) / baselineWindow.length)
        : latestPercentage;
      const trendDelta = latestPercentage - baseline;

      let mastery = 'Needs Work';
      let masteryTone = 'rose';
      if (entry.averagePercentage >= 80) {
        mastery = 'Strong';
        masteryTone = 'emerald';
      } else if (entry.averagePercentage >= 60) {
        mastery = 'Improving';
        masteryTone = 'blue';
      }

      let trendLabel = 'Stable';
      if (trendDelta >= 8) {
        trendLabel = 'Rising';
      } else if (trendDelta <= -8) {
        trendLabel = 'Cooling';
      }

      return {
        ...entry,
        latestPercentage,
        trendDelta,
        trendLabel,
        mastery,
        masteryTone,
      };
    })
    .sort((a, b) => b.averagePercentage - a.averagePercentage);

  const strongestTopic = topicProgress[0] ?? null;
  const weakestTopic = [...topicProgress].sort((a, b) => a.averagePercentage - b.averagePercentage)[0] ?? null;
  const risingTopic = [...topicProgress]
    .filter((entry) => entry.trendDelta > 0)
    .sort((a, b) => b.trendDelta - a.trendDelta)[0] ?? null;

  const statCards = [
    {
      label: 'Total Attempts',
      numeric: totalAttempts,
      suffix: '',
      helper: totalAttempts ? 'All recorded mock interviews' : 'Start your first session today',
      icon: ChartColumn,
      tone: 'blue',
    },
    {
      label: 'Best Score',
      numeric: bestSubmission ? bestSubmission.score : null,
      suffix: bestSubmission ? `/${bestSubmission.totalPossible}` : '',
      helper: bestSubmission ? `${bestSubmission.topic} round` : 'No completed attempts yet',
      icon: Trophy,
      tone: 'amber',
    },
    {
      label: 'Average Accuracy',
      numeric: totalAttempts ? averagePercentage : null,
      suffix: '%',
      helper: totalAttempts ? 'Across all completed sessions' : 'Build consistency over time',
      icon: Target,
      tone: 'emerald',
    },
    {
      label: 'Current Streak',
      numeric: streak,
      suffix: ` day${streak === 1 ? '' : 's'}`,
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
    return <DashboardSkeleton />;
  }

  if (error) {
    return (
      <div className="flex-grow flex items-center justify-center py-24 px-4">
        <div className="surface-card max-w-lg w-full p-8 text-center">
          <AlertCircle className="h-12 w-12 mx-auto text-red-500 mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Dashboard unavailable</h2>
          <p className="mt-3 text-gray-600 dark:text-gray-400">{error}</p>
          <Link to="/interview" className="brand-accent-action mt-6">
            Start A Mock Interview
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-grow py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-8">

        {/* Welcome header */}
        <div className="surface-card anim-up p-8 lg:p-10 relative overflow-hidden flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
          <div className="hero-grid absolute inset-0 opacity-30 pointer-events-none" />
          <div className="relative">
            <p className="brand-kicker">Your Prep Command Center</p>
            <h1 className="mt-3 text-4xl font-black text-gray-900 dark:text-white">
              Welcome back, <span className="font-playfair italic font-medium text-blue-600 dark:text-blue-400">{user?.name}</span>.
            </h1>
            <p className="mt-3 text-lg text-gray-600 dark:text-gray-400 max-w-2xl">
              Track your consistency, see where you&apos;re improving, and jump straight back into another round.
            </p>
          </div>
          <Link to="/interview" className="brand-accent-action relative shrink-0">
            Start Interview
            <ArrowRight className="h-4 w-4 ml-2" />
          </Link>
        </div>

        {/* Stat cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-5">
          {statCards.map((card, i) => {
            const Icon = card.icon;
            return (
              <div key={card.label} className={`surface-card card-hover anim-up d${i + 1} p-6`}>
                <div className={`inline-flex h-12 w-12 items-center justify-center rounded-2xl border ${toneMap[card.tone]}`}>
                  <Icon className="h-6 w-6" />
                </div>
                <p className="mt-5 text-sm font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">{card.label}</p>
                <p className="mt-2 text-3xl font-black text-gray-900 dark:text-white stat-figure">
                  {card.numeric === null ? '--' : <CountUp value={card.numeric} />}
                  {card.numeric !== null && <span className="text-xl text-gray-400 font-bold">{card.suffix}</span>}
                </p>
                <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">{card.helper}</p>
              </div>
            );
          })}
        </div>

        {/* Streak heatmap */}
        <div className="surface-card anim-up p-8">
          <div className="flex items-center gap-3 mb-6">
            <Flame className="h-6 w-6 text-rose-500" />
            <div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">Practice Activity</h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">Your last 12 weeks — {streak} day streak going.</p>
            </div>
          </div>
          <div className="overflow-x-auto pb-1">
            <StreakHeatmap countsByDay={countsByDay} />
          </div>
        </div>

        {/* Insights + Topic mastery */}
        <div className="grid grid-cols-1 xl:grid-cols-[1.4fr_1fr] gap-6">
          {/* Insights */}
          <div className="surface-card anim-up p-8">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Practice Insights</h2>

            {totalAttempts === 0 ? (
              <div className="surface-soft p-10 text-center">
                <BookOpenCheck className="h-12 w-12 mx-auto text-blue-500 mb-4" />
                <h3 className="text-xl font-bold text-gray-900 dark:text-white">No interview history yet</h3>
                <p className="mt-3 text-gray-600 dark:text-gray-400 max-w-md mx-auto">
                  Your dashboard will light up with stats, streaks, and topic progress after your first completed interview.
                </p>
                <Link to="/interview" className="brand-accent-action mt-6">Start your first round</Link>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="surface-soft p-5">
                  <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400">
                    <CalendarDays className="h-5 w-5" />
                    <p className="font-semibold text-gray-900 dark:text-white">Latest</p>
                  </div>
                  <p className="mt-4 text-xl font-black text-gray-900 dark:text-white">
                    {latestAttempt ? new Date(latestAttempt.createdAt).toLocaleDateString() : '--'}
                  </p>
                  <p className="mt-1 text-sm text-gray-600 dark:text-gray-400 capitalize">
                    {latestAttempt ? `${latestAttempt.topic} · ${latestAttempt.score}/${latestAttempt.totalPossible}` : '--'}
                  </p>
                </div>

                <div className="surface-soft p-5">
                  <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400">
                    <Sparkles className="h-5 w-5" />
                    <p className="font-semibold text-gray-900 dark:text-white">Strongest</p>
                  </div>
                  <p className="mt-4 text-xl font-black text-gray-900 dark:text-white capitalize">{strongestTopic?.topic ?? '--'}</p>
                  <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                    {strongestTopic ? `${strongestTopic.averagePercentage}% average` : '--'}
                  </p>
                </div>

                <div className="surface-soft p-5">
                  <div className="flex items-center gap-2 text-rose-600 dark:text-rose-400">
                    <TrendingDown className="h-5 w-5" />
                    <p className="font-semibold text-gray-900 dark:text-white">Focus on</p>
                  </div>
                  <p className="mt-4 text-xl font-black text-gray-900 dark:text-white capitalize">{weakestTopic?.topic ?? '--'}</p>
                  <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                    {weakestTopic ? `${weakestTopic.averagePercentage}% average` : '--'}
                  </p>
                </div>
              </div>
            )}

            {/* Mastery rings */}
            {topicProgress.length > 0 && (
              <>
                <h3 className="mt-8 mb-4 text-lg font-bold text-gray-900 dark:text-white">Topic Mastery</h3>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  {topicProgress.map((topic) => (
                    <Ring
                      key={topic.topic}
                      percentage={topic.averagePercentage}
                      tone={topic.masteryTone}
                      label={topic.topic}
                      sub={`${topic.attempts} attempt${topic.attempts === 1 ? '' : 's'}`}
                    />
                  ))}
                </div>
              </>
            )}
          </div>

          {/* Momentum panel */}
          <div className="surface-card anim-up d1 p-8">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Momentum</h2>
            {topicProgress.length === 0 ? (
              <div className="surface-soft p-6 text-center text-gray-600 dark:text-gray-400">
                Topic momentum appears after your first few attempts.
              </div>
            ) : (
              <div className="space-y-4">
                <div className="surface-soft p-5">
                  <div className="flex items-center gap-2 text-blue-700 dark:text-blue-300 font-semibold">
                    <TrendingUp className="h-4 w-4" />
                    Rising fastest
                  </div>
                  <p className="mt-2 text-lg font-bold text-gray-900 dark:text-white capitalize">{risingTopic?.topic ?? 'No clear trend'}</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {risingTopic ? `Up ${Math.max(risingTopic.trendDelta, 0)} points recently` : 'Revisit a topic to build momentum.'}
                  </p>
                </div>

                {topicProgress.map((topic) => (
                  <div key={topic.topic} className="surface-soft p-4">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-gray-900 dark:text-white capitalize">{topic.topic}</span>
                        <span className={`brand-tag border ${toneMap[topic.masteryTone]}`}>{topic.mastery}</span>
                      </div>
                      <span className="stat-figure font-black text-gray-900 dark:text-white">{topic.averagePercentage}%</span>
                    </div>
                    <div aria-hidden="true" className="h-2.5 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-blue-500 via-cyan-500 to-emerald-500"
                        style={{ width: `${Math.min(topic.averagePercentage, 100)}%`, transition: 'width 1s cubic-bezier(0.16,1,0.3,1)' }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Recent interviews */}
        {totalAttempts > 0 && (
          <div className="surface-card anim-up p-8">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center">
                <History className="mr-3 text-blue-600 dark:text-blue-400" /> Recent Interviews
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">Newest attempts first</p>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b-2 border-gray-100 dark:border-gray-700 text-gray-500 dark:text-gray-400 text-sm">
                    <th className="pb-3 px-4 font-semibold">Date</th>
                    <th className="pb-3 px-4 font-semibold">Topic</th>
                    <th className="pb-3 px-4 font-semibold">Score</th>
                    <th className="pb-3 px-4 font-semibold">Accuracy</th>
                  </tr>
                </thead>
                <tbody>
                  {sortedHistory.map((sub) => {
                    const percentage = sub.totalPossible ? Math.round((sub.score / sub.totalPossible) * 100) : 0;
                    return (
                      <tr key={sub._id} className="border-b border-gray-50 dark:border-gray-700 hover:bg-gray-50/70 dark:hover:bg-gray-700/40 transition-colors">
                        <td className="py-4 px-4 text-gray-700 dark:text-gray-300">{new Date(sub.createdAt).toLocaleDateString()}</td>
                        <td className="py-4 px-4 text-gray-700 dark:text-gray-300 capitalize">{sub.topic}</td>
                        <td className="py-4 px-4 font-bold text-blue-600 dark:text-blue-400 stat-figure">{sub.score} / {sub.totalPossible}</td>
                        <td className="py-4 px-4">
                          <span className={`brand-tag border ${percentage >= 80 ? toneMap.emerald : percentage >= 60 ? toneMap.blue : toneMap.rose}`}>
                            {percentage}%
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Quick actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Link to="/interview" className="surface-card card-hover anim-up p-6 group block">
            <div className="h-12 w-12 bg-blue-50 dark:bg-blue-900/30 rounded-2xl flex items-center justify-center mb-4 group-hover:bg-blue-600 transition-colors">
              <Code2 className="h-6 w-6 text-blue-600 dark:text-blue-400 group-hover:text-white transition-colors" />
            </div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">Start Mock Interview</h2>
            <p className="mt-2 text-gray-600 dark:text-gray-400">Choose your next topic and keep your streak alive.</p>
          </Link>

          <Link to="/leaderboard" className="surface-card card-hover anim-up d1 p-6 group block">
            <div className="h-12 w-12 bg-amber-50 dark:bg-amber-900/30 rounded-2xl flex items-center justify-center mb-4 group-hover:bg-amber-500 transition-colors">
              <Trophy className="h-6 w-6 text-amber-600 dark:text-amber-400 group-hover:text-white transition-colors" />
            </div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">Check Leaderboard</h2>
            <p className="mt-2 text-gray-600 dark:text-gray-400">See how your recent progress stacks up against the best scores.</p>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
