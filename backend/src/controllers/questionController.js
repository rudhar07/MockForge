import Question from '../models/Questions.js';

const sanitizeQuestion = (question) => ({
  _id: question._id,
  title: question.title,
  description: question.description,
  type: question.type,
  topic: question.topic,
  difficulty: question.difficulty,
  options: question.options,
  marks: question.marks,
});

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
      marks 
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
      createdBy: req.user._id, // Automatically links it to the Admin making the request!
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
