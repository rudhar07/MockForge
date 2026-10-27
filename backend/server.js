// Must be the first import: ES module imports are evaluated before the rest of
// this file runs, so .env has to load before app.js reads process.env.
import 'dotenv/config';
import connectDB from './src/config/db.js';
import app from './src/app.js';

connectDB();

// 5001, not 5000: macOS's AirPlay Receiver already listens on 5000.
// Render injects its own PORT, so this default only matters locally.
const PORT = process.env.PORT || 5001;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
