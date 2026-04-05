import React, { useState, useContext } from 'react';
import toast from 'react-hot-toast';
import { AuthContext } from '../context/AuthContext';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowRight, LogIn, ShieldCheck } from 'lucide-react';
import API from '../api/axios';

const Login = () => {
  const [email, setEmail] = useState('');
  const { setUser } = useContext(AuthContext);
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  const submitHandler = async (e) => {
    e.preventDefault();
    setError(null);

    try {
      const response = await API.post('/auth/login', { email, password });
      localStorage.setItem('userInfo', JSON.stringify(response.data));
      setUser(response.data);
      toast.success('Successfully logged in!');
      navigate('/');
    } catch (err) {
      const message = err.response?.data?.message || 'Login failed';
      setError(message);
      toast.error(message);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[radial-gradient(circle_at_top,#dbeafe,transparent_38%),linear-gradient(180deg,#f8fafc_0%,#eef2ff_100%)] dark:bg-[radial-gradient(circle_at_top,#172554,transparent_32%),linear-gradient(180deg,#0f172a_0%,#020617_100%)] py-16 px-4 sm:px-6 lg:px-8 transition-colors duration-300">
      <div className="max-w-5xl w-full grid lg:grid-cols-[1.05fr_0.95fr] gap-8 items-stretch">
        <div className="hidden lg:flex flex-col justify-between rounded-[2rem] border border-white/60 dark:border-white/10 bg-white/65 dark:bg-slate-900/55 backdrop-blur-xl shadow-[0_30px_80px_rgba(15,23,42,0.12)] p-10">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-blue-200/80 dark:border-blue-900/40 bg-blue-50/80 dark:bg-blue-900/20 px-4 py-2 text-sm font-semibold text-blue-700 dark:text-blue-300">
              <ShieldCheck className="h-4 w-4" />
              Secure interview workspace
            </div>
            <h1 className="mt-8 text-5xl font-black tracking-tight text-slate-900 dark:text-white">
              Walk in prepared, not just hopeful.
            </h1>
            <p className="mt-5 max-w-xl text-lg leading-8 text-slate-600 dark:text-slate-300">
              MockForge gives you timed practice, score tracking, and structured repetition so every session compounds into real interview confidence.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="rounded-2xl border border-slate-200/80 dark:border-slate-700/60 bg-white/70 dark:bg-slate-950/40 p-5">
              <p className="text-sm font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Focus</p>
              <p className="mt-3 text-2xl font-black text-slate-900 dark:text-white">Topic-first</p>
              <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">Pick a lane and practice with intent.</p>
            </div>
            <div className="rounded-2xl border border-slate-200/80 dark:border-slate-700/60 bg-white/70 dark:bg-slate-950/40 p-5">
              <p className="text-sm font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Rhythm</p>
              <p className="mt-3 text-2xl font-black text-slate-900 dark:text-white">Timed rounds</p>
              <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">Train under pressure before it counts.</p>
            </div>
          </div>
        </div>

        <div className="max-w-md lg:max-w-none w-full">
          <div className="bg-white/85 dark:bg-slate-900/75 backdrop-blur-xl p-8 sm:p-10 rounded-[2rem] shadow-[0_30px_80px_rgba(15,23,42,0.16)] border border-white/70 dark:border-slate-800 transition-colors">
            <div className="text-center">
              <div className="mx-auto h-14 w-14 bg-blue-100 dark:bg-blue-900/30 rounded-2xl flex items-center justify-center shadow-sm">
                <LogIn className="h-6 w-6 text-blue-600 dark:text-blue-400" />
              </div>
              <h2 className="mt-6 text-3xl font-black tracking-tight text-gray-900 dark:text-white">Sign in to MockForge</h2>
              <p className="mt-3 text-sm text-gray-600 dark:text-gray-400">
                New here?{' '}
                <Link to="/register" className="font-semibold text-blue-600 dark:text-blue-400 hover:text-blue-500">
                  Create an account
                </Link>{' '}
                and start practicing today.
              </p>
            </div>

            <form className="mt-8 space-y-5" onSubmit={submitHandler}>
              {error && (
                <div className="bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-300 px-4 py-3 rounded-2xl text-sm border border-red-200 dark:border-red-900/40">
                  {error}
                </div>
              )}

              <div className="space-y-4">
                <div>
                  <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">Email address</label>
                  <input
                    type="email"
                    required
                    className="mt-2 block w-full px-4 py-3.5 border border-gray-200 dark:border-gray-700 rounded-2xl shadow-sm focus:outline-none focus:ring-4 focus:ring-blue-100 dark:focus:ring-blue-900/30 focus:border-blue-500 sm:text-sm transition-all bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
                <div>
                  <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">Password</label>
                  <input
                    type="password"
                    required
                    className="mt-2 block w-full px-4 py-3.5 border border-gray-200 dark:border-gray-700 rounded-2xl shadow-sm focus:outline-none focus:ring-4 focus:ring-blue-100 dark:focus:ring-blue-900/30 focus:border-blue-500 sm:text-sm transition-all bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500"
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full inline-flex items-center justify-center py-3.5 px-4 rounded-2xl text-sm font-semibold text-white bg-slate-900 hover:bg-blue-600 dark:bg-blue-600 dark:hover:bg-blue-500 transition-all shadow-lg shadow-slate-900/10 dark:shadow-blue-950/30"
              >
                Sign in
                <ArrowRight className="h-4 w-4 ml-2" />
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
