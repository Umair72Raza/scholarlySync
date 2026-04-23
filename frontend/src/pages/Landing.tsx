import React, { useRef } from 'react';
import { Link } from 'react-router-dom';
import { motion, useInView } from 'framer-motion';
import {
  GraduationCap, Brain, FileText, BarChart3,
  Bell, Users, ArrowRight, Zap, Shield, Star,
  CheckCircle, ChevronRight,
} from 'lucide-react';
import { useAuthStore } from '../store/authStore';

// ── Animation helpers ──────────────────────────────────────
const fadeUp = {
  hidden: { opacity: 0, y: 32 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.55, ease: 'easeOut' } },
};
const stagger = { visible: { transition: { staggerChildren: 0.1 } } };

function InView({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: '-80px' });
  return (
    <motion.div
      ref={ref}
      variants={stagger}
      initial="hidden"
      animate={inView ? 'visible' : 'hidden'}
      className={className}
    >
      {children}
    </motion.div>
  );
}

// ── Nav ───────────────────────────────────────────────────
function Nav() {
  const { isAuthenticated } = useAuthStore();
  return (
    <header className="fixed top-0 inset-x-0 z-50">
      <div className="mx-auto max-w-6xl px-6 py-4">
        <div className="flex items-center justify-between rounded-2xl bg-white/5 border border-white/10 backdrop-blur-xl px-5 py-3">
          <Link to="/" className="flex items-center gap-2.5">
            <div className="h-8 w-8 rounded-lg bg-indigo-600 flex items-center justify-center">
              <GraduationCap className="h-5 w-5 text-white" />
            </div>
            <span className="font-bold text-white text-lg tracking-tight">ScholarlySync</span>
          </Link>
          <nav className="hidden md:flex items-center gap-8 text-sm text-slate-400">
            {['Features', 'How it works', 'Testimonials'].map((item) => (
              <a key={item} href={`#${item.toLowerCase().replace(' ', '-')}`}
                className="hover:text-white transition-colors">
                {item}
              </a>
            ))}
          </nav>
          <div className="flex items-center gap-3">
            {!isAuthenticated ? (
              <>
                <Link to="/signin" className="text-sm text-slate-400 hover:text-white transition-colors hidden sm:block">
                  Sign In
                </Link>
                <Link to="/signin" className="btn-primary text-sm py-2 px-4">
                  Get Started
                </Link>
              </>
            ) : (
              <Link to="/dashboard" className="btn-primary text-sm py-2 px-4">
                Dashboard
              </Link>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}

// ── Hero ──────────────────────────────────────────────────
function Hero() {
  const { isAuthenticated } = useAuthStore();
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden pt-24 pb-16">
      {/* Background */}
      <div className="absolute inset-0 bg-slate-950">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[600px] rounded-full bg-indigo-600/10 blur-[120px]" />
        <div className="absolute bottom-0 right-0 w-[400px] h-[400px] rounded-full bg-blue-600/8 blur-[100px]" />
        <div className="absolute inset-0 opacity-20"
          style={{
            backgroundImage: 'radial-gradient(circle at 1px 1px, rgba(99,102,241,0.15) 1px, transparent 0)',
            backgroundSize: '40px 40px',
          }}
        />
      </div>

      <div className="relative z-10 mx-auto max-w-5xl px-6 text-center">
        {/* Badge */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
          className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-indigo-600/15 border border-indigo-500/25 text-indigo-300 text-sm mb-8">
          <Zap className="h-3.5 w-3.5" />
          Powered by Claude AI
          <ChevronRight className="h-3.5 w-3.5" />
        </motion.div>

        {/* Headline */}
        <motion.h1 initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
          className="text-5xl sm:text-6xl lg:text-7xl font-black text-white leading-[1.05] tracking-tight mb-6">
          Where Learning
          <br />
          <span className="gradient-text">Meets Intelligence</span>
        </motion.h1>

        <motion.p initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
          className="text-slate-400 text-lg sm:text-xl max-w-2xl mx-auto leading-relaxed mb-10">
          ScholarlySync gives students instant AI feedback on assignments and gives teachers real-time analytics — all secured with role-based access.
        </motion.p>

        {/* CTAs */}
        <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}
          className="flex flex-wrap items-center justify-center gap-4 mb-16">
          <Link to={isAuthenticated ? "/dashboard" : "/signin"} id="hero-cta-primary"
            className="flex items-center gap-2 px-7 py-3.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold transition-all hover:shadow-xl hover:shadow-indigo-500/30 active:scale-[0.98]">
            {isAuthenticated ? "Go to Dashboard" : "Start for free"} <ArrowRight className="h-4 w-4" />
          </Link>
          <a href="#features"
            className="flex items-center gap-2 px-7 py-3.5 rounded-xl bg-white/5 border border-white/10 text-white font-semibold hover:bg-white/10 transition-all">
            See features
          </a>
        </motion.div>

        {/* Dashboard preview */}
        <motion.div initial={{ opacity: 0, y: 40, scale: 0.97 }} animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ delay: 0.5, duration: 0.7 }}
          className="relative mx-auto max-w-4xl rounded-2xl border border-white/10 bg-slate-900/80 backdrop-blur-sm overflow-hidden shadow-2xl shadow-black/40 animate-pulse-glow">
          {/* Window chrome */}
          <div className="flex items-center gap-2 px-4 py-3 border-b border-white/10 bg-white/5">
            <div className="h-3 w-3 rounded-full bg-red-500/70" />
            <div className="h-3 w-3 rounded-full bg-yellow-500/70" />
            <div className="h-3 w-3 rounded-full bg-green-500/70" />
            <div className="flex-1 mx-4 h-5 rounded-md bg-white/5 text-xs text-slate-500 flex items-center justify-center">
              app.scholarlysync.com/dashboard
            </div>
          </div>
          {/* Fake dashboard content */}
          <div className="p-6 grid grid-cols-3 gap-4">
            {[
              { label: 'Assignments Due', value: '12', color: 'text-indigo-400' },
              { label: 'AI Queries Today', value: '847', color: 'text-cyan-400' },
              { label: 'Avg. Score', value: '92%', color: 'text-emerald-400' },
            ].map((s) => (
              <div key={s.label} className="rounded-xl bg-white/5 border border-white/8 p-4">
                <p className="text-slate-500 text-xs mb-1">{s.label}</p>
                <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
              </div>
            ))}
            <div className="col-span-2 rounded-xl bg-white/5 border border-white/8 p-4 flex items-end gap-1 h-28">
              {[40, 65, 55, 80, 70, 90, 85].map((h, i) => (
                <div key={i} className="flex-1 rounded-sm bg-indigo-500/40" style={{ height: `${h}%` }} />
              ))}
            </div>
            <div className="rounded-xl bg-white/5 border border-white/8 p-4 space-y-2 h-28 overflow-hidden">
              {['Assignment submitted', 'AI feedback ready', 'New comment'].map((n) => (
                <div key={n} className="flex items-center gap-2 text-xs text-slate-400">
                  <div className="h-1.5 w-1.5 rounded-full bg-indigo-400 flex-shrink-0" />
                  {n}
                </div>
              ))}
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

// ── Bento Grid Features ───────────────────────────────────
const FEATURES = [
  {
    icon: Brain, label: 'AI Study Room', color: 'text-indigo-400', bg: 'bg-indigo-500/10',
    border: 'border-indigo-500/20', size: 'md:col-span-2',
    desc: 'Chat with Claude AI about any topic in your curriculum. Get instant, accurate explanations and deep-dive into complex concepts on demand.',
    preview: (
      <div className="mt-4 space-y-2 text-xs">
        {[
          { from: 'You', msg: 'Explain Big-O notation in simple terms', side: 'right' },
          { from: 'AI', msg: 'Think of it as a recipe complexity score — O(n) means one step per ingredient…', side: 'left' },
        ].map((m) => (
          <div key={m.from} className={`flex ${m.side === 'right' ? 'justify-end' : ''}`}>
            <div className={`max-w-[80%] px-3 py-2 rounded-xl text-slate-300 ${
              m.side === 'right' ? 'bg-indigo-600/30' : 'bg-white/8'
            }`}>{m.msg}</div>
          </div>
        ))}
      </div>
    ),
  },
  {
    icon: FileText, label: 'Assignment Tracking', color: 'text-cyan-400', bg: 'bg-cyan-500/10',
    border: 'border-cyan-500/20', size: '',
    desc: 'Upload files, track submission deadlines, and receive instant grading feedback without waiting.',
  },
  {
    icon: BarChart3, label: 'Live Analytics', color: 'text-emerald-400', bg: 'bg-emerald-500/10',
    border: 'border-emerald-500/20', size: '',
    desc: 'Teachers see real-time class performance. Students see their own growth curves and areas to improve.',
  },
  {
    icon: Users, label: 'Role-Based Access', color: 'text-violet-400', bg: 'bg-violet-500/10',
    border: 'border-violet-500/20', size: '',
    desc: 'Students, teachers, and admins each get a tailored experience with scoped permissions.',
  },
  {
    icon: Bell, label: 'Instant Notifications', color: 'text-amber-400', bg: 'bg-amber-500/10',
    border: 'border-amber-500/20', size: '',
    desc: 'Real-time WebSocket updates keep everyone in the loop the moment feedback is ready.',
  },
  {
    icon: Shield, label: 'Secure by Design', color: 'text-rose-400', bg: 'bg-rose-500/10',
    border: 'border-rose-500/20', size: 'md:col-span-2',
    desc: 'httpOnly cookie sessions, token rotation, Redis-backed refresh revocation, and rate limiting baked in.',
  },
];

function Features() {
  return (
    <section id="features" className="relative py-24 px-6">
      <div className="mx-auto max-w-6xl">
        <InView className="text-center mb-16">
          <motion.p variants={fadeUp} className="text-indigo-400 font-semibold text-sm mb-3 tracking-widest uppercase">
            Everything you need
          </motion.p>
          <motion.h2 variants={fadeUp} className="text-4xl sm:text-5xl font-bold text-white mb-4">
            Built for the way<br />academia actually works
          </motion.h2>
          <motion.p variants={fadeUp} className="text-slate-400 text-lg max-w-xl mx-auto">
            No feature bloat — just the tools that matter for students and teachers.
          </motion.p>
        </InView>

        <InView className="grid md:grid-cols-3 gap-4">
          {FEATURES.map((f) => {
            const Icon = f.icon;
            return (
              <motion.div
                key={f.label}
                variants={fadeUp}
                className={`bento-card ${f.size ?? ''}`}
              >
                <div className={`inline-flex h-10 w-10 items-center justify-center rounded-xl ${f.bg} border ${f.border} mb-4`}>
                  <Icon className={`h-5 w-5 ${f.color}`} />
                </div>
                <h3 className="text-white font-semibold text-lg mb-2">{f.label}</h3>
                <p className="text-slate-400 text-sm leading-relaxed">{f.desc}</p>
                {f.preview}
              </motion.div>
            );
          })}
        </InView>
      </div>
    </section>
  );
}

// ── Stats ──────────────────────────────────────────────────
const STATS = [
  { value: '50K+', label: 'Active Students' },
  { value: '2M+',  label: 'Assignments Graded' },
  { value: '99.9%', label: 'Uptime SLA' },
  { value: '<2s',  label: 'Avg AI Response' },
];

function Stats() {
  return (
    <section className="py-16 px-6">
      <InView className="mx-auto max-w-4xl grid grid-cols-2 md:grid-cols-4 gap-6">
        {STATS.map((s) => (
          <motion.div key={s.label} variants={fadeUp}
            className="text-center p-6 rounded-2xl bg-white/4 border border-white/8">
            <p className="text-4xl font-black gradient-text mb-1">{s.value}</p>
            <p className="text-slate-500 text-sm">{s.label}</p>
          </motion.div>
        ))}
      </InView>
    </section>
  );
}

// ── How it works ──────────────────────────────────────────
const STEPS = [
  { n: '01', title: 'Create your account', desc: 'Sign up as a student or teacher in under 30 seconds. No credit card required.' },
  { n: '02', title: 'Submit or assign work', desc: 'Students upload assignments; teachers set rubrics and deadlines.' },
  { n: '03', title: 'AI grades instantly', desc: 'Claude AI analyses submissions against the rubric and generates detailed feedback.' },
  { n: '04', title: 'Review & improve', desc: 'Both parties see scores, comments, and growth metrics in real time.' },
];

function HowItWorks() {
  return (
    <section id="how-it-works" className="py-24 px-6">
      <div className="mx-auto max-w-4xl">
        <InView className="text-center mb-16">
          <motion.h2 variants={fadeUp} className="text-4xl font-bold text-white mb-4">
            How it works
          </motion.h2>
          <motion.p variants={fadeUp} className="text-slate-400 text-lg">
            From sign-up to feedback in minutes.
          </motion.p>
        </InView>
        <InView className="grid sm:grid-cols-2 gap-6">
          {STEPS.map((s) => (
            <motion.div key={s.n} variants={fadeUp}
              className="flex gap-5 p-6 rounded-2xl bg-white/4 border border-white/8 hover:bg-white/7 transition-colors">
              <span className="text-3xl font-black text-indigo-600/40 leading-none">{s.n}</span>
              <div>
                <h3 className="text-white font-semibold mb-1.5">{s.title}</h3>
                <p className="text-slate-400 text-sm leading-relaxed">{s.desc}</p>
              </div>
            </motion.div>
          ))}
        </InView>
      </div>
    </section>
  );
}

// ── Testimonials ──────────────────────────────────────────
const TESTIMONIALS = [
  { quote: 'ScholarlySync cut my grading time by 60%. The AI feedback is genuinely better than what I used to write manually.', name: 'Dr. Elena R.', role: 'Computer Science Professor', initials: 'ER' },
  { quote: 'I got feedback on my essay at 2 AM the day before submission. That kind of instant response is a game-changer.', name: 'Marcus T.', role: 'Engineering Student', initials: 'MT' },
  { quote: 'The role-based system means students only see what they need. Setup took less than 10 minutes.', name: 'James L.', role: 'School Administrator', initials: 'JL' },
];

function Testimonials() {
  return (
    <section id="testimonials" className="py-24 px-6">
      <div className="mx-auto max-w-6xl">
        <InView className="text-center mb-16">
          <motion.h2 variants={fadeUp} className="text-4xl font-bold text-white mb-4">
            Loved by educators and students
          </motion.h2>
        </InView>
        <InView className="grid md:grid-cols-3 gap-6">
          {TESTIMONIALS.map((t) => (
            <motion.div key={t.name} variants={fadeUp}
              className="p-6 rounded-2xl bg-white/5 border border-white/10 hover:border-indigo-500/30 transition-all hover:shadow-lg hover:shadow-indigo-500/5 flex flex-col gap-5">
              <div className="flex gap-1 text-amber-400">
                {[...Array(5)].map((_, i) => <Star key={i} className="h-4 w-4 fill-current" />)}
              </div>
              <p className="text-slate-300 text-sm leading-relaxed flex-1">"{t.quote}"</p>
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-gradient-to-br from-indigo-500 to-blue-600 flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
                  {t.initials}
                </div>
                <div>
                  <p className="text-white text-sm font-semibold">{t.name}</p>
                  <p className="text-slate-500 text-xs">{t.role}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </InView>
      </div>
    </section>
  );
}

// ── CTA ───────────────────────────────────────────────────
function CTA() {
  const { isAuthenticated } = useAuthStore();
  return (
    <section className="py-16 px-6 pb-24">
      <InView className="mx-auto max-w-3xl">
        <motion.div variants={fadeUp}
          className="relative rounded-3xl overflow-hidden p-12 text-center bg-gradient-to-br from-indigo-900/60 via-indigo-800/40 to-slate-900/60 border border-indigo-500/20">
          <div className="absolute -top-16 -right-16 w-64 h-64 rounded-full bg-indigo-600/20 blur-3xl pointer-events-none" />
          <div className="absolute -bottom-16 -left-16 w-64 h-64 rounded-full bg-blue-600/10 blur-3xl pointer-events-none" />
          <div className="relative z-10">
            <CheckCircle className="h-12 w-12 text-indigo-400 mx-auto mb-4" />
            <h2 className="text-3xl sm:text-4xl font-bold text-white mb-3">Ready to transform learning?</h2>
            <p className="text-slate-400 mb-8 max-w-md mx-auto">
              Join thousands of students and teachers already using ScholarlySync. Free to start, no credit card needed.
            </p>
            <Link to={isAuthenticated ? "/dashboard" : "/signin"} id="cta-get-started"
              className="inline-flex items-center gap-2 px-8 py-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold transition-all hover:shadow-2xl hover:shadow-indigo-500/30 active:scale-[0.98]">
              {isAuthenticated ? "Go to Dashboard" : "Get started free"} <ArrowRight className="h-5 w-5" />
            </Link>
          </div>
        </motion.div>
      </InView>
    </section>
  );
}

// ── Footer ────────────────────────────────────────────────
function Footer() {
  return (
    <footer className="border-t border-white/8 py-10 px-6">
      <div className="mx-auto max-w-6xl flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2.5">
          <div className="h-7 w-7 rounded-lg bg-indigo-600 flex items-center justify-center">
            <GraduationCap className="h-4 w-4 text-white" />
          </div>
          <span className="text-white font-semibold text-sm">ScholarlySync</span>
        </div>
        <p className="text-slate-600 text-sm">© {new Date().getFullYear()} ScholarlySync. All rights reserved.</p>
        <div className="flex gap-5 text-sm text-slate-500">
          <a href="#" className="hover:text-white transition-colors">Privacy</a>
          <a href="#" className="hover:text-white transition-colors">Terms</a>
          <Link to="/signin" className="hover:text-white transition-colors">Sign In</Link>
        </div>
      </div>
    </footer>
  );
}

// ── Page ──────────────────────────────────────────────────
export const Landing: React.FC = () => (
  <div className="bg-slate-950 min-h-screen">
    <Nav />
    <Hero />
    <Stats />
    <Features />
    <HowItWorks />
    <Testimonials />
    <CTA />
    <Footer />
  </div>
);
