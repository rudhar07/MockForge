import React, { useState, useEffect, useContext, useRef, useCallback } from 'react';
import { AuthContext } from '../context/AuthContext';
import API from '../api/axios';
import { useNavigate } from 'react-router-dom';
import {
  Network,
  Layers,
  Box,
  Code,
  Clock,
  Flag,
  Sparkles,
  ChevronLeft,
  ChevronRight,
  CircleCheck,
  AlertCircle,
  FileCheck,
  Play,
  Loader2,
  Terminal,
} from 'lucide-react';
import CodeEditor from '../components/CodeEditor';

const InterviewLoadingSkeleton = () => (
  <div className="flex-grow py-10 px-4 sm:px-6 lg:px-8 animate-pulse">
    <div className="max-w-6xl mx-auto space-y-8">
      <div className="space-y-5">
        <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-5">
          <div className="space-y-3">
            <div className="h-4 w-32 rounded-full bg-gray-200 dark:bg-gray-700" />
            <div className="h-10 w-60 rounded-2xl bg-gray-200 dark:bg-gray-700" />
            <div className="h-5 w-80 rounded-full bg-gray-200 dark:bg-gray-700" />
          </div>
          <div className="h-11 w-28 rounded-xl bg-gray-200 dark:bg-gray-700" />
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-5 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
            <div className="space-y-2">
              <div className="h-4 w-20 rounded-full bg-gray-200 dark:bg-gray-700" />
              <div className="h-7 w-44 rounded-2xl bg-gray-200 dark:bg-gray-700" />
            </div>
            <div className="h-10 w-40 rounded-full bg-gray-200 dark:bg-gray-700" />
          </div>
          <div className="h-3 rounded-full bg-gray-200 dark:bg-gray-700" />
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[220px_minmax(0,1fr)] gap-6 items-start">
        <aside className="bg-white dark:bg-gray-800 rounded-3xl border border-gray-100 dark:border-gray-700 p-5 shadow-sm">
          <div className="space-y-3">
            <div className="h-4 w-32 rounded-full bg-gray-200 dark:bg-gray-700" />
            <div className="h-4 w-36 rounded-full bg-gray-200 dark:bg-gray-700" />
          </div>
          <div className="mt-5 grid grid-cols-5 sm:grid-cols-8 xl:grid-cols-1 gap-3">
            {[...Array(8)].map((_, index) => (
              <div key={index} className="h-11 xl:h-12 rounded-xl bg-gray-200 dark:bg-gray-700" />
            ))}
          </div>
        </aside>

        <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-md border border-gray-100 dark:border-gray-700 p-8 space-y-6">
          <div className="flex gap-2">
            {[...Array(3)].map((_, index) => (
              <div key={index} className="h-8 w-24 rounded-full bg-gray-200 dark:bg-gray-700" />
            ))}
          </div>
          <div className="space-y-3">
            <div className="h-10 w-3/4 rounded-2xl bg-gray-200 dark:bg-gray-700" />
            <div className="h-5 w-full rounded-full bg-gray-200 dark:bg-gray-700" />
            <div className="h-5 w-5/6 rounded-full bg-gray-200 dark:bg-gray-700" />
          </div>
          <div className="space-y-4">
            {[...Array(4)].map((_, index) => (
              <div key={index} className="h-20 rounded-xl border border-gray-100 dark:border-gray-700 bg-gray-100 dark:bg-gray-700/60" />
            ))}
          </div>
          <div className="flex flex-col md:flex-row gap-3 md:items-center md:justify-between">
            <div className="h-12 w-32 rounded-xl bg-gray-200 dark:bg-gray-700" />
            <div className="h-4 w-64 rounded-full bg-gray-200 dark:bg-gray-700" />
            <div className="h-12 w-36 rounded-xl bg-gray-200 dark:bg-gray-700" />
          </div>
        </div>
      </div>
    </div>
  </div>
);

const Interview = () => {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  const storageKey = user?._id ? `mockforge:interview:${user._id}` : null;
  const [topic, setTopic] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [aiReview, setAiReview] = useState(null);
  // Per-question results — populated by backend after submission. Each item
  // has { questionId, title, type, isCorrect, earnedMarks, ... } plus type-
  // specific extras: MCQs carry selectedAnswer/correctAnswer; code questions
  // carry testResults, testsPassed, testsTotal, submittedCode, language.
  const [reviewItems, setReviewItems] = useState([]);
  const [showResult, setShowResult] = useState(false);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [timeLeft, setTimeLeft] = useState(600);
  const [answers, setAnswers] = useState({});
  const [flaggedQuestions, setFlaggedQuestions] = useState({});
  const [reviewMode, setReviewMode] = useState(false);
  const [fetchError, setFetchError] = useState('');
  const [submitError, setSubmitError] = useState('');
  const [regeneratingReview, setRegeneratingReview] = useState(false);
  const [resumeCandidate, setResumeCandidate] = useState(null);
  // Per-question state for the "Run Code" feature. Keyed by question _id so
  // navigating away and back preserves the last run output without re-running.
  const [runOutput, setRunOutput] = useState({});
  const [running, setRunning] = useState({});
  const answersRef = useRef({});
  const submitInterviewRef = useRef(null);

  useEffect(() => {
    answersRef.current = answers;
  }, [answers]);

  useEffect(() => {
    if (!storageKey) {
      return;
    }

    const savedSession = localStorage.getItem(storageKey);
    if (!savedSession) {
      return;
    }

    try {
      const parsed = JSON.parse(savedSession);
      if (parsed?.topic) {
        setResumeCandidate(parsed);
      }
    } catch {
      localStorage.removeItem(storageKey);
    }
  }, [storageKey]);

  // It physically legally cannot run until `topic` is chosen!
  useEffect(() => {
    const fetchQuestions = async () => {
      if (!topic) return;

      setLoading(true);
      setFetchError('');
      setSubmitError('');
      setQuestions([]);
      setCurrentIndex(0);
      setScore(0);
      setShowResult(false);
      setReviewMode(false);
      setTimeLeft(600);
      setAnswers({});
      setFlaggedQuestions({});
      setReviewItems([]);
      answersRef.current = {};

      try {
        const config = { headers: { Authorization: `Bearer ${user.token}` } };
        const { data } = await API.get(`/questions/topic/${topic}`, config);
        setQuestions(data);
      } catch (error) {
        setFetchError(error.response?.data?.message || 'Unable to load this interview right now.');
      } finally {
        setLoading(false);
      }
    };
    fetchQuestions();
  }, [user.token, topic]);

  const totalPossible = questions.reduce((total, question) => total + (question.marks ?? 0), 0);
  const answeredCount = questions.filter((question) => answers[question._id]).length;
  const progress = questions.length ? ((answeredCount / questions.length) * 100).toFixed(0) : 0;
  const currentQ = questions[currentIndex];
  const hasActiveInterview =
    Boolean(topic) &&
    questions.length > 0 &&
    !loading &&
    !showResult &&
    !fetchError &&
    !submitting;

  const submitInterview = useCallback(async (answerMap = answers, options = {}) => {
    if (!topic || submitting) {
      return;
    }

    const { regenerate = false } = options;
    if (regenerate) {
      setRegeneratingReview(true);
    } else {
      setSubmitting(true);
    }
    setSubmitError('');

    try {
      const config = { headers: { Authorization: `Bearer ${user.token}` } };
      // Shape each response per the question's type. Code Qs send { code };
      // MCQs send { selectedOption } as before. This is what makes the
      // Phase 3 backend scoring kick in for code submissions.
      const questionTypeById = Object.fromEntries(questions.map((q) => [q._id, q.type]));
      const responses = Object.entries(answerMap).map(([questionId, answer]) => {
        if (questionTypeById[questionId] === 'code') {
          return { questionId, code: answer };
        }
        return { questionId, selectedOption: answer };
      });
      const flaggedQuestionIds = Object.entries(flaggedQuestions)
        .filter(([, isFlagged]) => Boolean(isFlagged))
        .map(([questionId]) => questionId);

      const endpoint = regenerate ? '/submissions/review' : '/submissions';

      const { data } = await API.post(
        endpoint,
        { topic, responses, flaggedQuestionIds },
        config
      );

      setScore(data.score);
      setAiReview(data.aiReview ?? null);
      setReviewItems(Array.isArray(data.reviewItems) ? data.reviewItems : []);
      setShowResult(true);
      setReviewMode(false);
      if (storageKey) {
        localStorage.removeItem(storageKey);
      }
    } catch (error) {
      setSubmitError(error.response?.data?.message || 'Submission failed. Please try again.');
    } finally {
      if (regenerate) {
        setRegeneratingReview(false);
      } else {
        setSubmitting(false);
      }
    }
  }, [answers, flaggedQuestions, questions, storageKey, submitting, topic, user.token]);

  useEffect(() => {
    submitInterviewRef.current = submitInterview;
  }, [submitInterview]);

  useEffect(() => {
    if (!topic || loading || showResult || reviewMode || questions.length === 0 || submitting) {
      return undefined;
    }

    if (topic && !loading && !showResult && questions.length > 0) {
      const timerInterval = setInterval(() => {
        setTimeLeft((prevTime) => {
          if (prevTime <= 1) {
            clearInterval(timerInterval);
            submitInterviewRef.current?.(answersRef.current);
            return 0;
          }
          return prevTime - 1;
        });
      }, 1000);

      return () => clearInterval(timerInterval);
    }
  }, [topic, loading, showResult, reviewMode, questions.length, submitting]);

  const handleSelectAnswer = useCallback((option) => {
    if (!currentQ) return;

    setAnswers((prev) => ({
      ...prev,
      [currentQ._id]: option,
    }));
  }, [currentQ]);

  // Pre-populate the editor with starter code the first time a candidate
  // visits a code question. We use the functional setAnswers form so we
  // don't have to depend on `answers` (which would cause this effect to
  // refire on every keystroke).
  useEffect(() => {
    if (!currentQ || currentQ.type !== 'code') return;
    setAnswers((prev) => {
      if (prev[currentQ._id] !== undefined) return prev;
      return { ...prev, [currentQ._id]: currentQ.starterCode || '' };
    });
  }, [currentQ]);

  // POST the current code to /api/execute/run with the first sample test
  // case's input as stdin. Mirrors LeetCode's "Run" (preview against examples)
  // distinct from "Submit" (run all tests, including hidden ones).
  const runCurrentCode = useCallback(async () => {
    if (!currentQ || currentQ.type !== 'code') return;

    const code = answers[currentQ._id] ?? '';
    const stdin = currentQ.sampleTestCases?.[0]?.input ?? '';

    setRunning((prev) => ({ ...prev, [currentQ._id]: true }));

    try {
      const config = { headers: { Authorization: `Bearer ${user.token}` } };
      const { data } = await API.post(
        '/execute/run',
        { language: currentQ.language, code, stdin },
        config
      );
      setRunOutput((prev) => ({ ...prev, [currentQ._id]: data }));
    } catch (error) {
      setRunOutput((prev) => ({
        ...prev,
        [currentQ._id]: {
          status: 'error',
          stdout: '',
          stderr: '',
          message: error.response?.data?.message || 'Could not reach the execution service.',
        },
      }));
    } finally {
      setRunning((prev) => ({ ...prev, [currentQ._id]: false }));
    }
  }, [currentQ, answers, user.token]);

  const handleNext = useCallback(() => {
    if (currentIndex + 1 < questions.length) {
      setCurrentIndex((prev) => prev + 1);
      return;
    }

    setReviewMode(true);
  }, [currentIndex, questions.length]);

  const handlePrevious = useCallback(() => {
    setCurrentIndex((prev) => Math.max(prev - 1, 0));
  }, []);

  const handleBackToQuestions = (index = 0) => {
    setReviewMode(false);
    setCurrentIndex(index);
  };

  const jumpToQuestion = useCallback((index) => {
    setCurrentIndex(index);
    setReviewMode(false);
  }, []);

  const toggleFlagForCurrentQuestion = useCallback(() => {
    if (!currentQ) {
      return;
    }

    setFlaggedQuestions((prev) => ({
      ...prev,
      [currentQ._id]: !prev[currentQ._id],
    }));
  }, [currentQ]);

  const restoreSavedInterview = useCallback(() => {
    if (!resumeCandidate?.topic) {
      return;
    }

    setTopic(resumeCandidate.topic);
    setCurrentIndex(resumeCandidate.currentIndex ?? 0);
    setTimeLeft(resumeCandidate.timeLeft ?? 600);
    setAnswers(resumeCandidate.answers ?? {});
    setFlaggedQuestions(resumeCandidate.flaggedQuestions ?? {});
    answersRef.current = resumeCandidate.answers ?? {};
    setReviewMode(Boolean(resumeCandidate.reviewMode));
    setResumeCandidate(null);
  }, [resumeCandidate]);

  const restartTopicSelection = () => {
    setTopic(null);
    setQuestions([]);
    setCurrentIndex(0);
    setScore(0);
    setAiReview(null);
    setReviewItems([]);
    setShowResult(false);
    setLoading(false);
    setSubmitting(false);
    setTimeLeft(600);
    setAnswers({});
    setFlaggedQuestions({});
    setReviewMode(false);
    setFetchError('');
    setSubmitError('');
    setResumeCandidate(null);
    if (storageKey) {
      localStorage.removeItem(storageKey);
    }
  };

  const retryCurrentTopic = async () => {
    if (!topic) {
      return;
    }

    setLoading(true);
    setFetchError('');
    setSubmitError('');
    setQuestions([]);
    setCurrentIndex(0);
    setScore(0);
    setShowResult(false);
    setReviewMode(false);
    setTimeLeft(600);
    setAnswers({});
    setFlaggedQuestions({});
    setReviewItems([]);
    answersRef.current = {};

    try {
      const config = { headers: { Authorization: `Bearer ${user.token}` } };
      const { data } = await API.get(`/questions/topic/${topic}`, config);
      setQuestions(data);
    } catch (error) {
      setFetchError(error.response?.data?.message || 'Unable to load this interview right now.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!topic || loading || showResult || reviewMode || submitting || !currentQ) {
      return undefined;
    }

    const handleKeyDown = (event) => {
      const target = event.target;
      const tagName = target?.tagName?.toLowerCase();
      const isTypingField =
        tagName === 'input' || tagName === 'textarea' || target?.isContentEditable;

      // Belt-and-braces: also skip if the event originated anywhere inside a
      // Monaco editor. The `isTypingField` check above usually catches Monaco's
      // hidden textarea, but Monaco's internal DOM (overlays, suggest widgets,
      // etc.) can be the actual `event.target` in edge cases and would slip
      // through. `.closest('.monaco-editor')` walks up the ancestor chain
      // looking for Monaco's root container — caught no matter what.
      const isInsideMonaco = typeof target?.closest === 'function'
        && !!target.closest('.monaco-editor');

      if (isTypingField || isInsideMonaco) {
        return;
      }

      // 1-4 keys are MCQ-only. Code questions don't have `options`; reading
      // `.length` on undefined would crash the whole handler.
      if (currentQ.type === 'mcq') {
        const optionIndex = Number(event.key) - 1;
        if (optionIndex >= 0 && optionIndex < (currentQ.options?.length ?? 0)) {
          event.preventDefault();
          handleSelectAnswer(currentQ.options[optionIndex]);
          return;
        }
      }

      if (event.key === 'ArrowLeft') {
        event.preventDefault();
        handlePrevious();
        return;
      }

      // Enter advances only for MCQs (a deliberate shortcut after selecting).
      // For code questions, Enter has no business advancing — candidates
      // press it constantly inside the editor. ArrowRight still works for
      // intentional navigation from outside the editor.
      const advanceKey =
        event.key === 'ArrowRight' ||
        (event.key === 'Enter' && currentQ.type === 'mcq');

      if (advanceKey) {
        if (!answers[currentQ._id]) {
          return;
        }

        event.preventDefault();
        handleNext();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [answers, currentQ, handleNext, handlePrevious, handleSelectAnswer, loading, reviewMode, showResult, submitting, topic]);

  useEffect(() => {
    if (!storageKey || !topic || showResult) {
      return;
    }

    const snapshot = {
      topic,
      currentIndex,
      timeLeft,
      answers,
      flaggedQuestions,
      reviewMode,
      savedAt: new Date().toISOString(),
    };

    localStorage.setItem(storageKey, JSON.stringify(snapshot));
  }, [answers, currentIndex, flaggedQuestions, reviewMode, showResult, storageKey, timeLeft, topic]);

  useEffect(() => {
    if (!hasActiveInterview) {
      return undefined;
    }

    const handleBeforeUnload = (event) => {
      event.preventDefault();
      event.returnValue = '';
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [hasActiveInterview]);

  useEffect(() => {
    if (!hasActiveInterview) {
      return undefined;
    }

    const handleDocumentClick = (event) => {
      const anchor = event.target.closest('a[href]');
      if (!anchor) {
        return;
      }

      const href = anchor.getAttribute('href');
      if (!href || href.startsWith('#') || href.startsWith('mailto:') || href.startsWith('tel:')) {
        return;
      }

      const destination = new URL(anchor.href, window.location.origin);
      const currentUrl = new URL(window.location.href);
      const isSamePath =
        destination.pathname === currentUrl.pathname &&
        destination.search === currentUrl.search &&
        destination.hash === currentUrl.hash;

      if (isSamePath || destination.origin !== currentUrl.origin) {
        return;
      }

      const shouldLeave = window.confirm(
        'Your interview is still in progress. If you leave this page, you can resume later from autosave. Do you want to continue?'
      );

      if (!shouldLeave) {
        event.preventDefault();
        event.stopPropagation();
      }
    };

    document.addEventListener('click', handleDocumentClick, true);
    return () => document.removeEventListener('click', handleDocumentClick, true);
  }, [hasActiveInterview]);

  if (!topic) {
    return (
      <div className="flex-grow flex items-center justify-center bg-gray-50 dark:bg-gray-900 py-12 px-4 transition-colors duration-300">
        <div className="max-w-4xl mx-auto w-full">
          {resumeCandidate?.topic && (
            <div className="mb-8 rounded-3xl border border-blue-100 dark:border-blue-900/40 bg-white dark:bg-gray-800 p-6 shadow-sm">
              <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                <div>
                  <p className="text-sm font-semibold uppercase tracking-wide text-blue-600 dark:text-blue-400">
                    Saved Interview Found
                  </p>
                  <h2 className="mt-2 text-2xl font-bold text-gray-900 dark:text-white capitalize">
                    Resume your {resumeCandidate.topic} round
                  </h2>
                  <p className="mt-2 text-gray-600 dark:text-gray-400">
                    Question {(resumeCandidate.currentIndex ?? 0) + 1}, {Object.keys(resumeCandidate.answers ?? {}).length} answered, {Math.max(resumeCandidate.timeLeft ?? 600, 0)} seconds remaining.
                  </p>
                </div>
                <div className="flex flex-col sm:flex-row gap-3">
                  <button
                    onClick={restoreSavedInterview}
                    className="px-5 py-3 rounded-xl bg-blue-600 text-white font-semibold hover:bg-blue-700 transition-colors"
                  >
                    Resume Interview
                  </button>
                  <button
                    onClick={restartTopicSelection}
                    className="px-5 py-3 rounded-xl border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-200 font-semibold"
                  >
                    Start Fresh
                  </button>
                </div>
              </div>
            </div>
          )}

          <div className="text-center mb-12">
            <h1 className="text-4xl font-extrabold text-gray-900 dark:text-white mb-4">Select Interview Topic</h1>
            <p className="text-xl text-gray-600 dark:text-gray-400">Choose a focused practice round and step into interview mode.</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <button onClick={() => setTopic('arrays')} className="bg-white dark:bg-gray-800 p-8 rounded-2xl shadow-sm border border-blue-100 dark:border-gray-700 hover:border-blue-400 dark:hover:border-blue-500 hover:shadow-xl transition-all duration-300 hover:-translate-y-2 group text-left">
              <Layers className="h-10 w-10 text-blue-500 dark:text-blue-400 mb-4 group-hover:scale-110 transition-transform" />
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white">Arrays & Hashing</h3>
              <p className="text-gray-500 dark:text-gray-400 mt-2">Pointers, hash maps, and sliding window patterns.</p>
            </button>

            <button onClick={() => setTopic('graphs')} className="bg-white dark:bg-gray-800 p-8 rounded-2xl shadow-sm border border-violet-100 dark:border-gray-700 hover:border-violet-400 dark:hover:border-violet-500 hover:shadow-xl transition-all duration-300 hover:-translate-y-2 group text-left">
              <Network className="h-10 w-10 text-violet-500 dark:text-violet-400 mb-4 group-hover:scale-110 transition-transform" />
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white">Graph Algorithms</h3>
              <p className="text-gray-500 dark:text-gray-400 mt-2">BFS, DFS, traversals, and graph reasoning under time pressure.</p>
            </button>

            <button onClick={() => setTopic('dp')} className="bg-white dark:bg-gray-800 p-8 rounded-2xl shadow-sm border border-pink-100 dark:border-gray-700 hover:border-pink-400 dark:hover:border-pink-500 hover:shadow-xl transition-all duration-300 hover:-translate-y-2 group text-left">
              <Box className="h-10 w-10 text-pink-500 dark:text-pink-400 mb-4 group-hover:scale-110 transition-transform" />
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white">Dynamic Programming</h3>
              <p className="text-gray-500 dark:text-gray-400 mt-2">Recurrence thinking, memoization, and tabulation tradeoffs.</p>
            </button>

            <button onClick={() => setTopic('oop')} className="bg-white dark:bg-gray-800 p-8 rounded-2xl shadow-sm border border-emerald-100 dark:border-gray-700 hover:border-emerald-400 dark:hover:border-emerald-500 hover:shadow-xl transition-all duration-300 hover:-translate-y-2 group text-left">
              <Code className="h-10 w-10 text-emerald-500 dark:text-emerald-400 mb-4 group-hover:scale-110 transition-transform" />
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white">Object Oriented</h3>
              <p className="text-gray-500 dark:text-gray-400 mt-2">Design principles, abstraction, and modeling choices.</p>
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (loading) {
    return <InterviewLoadingSkeleton />;
  }

  if (fetchError) {
    return (
      <div className="flex-grow flex items-center justify-center px-4 py-24">
        <div className="max-w-lg w-full bg-white dark:bg-gray-800 border border-red-100 dark:border-red-900/40 rounded-2xl p-8 shadow-sm text-center">
          <AlertCircle className="h-12 w-12 mx-auto text-red-500 mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Couldn&apos;t start this interview</h2>
          <p className="mt-3 text-gray-600 dark:text-gray-400">{fetchError}</p>
          <div className="mt-6 flex flex-col sm:flex-row gap-3 justify-center">
            <button onClick={() => setTopic(null)} className="px-5 py-3 rounded-xl bg-slate-900 dark:bg-slate-100 dark:text-slate-900 text-white font-semibold">
              Pick Another Topic
            </button>
             <button onClick={retryCurrentTopic} className="px-5 py-3 rounded-xl border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-200 font-semibold">
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (questions.length === 0) {
    return (
      <div className="flex-grow flex flex-col items-center justify-center py-32 text-center px-4">
        <FileCheck className="h-14 w-14 text-blue-500 mb-5" />
        <h2 className="text-4xl font-black text-gray-900 dark:text-white mb-4">No Questions Found</h2>
        <p className="text-xl text-gray-500 dark:text-gray-400 mb-8 max-w-md">
          There are no questions available for this topic yet. Choose another topic and keep your momentum going.
        </p>
        <button onClick={() => setTopic(null)} className="px-8 py-3 bg-blue-600 text-white rounded-lg font-bold hover:bg-blue-700 transition">
          Back To Topics
        </button>
      </div>
    );
  }

  if (showResult) {
    const percentage = totalPossible ? Math.round((score / totalPossible) * 100) : 0;

    return (
      <div className="flex-grow py-16 px-4 flex items-center justify-center">
        <div className="bg-white dark:bg-gray-800 p-10 rounded-3xl shadow-xl border border-gray-100 dark:border-gray-700 text-center max-w-4xl w-full">
          <div className="mx-auto mb-6 h-16 w-16 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
            <CircleCheck className="h-8 w-8 text-emerald-600 dark:text-emerald-400" />
          </div>
          <h2 className="text-3xl font-black text-gray-900 dark:text-white mb-3">Interview Complete</h2>
          <p className="text-lg text-gray-600 dark:text-gray-400 mb-8">
            Nice work. You finished the <span className="capitalize font-semibold">{topic}</span> round and your submission was saved.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
            <div className="rounded-2xl bg-slate-50 dark:bg-gray-900/50 p-5 border border-slate-100 dark:border-gray-700">
              <p className="text-sm uppercase tracking-wide text-gray-500 dark:text-gray-400">Score</p>
              <p className="mt-2 text-3xl font-black text-gray-900 dark:text-white">{score}<span className="text-lg text-gray-500">/{totalPossible}</span></p>
            </div>
            <div className="rounded-2xl bg-slate-50 dark:bg-gray-900/50 p-5 border border-slate-100 dark:border-gray-700">
              <p className="text-sm uppercase tracking-wide text-gray-500 dark:text-gray-400">Accuracy</p>
              <p className="mt-2 text-3xl font-black text-gray-900 dark:text-white">{percentage}%</p>
            </div>
            <div className="rounded-2xl bg-slate-50 dark:bg-gray-900/50 p-5 border border-slate-100 dark:border-gray-700">
              <p className="text-sm uppercase tracking-wide text-gray-500 dark:text-gray-400">Answered</p>
              <p className="mt-2 text-3xl font-black text-gray-900 dark:text-white">{answeredCount}<span className="text-lg text-gray-500">/{questions.length}</span></p>
            </div>
          </div>

          {aiReview && (
            <div className="mb-8 rounded-3xl border border-blue-100 dark:border-blue-900/40 bg-blue-50/70 dark:bg-blue-900/10 p-6 text-left">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
                <div className="flex items-center gap-3">
                  <div className="h-11 w-11 rounded-2xl bg-white dark:bg-gray-800 flex items-center justify-center shadow-sm">
                    <Sparkles className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold uppercase tracking-wide text-blue-700 dark:text-blue-300">
                      AI Coach Review
                    </p>
                    <p className="text-sm text-blue-600 dark:text-blue-400">
                      {aiReview.status === 'ready'
                        ? `Generated with ${aiReview.provider}`
                        : 'Setup note'}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => submitInterview(answers, { regenerate: true })}
                  disabled={regeneratingReview || submitting}
                  className="inline-flex items-center justify-center px-4 py-2 rounded-xl bg-white dark:bg-gray-800 border border-blue-200 dark:border-blue-900/40 text-blue-700 dark:text-blue-300 font-semibold hover:bg-blue-100 dark:hover:bg-blue-900/20 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {regeneratingReview ? 'Regenerating...' : 'Regenerate Review'}
                </button>
              </div>

              {aiReview.content ? (
                <p className="whitespace-pre-line text-gray-700 dark:text-gray-200 leading-7">
                  {aiReview.content}
                </p>
              ) : (
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {aiReview.message || 'AI review is currently unavailable for this attempt.'}
                </p>
              )}
            </div>
          )}

          {reviewItems.length > 0 && (
            <div className="mb-8 text-left space-y-4">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white">Question-by-Question Breakdown</h3>

              {reviewItems.map((item) => {
                const isCorrect = !!item.isCorrect;
                const isCode = item.type === 'code';

                return (
                  <div
                    key={item.questionId}
                    className={`rounded-2xl border p-5 ${
                      isCorrect
                        ? 'border-emerald-200 dark:border-emerald-900/40 bg-emerald-50/50 dark:bg-emerald-900/10'
                        : 'border-rose-200 dark:border-rose-900/40 bg-rose-50/50 dark:bg-rose-900/10'
                    }`}
                  >
                    {/* Header: badges + marks */}
                    <div className="flex flex-wrap items-center gap-2 mb-3">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-bold inline-flex items-center gap-1 ${
                        isCode
                          ? 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300'
                          : 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300'
                      }`}>
                        {isCode ? <Code className="h-3 w-3" /> : null}
                        {isCode ? item.language || 'code' : 'mcq'}
                      </span>

                      {isCorrect ? (
                        <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 inline-flex items-center gap-1">
                          <CircleCheck className="h-3 w-3" />
                          Correct
                        </span>
                      ) : (
                        <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-rose-100 dark:bg-rose-900/30 text-rose-700 dark:text-rose-300 inline-flex items-center gap-1">
                          <AlertCircle className="h-3 w-3" />
                          {isCode && item.testsTotal
                            ? `${item.testsPassed}/${item.testsTotal} tests passed`
                            : 'Incorrect'}
                        </span>
                      )}

                      {typeof item.earnedMarks === 'number' && (
                        <span className="ml-auto text-sm font-semibold text-gray-700 dark:text-gray-300">
                          {item.earnedMarks} marks earned
                        </span>
                      )}
                    </div>

                    <p className="text-base font-bold text-gray-900 dark:text-white mb-3">{item.title}</p>

                    {/* MCQ body */}
                    {!isCode && (
                      <div className="space-y-2 text-sm">
                        <div>
                          <span className="text-gray-500 dark:text-gray-400">Your answer: </span>
                          <span className={isCorrect ? 'text-emerald-700 dark:text-emerald-300 font-semibold' : 'text-rose-700 dark:text-rose-300 font-semibold'}>
                            {item.selectedAnswer || '(no answer)'}
                          </span>
                        </div>
                        {!isCorrect && (
                          <div>
                            <span className="text-gray-500 dark:text-gray-400">Correct answer: </span>
                            <span className="text-emerald-700 dark:text-emerald-300 font-semibold">{item.correctAnswer}</span>
                          </div>
                        )}
                        {item.explanation && (
                          <div className="mt-2 rounded-lg bg-white/60 dark:bg-gray-800/60 p-3 text-gray-700 dark:text-gray-200">
                            <span className="text-xs font-bold uppercase tracking-wide text-gray-500 dark:text-gray-400">Explanation</span>
                            <p className="mt-1 whitespace-pre-wrap">{item.explanation}</p>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Code body */}
                    {isCode && (
                      <div className="space-y-3">
                        {/* Per-test-case results */}
                        {Array.isArray(item.testResults) && item.testResults.length > 0 && (
                          <div className="space-y-1.5">
                            {item.testResults.map((tr, idx) => (
                              <div
                                key={idx}
                                className={`flex items-start gap-3 rounded-lg px-3 py-2 text-sm ${
                                  tr.passed
                                    ? 'bg-emerald-100/60 dark:bg-emerald-900/20 text-emerald-900 dark:text-emerald-100'
                                    : 'bg-rose-100/60 dark:bg-rose-900/20 text-rose-900 dark:text-rose-100'
                                }`}
                              >
                                {tr.passed ? (
                                  <CircleCheck className="h-4 w-4 mt-0.5 flex-shrink-0 text-emerald-600 dark:text-emerald-400" />
                                ) : (
                                  <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0 text-rose-600 dark:text-rose-400" />
                                )}
                                <div className="flex-1 min-w-0">
                                  <div className="font-semibold">
                                    Test {idx + 1}
                                    <span className="ml-2 text-xs font-normal opacity-75">
                                      {tr.isSample ? 'sample' : 'hidden'}
                                      {tr.status !== 'success' && ` · ${tr.status}`}
                                    </span>
                                  </div>
                                  {!tr.passed && (
                                    <div className="mt-1 grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs font-mono">
                                      <div>
                                        <div className="opacity-60">input</div>
                                        <pre className="whitespace-pre-wrap">{tr.input || '(empty)'}</pre>
                                      </div>
                                      <div>
                                        <div className="opacity-60">expected</div>
                                        <pre className="whitespace-pre-wrap">{tr.expectedOutput}</pre>
                                      </div>
                                      <div>
                                        <div className="opacity-60">got</div>
                                        <pre className="whitespace-pre-wrap">{tr.actualOutput || tr.errorMessage || '(no output)'}</pre>
                                      </div>
                                    </div>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        )}

                        {/* Submitted code (read-only Monaco viewer) */}
                        {item.submittedCode && (
                          <details className="rounded-xl bg-white/60 dark:bg-gray-800/60 border border-gray-200 dark:border-gray-700">
                            <summary className="cursor-pointer px-4 py-2 text-sm font-semibold text-gray-700 dark:text-gray-200">
                              View submitted code
                            </summary>
                            <div className="p-3 pt-0">
                              <CodeEditor
                                language={item.language || 'python'}
                                value={item.submittedCode}
                                onChange={() => {}}
                                readOnly
                                height="240px"
                              />
                            </div>
                          </details>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <button
              onClick={() => navigate('/dashboard')}
              className="px-6 py-3 rounded-xl bg-slate-900 dark:bg-blue-600 text-white font-semibold hover:bg-blue-600 dark:hover:bg-blue-500 transition-colors"
            >
              Review Attempt On Dashboard
            </button>
            <button
              onClick={restartTopicSelection}
              className="px-6 py-3 rounded-xl border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-200 font-semibold"
            >
              Practice Another Topic
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (reviewMode) {
    return (
      <div className="flex-grow py-10 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-md border border-gray-100 dark:border-gray-700 p-8">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
              <div>
                <h1 className="text-3xl font-black text-gray-900 dark:text-white">Review Your Answers</h1>
                <p className="mt-2 text-gray-600 dark:text-gray-400">
                  Check your selections before submitting. You can still jump back and edit any answer.
                </p>
              </div>
              <div className="rounded-2xl bg-blue-50 dark:bg-blue-900/20 px-5 py-4">
                <p className="text-sm text-blue-700 dark:text-blue-300 font-semibold">{answeredCount} of {questions.length} answered</p>
                <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">Unanswered questions will be submitted blank.</p>
              </div>
            </div>

            <div className="space-y-4 mb-6">
              <div className="rounded-2xl border border-gray-100 dark:border-gray-700 bg-slate-50 dark:bg-gray-900/30 p-5">
                <p className="text-sm font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400 mb-4">
                  Question Palette
                </p>
                <div className="grid grid-cols-5 sm:grid-cols-8 gap-3">
                  {questions.map((question, index) => {
                    const isAnswered = Boolean(answers[question._id]);
                    const isFlagged = Boolean(flaggedQuestions[question._id]);
                    return (
                      <button
                        key={question._id}
                        onClick={() => jumpToQuestion(index)}
                        className={`h-11 rounded-xl font-bold transition-colors ${
                          isFlagged
                            ? 'bg-amber-100 dark:bg-amber-900/30 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-700 hover:bg-amber-200 dark:hover:bg-amber-900/40'
                            : isAnswered
                              ? 'bg-blue-600 text-white hover:bg-blue-700'
                              : 'bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-200 hover:border-blue-400'
                        }`}
                      >
                        {index + 1}
                      </button>
                    );
                  })}
                </div>
              </div>

              {questions.map((question, index) => {
                const selectedAnswer = answers[question._id];
                const answered = Boolean(selectedAnswer);
                const isFlagged = Boolean(flaggedQuestions[question._id]);

                return (
                  <div key={question._id} className="rounded-2xl border border-gray-100 dark:border-gray-700 p-5 bg-slate-50 dark:bg-gray-900/30">
                    <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                      <div>
                        <p className="text-sm font-semibold text-gray-500 dark:text-gray-400">Question {index + 1}</p>
                        <h3 className="mt-1 text-lg font-bold text-gray-900 dark:text-white">{question.title}</h3>
                        <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                          {answered ? `Selected: ${selectedAnswer}` : 'No answer selected yet'}
                        </p>
                        {isFlagged && (
                          <p className="mt-2 inline-flex items-center text-sm font-semibold text-amber-600 dark:text-amber-400">
                            <Flag className="h-4 w-4 mr-2" />
                            Flagged for review
                          </p>
                        )}
                      </div>
                      <button
                        onClick={() => handleBackToQuestions(index)}
                        className="px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-700 text-sm font-semibold text-gray-700 dark:text-gray-200"
                      >
                        Edit
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            {submitError && (
              <div className="mb-5 rounded-xl border border-red-200 dark:border-red-900/40 bg-red-50 dark:bg-red-900/10 px-4 py-3 text-red-700 dark:text-red-300">
                {submitError}
              </div>
            )}

            <div className="flex flex-col sm:flex-row gap-3 justify-between">
              <button
                onClick={() => handleBackToQuestions(questions.length - 1)}
                className="px-5 py-3 rounded-xl border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-200 font-semibold"
              >
                Back To Questions
              </button>
              <button
                onClick={() => submitInterview()}
                disabled={submitting}
                className="px-6 py-3 rounded-xl bg-blue-600 text-white font-semibold hover:bg-blue-700 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {submitting ? 'Submitting...' : 'Submit Interview'}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-grow py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-5 mb-5">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-blue-600 dark:text-blue-400">Mock Interview</p>
              <h1 className="text-3xl font-black text-gray-900 dark:text-white capitalize mt-2">{topic} Round</h1>
              <p className="mt-2 text-gray-600 dark:text-gray-400">
                Stay calm, answer deliberately, and submit when you're satisfied.
              </p>
            </div>

            <div className={`flex items-center font-bold px-4 py-2 rounded-xl w-max ${timeLeft < 60 ? 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 animate-pulse' : 'bg-orange-50 dark:bg-orange-900/20 text-orange-600 dark:text-orange-400'}`}>
              <Clock className="w-4 h-4 mr-2" />
              {Math.floor(timeLeft / 60)}:{(timeLeft % 60).toString().padStart(2, '0')}
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-5 shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Progress</p>
                <p className="text-lg font-bold text-gray-900 dark:text-white">{answeredCount} of {questions.length} answered</p>
              </div>
              <span className="bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 py-2 px-4 rounded-full font-bold shadow-sm">
                Question {currentIndex + 1} of {questions.length}
              </span>
            </div>

            <div className="h-3 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-blue-500 via-cyan-500 to-emerald-500 rounded-full transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-[220px_minmax(0,1fr)] gap-6 items-start">
          <aside className="xl:sticky xl:top-24">
            <div className="bg-white dark:bg-gray-800 rounded-3xl border border-gray-100 dark:border-gray-700 p-5 shadow-sm">
              <div className="flex items-center justify-between gap-3 xl:flex-col xl:items-start xl:justify-start">
                <div>
                  <p className="text-sm font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                    Question Palette
                  </p>
                  <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                    Jump between questions anytime.
                  </p>
                </div>
                <div className="text-right xl:text-left">
                  <p className="text-2xl font-black text-gray-900 dark:text-white">{answeredCount}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">answered</p>
                </div>
              </div>

              <div className="mt-5 grid grid-cols-5 sm:grid-cols-8 xl:grid-cols-1 gap-3">
                {questions.map((question, index) => {
                  const isCurrent = index === currentIndex;
                  const isAnswered = Boolean(answers[question._id]);
                  const isFlagged = Boolean(flaggedQuestions[question._id]);

                  return (
                    <button
                      key={question._id}
                      onClick={() => jumpToQuestion(index)}
                      className={`h-11 xl:h-12 rounded-xl font-bold transition-colors xl:w-full ${
                        isCurrent
                          ? 'bg-slate-900 dark:bg-blue-600 text-white'
                          : isFlagged
                            ? 'bg-amber-100 dark:bg-amber-900/30 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-700 hover:bg-amber-200 dark:hover:bg-amber-900/40'
                            : isAnswered
                              ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 hover:bg-blue-200 dark:hover:bg-blue-900/50'
                              : 'bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-200 hover:border-blue-400'
                      }`}
                    >
                      {index + 1}
                    </button>
                  );
                })}
              </div>
            </div>
          </aside>

          <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-md border border-gray-100 dark:border-gray-700 p-8 transition-colors duration-300">
            <div className="flex flex-wrap gap-2 mb-5">
              <span className="px-3 py-1 rounded-full bg-slate-100 dark:bg-gray-700 text-sm font-semibold text-slate-700 dark:text-gray-200 capitalize">
                {currentQ.difficulty}
              </span>
              <span className="px-3 py-1 rounded-full bg-blue-100 dark:bg-blue-900/30 text-sm font-semibold text-blue-700 dark:text-blue-300">
                {currentQ.marks ?? 0} points
              </span>
              <button
                type="button"
                onClick={toggleFlagForCurrentQuestion}
                className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold transition-colors ${
                  flaggedQuestions[currentQ._id]
                    ? 'bg-amber-100 dark:bg-amber-900/30 text-amber-800 dark:text-amber-300'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 hover:bg-amber-100 dark:hover:bg-amber-900/20'
                }`}
              >
                <Flag className="h-4 w-4 mr-2" />
                {flaggedQuestions[currentQ._id] ? 'Flagged' : 'Flag For Review'}
              </button>
            </div>

            <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-3">{currentQ.title}</h2>
            <p className="text-gray-500 dark:text-gray-400 mb-8 text-lg whitespace-pre-wrap">{currentQ.description}</p>

            {/* ---- MCQ rendering (existing behavior) ---- */}
            {currentQ.type === 'mcq' && (
              <div className="space-y-4">
                {currentQ.options.map((option, idx) => {
                  const isSelected = answers[currentQ._id] === option;

                  return (
                    <button
                      key={idx}
                      onClick={() => handleSelectAnswer(option)}
                      className={`w-full text-left p-5 border-2 rounded-xl transition-all duration-200 font-semibold text-lg shadow-sm ${
                        isSelected
                          ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 text-blue-900 dark:text-blue-100'
                          : 'border-gray-100 dark:border-gray-700 hover:border-blue-400 dark:hover:border-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 text-gray-700 dark:text-gray-300'
                      }`}
                    >
                      {option}
                    </button>
                  );
                })}
              </div>
            )}

            {/* ---- Code question rendering ---- */}
            {currentQ.type === 'code' && (
              <div className="space-y-5">
                {/* Language + hidden test count metadata */}
                <div className="flex flex-wrap items-center gap-2">
                  <span className="px-3 py-1 rounded-full bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 text-xs font-semibold inline-flex items-center gap-1">
                    <Code className="h-3 w-3" />
                    {currentQ.language || 'code'}
                  </span>
                  {typeof currentQ.hiddenTestCount === 'number' && currentQ.hiddenTestCount > 0 && (
                    <span className="px-3 py-1 rounded-full bg-slate-100 dark:bg-gray-700 text-slate-700 dark:text-gray-300 text-xs font-semibold">
                      {currentQ.hiddenTestCount} hidden test{currentQ.hiddenTestCount === 1 ? '' : 's'}
                    </span>
                  )}
                </div>

                {/* Sample test cases — LeetCode-style worked examples */}
                {currentQ.sampleTestCases && currentQ.sampleTestCases.length > 0 && (
                  <div className="space-y-3">
                    <h3 className="text-sm font-bold text-gray-700 dark:text-gray-300">Examples</h3>
                    {currentQ.sampleTestCases.map((tc, idx) => (
                      <div key={idx} className="rounded-xl border border-gray-200 dark:border-gray-700 p-4 bg-slate-50 dark:bg-gray-900/30 space-y-2">
                        <div>
                          <div className="text-xs font-bold text-gray-500 dark:text-gray-400">Input</div>
                          <pre className="mt-1 text-sm font-mono text-gray-800 dark:text-gray-100 whitespace-pre-wrap">{tc.input || '(no input)'}</pre>
                        </div>
                        <div>
                          <div className="text-xs font-bold text-gray-500 dark:text-gray-400">Expected output</div>
                          <pre className="mt-1 text-sm font-mono text-gray-800 dark:text-gray-100 whitespace-pre-wrap">{tc.expectedOutput}</pre>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Monaco editor */}
                <CodeEditor
                  language={currentQ.language}
                  value={answers[currentQ._id] ?? ''}
                  onChange={(code) =>
                    setAnswers((prev) => ({ ...prev, [currentQ._id]: code }))
                  }
                  height="360px"
                />

                {/* Run Code button + output panel */}
                <div className="flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
                  <button
                    type="button"
                    onClick={runCurrentCode}
                    disabled={running[currentQ._id]}
                    className="inline-flex items-center justify-center px-5 py-3 rounded-xl bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 font-semibold disabled:opacity-60"
                  >
                    {running[currentQ._id] ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Running…
                      </>
                    ) : (
                      <>
                        <Play className="h-4 w-4 mr-2" />
                        Run Code
                      </>
                    )}
                  </button>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Runs against the first sample. Full scoring happens at submit.
                  </p>
                </div>

                {runOutput[currentQ._id] && (
                  <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-slate-900 dark:bg-black p-4 space-y-2">
                    <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wide">
                      <Terminal className="h-3.5 w-3.5 text-slate-300" />
                      <span className={
                        runOutput[currentQ._id].status === 'success'
                          ? 'text-emerald-400'
                          : runOutput[currentQ._id].status === 'timeout'
                            ? 'text-amber-400'
                            : 'text-rose-400'
                      }>
                        {runOutput[currentQ._id].status}
                      </span>
                      {typeof runOutput[currentQ._id].runtimeMs === 'number' && (
                        <span className="text-slate-400 font-normal">
                          · {runOutput[currentQ._id].runtimeMs}ms
                        </span>
                      )}
                    </div>
                    {runOutput[currentQ._id].stdout && (
                      <div>
                        <div className="text-xs text-slate-400 mb-1">stdout</div>
                        <pre className="text-sm font-mono text-emerald-200 whitespace-pre-wrap">{runOutput[currentQ._id].stdout}</pre>
                      </div>
                    )}
                    {runOutput[currentQ._id].stderr && (
                      <div>
                        <div className="text-xs text-slate-400 mb-1">stderr</div>
                        <pre className="text-sm font-mono text-rose-300 whitespace-pre-wrap">{runOutput[currentQ._id].stderr}</pre>
                      </div>
                    )}
                    {runOutput[currentQ._id].message && (
                      <div className="text-xs text-slate-300">{runOutput[currentQ._id].message}</div>
                    )}
                  </div>
                )}
              </div>
            )}

            {submitError && (
              <div className="mt-6 rounded-xl border border-red-200 dark:border-red-900/40 bg-red-50 dark:bg-red-900/10 px-4 py-3 text-red-700 dark:text-red-300">
                {submitError}
              </div>
            )}

            <div className="mt-8 flex flex-col md:flex-row gap-3 md:items-center md:justify-between">
              <button
                onClick={handlePrevious}
                disabled={currentIndex === 0}
                className="inline-flex items-center justify-center px-5 py-3 rounded-xl border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-200 font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronLeft className="h-4 w-4 mr-2" />
                Previous
              </button>

              <div className="text-sm text-gray-500 dark:text-gray-400 text-center">
                {currentQ.type === 'code'
                  ? 'Edit code freely. Run preview against the sample; full grading happens at submit.'
                  : answers[currentQ._id]
                    ? 'Answer selected and ready. Use Enter or Right Arrow to continue.'
                    : 'Press 1-4 to select an option, then Enter or Right Arrow to continue.'}
              </div>

              <button
                onClick={handleNext}
                disabled={!answers[currentQ._id]}
                className="inline-flex items-center justify-center px-5 py-3 rounded-xl bg-blue-600 text-white font-semibold hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {currentIndex === questions.length - 1 ? 'Review Answers' : 'Next Question'}
                <ChevronRight className="h-4 w-4 ml-2" />
              </button>
            </div>

            {hasActiveInterview && (
              <p className="mt-5 text-center text-xs font-medium text-amber-600 dark:text-amber-400">
                Leaving this page will show a confirmation. Your progress is also autosaved locally.
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Interview;
