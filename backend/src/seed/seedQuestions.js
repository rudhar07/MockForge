import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Question from '../models/Questions.js';
import User from '../models/User.js';

// Load our .env file so we can connect to MongoDB locally
dotenv.config();

const seedDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB! Finding Admin user...');

    // We dynamically find your admin user (Jane) to attach her as the 'Creator'
    const adminUser = await User.findOne({ role: 'admin' });

    if (!adminUser) {
      console.log("No admin found! Please promote a user to admin first.");
      process.exit(1);
    }

    // Wipe old questions so we have a clean slate
    await Question.deleteMany();

    const questions = [
      {
        title: "What is the time complexity of searching in a perfectly balanced Binary Search Tree?",
        description: "Think about how the search space changes at each step.",
        type: "mcq",
        topic: "arrays",
        difficulty: "easy",
        options: ["O(1)", "O(log n)", "O(n)", "O(n^2)"],
        correctAnswer: "O(log n)",
        explanation: "Because we eliminate half the search space at each node.",
        marks: 10,
        createdBy: adminUser._id
      },
      {
        title: "Which data structure is used for Breadth First Search (BFS)?",
        description: "Choose the correct queue-like or stack-like structure.",
        type: "mcq",
        topic: "graphs",
        difficulty: "easy",
        options: ["Stack", "Queue", "Priority Queue", "Hash Map"],
        correctAnswer: "Queue",
        explanation: "BFS explores nodes layer by layer, which fits perfectly with FIFO queues.",
        marks: 10,
        createdBy: adminUser._id
      },
      {
        title: "What does Dependency Injection solve in Object Oriented Programming?",
        description: "Think about coupling.",
        type: "mcq",
        topic: "oop",
        difficulty: "medium",
        options: ["Tight coupling between classes", "Memory leaks", "Slow compilation", "Overusing inheritance"],
        correctAnswer: "Tight coupling between classes",
        explanation: "It allows us to inject dependencies rather than hardcoding them, increasing testability.",
        marks: 10,
        createdBy: adminUser._id
      },
      {
        title: "In Dynamic Programming, what is 'Memoization'?",
        description: "Top-down or bottom-up?",
        type: "mcq",
        topic: "dp",
        difficulty: "medium",
        options: ["Bottom-up table filling", "Top-down recursion with caching", "Sorting an array", "Dividing and conquering"],
        correctAnswer: "Top-down recursion with caching",
        explanation: "Memoization caches the results of recursive calls so we don't calculate them twice.",
        marks: 10,
        createdBy: adminUser._id
      },
      {
        title: "Which sorting algorithm has the worst-case time complexity of O(n^2) but is generally very fast in practice?",
        description: "It uses a pivot.",
        type: "mcq",
        topic: "arrays",
        difficulty: "hard",
        options: ["Merge Sort", "Heap Sort", "Quick Sort", "Bubble Sort"],
        correctAnswer: "Quick Sort",
        explanation: "Quick sort decays to O(n^2) if the pivot is chosen poorly, but its average case is incredibly fast.",
        marks: 10,
        createdBy: adminUser._id
      }
    ];

    await Question.insertMany(questions);
    console.log('Database successfully seeded with 5 Interview Questions! 🌱');
    process.exit(0);
  } catch (err) {
    console.error('Error seeding data:', err);
    process.exit(1);
  }
};

seedDB();
