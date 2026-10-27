import User from '../models/User.js';
import generateToken from '../utils/generateToken.js';
import HttpError from '../utils/HttpError.js';

// Request bodies are already validated by `validate(...)` in authRoutes.js,
// and any thrown/rejected error is handled by middleware/errorHandler.js —
// so these handlers only contain the happy path and expected failures.

const toAuthResponse = (user) => ({
  _id: user._id,
  name: user.name,
  email: user.email,
  role: user.role,
  token: generateToken(user._id),
});

// @desc    Register a new user
// @route   POST /api/auth/register
export const registerUser = async (req, res) => {
  const { name, email, password } = req.body;

  // 1. Check if the user already exists in the database
  const userExists = await User.findOne({ email });
  if (userExists) {
    throw new HttpError(400, 'User already exists');
  }

  // 2. Create the user
  // (Mongoose automatically hashes the password here because of our pre-save hook!)
  let user;
  try {
    user = await User.create({ name, email, password });
  } catch (error) {
    // Two simultaneous sign-ups can both pass the check above; the unique
    // index on email then rejects the second one with code 11000.
    if (error.code === 11000) {
      throw new HttpError(400, 'User already exists');
    }
    throw error;
  }

  // 3. Send back the user's data and their new token
  res.status(201).json(toAuthResponse(user));
};

// @desc    Authenticate user & get token
// @route   POST /api/auth/login
export const loginUser = async (req, res) => {
  const { email, password } = req.body;

  // 1. Find the user by their email
  const user = await User.findOne({ email });

  // 2. Same message whether the email or the password is wrong, so the
  //    response doesn't reveal which emails have accounts.
  if (!user || !(await user.matchPassword(password))) {
    throw new HttpError(401, 'Invalid email or password');
  }

  res.json(toAuthResponse(user));
};
