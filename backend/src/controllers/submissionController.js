import Submission from '../models/Submission.js';
import Question from '../models/Questions.js';

const generateAiReview = async ({ topic, score, totalPossible, reviewItems, flaggedQuestionIds = [] }) => {
  const apiKey = process.env.OPENROUTER_API_KEY;

  if (!apiKey) {
    return {
      status: 'unavailable',
      content: '',
      provider: 'openrouter/free',
      message: 'Add OPENROUTER_API_KEY to enable free AI review.',
    };
  }

  const accuracy = totalPossible > 0 ? Math.round((score / totalPossible) * 100) : 0;
  const compactReview = reviewItems.map((item) => ({
    title: item.title,
    selectedAnswer: item.selectedAnswer || 'No answer selected',
    correctAnswer: item.correctAnswer,
    isCorrect: item.isCorrect,
    explanation: item.explanation || 'No explanation provided.',
    flaggedForReview: flaggedQuestionIds.includes(item.questionId),
  }));

  try {
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: process.env.OPENROUTER_MODEL || 'openrouter/free',
        temperature: 0.4,
        max_tokens: 260,
        messages: [
          {
            role: 'system',
            content:
              'You are an interview coach. Write concise, practical feedback for a mock interview attempt. Use plain text only. Keep it under 180 words. Format the response as exactly three short sections titled Overall, Strengths, and Next Focus. In Next Focus, include topic-specific study suggestions. Mention flagged questions when they reveal uncertainty patterns.',
          },
          {
            role: 'user',
            content: JSON.stringify({
              topic,
              score,
              totalPossible,
              accuracy,
              flaggedQuestionIds,
              questions: compactReview,
            }),
          },
        ],
      }),
    });

    if (!response.ok) {
      throw new Error(`OpenRouter request failed with status ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content?.trim() || '';

    return {
      status: content ? 'ready' : 'empty',
      content,
      provider: data.model || process.env.OPENROUTER_MODEL || 'openrouter/free',
      message: content ? '' : 'AI review returned an empty response.',
    };
  } catch (error) {
    return {
      status: 'error',
      content: '',
      provider: process.env.OPENROUTER_MODEL || 'openrouter/free',
      message: error.message,
    };
  }
};

// @desc    Save an interview score securely
// @route   POST /api/submissions
export const saveSubmission = async (req, res) => {
  try {
    const { topic, responses = [], flaggedQuestionIds = [] } = req.body;

    if (!topic) {
      return res.status(400).json({ message: 'Topic is required' });
    }

    if (!Array.isArray(responses)) {
      return res.status(400).json({ message: 'Responses must be an array' });
    }

    if (!Array.isArray(flaggedQuestionIds)) {
      return res.status(400).json({ message: 'Flagged question ids must be an array' });
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
    const reviewItems = [];

    for (const question of questions) {
      totalPossible += question.marks ?? 0;
    }

    for (const question of questions) {
      const selectedOption = responseMap.get(question._id.toString());
      const isCorrect = selectedOption === question.correctAnswer;

      if (isCorrect) {
        score += question.marks ?? 0;
      }

      reviewItems.push({
        questionId: question._id.toString(),
        title: question.title,
        selectedAnswer: selectedOption ?? '',
        correctAnswer: question.correctAnswer,
        isCorrect,
        explanation: question.explanation ?? '',
      });
    }

    const submission = new Submission({
      user: req.user._id, // This is safely grabbed from the JWT token via our Auth Middleware
      topic,
      score,
      totalPossible,
    });

    const savedSubmission = await submission.save();
    const aiReview = await generateAiReview({
      topic,
      score,
      totalPossible,
      reviewItems,
      flaggedQuestionIds,
    });

    res.status(201).json({
      ...savedSubmission.toObject(),
      score,
      totalPossible,
      aiReview,
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
