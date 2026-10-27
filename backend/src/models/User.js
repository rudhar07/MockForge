import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: true,
      unique: true, // No two users can have the same email
    },
    password: {
      type: String,
      required: true,
    },
    role: {
      type: String,
      enum: ['user', 'admin'], // Only allows these two values
      default: 'user',
    },
  },
  {
    timestamps: true, // Automatically manages createdAt and updatedAt
  }
);

// 1. Hash the password before saving it to the database
// Mongoose 9 no longer passes `next` to pre hooks — an async function just
// returns (or throws) to signal it's done.
userSchema.pre('save', async function () {
  // If the password wasn't modified (e.g., updating user name), don't hash it again
  if (!this.isModified('password')) {
    return;
  }

  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

// 2. Add a custom method to check passwords when the user tries to login
userSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

const User = mongoose.model('User', userSchema);

export default User;
