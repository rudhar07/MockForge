import mongoose from 'mongoose';

const questionSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
    },
    description: {
      type: String,
      required: true,
    },
    type: {
      type: String,
      enum: ['mcq', 'short', 'code'], // For MVP, we'll mostly focus on mcq
      required: true,
    },
    topic: {
      type: String,
      enum: ['arrays', 'dp', 'graphs', 'oop'],
      required: true,
    },
    difficulty: {
      type: String,
      enum: ['easy', 'medium', 'hard'],
      required: true,
    },
    options: [
      {
        type: String, // Array of possible answers for MCQs
      },
    ],
    correctAnswer: {
      type: String,
      required: true,
    },
    explanation: {
      type: String, // Useful for showing feedback after the interview
    },
    marks: {
      type: Number,
      default: 10, // 10 points per question
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: 'User', // This creates a relationship! It tells us exactly WHICH admin created this question.
    },
  },
  {
    timestamps: true,
  }
);

const Question = mongoose.model('Question', questionSchema);

export default Question;
