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
      },

      // ---- Code questions ----
      // All Python, stdin/stdout. Sample tests are visible to candidates;
      // hidden tests catch off-by-one bugs, negatives, single-element edges.
      {
        title: "Sum two numbers",
        description: "Read two integers separated by a space from standard input and print their sum.",
        type: "code",
        topic: "arrays",
        difficulty: "easy",
        language: "python",
        starterCode: "# Read two integers separated by a space and print their sum\n",
        testCases: [
          { input: "2 3", expectedOutput: "5", isSample: true },
          { input: "10 20", expectedOutput: "30", isSample: false },
          { input: "-5 5", expectedOutput: "0", isSample: false },
          { input: "0 0", expectedOutput: "0", isSample: false },
        ],
        explanation: "Use input().split() to get the two numbers, then sum them.",
        marks: 10,
        createdBy: adminUser._id,
      },
      {
        title: "Reverse a string",
        description: "Read a single line of input and print the line reversed.",
        type: "code",
        topic: "arrays",
        difficulty: "easy",
        language: "python",
        starterCode: "# Read a line and print it reversed\ns = input()\n",
        testCases: [
          { input: "hello", expectedOutput: "olleh", isSample: true },
          { input: "MockForge", expectedOutput: "egroFkcoM", isSample: false },
          { input: "a", expectedOutput: "a", isSample: false },
          { input: "racecar", expectedOutput: "racecar", isSample: false },
        ],
        explanation: "Python slicing s[::-1] is the canonical one-liner.",
        marks: 10,
        createdBy: adminUser._id,
      },
      {
        title: "Maximum element in an array",
        description: "Line 1: integer n. Line 2: n space-separated integers. Print the maximum value.",
        type: "code",
        topic: "arrays",
        difficulty: "easy",
        language: "python",
        starterCode: "n = int(input())\nnums = list(map(int, input().split()))\n# print the maximum\n",
        testCases: [
          { input: "5\n3 1 4 1 5", expectedOutput: "5", isSample: true },
          { input: "3\n-1 -2 -3", expectedOutput: "-1", isSample: false },
          { input: "1\n42", expectedOutput: "42", isSample: false },
          { input: "6\n7 7 7 7 7 7", expectedOutput: "7", isSample: false },
        ],
        explanation: "Builtin max() over the list. Handle the single-element case naturally.",
        marks: 10,
        createdBy: adminUser._id,
      },
      {
        title: "Two Sum (return indices)",
        description: "Given an array of integers and a target, output the indices (0-based) of the two numbers that add to target. Exactly one solution exists. Print the two indices space-separated, smaller first.\n\nLine 1: integer n\nLine 2: integer target\nLine 3: n space-separated integers",
        type: "code",
        topic: "arrays",
        difficulty: "medium",
        language: "python",
        starterCode: "n = int(input())\ntarget = int(input())\nnums = list(map(int, input().split()))\n# print two indices (smaller first) that sum to target\n",
        testCases: [
          { input: "4\n9\n2 7 11 15", expectedOutput: "0 1", isSample: true },
          { input: "3\n6\n3 2 4", expectedOutput: "1 2", isSample: false },
          { input: "2\n6\n3 3", expectedOutput: "0 1", isSample: false },
          { input: "5\n8\n1 5 3 7 9", expectedOutput: "1 2", isSample: false },
        ],
        explanation: "Hash map: walk once, store {value: index}, check if target-num exists.",
        marks: 20,
        createdBy: adminUser._id,
      },
      {
        title: "Nth Fibonacci number",
        description: "Read an integer n (0 <= n <= 40) and print the nth Fibonacci number, where F(0)=0 and F(1)=1.",
        type: "code",
        topic: "dp",
        difficulty: "easy",
        language: "python",
        starterCode: "n = int(input())\n# print F(n)\n",
        testCases: [
          { input: "0", expectedOutput: "0", isSample: true },
          { input: "10", expectedOutput: "55", isSample: true },
          { input: "1", expectedOutput: "1", isSample: false },
          { input: "20", expectedOutput: "6765", isSample: false },
          { input: "30", expectedOutput: "832040", isSample: false },
        ],
        explanation: "Iterative O(n) is the cleanest. Avoid naive recursion — it'd time out for n=30.",
        marks: 15,
        createdBy: adminUser._id,
      },
      {
        title: "Climbing stairs",
        description: "You're climbing a staircase that takes n steps to reach the top. Each move you can climb 1 or 2 steps. Print the number of distinct ways to reach the top.",
        type: "code",
        topic: "dp",
        difficulty: "easy",
        language: "python",
        starterCode: "n = int(input())\n# print the number of ways to climb n stairs taking 1 or 2 steps\n",
        testCases: [
          { input: "2", expectedOutput: "2", isSample: true },
          { input: "3", expectedOutput: "3", isSample: true },
          { input: "1", expectedOutput: "1", isSample: false },
          { input: "5", expectedOutput: "8", isSample: false },
          { input: "10", expectedOutput: "89", isSample: false },
        ],
        explanation: "Same recurrence as Fibonacci: ways(n) = ways(n-1) + ways(n-2). Build up iteratively.",
        marks: 15,
        createdBy: adminUser._id,
      },
      {
        title: "Maximum subarray sum",
        description: "Line 1: integer n. Line 2: n space-separated integers (possibly negative). Print the largest sum of any contiguous non-empty subarray.",
        type: "code",
        topic: "dp",
        difficulty: "medium",
        language: "python",
        starterCode: "n = int(input())\nnums = list(map(int, input().split()))\n# print the maximum contiguous subarray sum\n",
        testCases: [
          { input: "9\n-2 1 -3 4 -1 2 1 -5 4", expectedOutput: "6", isSample: true },
          { input: "1\n-3", expectedOutput: "-3", isSample: false },
          { input: "5\n5 4 -1 7 8", expectedOutput: "23", isSample: false },
          { input: "4\n-1 -2 -3 -4", expectedOutput: "-1", isSample: false },
        ],
        explanation: "Kadane's algorithm: track running sum, reset to current element when running sum goes negative.",
        marks: 20,
        createdBy: adminUser._id,
      },
    ];

    await Question.insertMany(questions);
    console.log(`Database successfully seeded with ${questions.length} Interview Questions! 🌱`);
    process.exit(0);
  } catch (err) {
    console.error('Error seeding data:', err);
    process.exit(1);
  }
};

seedDB();
