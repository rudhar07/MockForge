import User from '../src/models/User.js';
import generateToken from '../src/utils/generateToken.js';

let counter = 0;

// Creates a user in the test DB and returns it with a ready-to-use
// Authorization header value.
export const createUserWithToken = async (role = 'user') => {
  counter += 1;
  const user = await User.create({
    name: `${role} ${counter}`,
    email: `${role}${counter}@test.dev`,
    password: 'secret123',
    role,
  });
  return { user, auth: `Bearer ${generateToken(user._id)}` };
};
