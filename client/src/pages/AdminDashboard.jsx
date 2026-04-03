import React, { useState, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import API from '../api/axios';
import toast from 'react-hot-toast';
import { ShieldCheck } from 'lucide-react';
import { Navigate } from 'react-router-dom';

const AdminDashboard = () => {
  const { user } = useContext(AuthContext);

  // SECURITY Bouncer: If they aren't an admin, kick them out!
  if (!user || user.role !== 'admin') {
    return <Navigate to="/" replace />;
  }

  const [formData, setFormData] = useState({
    title: '', description: '', topic: 'arrays', difficulty: 'easy',
    correctAnswer: '', explanation: '', marks: 10
  });

  const [options, setOptions] = useState(['', '', '', '']);

  const handleOptionChange = (idx, value) => {
    const newOptions = [...options];
    newOptions[idx] = value;
    setOptions(newOptions);
  };

  const submitHandler = async (e) => {
    e.preventDefault();
    if (!options.includes(formData.correctAnswer)) {
      toast.error("Correct Answer MUST exactly match one of the 4 options!");
      return;
    }
    try {
      const config = { headers: { Authorization: `Bearer ${user.token}` } };
      await API.post('/questions', { ...formData, type: 'mcq', options }, config);
      
      toast.success("Question successfully deployed to Database!");
      
      // Empty the form boxes so they can type another one immediately
      setFormData({ ...formData, title: '', description: '', correctAnswer: '', explanation: '' });
      setOptions(['', '', '', '']);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to add question');
    }
  };

  return (
    <div className="flex-grow py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-8 transition-colors duration-300">
        
        <div className="flex items-center mb-8 border-b dark:border-gray-700 pb-4">
          <ShieldCheck className="h-8 w-8 text-blue-600 dark:text-blue-400 mr-3" />
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Admin Control Panel</h1>
        </div>

        <form onSubmit={submitHandler} className="space-y-6">
          <div>
            <label className="text-sm font-bold text-gray-700 dark:text-gray-300">Question Title (The actual question)</label>
            <input required type="text" className="mt-1 w-full p-2 border dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500" value={formData.title} onChange={(e) => setFormData({...formData, title: e.target.value})} />
          </div>

          <div>
            <label className="text-sm font-bold text-gray-700 dark:text-gray-300">Description / Hint</label>
            <textarea required className="mt-1 w-full p-2 border dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500" value={formData.description} onChange={(e) => setFormData({...formData, description: e.target.value})} />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-bold text-gray-700 dark:text-gray-300">Topic</label>
              <select className="mt-1 w-full p-2 border dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white" value={formData.topic} onChange={(e) => setFormData({...formData, topic: e.target.value})}>
                <option value="arrays">Arrays</option>
                <option value="strings">Strings</option>
                <option value="graphs">Graphs</option>
                <option value="dp">Dynamic Programming</option>
                <option value="oop">Object Oriented Programming</option>
              </select>
            </div>
            <div>
              <label className="text-sm font-bold text-gray-700 dark:text-gray-300">Difficulty</label>
              <select className="mt-1 w-full p-2 border dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white" value={formData.difficulty} onChange={(e) => setFormData({...formData, difficulty: e.target.value})}>
                <option value="easy">Easy</option><option value="medium">Medium</option><option value="hard">Hard</option>
              </select>
            </div>
          </div>

          <div className="space-y-3">
            <label className="text-sm font-bold text-gray-700 dark:text-gray-300">The 4 Multiple Choice Options</label>
            {options.map((opt, idx) => (
              <input key={idx} required type="text" placeholder={`Option ${idx + 1}`} className="w-full p-2 border dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500" value={opt} onChange={(e) => handleOptionChange(idx, e.target.value)} />
            ))}
          </div>

          <div>
            <label className="text-sm font-bold text-blue-600 dark:text-blue-400">Correct Answer (Must match an option exactly)</label>
            <input required type="text" className="mt-1 w-full p-2 border border-blue-300 dark:border-blue-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500" value={formData.correctAnswer} onChange={(e) => setFormData({...formData, correctAnswer: e.target.value})} />
          </div>

          <div>
            <label className="text-sm font-bold text-gray-700 dark:text-gray-300">Explanation (Shown at the end of the test)</label>
            <textarea required className="mt-1 w-full p-2 border dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500" value={formData.explanation} onChange={(e) => setFormData({...formData, explanation: e.target.value})} />
          </div>

          <button type="submit" className="w-full bg-blue-600 text-white font-bold py-3 rounded-lg hover:bg-blue-700 transition">
            Deploy Question to Database
          </button>
        </form>
      </div>
    </div>
  );
};
export default AdminDashboard;
