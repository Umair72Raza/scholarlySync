import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  GraduationCap, Mail, Lock, User, ArrowRight,
  Eye, EyeOff, Loader2, AlertCircle,
} from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import api from '../services/api';

type Tab = 'signin' | 'signup';

const FEATURES = [
  'AI-powered assignment feedback',
  'Real-time grading & analytics',
  'Role-based teacher & student views',
  'Instant notifications',
];

export const SignIn: React.FC = () => {
  const [tab, setTab]               = useState<Tab>('signin');
  const [name, setName]             = useState('');
  const [email, setEmail]           = useState('');
  const [password, setPassword]     = useState('');
  const [role, setRole]             = useState<'STUDENT' | 'TEACHER'>('STUDENT');
  const [showPassword, setShowPass] = useState(false);
  const [isLoading, setIsLoading]   = useState(false);
  const [error, setError]           = useState('');

  const navigate = useNavigate();
  const setUser  = useAuthStore((s) => s.setUser);

  const switchTab = (t: Tab) => { setTab(t); setError(''); };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);
    try {
      const endpoint = tab === 'signin' ? '/auth/login' : '/auth/register';
      const body     = tab === 'signin' ? { email, password } : { name, email, password, role };
      const { data } = await api.post(endpoint, body);
      setUser(data.data.user);
      navigate('/dashboard');
    } catch (err: unknown) {
      const msg =
        err instanceof Error && 'response' in err
          ? (err as { response?: { data?: { message?: string } } }).response?.data?.message
          : undefined;
      setError(msg ?? 'Something went wrong. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex overflow-hidden">
      {/* ── Left Branding Panel ───────────────────────────── */}
      <div className="hidden lg:flex flex-col justify-between w-[48%] relative overflow-hidden bg-gradient-to-br from-slate-900 via-indigo-950/40 to-slate-950 p-12">
        {/* Background orbs */}
        <div className="absolute -top-48 -left-48 w-96 h-96 rounded-full bg-indigo-600/15 blur-3xl pointer-events-none" />
        <div className="absolute -bottom-48 -right-16 w-80 h-80 rounded-full bg-blue-600/10 blur-3xl pointer-events-none" />

        {/* Grid overlay */}
        <div
          className="absolute inset-0 opacity-30"
          style={{
            backgroundImage:
              'linear-gradient(rgba(99,102,241,0.07) 1px, transparent 1px),' +
              'linear-gradient(to right, rgba(99,102,241,0.07) 1px, transparent 1px)',
            backgroundSize: '3.5rem 3.5rem',
          }}
        />

        {/* Top — Logo */}
        <Link to="/" className="relative z-10 flex items-center gap-3 w-fit">
          <div className="h-10 w-10 rounded-xl bg-indigo-600 flex items-center justify-center shadow-lg shadow-indigo-500/30">
            <GraduationCap className="h-6 w-6 text-white" />
          </div>
          <span className="text-white font-bold text-xl tracking-tight">ScholarlySync</span>
        </Link>

        {/* Middle — Copy */}
        <div className="relative z-10 space-y-8">
          <div className="space-y-3">
            <h2 className="text-4xl font-bold text-white leading-tight">
              Your AI-powered<br />
              <span className="gradient-text">academic workspace</span>
            </h2>
            <p className="text-slate-400 text-lg leading-relaxed max-w-sm">
              Submit assignments, get instant AI feedback, track your progress — all in one beautiful platform.
            </p>
          </div>

          {/* Feature list */}
          <ul className="space-y-3">
            {FEATURES.map((f) => (
              <li key={f} className="flex items-center gap-3 text-slate-300 text-sm">
                <span className="h-5 w-5 rounded-full bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center flex-shrink-0">
                  <span className="h-2 w-2 rounded-full bg-indigo-400" />
                </span>
                {f}
              </li>
            ))}
          </ul>

          {/* Testimonial card */}
          <div className="p-5 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-sm animate-fade-in-up">
            <p className="text-slate-300 text-sm leading-relaxed italic">
              "ScholarlySync cut my assignment review time in half. The AI feedback is remarkably accurate and students love the instant responses."
            </p>
            <div className="mt-4 flex items-center gap-3">
              <div className="h-9 w-9 rounded-full bg-gradient-to-br from-indigo-500 to-blue-600 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                SK
              </div>
              <div>
                <p className="text-white text-sm font-semibold">Sarah K.</p>
                <p className="text-slate-500 text-xs">Computer Science Teacher, MIT</p>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom — Copyright */}
        <p className="relative z-10 text-slate-600 text-sm">
          © {new Date().getFullYear()} ScholarlySync. All rights reserved.
        </p>
      </div>

      {/* ── Right Form Panel ──────────────────────────────── */}
      <div className="flex-1 flex items-center justify-center p-6 lg:p-12 relative">
        {/* Subtle background glow */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 rounded-full bg-indigo-600/5 blur-3xl pointer-events-none" />

        <div className="relative w-full max-w-md">
          {/* Mobile logo */}
          <Link to="/" className="lg:hidden flex items-center gap-3 mb-8 w-fit">
            <div className="h-9 w-9 rounded-xl bg-indigo-600 flex items-center justify-center">
              <GraduationCap className="h-5 w-5 text-white" />
            </div>
            <span className="text-white font-bold text-lg">ScholarlySync</span>
          </Link>

          {/* Heading */}
          <div className="mb-8">
            <AnimatePresence mode="wait">
              <motion.div
                key={tab + '-heading'}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.2 }}
              >
                <h1 className="text-2xl font-bold text-white">
                  {tab === 'signin' ? 'Welcome back' : 'Create your account'}
                </h1>
                <p className="mt-1.5 text-slate-400 text-sm">
                  {tab === 'signin'
                    ? 'Sign in to continue to your dashboard'
                    : 'Join thousands of students and teachers today'}
                </p>
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Tab switcher */}
          <div className="flex p-1 rounded-xl bg-white/5 border border-white/10 mb-6">
            {(['signin', 'signup'] as Tab[]).map((t) => (
              <button
                key={t}
                id={`tab-${t}`}
                type="button"
                onClick={() => switchTab(t)}
                className={`flex-1 py-2.5 text-sm font-medium rounded-lg transition-all duration-200 ${
                  tab === t
                    ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/20'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {t === 'signin' ? 'Sign In' : 'Sign Up'}
              </button>
            ))}
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4" noValidate>
            {/* Name field (sign-up only) */}
            <AnimatePresence initial={false}>
              {tab === 'signup' && (
                <motion.div
                  key="name"
                  initial={{ height: 0, opacity: 0, marginBottom: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.25, ease: 'easeInOut' }}
                  className="overflow-hidden"
                >
                  <div className="pb-0">
                    <label htmlFor="name" className="block text-sm font-medium text-slate-300 mb-1.5">
                      Full Name
                    </label>
                    <div className="relative">
                      <User className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                      <input
                        id="name"
                        type="text"
                        autoComplete="name"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="John Doe"
                        required={tab === 'signup'}
                        className="w-full bg-white/5 border border-white/10 rounded-xl py-3 pl-10 pr-4 text-white placeholder-slate-600 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all"
                      />
                    </div>
                  </div>

                  <div className="mt-4">
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                      I am a...
                    </label>
                    <div className="grid grid-cols-2 gap-3">
                      <button
                        type="button"
                        onClick={() => setRole('STUDENT')}
                        className={`py-2 px-3 rounded-xl border text-sm font-medium transition-all ${
                          role === 'STUDENT'
                            ? 'bg-indigo-600/20 border-indigo-500 text-indigo-400'
                            : 'bg-white/5 border-white/10 text-slate-400 hover:bg-white/10'
                        }`}
                      >
                        Student
                      </button>
                      <button
                        type="button"
                        onClick={() => setRole('TEACHER')}
                        className={`py-2 px-3 rounded-xl border text-sm font-medium transition-all ${
                          role === 'TEACHER'
                            ? 'bg-indigo-600/20 border-indigo-500 text-indigo-400'
                            : 'bg-white/5 border-white/10 text-slate-400 hover:bg-white/10'
                        }`}
                      >
                        Teacher
                      </button>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Email */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-slate-300 mb-1.5">
                Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                <input
                  id="email"
                  type="email"
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  required
                  className="w-full bg-white/5 border border-white/10 rounded-xl py-3 pl-10 pr-4 text-white placeholder-slate-600 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all"
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-slate-300 mb-1.5">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete={tab === 'signin' ? 'current-password' : 'new-password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  minLength={8}
                  className="w-full bg-white/5 border border-white/10 rounded-xl py-3 pl-10 pr-12 text-white placeholder-slate-600 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPass(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {/* Error banner */}
            <AnimatePresence>
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -6 }}
                  transition={{ duration: 0.18 }}
                  className="flex items-start gap-2.5 p-3.5 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm"
                  role="alert"
                >
                  <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                  <span>{error}</span>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Submit */}
            <button
              id="btn-submit"
              type="submit"
              disabled={isLoading}
              className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-60 disabled:cursor-not-allowed text-white font-semibold text-sm transition-all hover:shadow-lg hover:shadow-indigo-500/25 active:scale-[0.98] mt-2"
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  {tab === 'signin' ? 'Signing in…' : 'Creating account…'}
                </>
              ) : (
                <>
                  {tab === 'signin' ? 'Sign In' : 'Create Account'}
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </button>
          </form>

          {/* Switch tab */}
          <p className="mt-6 text-center text-sm text-slate-500">
            {tab === 'signin' ? "Don't have an account? " : 'Already have an account? '}
            <button
              type="button"
              onClick={() => switchTab(tab === 'signin' ? 'signup' : 'signin')}
              className="text-indigo-400 hover:text-indigo-300 font-medium transition-colors"
            >
              {tab === 'signin' ? 'Sign up for free' : 'Sign in'}
            </button>
          </p>

          <div className="mt-5 text-center">
            <Link to="/" className="text-xs text-slate-600 hover:text-slate-400 transition-colors">
              ← Back to home
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};
