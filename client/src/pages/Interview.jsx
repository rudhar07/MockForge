import React, { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import API from '../api/axios';
import { useNavigate } from 'react-router-dom';
import { Network, Layers, Box, Code , Clock} from 'lucide-react'; // Beautiful icons for our cards

const Interview = () => {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  
  // NEW STATE: Which topic did they click?
  const [topic, setTopic] = useState(null);

  const [questions, setQuestions] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [showResult, setShowResult] = useState(false);
  const [loading, setLoading] = useState(true);
  const [timeLeft, setTimeLeft] = useState(600); // NEW: 10 minutes in seconds

  // It physically legally cannot run until `topic` is chosen!
  useEffect(() => {
    const fetchQuestions = async () => {
      // Don't fetch anything if they haven't clicked a card yet!
      if (!topic) return;

      try {
        const config = { headers: { Authorization: `Bearer ${user.token}` } };
        // Notice we hit your specific backend filter route instead of grabbing everything
        const { data } = await API.get(`/questions/topic/${topic}`, config);
        
        setQuestions(data);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching questions', error);
      }
    };
    fetchQuestions();
  }, [user.token, topic]);

    // =========================================================
  //   THE COUNTDOWN ENGINE
  // =========================================================
  useEffect(() => {
    // Only physically tick the clock if they are actively in Phase 4!
    if (topic && !loading && !showResult && questions.length > 0) {
      const timerInterval = setInterval(() => {
        setTimeLeft((prevTime) => {
          if (prevTime <= 1) {
            clearInterval(timerInterval);
            forceSubmitTest(); // TIME IS UP!
            return 0;
          }
          return prevTime - 1;
        });
      }, 1000);

      // Memory cleanup if they navigate away
      return () => clearInterval(timerInterval);
    }
  }, [topic, loading, showResult, questions.length]);

  const forceSubmitTest = async () => {
    setShowResult(true);
    try {
      const config = { headers: { Authorization: `Bearer ${user.token}` } };
      await API.post('/submissions', {
        score: score, // Submit whatever score they managed to get so far!
        totalPossible: questions.length * 10,
        topic: topic
      }, config);
    } catch (err) {
      console.error("Timeout submit failed", err);
    }
  };


  const handleAnswer = async (selectedOption) => {
    let newScore = score;
    if (selectedOption === questions[currentIndex].correctAnswer) {
      newScore = newScore + questions[currentIndex].marks;
      setScore(newScore); 
    }

    if (currentIndex + 1 < questions.length) {
      setCurrentIndex(currentIndex + 1);
    } else {
      setShowResult(true);
      try {
        const config = { headers: { Authorization: `Bearer ${user.token}` } };
        await API.post('/submissions', {
          score: newScore,
          totalPossible: questions.length * 10,
          topic: topic // Now we definitively know their exact topic to log it correctly!
        }, config);
      } catch (err) {
        console.error("Failed to save score to database", err);
      }
    }
  };

  // =========================================================
  //   PHASE 1 - TOPIC SELECTION SCREEN (No topic chosen yet)
  // =========================================================
  if (!topic) {
    return (
      <div className="flex-grow flex items-center justify-center bg-gray-50 py-12 px-4">
        <div className="max-w-4xl mx-auto w-full">
          <div className="text-center mb-12">
            <h1 className="text-4xl font-extrabold text-gray-900 mb-4">Select Interview Topic</h1>
            <p className="text-xl text-gray-600">Choose a specialized system architecture to test your skills.</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <button onClick={() => setTopic('arrays')} className="bg-white p-8 rounded-2xl shadow-sm border border-blue-100 hover:border-blue-400 hover:shadow-xl transition-all duration-300 hover:-translate-y-2 group text-left">
              <Layers className="h-10 w-10 text-blue-500 mb-4 group-hover:scale-110 transition-transform" />
              <h3 className="text-2xl font-bold text-gray-900">Arrays & Hashing</h3>
              <p className="text-gray-500 mt-2">Pointers, HashMaps, and sliding windows.</p>
            </button>

            <button onClick={() => setTopic('graphs')} className="bg-white p-8 rounded-2xl shadow-sm border border-purple-100 hover:border-purple-400 hover:shadow-xl transition-all duration-300 hover:-translate-y-2 group text-left">
              <Network className="h-10 w-10 text-purple-500 mb-4 group-hover:scale-110 transition-transform" />
              <h3 className="text-2xl font-bold text-gray-900">Graph Algorithms</h3>
              <p className="text-gray-500 mt-2">BFS, DFS, and topological sorting logic.</p>
            </button>

            <button onClick={() => setTopic('dp')} className="bg-white p-8 rounded-2xl shadow-sm border border-pink-100 hover:border-pink-400 hover:shadow-xl transition-all duration-300 hover:-translate-y-2 group text-left">
              <Box className="h-10 w-10 text-pink-500 mb-4 group-hover:scale-110 transition-transform" />
              <h3 className="text-2xl font-bold text-gray-900">Dynamic Programming</h3>
              <p className="text-gray-500 mt-2">Memoization caches and 2D tabulation arrays.</p>
            </button>

            <button onClick={() => setTopic('oop')} className="bg-white p-8 rounded-2xl shadow-sm border border-emerald-100 hover:border-emerald-400 hover:shadow-xl transition-all duration-300 hover:-translate-y-2 group text-left">
              <Code className="h-10 w-10 text-emerald-500 mb-4 group-hover:scale-110 transition-transform" />
              <h3 className="text-2xl font-bold text-gray-900">Object Oriented</h3>
              <p className="text-gray-500 mt-2">Classes, strict inheritance, and system design.</p>
            </button>
          </div>
        </div>
      </div>
    );
  }

  // =========================================================
  //   PHASE 2 - LOADING SPINNER
  // =========================================================
  if (loading) {    
    return (
      <div className="flex-grow flex flex-col items-center justify-center py-32">
        <div className="w-16 h-16 border-4 border-blue-100 border-t-blue-600 rounded-full animate-spin shadow-sm"></div>
        <h2 className="mt-6 text-xl font-bold text-gray-700 animate-pulse uppercase tracking-wider">
          Fetching {topic} Protocol...
        </h2>
      </div>
    );
  }

  // =========================================================
  //   FAILSAFE - DATABASE RETURNS ZERO QUESTIONS
  // =========================================================
  if (questions.length === 0) {
    return (
      <div className="flex-grow flex flex-col items-center justify-center py-32 text-center">
        <h2 className="text-4xl font-black text-gray-900 mb-4">No Questions Found!</h2>
        <p className="text-xl text-gray-500 mb-8 max-w-sm">The Site Admin hasn't added any {topic.toUpperCase()} questions to MongoDB yet.</p>
        <button onClick={() => setTopic(null)} className="px-8 py-3 bg-blue-600 text-white rounded-lg font-bold hover:bg-blue-700 transition">Go Back</button>
      </div>
    )
  }

  // =========================================================
  //   PHASE 3 - RESULTS SCREEN
  // =========================================================
  if (showResult) {
    return (
      <div className="flex-grow py-20 px-4 flex items-center justify-center">
        <div className="bg-white p-10 rounded-2xl shadow-xl border border-gray-100 text-center max-w-lg w-full transform transition-all duration-500 scale-100">
          <h2 className="text-3xl font-black text-gray-900 mb-4">Interview Complete!</h2>
          <p className="text-xl text-gray-600 mb-8">
            You scored an impressive <span className="font-bold text-green-500 text-3xl mx-2">{score}</span> out of {questions.length * 10}
          </p>
          <button 
            onClick={() => navigate('/')} 
            className="w-full bg-slate-900 text-white py-4 rounded-xl font-bold hover:bg-blue-600 transition-colors shadow-lg"
          >
            Review Attempt on Dashboard
          </button>
        </div>
      </div>
    );
  }

  // =========================================================
  //   PHASE 4 - THE ACTUAL TEST UI
  // =========================================================
  const currentQ = questions[currentIndex];

  return (
    <div className="flex-grow py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
                {/* Progress Bar & Timer Header */}
        <div className="flex justify-between items-start mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 capitalize mb-2">{topic} Interview</h1>
            
            {/* The scary pulsing red clock! */}
            <div className={`flex items-center font-bold px-3 py-1 rounded-md w-max ${timeLeft < 60 ? 'bg-red-100 text-red-600 animate-pulse' : 'bg-orange-50 text-orange-600'}`}>
              <Clock className="w-4 h-4 mr-2" />
              {Math.floor(timeLeft / 60)}:{(timeLeft % 60).toString().padStart(2, '0')}
            </div>
          </div>
          
          <span className="bg-blue-100 text-blue-800 py-2 px-5 rounded-full font-bold shadow-sm">
            Question {currentIndex + 1} of {questions.length}
          </span>
        </div>

        <div className="bg-white rounded-2xl shadow-md border border-gray-100 p-8">
          <h2 className="text-2xl font-bold text-gray-800 mb-3">{currentQ.title}</h2>
          <p className="text-gray-500 mb-8 text-lg">{currentQ.description}</p>
          <div className="space-y-4">
            {currentQ.options.map((option, idx) => (
              <button
                key={idx}
                onClick={() => handleAnswer(option)}
                className="w-full text-left p-5 border-2 border-gray-100 rounded-xl hover:border-blue-500 hover:bg-blue-50 transition-all duration-200 font-semibold text-gray-700 text-lg shadow-sm hover:shadow"
              >
                {option}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
export default Interview;
