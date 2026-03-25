import Question from '../models/Questions.js';

// @desc    Get all questions
// @route   GET /api/questions
// @access  Private (Logged-in users only)
export const getQuestions = async (req, res) => {
  try {
    // `.find({})` gets every single question in the database
    const questions = await Question.find({});
    res.json(questions);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get questions filtered by a specific topic (e.g. 'arrays')
// @route   GET /api/questions/topic/:topic
// @access  Private
export const getQuestionsByTopic = async (req, res) => {
  try {
    // We grab the topic from the URL parameter (req.params.topic)
    const questions = await Question.find({ topic: req.params.topic });
    res.json(questions);
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
