// Must be the first import: ES module imports are evaluated before the rest of
// this file runs, so .env has to load before app.js reads process.env.
import 'dotenv/config';
import { validateEnv } from './src/config/env.js';
import connectDB from './src/config/db.js';
import app from './src/app.js';

// Fail fast: refuse to start with a broken configuration.
try {
  const { warnings } = validateEnv();
  warnings.forEach((warning) => console.warn(`Warning: ${warning}`));
} catch (error) {
  console.error(error.message);
  process.exit(1);
}

connectDB();

// 5001, not 5000: macOS's AirPlay Receiver already listens on 5000.
// Render injects its own PORT, so this default only matters locally.
const PORT = process.env.PORT || 5001;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
