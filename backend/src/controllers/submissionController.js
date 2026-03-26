import Submission from '../models/Submission.js';

// @desc    Save an interview score securely
// @route   POST /api/submissions
export const saveSubmission = async (req, res) => {
  try {
    const { score, totalPossible, topic } = req.body;

    const submission = new Submission({
      user: req.user._id, // This is safely grabbed from the JWT token via our Auth Middleware
      topic,
      score,
      totalPossible,
    });

    const savedSubmission = await submission.save();
    res.status(201).json(savedSubmission);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get the current logged-in user's past history
// @route   GET /api/submissions/history
export const getMySubmissions = async (req, res) => {
  try {
    // Find all submissions matching this exact user, sorted by Newest first (-1)
    const submissions = await Submission.find({ user: req.user._id }).sort({ createdAt: -1 });
    res.json(submissions);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// naya query add kiya leaderboard bnane se pehle

// @desc    Get top 10 highest scores across all users
// @route   GET /api/submissions/leaderboard
export const getLeaderboard = async (req, res) => {
  try {
    const topSubmissions = await Submission.find({})
      .sort({ score: -1, createdAt: 1 }) // Highest score first (-1)
      .limit(10) // Only get the top 10!
      .populate('user', 'name'); // Magically grab the 'name' of the user who scored it
      
    res.json(topSubmissions);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
