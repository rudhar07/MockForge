import Submission from '../models/Submission.js';
import Question from '../models/Questions.js';

// @desc    Save an interview score securely
// @route   POST /api/submissions
export const saveSubmission = async (req, res) => {
  try {
    const { topic, responses = [] } = req.body;

    if (!topic) {
      return res.status(400).json({ message: 'Topic is required' });
    }

    if (!Array.isArray(responses)) {
      return res.status(400).json({ message: 'Responses must be an array' });
    }

    const questions = await Question.find({ topic }).lean();

    const responseMap = new Map();
    for (const response of responses) {
      if (!response?.questionId) {
        continue;
      }

      responseMap.set(response.questionId, response.selectedOption);
    }

    let score = 0;
    let totalPossible = 0;

    for (const question of questions) {
      totalPossible += question.marks ?? 0;
    }

    for (const question of questions) {
      const selectedOption = responseMap.get(question._id.toString());
      if (selectedOption === question.correctAnswer) {
        score += question.marks ?? 0;
      }
    }

    const submission = new Submission({
      user: req.user._id, // This is safely grabbed from the JWT token via our Auth Middleware
      topic,
      score,
      totalPossible,
    });

    const savedSubmission = await submission.save();
    res.status(201).json({
      ...savedSubmission.toObject(),
      score,
      totalPossible,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    get the current logged-in user's past history
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

// @desc    Get top 10 highest scores across all users bbg
// @route   GET /api/submissions/leaderboard bbg
export const getLeaderboard = async (req, res) => {
  try {
    const topSubmissions = await Submission.aggregate([
      {
        $addFields: {
          percentage: {
            $cond: [
              { $gt: ['$totalPossible', 0] },
              { $multiply: [{ $divide: ['$score', '$totalPossible'] }, 100] },
              0,
            ],
          },
        },
      },
      {
        $sort: {
          percentage: -1,
          score: -1,
          createdAt: 1,
        },
      },
      { $limit: 10 },
      {
        $lookup: {
          from: 'users',
          localField: 'user',
          foreignField: '_id',
          as: 'user',
        },
      },
      {
        $unwind: {
          path: '$user',
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $project: {
          topic: 1,
          score: 1,
          totalPossible: 1,
          createdAt: 1,
          percentage: { $round: ['$percentage', 0] },
          'user.name': 1,
        },
      },
    ]);

    res.json(topSubmissions);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
