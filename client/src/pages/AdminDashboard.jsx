import React, { useState, useContext, useEffect, useCallback } from 'react';
import { AuthContext } from '../context/AuthContext';
import API from '../api/axios';
import toast from 'react-hot-toast';
import { ShieldCheck, PencilLine, Trash2, Search, RefreshCw, PlusCircle } from 'lucide-react';
import { Navigate } from 'react-router-dom';

const AdminDashboard = () => {
  const { user } = useContext(AuthContext);
  const initialFormState = {
    title: '',
    description: '',
    topic: 'arrays',
    difficulty: 'easy',
    correctAnswer: '',
    explanation: '',
    marks: 10,
  };

  const [formData, setFormData] = useState(initialFormState);
  const [options, setOptions] = useState(['', '', '', '']);
  const [questions, setQuestions] = useState([]);
  const [loadingQuestions, setLoadingQuestions] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoadingEdit, setIsLoadingEdit] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [filters, setFilters] = useState({ search: '', topic: 'all', difficulty: 'all' });
  const token = user?.token;

  const handleOptionChange = (idx, value) => {
    const newOptions = [...options];
    newOptions[idx] = value;
    setOptions(newOptions);
  };

  const resetForm = () => {
    setFormData(initialFormState);
    setOptions(['', '', '', '']);
    setEditingId(null);
  };

  const fetchQuestions = useCallback(async () => {
    setLoadingQuestions(true);
    try {
      const { data } = await API.get('/questions', {
        headers: { Authorization: `Bearer ${token}` },
      });
      setQuestions(data);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to load questions');
    } finally {
      setLoadingQuestions(false);
    }
  }, [token]);

  useEffect(() => {
    fetchQuestions();
  }, [fetchQuestions]);

  // SECURITY Bouncer: If they aren't an admin, kick them out!
  if (!user || user.role !== 'admin') {
    return <Navigate to="/" replace />;
  }

  const startEditing = async (questionId) => {
    try {
      setIsLoadingEdit(true);
      const { data } = await API.get(`/questions/${questionId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      setEditingId(data._id);
      setFormData({
        title: data.title,
        description: data.description,
        topic: data.topic,
        difficulty: data.difficulty,
        correctAnswer: data.correctAnswer,
        explanation: data.explanation,
        marks: data.marks,
      });
      setOptions(data.options);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to load question details');
    } finally {
      setIsLoadingEdit(false);
    }
  };

  const handleDelete = async (questionId) => {
    try {
      await API.delete(`/questions/${questionId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      toast.success('Question deleted successfully');
      setQuestions((prev) => prev.filter((question) => question._id !== questionId));
      if (editingId === questionId) {
        resetForm();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete question');
    }
  };

  const submitHandler = async (e) => {
    e.preventDefault();
    if (!options.includes(formData.correctAnswer)) {
      toast.error("Correct Answer MUST exactly match one of the 4 options!");
      return;
    }

    try {
      setIsSaving(true);
      const payload = { ...formData, type: 'mcq', options };

      if (editingId) {
        const { data } = await API.put(`/questions/${editingId}`, payload, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setQuestions((prev) =>
          prev.map((question) => (question._id === editingId ? data : question))
        );
        toast.success("Question updated successfully!");
      } else {
        const { data } = await API.post('/questions', payload, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setQuestions((prev) => [data, ...prev]);
        toast.success("Question successfully deployed to Database!");
      }

      resetForm();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to add question');
    } finally {
      setIsSaving(false);
    }
  };

  const filteredQuestions = questions.filter((question) => {
    const matchesSearch =
      question.title.toLowerCase().includes(filters.search.toLowerCase()) ||
      question.description.toLowerCase().includes(filters.search.toLowerCase());
    const matchesTopic = filters.topic === 'all' || question.topic === filters.topic;
    const matchesDifficulty =
      filters.difficulty === 'all' || question.difficulty === filters.difficulty;

    return matchesSearch && matchesTopic && matchesDifficulty;
  });

  return (
    <div className="flex-grow py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-8">
        <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-700 p-8 transition-colors duration-300">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
            <div>
              <div className="flex items-center mb-3">
                <ShieldCheck className="h-8 w-8 text-blue-600 dark:text-blue-400 mr-3" />
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Admin Control Panel</h1>
              </div>
              <p className="text-gray-600 dark:text-gray-400 max-w-2xl">
                Create, refine, and maintain the question bank without leaving the dashboard.
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <button
                onClick={resetForm}
                className="inline-flex items-center px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-200 font-semibold"
              >
                <PlusCircle className="h-4 w-4 mr-2" />
                New Question
              </button>
              <button
                onClick={fetchQuestions}
                className="inline-flex items-center px-4 py-3 rounded-xl bg-slate-900 dark:bg-blue-600 text-white font-semibold"
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh List
              </button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-[1.05fr_1.4fr] gap-6">
          <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-700 p-8 transition-colors duration-300">
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                {editingId ? 'Edit Question' : 'Create Question'}
              </h2>
              <p className="mt-2 text-gray-600 dark:text-gray-400">
                {editingId ? 'Update the selected question and keep the bank polished.' : 'Add a fresh prompt to the interview bank.'}
              </p>
            </div>

            <form onSubmit={submitHandler} className="space-y-6">
              <div>
                <label className="text-sm font-bold text-gray-700 dark:text-gray-300">Question Title</label>
                <input required type="text" className="mt-1 w-full p-3 border dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500" value={formData.title} onChange={(e) => setFormData({ ...formData, title: e.target.value })} />
              </div>

              <div>
                <label className="text-sm font-bold text-gray-700 dark:text-gray-300">Description / Hint</label>
                <textarea required className="mt-1 w-full p-3 border dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 min-h-28" value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-bold text-gray-700 dark:text-gray-300">Topic</label>
                  <select className="mt-1 w-full p-3 border dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white" value={formData.topic} onChange={(e) => setFormData({ ...formData, topic: e.target.value })}>
                    <option value="arrays">Arrays</option>
                    <option value="graphs">Graphs</option>
                    <option value="dp">Dynamic Programming</option>
                    <option value="oop">Object Oriented Programming</option>
                  </select>
                </div>
                <div>
                  <label className="text-sm font-bold text-gray-700 dark:text-gray-300">Difficulty</label>
                  <select className="mt-1 w-full p-3 border dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white" value={formData.difficulty} onChange={(e) => setFormData({ ...formData, difficulty: e.target.value })}>
                    <option value="easy">Easy</option>
                    <option value="medium">Medium</option>
                    <option value="hard">Hard</option>
                  </select>
                </div>
              </div>

              <div className="space-y-3">
                <label className="text-sm font-bold text-gray-700 dark:text-gray-300">Multiple Choice Options</label>
                {options.map((opt, idx) => (
                  <input key={idx} required type="text" placeholder={`Option ${idx + 1}`} className="w-full p-3 border dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500" value={opt} onChange={(e) => handleOptionChange(idx, e.target.value)} />
                ))}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-bold text-blue-600 dark:text-blue-400">Correct Answer</label>
                  <input required type="text" className="mt-1 w-full p-3 border border-blue-300 dark:border-blue-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500" value={formData.correctAnswer} onChange={(e) => setFormData({ ...formData, correctAnswer: e.target.value })} />
                </div>
                <div>
                  <label className="text-sm font-bold text-gray-700 dark:text-gray-300">Marks</label>
                  <input required type="number" min="1" className="mt-1 w-full p-3 border dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white" value={formData.marks} onChange={(e) => setFormData({ ...formData, marks: Number(e.target.value) })} />
                </div>
              </div>

              <div>
                <label className="text-sm font-bold text-gray-700 dark:text-gray-300">Explanation</label>
                <textarea required className="mt-1 w-full p-3 border dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 min-h-28" value={formData.explanation} onChange={(e) => setFormData({ ...formData, explanation: e.target.value })} />
              </div>

              <div className="flex flex-col sm:flex-row gap-3">
                <button type="submit" disabled={isSaving || isLoadingEdit} className="flex-1 bg-blue-600 text-white font-bold py-3 rounded-xl hover:bg-blue-700 transition disabled:opacity-60">
                  {isSaving ? 'Saving...' : isLoadingEdit ? 'Loading...' : editingId ? 'Update Question' : 'Deploy Question'}
                </button>
                {editingId && (
                  <button type="button" onClick={resetForm} className="px-5 py-3 rounded-xl border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-200 font-semibold">
                    Cancel Edit
                  </button>
                )}
              </div>
            </form>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-700 p-8 transition-colors duration-300">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-6">
              <div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Question Bank</h2>
                <p className="mt-2 text-gray-600 dark:text-gray-400">
                  Search, filter, edit, and clean up the content library.
                </p>
              </div>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {filteredQuestions.length} of {questions.length} questions shown
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div className="md:col-span-1 relative">
                <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search by title or hint"
                  className="w-full pl-10 pr-3 py-3 border dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  value={filters.search}
                  onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                />
              </div>
              <select
                className="w-full py-3 px-3 border dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                value={filters.topic}
                onChange={(e) => setFilters({ ...filters, topic: e.target.value })}
              >
                <option value="all">All Topics</option>
                <option value="arrays">Arrays</option>
                <option value="graphs">Graphs</option>
                <option value="dp">Dynamic Programming</option>
                <option value="oop">Object Oriented Programming</option>
              </select>
              <select
                className="w-full py-3 px-3 border dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                value={filters.difficulty}
                onChange={(e) => setFilters({ ...filters, difficulty: e.target.value })}
              >
                <option value="all">All Difficulties</option>
                <option value="easy">Easy</option>
                <option value="medium">Medium</option>
                <option value="hard">Hard</option>
              </select>
            </div>

            <div className="space-y-4">
              {loadingQuestions ? (
                <div className="rounded-2xl border border-dashed border-gray-200 dark:border-gray-700 p-10 text-center text-gray-500 dark:text-gray-400">
                  Loading questions...
                </div>
              ) : filteredQuestions.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-gray-200 dark:border-gray-700 p-10 text-center text-gray-500 dark:text-gray-400">
                  No questions match the current filters.
                </div>
              ) : (
                filteredQuestions.map((question) => (
                  <div key={question._id} className="rounded-2xl border border-gray-100 dark:border-gray-700 p-5 bg-slate-50 dark:bg-gray-900/30">
                    <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
                      <div className="space-y-3">
                        <div className="flex flex-wrap gap-2">
                          <span className="px-3 py-1 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 text-xs font-semibold capitalize">
                            {question.topic}
                          </span>
                          <span className="px-3 py-1 rounded-full bg-slate-100 dark:bg-gray-700 text-slate-700 dark:text-gray-200 text-xs font-semibold capitalize">
                            {question.difficulty}
                          </span>
                          <span className="px-3 py-1 rounded-full bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 text-xs font-semibold">
                            {question.marks} marks
                          </span>
                        </div>
                        <div>
                          <h3 className="text-lg font-bold text-gray-900 dark:text-white">{question.title}</h3>
                          <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">{question.description}</p>
                        </div>
                      </div>

                      <div className="flex flex-row lg:flex-col gap-3">
                        <button
                          onClick={() => startEditing(question._id)}
                          disabled={isLoadingEdit}
                          className="inline-flex items-center justify-center px-4 py-2 rounded-xl border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-200 font-semibold"
                        >
                          <PencilLine className="h-4 w-4 mr-2" />
                          {isLoadingEdit && editingId !== question._id ? 'Loading...' : 'Edit'}
                        </button>
                        <button
                          onClick={() => handleDelete(question._id)}
                          className="inline-flex items-center justify-center px-4 py-2 rounded-xl bg-red-600 text-white font-semibold hover:bg-red-700 transition-colors"
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Delete
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
export default AdminDashboard;
