import jwt from 'jsonwebtoken';

const generateToken = (userId) => {
  // Signs a new token with the secret key from our .env file.
  // It will expire in 30 days.
  return jwt.sign({ id: userId }, process.env.JWT_SECRET, {
    expiresIn: '30d',
  });
};

export default generateToken;
