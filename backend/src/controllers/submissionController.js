import Submission from '../models/Submission.js';
import Question from '../models/Questions.js';
import { executeCode } from '../services/codeExecutor.js';

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

// Run a single test case for a code question via the Piston service.
// Returns a uniform shape regardless of pass/fail/error so the caller
// can aggregate without branching.
const runTestCase = async ({ language, code, testCase }) => {
  const result = await executeCode({
    language,
    code,
    stdin: testCase.input ?? '',
  });

  const actualOutput = (result.stdout || '').trim();
  const expectedOutput = (testCase.expectedOutput || '').trim();
  const passed = result.status === 'success' && actualOutput === expectedOutput;

  return {
    input: testCase.input ?? '',
    expectedOutput,
    actualOutput,
    isSample: !!testCase.isSample,
    passed,
    // 'success' | 'runtime_error' | 'compile_error' | 'timeout' | 'error'
    status: result.status,
    errorMessage: result.message || result.stderr || '',
    runtimeMs: result.runtimeMs ?? 0,
  };
};

// Score a code-type question. Runs every test case in parallel and awards
// partial credit proportional to tests passed. We use the question's pinned
// language (not whatever the candidate sent) because test cases are tuned
// to a specific runtime.
const scoreCodeQuestion = async ({ question, code }) => {
  const testCases = question.testCases || [];
  const totalMarks = question.marks ?? 0;

  // No code submitted → 0 marks. We still return a result shape so the
  // review screen can render "Not attempted".
  if (!code || typeof code !== 'string' || code.trim().length === 0) {
    return {
      isCorrect: false,
      earnedMarks: 0,
      testResults: [],
      testsPassed: 0,
      testsTotal: testCases.length,
      submittedCode: '',
    };
  }

  const testResults = await Promise.all(
    testCases.map((tc) =>
      runTestCase({ language: question.language, code, testCase: tc })
    )
  );

  const testsPassed = testResults.filter((r) => r.passed).length;
  const testsTotal = testResults.length;
  const ratio = testsTotal > 0 ? testsPassed / testsTotal : 0;

  return {
    isCorrect: testsTotal > 0 && testsPassed === testsTotal,
    earnedMarks: Math.round(totalMarks * ratio),
    testResults,
    testsPassed,
    testsTotal,
    submittedCode: code,
  };
};

const buildReviewFromResponses = async ({ topic, responses = [] }) => {
  const questions = await Question.find({ topic }).lean();

  // Map questionId → full response object. Old code only stored selectedOption,
  // but code answers carry { code, language } so we keep the whole payload.
  const responseMap = new Map();
  for (const response of responses) {
    if (!response?.questionId) continue;
    responseMap.set(response.questionId, response);
  }

  let totalPossible = 0;
  for (const question of questions) {
    totalPossible += question.marks ?? 0;
  }

  // Score all questions in parallel. Code questions trigger Piston calls;
  // running them in parallel keeps total submission time bounded by the
  // slowest single question rather than the sum of all of them.
  const reviewItems = await Promise.all(
    questions.map(async (question) => {
      const response = responseMap.get(question._id.toString());
      const base = {
        questionId: question._id.toString(),
        title: question.title,
        type: question.type,
        explanation: question.explanation ?? '',
      };

      if (question.type === 'code') {
        const result = await scoreCodeQuestion({ question, code: response?.code });
        return {
          ...base,
          language: question.language,
          submittedCode: result.submittedCode,
          testResults: result.testResults,
          testsPassed: result.testsPassed,
          testsTotal: result.testsTotal,
          earnedMarks: result.earnedMarks,
          isCorrect: result.isCorrect,
          // These two keep the AI-review prompt compatible — it expects every
          // item to have selectedAnswer + correctAnswer strings.
          selectedAnswer: `Submitted code (${result.testsPassed}/${result.testsTotal} tests passed)`,
          correctAnswer: `All ${result.testsTotal} test cases must pass`,
        };
      }

      // MCQ branch (default for type 'mcq' or 'short').
      const selectedOption = response?.selectedOption;
      const isCorrect = selectedOption === question.correctAnswer;
      return {
        ...base,
        selectedAnswer: selectedOption ?? '',
        correctAnswer: question.correctAnswer,
        isCorrect,
        earnedMarks: isCorrect ? (question.marks ?? 0) : 0,
      };
    })
  );

  // Sum earnedMarks uniformly across MCQs and code questions.
  const score = reviewItems.reduce((sum, item) => sum + (item.earnedMarks ?? 0), 0);

  return { score, totalPossible, reviewItems };
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

    const { score, totalPossible, reviewItems } = await buildReviewFromResponses({ topic, responses });

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
      reviewItems,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Regenerate AI review without saving a new submission
// @route   POST /api/submissions/review
export const regenerateSubmissionReview = async (req, res) => {
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

    const { score, totalPossible, reviewItems } = await buildReviewFromResponses({ topic, responses });
    const aiReview = await generateAiReview({
      topic,
      score,
      totalPossible,
      reviewItems,
      flaggedQuestionIds,
    });

    res.json({
      score,
      totalPossible,
      aiReview,
      reviewItems,
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
