import mongoose from 'mongoose';

const submissionSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: 'User', // Who took the interview?
    },
    topic: {
      type: String,
      required: true,
      default: 'General',
    },
    score: {
      type: Number,
      required: true,
    },
    totalPossible: {
      type: Number,
      required: true,
    }
  },
  {
    timestamps: true, // We get `createdAt` for free so we know EXACTLY when they took the test!
  }
);

const Submission = mongoose.model('Submission', submissionSchema);
export default Submission;
