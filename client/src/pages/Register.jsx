import React, { useState, useContext } from 'react';
import toast from 'react-hot-toast';
import { AuthContext } from '../context/AuthContext';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowRight, Sparkles, UserPlus } from 'lucide-react';
import API from '../api/axios';

const Register = () => {
  const [name, setName] = useState('');
  const { setUser } = useContext(AuthContext);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  const submitHandler = async (e) => {
    e.preventDefault();
    setError(null);

    try {
      const response = await API.post('/auth/register', { name, email, password });
      localStorage.setItem('userInfo', JSON.stringify(response.data));
      setUser(response.data);
      toast.success('Account created successfully!');
      navigate('/');
    } catch (err) {
      const message = err.response?.data?.message || 'Registration failed';
      setError(message);
      toast.error(message);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[radial-gradient(circle_at_top,#dbeafe,transparent_38%),linear-gradient(180deg,#f8fafc_0%,#eef2ff_100%)] dark:bg-[radial-gradient(circle_at_top,#172554,transparent_32%),linear-gradient(180deg,#0f172a_0%,#020617_100%)] py-16 px-4 sm:px-6 lg:px-8 transition-colors duration-300">
      <div className="max-w-5xl w-full grid lg:grid-cols-[0.95fr_1.05fr] gap-8 items-stretch">
        <div className="max-w-md lg:max-w-none w-full order-2 lg:order-1">
          <div className="bg-white/85 dark:bg-slate-900/75 backdrop-blur-xl p-8 sm:p-10 rounded-[2rem] shadow-[0_30px_80px_rgba(15,23,42,0.16)] border border-white/70 dark:border-slate-800 transition-colors">
            <div className="text-center">
              <div className="mx-auto h-14 w-14 bg-blue-100 dark:bg-blue-900/30 rounded-2xl flex items-center justify-center shadow-sm">
                <UserPlus className="h-6 w-6 text-blue-600 dark:text-blue-400" />
              </div>
              <h2 className="mt-6 text-3xl font-black tracking-tight text-gray-900 dark:text-white">Create your account</h2>
              <p className="mt-3 text-sm text-gray-600 dark:text-gray-400">
                Already have access?{' '}
                <Link to="/login" className="font-semibold text-blue-600 dark:text-blue-400 hover:text-blue-500">
                  Sign in here
                </Link>
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
                  <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">Full Name</label>
                  <input
                    type="text"
                    required
                    className="mt-2 block w-full px-4 py-3.5 border border-gray-200 dark:border-gray-700 rounded-2xl shadow-sm focus:outline-none focus:ring-4 focus:ring-blue-100 dark:focus:ring-blue-900/30 focus:border-blue-500 sm:text-sm transition-all bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500"
                    placeholder="John Doe"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                  />
                </div>
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
                    placeholder="Create a secure password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full inline-flex items-center justify-center py-3.5 px-4 rounded-2xl text-sm font-semibold text-white bg-slate-900 hover:bg-blue-600 dark:bg-blue-600 dark:hover:bg-blue-500 transition-all shadow-lg shadow-slate-900/10 dark:shadow-blue-950/30"
              >
                Create Account
                <ArrowRight className="h-4 w-4 ml-2" />
              </button>
            </form>
          </div>
        </div>

        <div className="hidden lg:flex order-1 lg:order-2 flex-col justify-between rounded-[2rem] border border-white/60 dark:border-white/10 bg-white/65 dark:bg-slate-900/55 backdrop-blur-xl shadow-[0_30px_80px_rgba(15,23,42,0.12)] p-10">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-emerald-200/80 dark:border-emerald-900/40 bg-emerald-50/80 dark:bg-emerald-900/20 px-4 py-2 text-sm font-semibold text-emerald-700 dark:text-emerald-300">
              <Sparkles className="h-4 w-4" />
              Build your prep system
            </div>
            <h1 className="mt-8 text-5xl font-black tracking-tight text-slate-900 dark:text-white">
              Start compounding better interview reps.
            </h1>
            <p className="mt-5 max-w-xl text-lg leading-8 text-slate-600 dark:text-slate-300">
              Create your profile, track progress over time, and turn scattered prep into a repeatable system that actually moves the needle.
            </p>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="rounded-2xl border border-slate-200/80 dark:border-slate-700/60 bg-white/70 dark:bg-slate-950/40 p-5">
              <p className="text-sm font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Track</p>
              <p className="mt-3 text-2xl font-black text-slate-900 dark:text-white">Scores</p>
            </div>
            <div className="rounded-2xl border border-slate-200/80 dark:border-slate-700/60 bg-white/70 dark:bg-slate-950/40 p-5">
              <p className="text-sm font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Build</p>
              <p className="mt-3 text-2xl font-black text-slate-900 dark:text-white">Streaks</p>
            </div>
            <div className="rounded-2xl border border-slate-200/80 dark:border-slate-700/60 bg-white/70 dark:bg-slate-950/40 p-5">
              <p className="text-sm font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Improve</p>
              <p className="mt-3 text-2xl font-black text-slate-900 dark:text-white">Topics</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Register;
