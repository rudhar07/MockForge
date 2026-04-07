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
  ChevronLeft,
  ChevronRight,
  CircleCheck,
  AlertCircle,
  FileCheck,
} from 'lucide-react';

const Interview = () => {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  const [topic, setTopic] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [showResult, setShowResult] = useState(false);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [timeLeft, setTimeLeft] = useState(600);
  const [answers, setAnswers] = useState({});
  const [reviewMode, setReviewMode] = useState(false);
  const [fetchError, setFetchError] = useState('');
  const [submitError, setSubmitError] = useState('');
  const answersRef = useRef({});
  const submitInterviewRef = useRef(null);

  useEffect(() => {
    answersRef.current = answers;
  }, [answers]);

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

  const submitInterview = useCallback(async (answerMap = answers) => {
    if (!topic || submitting) {
      return;
    }

    setSubmitting(true);
    setSubmitError('');

    try {
      const config = { headers: { Authorization: `Bearer ${user.token}` } };
      const responses = Object.entries(answerMap).map(([questionId, selectedOption]) => ({
        questionId,
        selectedOption,
      }));

      const { data } = await API.post(
        '/submissions',
        { topic, responses },
        config
      );

      setScore(data.score);
      setShowResult(true);
      setReviewMode(false);
    } catch (error) {
      setSubmitError(error.response?.data?.message || 'Submission failed. Please try again.');
    } finally {
      setSubmitting(false);
    }
  }, [answers, submitting, topic, user.token]);

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

  const handleSelectAnswer = (option) => {
    if (!currentQ) return;

    setAnswers((prev) => ({
      ...prev,
      [currentQ._id]: option,
    }));
  };

  const handleNext = () => {
    if (currentIndex + 1 < questions.length) {
      setCurrentIndex((prev) => prev + 1);
      return;
    }

    setReviewMode(true);
  };

  const handleBackToQuestions = (index = 0) => {
    setReviewMode(false);
    setCurrentIndex(index);
  };

  const restartTopicSelection = () => {
    setTopic(null);
    setQuestions([]);
    setCurrentIndex(0);
    setScore(0);
    setShowResult(false);
    setLoading(false);
    setSubmitting(false);
    setTimeLeft(600);
    setAnswers({});
    setReviewMode(false);
    setFetchError('');
    setSubmitError('');
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
  if (!topic) {
    return (
      <div className="flex-grow flex items-center justify-center bg-gray-50 dark:bg-gray-900 py-12 px-4 transition-colors duration-300">
        <div className="max-w-4xl mx-auto w-full">
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
    return (
      <div className="flex-grow flex flex-col items-center justify-center py-32 px-4 text-center">
        <div className="w-16 h-16 border-4 border-blue-100 dark:border-blue-900 border-t-blue-600 dark:border-t-blue-400 rounded-full animate-spin shadow-sm"></div>
        <h2 className="mt-6 text-2xl font-bold text-gray-800 dark:text-white">Preparing your interview</h2>
        <p className="mt-2 text-gray-500 dark:text-gray-400 max-w-md">
          Pulling the latest questions and setting up your timed round.
        </p>
      </div>
    );
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
        <div className="bg-white dark:bg-gray-800 p-10 rounded-3xl shadow-xl border border-gray-100 dark:border-gray-700 text-center max-w-2xl w-full">
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
              {questions.map((question, index) => {
                const selectedAnswer = answers[question._id];
                const answered = Boolean(selectedAnswer);

                return (
                  <div key={question._id} className="rounded-2xl border border-gray-100 dark:border-gray-700 p-5 bg-slate-50 dark:bg-gray-900/30">
                    <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                      <div>
                        <p className="text-sm font-semibold text-gray-500 dark:text-gray-400">Question {index + 1}</p>
                        <h3 className="mt-1 text-lg font-bold text-gray-900 dark:text-white">{question.title}</h3>
                        <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                          {answered ? `Selected: ${selectedAnswer}` : 'No answer selected yet'}
                        </p>
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
      <div className="max-w-4xl mx-auto">
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

        <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-md border border-gray-100 dark:border-gray-700 p-8 transition-colors duration-300">
          <div className="flex flex-wrap gap-2 mb-5">
            <span className="px-3 py-1 rounded-full bg-slate-100 dark:bg-gray-700 text-sm font-semibold text-slate-700 dark:text-gray-200 capitalize">
              {currentQ.difficulty}
            </span>
            <span className="px-3 py-1 rounded-full bg-blue-100 dark:bg-blue-900/30 text-sm font-semibold text-blue-700 dark:text-blue-300">
              {currentQ.marks ?? 0} points
            </span>
          </div>

          <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-3">{currentQ.title}</h2>
          <p className="text-gray-500 dark:text-gray-400 mb-8 text-lg">{currentQ.description}</p>

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

          {submitError && (
            <div className="mt-6 rounded-xl border border-red-200 dark:border-red-900/40 bg-red-50 dark:bg-red-900/10 px-4 py-3 text-red-700 dark:text-red-300">
              {submitError}
            </div>
          )}

          <div className="mt-8 flex flex-col md:flex-row gap-3 md:items-center md:justify-between">
            <button
              onClick={() => setCurrentIndex((prev) => Math.max(prev - 1, 0))}
              disabled={currentIndex === 0}
              className="inline-flex items-center justify-center px-5 py-3 rounded-xl border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-200 font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ChevronLeft className="h-4 w-4 mr-2" />
              Previous
            </button>

            <div className="text-sm text-gray-500 dark:text-gray-400 text-center">
              {answers[currentQ._id] ? 'Answer selected and ready.' : 'Select an option to continue with confidence.'}
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
        </div>
      </div>
    </div>
  );
};
export default Interview;
