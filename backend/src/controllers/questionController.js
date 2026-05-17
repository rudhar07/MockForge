import Question from '../models/Questions.js';

// Strip answer keys before sending questions to interview candidates.
// MCQs: drop `correctAnswer` and `explanation`.
// Code: drop hidden test cases entirely; keep only sample cases (input + expected)
//       so the candidate can see worked examples like LeetCode does.
const sanitizeQuestion = (question) => {
  const base = {
    _id: question._id,
    title: question.title,
    description: question.description,
    type: question.type,
    topic: question.topic,
    difficulty: question.difficulty,
    marks: question.marks,
  };

  if (question.type === 'mcq') {
    return { ...base, options: question.options };
  }

  if (question.type === 'code') {
    const sampleCases = (question.testCases || [])
      .filter((tc) => tc.isSample)
      .map((tc) => ({ input: tc.input, expectedOutput: tc.expectedOutput }));

    return {
      ...base,
      language: question.language,
      starterCode: question.starterCode,
      sampleTestCases: sampleCases,
      // We expose the *count* of hidden cases so the UI can say
      // "Passed 3/10 hidden tests" without leaking the cases themselves.
      hiddenTestCount: (question.testCases || []).filter((tc) => !tc.isSample).length,
    };
  }

  return base;
};

// @desc    Get all questions
// @route   GET /api/questions
// @access  Private (Logged-in users only)
export const getQuestions = async (req, res) => {
  try {
    // Never expose answer keys to interview candidates.
    const questions = await Question.find({}).lean();
    res.json(questions.map(sanitizeQuestion));
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get questions filtered by a specific topic (e.g. 'arrays')
// @route   GET /api/questions/topic/:topic
// @access  Private
export const getQuestionsByTopic = async (req, res) => {
  try {
    const questions = await Question.find({ topic: req.params.topic }).lean();
    res.json(questions.map(sanitizeQuestion));
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get a single question with full admin-edit details
// @route   GET /api/questions/:id
// @access  Private/Admin
export const getQuestionById = async (req, res) => {
  try {
    const question = await Question.findById(req.params.id).lean();

    if (!question) {
      return res.status(404).json({ message: 'Question not found' });
    }

    res.json(question);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Create a new question
// @route   POST /api/questions
// @access  Private/Admin (Only Admins can do this)
export const createQuestion = async (req, res) => {
  try {
    const {
      title,
      description,
      type,
      topic,
      difficulty,
      options,
      correctAnswer,
      explanation,
      marks,
      language,
      starterCode,
      testCases,
    } = req.body;

    const question = new Question({
      title,
      description,
      type,
      topic,
      difficulty,
      options,
      correctAnswer,
      explanation,
      marks,
      language,
      starterCode,
      testCases,
      createdBy: req.user._id,
    });

    const createdQuestion = await question.save();
    res.status(201).json(createdQuestion);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update a question
// @route   PUT /api/questions/:id
// @access  Private/Admin
export const updateQuestion = async (req, res) => {
  try {
    const {
      title,
      description,
      type,
      topic,
      difficulty,
      options,
      correctAnswer,
      explanation,
      marks,
      language,
      starterCode,
      testCases,
    } = req.body;

    const question = await Question.findById(req.params.id);

    if (!question) {
      return res.status(404).json({ message: 'Question not found' });
    }

    question.title = title;
    question.description = description;
    question.type = type;
    question.topic = topic;
    question.difficulty = difficulty;
    question.options = options;
    question.correctAnswer = correctAnswer;
    question.explanation = explanation;
    question.marks = marks;
    question.language = language;
    question.starterCode = starterCode;
    question.testCases = testCases;

    const updatedQuestion = await question.save();
    res.json(updatedQuestion);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Delete a question
// @route   DELETE /api/questions/:id
// @access  Private/Admin
export const deleteQuestion = async (req, res) => {
  try {
    const question = await Question.findById(req.params.id);

    if (!question) {
      return res.status(404).json({ message: 'Question not found' });
    }

    await question.deleteOne();
    res.json({ message: 'Question deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
