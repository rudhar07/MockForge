import React, { useState, useContext, useEffect, useCallback } from 'react';
import { AuthContext } from '../context/AuthContext';
import API from '../api/axios';
import toast from 'react-hot-toast';
import { ShieldCheck, PencilLine, Trash2, Search, RefreshCw, PlusCircle, Code2, ListChecks, X } from 'lucide-react';
import { Navigate } from 'react-router-dom';

const QuestionBankSkeleton = () => (
  <div className="space-y-4 animate-pulse">
    {[...Array(4)].map((_, index) => (
      <div key={index} className="rounded-2xl border border-gray-100 dark:border-gray-700 p-5 bg-slate-50 dark:bg-gray-900/30">
        <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
          <div className="space-y-3 flex-1">
            <div className="flex flex-wrap gap-2">
              <div className="h-6 w-20 rounded-full bg-gray-200 dark:bg-gray-700" />
              <div className="h-6 w-24 rounded-full bg-gray-200 dark:bg-gray-700" />
              <div className="h-6 w-20 rounded-full bg-gray-200 dark:bg-gray-700" />
            </div>
            <div className="space-y-3">
              <div className="h-6 w-2/3 rounded-2xl bg-gray-200 dark:bg-gray-700" />
              <div className="h-4 w-full rounded-full bg-gray-200 dark:bg-gray-700" />
              <div className="h-4 w-5/6 rounded-full bg-gray-200 dark:bg-gray-700" />
            </div>
          </div>
          <div className="flex flex-row lg:flex-col gap-3">
            <div className="h-10 w-24 rounded-xl bg-gray-200 dark:bg-gray-700" />
            <div className="h-10 w-24 rounded-xl bg-gray-200 dark:bg-gray-700" />
          </div>
        </div>
      </div>
    ))}
  </div>
);

const AdminDashboard = () => {
  const { user } = useContext(AuthContext);
  const initialFormState = {
    title: '',
    description: '',
    type: 'mcq',
    topic: 'arrays',
    difficulty: 'easy',
    correctAnswer: '',
    explanation: '',
    marks: 10,
    // Code-specific fields. Empty/default for MCQs so the payload stays clean.
    language: 'python',
    starterCode: '',
  };

  // First case defaults to a sample so candidates always see at least one
  // worked example. Admin can toggle it off if they really want all hidden.
  const initialTestCases = [{ input: '', expectedOutput: '', isSample: true }];

  const [formData, setFormData] = useState(initialFormState);
  const [options, setOptions] = useState(['', '', '', '']);
  const [testCases, setTestCases] = useState(initialTestCases);
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

  // Test-case editor helpers. We rebuild the array on every change rather than
  // mutating in place — React only re-renders when reference identity changes.
  const updateTestCase = (idx, patch) => {
    setTestCases((prev) =>
      prev.map((tc, i) => (i === idx ? { ...tc, ...patch } : tc))
    );
  };

  const addTestCase = () => {
    setTestCases((prev) => [
      ...prev,
      { input: '', expectedOutput: '', isSample: false },
    ]);
  };

  const removeTestCase = (idx) => {
    setTestCases((prev) => {
      // Keep at least one row visible — clearing the last row would orphan
      // the editor with no "add" affordance in view.
      if (prev.length <= 1) return prev;
      return prev.filter((_, i) => i !== idx);
    });
  };

  const resetForm = () => {
    setFormData(initialFormState);
    setOptions(['', '', '', '']);
    setTestCases(initialTestCases);
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
        type: data.type || 'mcq',
        topic: data.topic,
        difficulty: data.difficulty,
        correctAnswer: data.correctAnswer || '',
        explanation: data.explanation || '',
        marks: data.marks,
        language: data.language || 'python',
        starterCode: data.starterCode || '',
      });
      setOptions(data.options && data.options.length === 4 ? data.options : ['', '', '', '']);
      setTestCases(
        data.testCases && data.testCases.length > 0
          ? data.testCases.map((tc) => ({
              input: tc.input ?? '',
              expectedOutput: tc.expectedOutput ?? '',
              isSample: !!tc.isSample,
            }))
          : initialTestCases
      );
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

    // Type-specific validation + payload shaping. We strip irrelevant fields
    // per type so the backend never has to deal with stale state from a
    // type-toggle (e.g., MCQ leftovers when saving a code question).
    let payload;

    if (formData.type === 'mcq') {
      if (!options.every((opt) => opt.trim().length > 0)) {
        toast.error('All 4 options must be filled in.');
        return;
      }
      if (!options.includes(formData.correctAnswer)) {
        toast.error('Correct Answer MUST exactly match one of the 4 options!');
        return;
      }
      payload = {
        ...formData,
        options,
        testCases: [],
        starterCode: '',
      };
    } else if (formData.type === 'code') {
      // Code questions need at least one fully-specified test case.
      const cleanCases = testCases
        .map((tc) => ({
          input: tc.input ?? '',
          expectedOutput: (tc.expectedOutput ?? '').trim(),
          isSample: !!tc.isSample,
        }))
        .filter((tc) => tc.expectedOutput.length > 0);

      if (cleanCases.length === 0) {
        toast.error('Add at least one test case with an expected output.');
        return;
      }
      if (!cleanCases.some((tc) => tc.isSample)) {
        toast.error('Mark at least one test case as a Sample so candidates see a worked example.');
        return;
      }

      payload = {
        ...formData,
        options: [],
        correctAnswer: '', // Schema treats this as not-required for type=code.
        testCases: cleanCases,
      };
    } else {
      toast.error('Unsupported question type.');
      return;
    }

    try {
      setIsSaving(true);

      if (editingId) {
        const { data } = await API.put(`/questions/${editingId}`, payload, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setQuestions((prev) =>
          prev.map((question) => (question._id === editingId ? data : question))
        );
        toast.success('Question updated successfully!');
      } else {
        const { data } = await API.post('/questions', payload, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setQuestions((prev) => [data, ...prev]);
        toast.success('Question successfully deployed to Database!');
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

              {/* Question Type — controls which subset of fields renders below. */}
              <div>
                <label className="text-sm font-bold text-gray-700 dark:text-gray-300">Question Type</label>
                <div className="mt-2 grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, type: 'mcq' })}
                    className={`flex items-center justify-center gap-2 px-4 py-3 rounded-xl border-2 font-semibold transition ${
                      formData.type === 'mcq'
                        ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'
                        : 'border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300'
                    }`}
                  >
                    <ListChecks className="h-4 w-4" />
                    Multiple Choice
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, type: 'code' })}
                    className={`flex items-center justify-center gap-2 px-4 py-3 rounded-xl border-2 font-semibold transition ${
                      formData.type === 'code'
                        ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'
                        : 'border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300'
                    }`}
                  >
                    <Code2 className="h-4 w-4" />
                    Code
                  </button>
                </div>
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

              {/* ---- MCQ-specific fields ---- */}
              {formData.type === 'mcq' && (
                <>
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
                </>
              )}

              {/* ---- Code-specific fields ---- */}
              {formData.type === 'code' && (
                <>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-bold text-gray-700 dark:text-gray-300">Language</label>
                      <select className="mt-1 w-full p-3 border dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white" value={formData.language} onChange={(e) => setFormData({ ...formData, language: e.target.value })}>
                        <option value="python">Python</option>
                        <option value="javascript">JavaScript (Node)</option>
                        <option value="cpp">C++</option>
                        <option value="java">Java</option>
                        <option value="c">C</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-sm font-bold text-gray-700 dark:text-gray-300">Marks</label>
                      <input required type="number" min="1" className="mt-1 w-full p-3 border dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white" value={formData.marks} onChange={(e) => setFormData({ ...formData, marks: Number(e.target.value) })} />
                    </div>
                  </div>

                  <div>
                    <label className="text-sm font-bold text-gray-700 dark:text-gray-300">Starter Code (optional)</label>
                    <textarea
                      className="mt-1 w-full p-3 border dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 min-h-32 font-mono text-sm"
                      placeholder={'# e.g.\ndef two_sum(nums, target):\n    pass'}
                      value={formData.starterCode}
                      onChange={(e) => setFormData({ ...formData, starterCode: e.target.value })}
                    />
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <label className="text-sm font-bold text-gray-700 dark:text-gray-300">
                        Test Cases ({testCases.length})
                      </label>
                      <button
                        type="button"
                        onClick={addTestCase}
                        className="inline-flex items-center text-sm font-semibold text-blue-600 dark:text-blue-400 hover:underline"
                      >
                        <PlusCircle className="h-4 w-4 mr-1" />
                        Add test case
                      </button>
                    </div>

                    {testCases.map((tc, idx) => (
                      <div key={idx} className="rounded-xl border border-gray-200 dark:border-gray-700 p-4 space-y-3 bg-slate-50 dark:bg-gray-900/30">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-semibold text-gray-500 dark:text-gray-400">
                            Test #{idx + 1}
                          </span>
                          <div className="flex items-center gap-3">
                            <label className="inline-flex items-center text-xs font-semibold text-gray-600 dark:text-gray-300 cursor-pointer">
                              <input
                                type="checkbox"
                                className="mr-1.5 h-4 w-4 rounded"
                                checked={tc.isSample}
                                onChange={(e) => updateTestCase(idx, { isSample: e.target.checked })}
                              />
                              Sample (visible to candidate)
                            </label>
                            {testCases.length > 1 && (
                              <button
                                type="button"
                                onClick={() => removeTestCase(idx)}
                                className="text-red-500 hover:text-red-700"
                                title="Remove this test case"
                              >
                                <X className="h-4 w-4" />
                              </button>
                            )}
                          </div>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <div>
                            <label className="text-xs font-bold text-gray-600 dark:text-gray-400">Input (stdin)</label>
                            <textarea
                              className="mt-1 w-full p-2 border dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white font-mono text-sm min-h-20"
                              placeholder="e.g. 2 3"
                              value={tc.input}
                              onChange={(e) => updateTestCase(idx, { input: e.target.value })}
                            />
                          </div>
                          <div>
                            <label className="text-xs font-bold text-gray-600 dark:text-gray-400">Expected output (stdout)</label>
                            <textarea
                              className="mt-1 w-full p-2 border dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white font-mono text-sm min-h-20"
                              placeholder="e.g. 5"
                              value={tc.expectedOutput}
                              onChange={(e) => updateTestCase(idx, { expectedOutput: e.target.value })}
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              )}

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
                <QuestionBankSkeleton />
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
                          {question.type === 'code' ? (
                            <span className="px-3 py-1 rounded-full bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 text-xs font-semibold inline-flex items-center gap-1">
                              <Code2 className="h-3 w-3" />
                              Code · {question.language || 'n/a'}
                            </span>
                          ) : (
                            <span className="px-3 py-1 rounded-full bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 text-xs font-semibold inline-flex items-center gap-1">
                              <ListChecks className="h-3 w-3" />
                              MCQ
                            </span>
                          )}
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
