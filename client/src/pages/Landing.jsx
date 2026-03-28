import React from 'react';
import { Link } from 'react-router-dom';
import { Code2, ArrowRight, Zap, Trophy, BookOpen } from 'lucide-react';

const Landing = () => {
  return (
    <div className="flex flex-col min-h-screen">

      {/* ===== HERO SECTION ===== */}
      <section className="bg-slate-900 text-white flex-1 flex items-center justify-center py-24 px-4">
        <div className="max-w-3xl mx-auto text-center">

          {/* Badge */}
          <div className="inline-flex items-center gap-2 bg-blue-500/10 border border-blue-500/20 text-blue-400 text-sm font-medium px-4 py-1.5 rounded-full mb-8">
            <Zap className="h-4 w-4" />
            Your personal interview simulator
          </div>

          {/* Headline */}
          <h1 className="text-5xl sm:text-6xl font-extrabold tracking-tight mb-6 leading-tight">
            Ace Your Next
            <span className="text-blue-400"> Tech Interview.</span>
          </h1>

          {/* Subheadline */}
          <p className="text-lg text-slate-400 max-w-xl mx-auto mb-10">
            Practice with real DSA questions, timed interview sessions, and a
            live leaderboard. Built for developers who are serious about landing
            their next role.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              to="/register"
              className="inline-flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-500 text-white font-semibold px-8 py-3 rounded-lg transition-colors duration-200"
            >
              Start Practicing
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              to="/login"
              className="inline-flex items-center justify-center gap-2 bg-white/5 hover:bg-white/10 border border-white/10 text-white font-semibold px-8 py-3 rounded-lg transition-colors duration-200"
            >
              Login
            </Link>
          </div>

          {/* Stats Row */}
          <div className="mt-14 flex flex-col sm:flex-row items-center justify-center gap-6 text-slate-400 text-sm">
            <div className="flex items-center gap-2">
              <BookOpen className="h-4 w-4 text-blue-400" />
              <span>Curated DSA Questions</span>
            </div>
            <span className="hidden sm:block text-slate-700">•</span>
            <div className="flex items-center gap-2">
              <Zap className="h-4 w-4 text-blue-400" />
              <span>Timed Interview Sessions</span>
            </div>
            <span className="hidden sm:block text-slate-700">•</span>
            <div className="flex items-center gap-2">
              <Trophy className="h-4 w-4 text-blue-400" />
              <span>Live Leaderboard</span>
            </div>
          </div>

        </div>
      </section>



      {/* // naya section add krenge bbg - 3 cards - idea of mockforge */}
      {/* ===== FEATURES SECTION ===== */}
      <section className="bg-white py-24 px-4">
        <div className="max-w-5xl mx-auto">

          {/* Section Header */}
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 mb-4">
              Everything you need to prepare
            </h2>
            <p className="text-slate-500 max-w-xl mx-auto">
              MockForge gives you the tools, the pressure, and the feedback to
              walk into any interview with confidence.
            </p>
          </div>

          {/* Feature Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-8">

            {/* Card 1 */}
            <div className="bg-slate-50 border border-slate-100 rounded-2xl p-8 hover:shadow-lg transition-shadow duration-300">
              <div className="bg-blue-100 text-blue-600 w-12 h-12 rounded-xl flex items-center justify-center mb-5">
                <Zap className="h-6 w-6" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-3">Timed Sessions</h3>
              <p className="text-slate-500">
                Every interview is timed to simulate real pressure. No pausing,
                no overthinking — just you and the clock.
              </p>
            </div>

            {/* Card 2 */}
            <div className="bg-slate-50 border border-slate-100 rounded-2xl p-8 hover:shadow-lg transition-shadow duration-300">
              <div className="bg-blue-100 text-blue-600 w-12 h-12 rounded-xl flex items-center justify-center mb-5">
                <BookOpen className="h-6 w-6" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-3">Curated Question Bank</h3>
              <p className="text-slate-500">
                Arrays, DP, Graphs, OOP — handpicked questions across topics and
                difficulty levels, built by engineers.
              </p>
            </div>

            {/* Card 3 */}
            <div className="bg-slate-50 border border-slate-100 rounded-2xl p-8 hover:shadow-lg transition-shadow duration-300">
              <div className="bg-blue-100 text-blue-600 w-12 h-12 rounded-xl flex items-center justify-center mb-5">
                <Trophy className="h-6 w-6" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-3">Live Leaderboard</h3>
              <p className="text-slate-500">
                See how you stack up against other developers in real time. Compete,
                improve, and climb the ranks.
              </p>
            </div>

          </div>
        </div>
      </section>


      {/* kuch aur bhi add krenge bbg - new section - smthing is cooking?! */}
      {/* ===== HOW IT WORKS SECTION ===== */}
      <section className="bg-slate-50 py-24 px-4">
        <div className="max-w-5xl mx-auto">

          {/* Section Header */}
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 mb-4">
              How It Works
            </h2>
            <p className="text-slate-500 max-w-xl mx-auto">
              Go from zero to interview-ready in three simple steps.
            </p>
          </div>

          {/* Steps */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 relative">

            {/* Step 1 */}
            <div className="flex flex-col items-center text-center">
              <div className="w-14 h-14 rounded-full bg-blue-600 text-white text-xl font-bold flex items-center justify-center mb-5 shadow-lg">
                1
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-3">Create an Account</h3>
              <p className="text-slate-500">
                Sign up in seconds. No credit card, no fluff. Just create your
                profile and you're ready.
              </p>
            </div>

            {/* Connector line (hidden on mobile) */}
            <div className="hidden sm:block absolute top-7 left-1/3 w-1/3 h-0.5 bg-blue-200" />

            {/* Step 2 */}
            <div className="flex flex-col items-center text-center">
              <div className="w-14 h-14 rounded-full bg-blue-600 text-white text-xl font-bold flex items-center justify-center mb-5 shadow-lg">
                2
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-3">Pick a Topic & Start</h3>
              <p className="text-slate-500">
                Choose your topic — Arrays, DP, Graphs, or OOP. The timer starts
                immediately. Treat it like the real thing.
              </p>
            </div>

            {/* Connector line (hidden on mobile) */}
            <div className="hidden sm:block absolute top-7 right-1/3 w-1/3 h-0.5 bg-blue-200" />

            {/* Step 3 */}
            <div className="flex flex-col items-center text-center">
              <div className="w-14 h-14 rounded-full bg-blue-600 text-white text-xl font-bold flex items-center justify-center mb-5 shadow-lg">
                3
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-3">Track Your Progress</h3>
              <p className="text-slate-500">
                See your score, compare it on the leaderboard, and come back
                tomorrow to beat it. Consistency wins.
              </p>
            </div>

          </div>
        </div>
      </section>


      {/* ===== CTA BANNER === how it works wala section bbg== */}
      <section className="bg-slate-900 py-20 px-4">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
            Ready to start forging your skills?
          </h2>
          <p className="text-slate-400 mb-8">
            Join developers who are taking their interview prep seriously.
            Your next offer starts here.
          </p>
          <Link
            to="/register"
            className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white font-semibold px-10 py-4 rounded-lg text-lg transition-colors duration-200"
          >
            Get Started — It's Free
            <ArrowRight className="h-5 w-5" />
          </Link>
        </div>
      </section>


      {/* ===== FOOTER == kuch aur added bbg === */} 
      <footer className="bg-slate-950 text-slate-500 py-8 px-4">
        <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          
          {/* Logo */}
          <div className="flex items-center gap-2 text-white font-bold text-lg">
            <Code2 className="h-5 w-5 text-blue-400" />
            MockForge
          </div>

          {/* Copyright */}
          <p className="text-sm">
            © {new Date().getFullYear()} MockForge. Made with ❤️ by{" "}
            <a
              href="https://www.linkedin.com/in/rudhar-bajaj/"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-white hover:drop-shadow-[0_0_8px_rgba(255,255,255,0.8)] 
               transition-all duration-300 font-medium"            
            >
              Rudhar Bajaj
            </a>.
          </p>

          {/* Links */}
          <div className="flex gap-6 text-sm">
            <Link to="/login" className="hover:text-white transition-colors">Login</Link>
            <Link to="/register" className="hover:text-white transition-colors">Sign Up</Link>
          </div>

        </div>
      </footer>





    </div>
  );
};

export default Landing;
