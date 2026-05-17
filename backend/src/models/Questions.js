import mongoose from 'mongoose';

// Sub-schema for code-question test cases.
// `isSample: true` cases are visible to candidates as worked examples.
// All other cases are hidden judge cases — used for scoring only.
const testCaseSchema = new mongoose.Schema(
  {
    input: {
      type: String,
      default: '', // Piped to the program's stdin. Empty string is valid (no input).
    },
    expectedOutput: {
      type: String,
      required: true, // We compare program stdout against this (trimmed).
    },
    isSample: {
      type: Boolean,
      default: false,
    },
  },
  { _id: false } // Subdocs don't need their own ObjectIds — keeps payloads lean.
);

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
      enum: ['mcq', 'short', 'code'],
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

    // ---- MCQ-specific fields ----
    options: [
      {
        type: String,
      },
    ],
    correctAnswer: {
      type: String,
      // Conditional required: only MCQs must have a correctAnswer.
      // Code questions are scored via test cases, not a single string.
      required: function () {
        return this.type === 'mcq';
      },
    },

    // ---- Code-specific fields ----
    language: {
      type: String,
      enum: ['python', 'javascript', 'cpp', 'java', 'c'],
      // Required only for code questions.
      required: function () {
        return this.type === 'code';
      },
    },
    starterCode: {
      type: String,
      default: '',
    },
    testCases: {
      type: [testCaseSchema],
      validate: {
        // A code question with zero test cases is meaningless — we'd have nothing
        // to score against. Enforce at least one for type === 'code'.
        validator: function (cases) {
          if (this.type !== 'code') return true;
          return Array.isArray(cases) && cases.length > 0;
        },
        message: 'Code questions require at least one test case.',
      },
      default: [],
    },

    // ---- Shared fields ----
    explanation: {
      type: String,
    },
    marks: {
      type: Number,
      default: 10,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: 'User',
    },
  },
  {
    timestamps: true,
  }
);

const Question = mongoose.model('Question', questionSchema);

export default Question;
