import React, { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import API from '../api/axios';
import { useNavigate } from 'react-router-dom';

const Interview = () => {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  
  // All the state we need to run an interview
  const [questions, setQuestions] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [showResult, setShowResult] = useState(false);
  const [loading, setLoading] = useState(true);

  // 1. Fetch questions exactly once when the page loads
  useEffect(() => {
    const fetchQuestions = async () => {
      try {
        // We MUST send our Token so the backend knows we are allowed to read questions!
        const config = {
          headers: {
            Authorization: `Bearer ${user.token}`,
          }
        };
        const { data } = await API.get('/questions', config);
        setQuestions(data);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching questions', error);
      }
    };
    fetchQuestions();
  }, [user.token]);

  // 2. Logic to run when the user clicks an option
    const handleAnswer = async (selectedOption) => {
    // 1. Calculate the precise New Score instantly in a temporary variable
    let newScore = score;
    if (selectedOption === questions[currentIndex].correctAnswer) {
      newScore = newScore + questions[currentIndex].marks;
      setScore(newScore); // Update the React state visually
    }

    // 2. Are we moving to the next question, or finishing the test?
    if (currentIndex + 1 < questions.length) {
      setCurrentIndex(currentIndex + 1);
    } else {
      // 3. THE INTERVIEW IS OVER! Save to Database!
      setShowResult(true);
      
      try {
        const config = { headers: { Authorization: `Bearer ${user.token}` } };
        
        await API.post('/submissions', {
          score: newScore,
          totalPossible: questions.length * 10,
          topic: questions[0].topic || 'General'
        }, config);
        
        console.log("Score cleanly saved to database!");
      } catch (err) {
        console.error("Failed to save score to database", err);
      }
    }
  };


  if (loading) return <div className="text-center py-20 text-xl font-bold text-gray-500">Loading your interview...</div>;

  // 3. What to show when the interview finishes
  if (showResult) {
    return (
      <div className="flex-grow py-20 px-4 flex items-center justify-center">
        <div className="bg-white p-10 rounded-xl shadow-lg border border-gray-100 text-center max-w-lg w-full">
          <h2 className="text-3xl font-extrabold text-gray-900 mb-4">Interview Complete!</h2>
          <p className="text-xl text-gray-600 mb-8">
            You scored <span className="font-bold text-green-600 text-2xl">{score}</span> out of {questions.length * 10}
          </p>
          <button 
            onClick={() => navigate('/')} 
            className="w-full bg-blue-600 text-white py-3 rounded-lg font-bold hover:bg-blue-700 transition"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  // 4. The actual Question UI
  const currentQ = questions[currentIndex];

  return (
    <div className="flex-grow py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        
        {/* Progress Bar Header */}
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-2xl font-bold text-gray-900">Technical Interview</h1>
          <span className="bg-blue-100 text-blue-800 py-1 px-4 rounded-full font-bold">
            Question {currentIndex + 1} of {questions.length}
          </span>
        </div>

        {/* Question Card */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8">
          <h2 className="text-2xl font-semibold text-gray-800 mb-2">{currentQ.title}</h2>
          <p className="text-gray-500 mb-8">{currentQ.description}</p>

          {/* Options Grid */}
          <div className="space-y-4">
            {currentQ.options.map((option, idx) => (
              <button
                key={idx}
                onClick={() => handleAnswer(option)}
                className="w-full text-left p-4 border border-gray-200 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-all font-medium text-gray-700"
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
