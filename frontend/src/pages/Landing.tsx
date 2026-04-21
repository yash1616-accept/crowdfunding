import React, { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@clerk/clerk-react';
import { motion } from 'framer-motion';
import {
  Rocket, ArrowRight, Shield, Zap, Globe, TrendingUp, Users, Sparkles,
  Menu, X, ChevronRight, Play, Star, CheckCircle
} from 'lucide-react';

/* ── Floating particle ── */
function FloatingParticle({ delay, x, y, size, color }: { delay: number; x: number; y: number; size: number; color: string }) {
  return (
    <motion.div
      className="absolute rounded-full"
      style={{ width: size, height: size, left: `${x}%`, top: `${y}%`, background: color }}
      animate={{ y: [0, -40, 0], opacity: [0.15, 0.5, 0.15], scale: [1, 1.3, 1] }}
      transition={{ duration: 5 + Math.random() * 4, repeat: Infinity, delay, ease: 'easeInOut' }}
    />
  );
}

/* ── Data ── */
const features = [
  { icon: Shield, title: 'Secure & Transparent', desc: 'Every transaction is tracked. Every dollar accounted for with blockchain-grade audit trails.' },
  { icon: Zap, title: 'Lightning Fast', desc: 'Deploy campaigns in seconds. Get funded in minutes. Zero bureaucracy, pure momentum.' },
  { icon: Globe, title: 'Global Reach', desc: 'Connect with backers across 150+ countries. Your next investor is one click away.' },
  { icon: TrendingUp, title: 'Real-Time Analytics', desc: 'Track campaign performance with live dashboards and AI-driven funding insights.' },
  { icon: Users, title: 'Community Driven', desc: 'Build a tribe of supporters who champion your cause and amplify your reach.' },
  { icon: Sparkles, title: 'AI-Powered Pitches', desc: 'Our built-in AI crafts compelling campaign descriptions that convert browsers to backers.' },
];

const stats = [
  { value: '10K+', label: 'Projects Funded' },
  { value: '$50M+', label: 'Capital Raised' },
  { value: '150+', label: 'Countries' },
  { value: '98%', label: 'Success Rate' },
];

const testimonials = [
  { name: 'Sarah Chen', role: 'Hardware Startup Founder', quote: 'FundSphere helped us raise $2M in 72 hours. The AI pitch generator alone tripled our conversion rate.', stars: 5 },
  { name: 'Marcus Rivera', role: 'Indie Game Developer', quote: "The real-time analytics dashboard gave us insights we couldn't get anywhere else. Fully funded in 3 days.", stars: 5 },
  { name: 'Priya Sharma', role: 'Social Enterprise CEO', quote: 'Global reach is real. We received backing from 40+ countries. The community features are game-changing.', stars: 5 },
];

const steps = [
  { step: '01', title: 'Create Your Project', desc: 'Fill in your vision, set your funding goal, and let our AI polish your pitch to perfection.' },
  { step: '02', title: 'Go Live Instantly', desc: 'Publish to the Explore feed. Backers worldwide can discover and support your idea immediately.' },
  { step: '03', title: 'Get Funded', desc: 'Track contributions in real-time. Withdraw funds directly to your bank once your goal is met.' },
];

/* ── Stagger container ── */
const staggerContainer = { hidden: {}, visible: { transition: { staggerChildren: 0.1 } } };
const fadeUp = { hidden: { opacity: 0, y: 30 }, visible: { opacity: 1, y: 0, transition: { duration: 0.6 } } };

export default function Landing() {
  const navigate = useNavigate();
  const { isSignedIn, isLoaded } = useAuth();
  const [mousePos, setMousePos] = useState({ x: 0.5, y: 0.5 });
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    if (isLoaded && isSignedIn) {
      navigate('/explore', { replace: true });
    }
  }, [isLoaded, isSignedIn, navigate]);

  useEffect(() => {
    const handleMouse = (e: MouseEvent) => {
      setMousePos({ x: e.clientX / window.innerWidth, y: e.clientY / window.innerHeight });
    };
    window.addEventListener('mousemove', handleMouse);
    return () => window.removeEventListener('mousemove', handleMouse);
  }, []);

  const particles = useMemo(() => Array.from({ length: 25 }, (_, i) => ({
    id: i,
    x: Math.random() * 100,
    y: Math.random() * 100,
    size: 3 + Math.random() * 10,
    delay: Math.random() * 4,
    color: ['rgba(59,130,246,0.2)', 'rgba(99,102,241,0.15)', 'rgba(139,92,246,0.15)', 'rgba(236,72,153,0.1)'][Math.floor(Math.random() * 4)],
  })), []);

  return (
    <div className="min-h-screen bg-[#030712] text-white overflow-x-hidden">

      {/* ═══════════ HERO ═══════════ */}
      <section className="relative min-h-screen flex flex-col items-center justify-center px-4 sm:px-6">

        {/* Animated background */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <motion.div
            className="absolute w-[500px] sm:w-[800px] h-[500px] sm:h-[800px] rounded-full opacity-20 blur-[80px] sm:blur-[120px]"
            style={{
              background: 'radial-gradient(circle, #3b82f6, #6366f1, transparent)',
              left: `${25 + mousePos.x * 15}%`, top: `${15 + mousePos.y * 15}%`,
              transform: 'translate(-50%, -50%)',
            }}
            animate={{ scale: [1, 1.15, 1] }}
            transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
          />
          <motion.div
            className="absolute w-[400px] sm:w-[600px] h-[400px] sm:h-[600px] rounded-full opacity-15 blur-[60px] sm:blur-[100px]"
            style={{
              background: 'radial-gradient(circle, #8b5cf6, #ec4899, transparent)',
              right: `${5 + mousePos.x * 8}%`, bottom: `${5 + mousePos.y * 8}%`,
            }}
            animate={{ scale: [1.1, 1, 1.1] }}
            transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
          />
          <motion.div
            className="absolute w-[300px] h-[300px] rounded-full opacity-10 blur-[80px]"
            style={{ background: 'radial-gradient(circle, #10b981, transparent)', left: '60%', top: '70%' }}
            animate={{ scale: [1, 1.2, 1], x: [0, 30, 0] }}
            transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut' }}
          />
          {/* Grid */}
          <div className="absolute inset-0" style={{
            backgroundImage: 'linear-gradient(rgba(255,255,255,0.025) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.025) 1px, transparent 1px)',
            backgroundSize: '50px 50px',
          }} />
          {particles.map(p => <FloatingParticle key={p.id} {...p} />)}
        </div>

        {/* ── Navbar ── */}
        <motion.nav
          initial={{ y: -80, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
          className="fixed top-0 left-0 right-0 z-50 backdrop-blur-xl bg-[#030712]/60 border-b border-white/5"
        >
          <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
            <div className="flex items-center gap-2 text-white font-bold text-lg sm:text-xl tracking-tight">
              <Rocket className="w-5 h-5 sm:w-6 sm:h-6 text-blue-400" />
              FundSphere
            </div>

            {/* Desktop nav */}
            <div className="hidden md:flex items-center gap-6">
              <a href="#features" className="text-sm text-gray-400 hover:text-white transition-colors">Features</a>
              <a href="#how-it-works" className="text-sm text-gray-400 hover:text-white transition-colors">How It Works</a>
              <a href="#testimonials" className="text-sm text-gray-400 hover:text-white transition-colors">Testimonials</a>
              <div className="w-px h-5 bg-white/10" />
              <button onClick={() => navigate('/login')} className="px-4 py-2 text-sm font-medium text-gray-300 hover:text-white transition-colors">
                Sign In
              </button>
              <button onClick={() => navigate('/register')} className="px-5 py-2.5 text-sm font-semibold bg-blue-600 hover:bg-blue-500 text-white rounded-lg transition-all hover:shadow-lg hover:shadow-blue-500/25">
                Get Started
              </button>
            </div>

            {/* Mobile hamburger */}
            <button className="md:hidden text-gray-300 p-2" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>

          {/* Mobile menu */}
          {mobileMenuOpen && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="md:hidden bg-[#0a0f1a] border-b border-white/5 px-4 py-4 space-y-3"
            >
              <a href="#features" onClick={() => setMobileMenuOpen(false)} className="block text-sm text-gray-300 hover:text-white py-2">Features</a>
              <a href="#how-it-works" onClick={() => setMobileMenuOpen(false)} className="block text-sm text-gray-300 hover:text-white py-2">How It Works</a>
              <a href="#testimonials" onClick={() => setMobileMenuOpen(false)} className="block text-sm text-gray-300 hover:text-white py-2">Testimonials</a>
              <hr className="border-white/10" />
              <button onClick={() => { navigate('/login'); setMobileMenuOpen(false); }} className="block w-full text-left text-sm text-gray-300 hover:text-white py-2">Sign In</button>
              <button onClick={() => { navigate('/register'); setMobileMenuOpen(false); }} className="block w-full text-center px-5 py-2.5 text-sm font-semibold bg-blue-600 hover:bg-blue-500 text-white rounded-lg">Get Started</button>
            </motion.div>
          )}
        </motion.nav>

        {/* ── Hero content ── */}
        <div className="relative z-10 text-center max-w-5xl mx-auto pt-20 sm:pt-0">
          <motion.div
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ duration: 0.8, type: 'spring', stiffness: 200 }}
            className="mx-auto mb-6 sm:mb-8 w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-2xl shadow-blue-500/30"
          >
            <Rocket className="w-8 h-8 sm:w-10 sm:h-10 text-white" />
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3, duration: 0.8 }}>
            <span className="inline-flex items-center gap-2 px-3 sm:px-4 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-300 text-xs sm:text-sm font-medium mb-4 sm:mb-6">
              <Sparkles className="w-3.5 h-3.5 sm:w-4 sm:h-4" /> The Future of Crowdfunding is Here
            </span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 0.8 }}
            className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-extrabold leading-[1.1] tracking-tight mb-5 sm:mb-6 px-2"
          >
            Fund the{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-indigo-400 to-purple-400">
              Next Big Thing
            </span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7, duration: 0.8 }}
            className="text-base sm:text-lg md:text-xl text-gray-400 max-w-2xl mx-auto mb-8 sm:mb-10 leading-relaxed px-4"
          >
            The platform where bold ideas meet passionate backers.
            Launch your project, rally your community, and turn your vision into reality.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.9, duration: 0.8 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4 px-4"
          >
            <button
              onClick={() => navigate('/register')}
              className="group w-full sm:w-auto px-7 sm:px-8 py-3.5 sm:py-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-semibold rounded-xl text-base sm:text-lg transition-all shadow-xl shadow-blue-600/20 hover:shadow-blue-500/40 flex items-center justify-center gap-3"
            >
              Get Started Free
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </button>
            <button
              onClick={() => navigate('/explore')}
              className="group w-full sm:w-auto px-7 sm:px-8 py-3.5 sm:py-4 bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 text-gray-300 hover:text-white font-semibold rounded-xl text-base sm:text-lg transition-all flex items-center justify-center gap-2"
            >
              <Play className="w-4 h-4" /> Explore Projects
            </button>
          </motion.div>
        </div>

        {/* Scroll indicator */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.5 }} className="absolute bottom-8 sm:bottom-10 left-1/2 -translate-x-1/2 hidden sm:block">
          <motion.div animate={{ y: [0, 8, 0] }} transition={{ duration: 1.5, repeat: Infinity }} className="w-6 h-10 rounded-full border-2 border-white/20 flex items-start justify-center p-1.5">
            <div className="w-1.5 h-2.5 rounded-full bg-white/40" />
          </motion.div>
        </motion.div>
      </section>

      {/* ═══════════ TRUSTED BY (logos strip) ═══════════ */}
      <section className="relative z-10 py-10 sm:py-12 border-y border-white/5 bg-white/[0.01]">
        <p className="text-center text-xs sm:text-sm text-gray-600 uppercase tracking-[0.2em] font-semibold mb-6 sm:mb-8">Trusted by innovative teams worldwide</p>
        <div className="max-w-4xl mx-auto flex flex-wrap items-center justify-center gap-6 sm:gap-10 px-6 opacity-30">
          {['TechVentures', 'NovaLabs', 'Quantum AI', 'GreenFuture', 'AstroBuild'].map(name => (
            <span key={name} className="text-base sm:text-lg font-bold tracking-wider text-white/60">{name}</span>
          ))}
        </div>
      </section>

      {/* ═══════════ STATS ═══════════ */}
      <section className="relative z-10 bg-white/[0.015]">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-14 sm:py-20 grid grid-cols-2 md:grid-cols-4 gap-6 sm:gap-8">
          {stats.map((stat, i) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1, duration: 0.5 }}
              className="text-center"
            >
              <div className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-400">
                {stat.value}
              </div>
              <div className="text-xs sm:text-sm text-gray-500 mt-1 font-medium">{stat.label}</div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ═══════════ FEATURES ═══════════ */}
      <section id="features" className="relative z-10 py-20 sm:py-28 px-4 sm:px-6">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-12 sm:mb-16"
          >
            <h2 className="text-2xl sm:text-3xl md:text-5xl font-extrabold mb-3 sm:mb-4 tracking-tight">
              Everything you need to{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-400">succeed</span>
            </h2>
            <p className="text-gray-500 text-sm sm:text-lg max-w-2xl mx-auto">
              A complete toolkit for creators and backers. From idea to funded project in record time.
            </p>
          </motion.div>

          <motion.div
            variants={staggerContainer}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6"
          >
            {features.map((feature) => (
              <motion.div
                key={feature.title}
                variants={fadeUp}
                whileHover={{ y: -6, transition: { duration: 0.2 } }}
                className="group bg-white/[0.03] hover:bg-white/[0.06] border border-white/5 hover:border-blue-500/20 rounded-2xl p-5 sm:p-6 transition-all cursor-default"
              >
                <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-xl bg-gradient-to-br from-blue-500/20 to-indigo-500/20 flex items-center justify-center mb-3 sm:mb-4 group-hover:from-blue-500/30 group-hover:to-indigo-500/30 transition-all">
                  <feature.icon className="w-5 h-5 sm:w-6 sm:h-6 text-blue-400" />
                </div>
                <h3 className="text-base sm:text-lg font-bold text-white mb-1.5 sm:mb-2">{feature.title}</h3>
                <p className="text-xs sm:text-sm text-gray-500 leading-relaxed">{feature.desc}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ═══════════ HOW IT WORKS ═══════════ */}
      <section id="how-it-works" className="relative z-10 py-20 sm:py-28 px-4 sm:px-6 bg-white/[0.01]">
        <div className="max-w-5xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12 sm:mb-16"
          >
            <h2 className="text-2xl sm:text-3xl md:text-5xl font-extrabold mb-3 sm:mb-4 tracking-tight">
              Three steps to{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-blue-400">liftoff</span>
            </h2>
            <p className="text-gray-500 text-sm sm:text-lg max-w-xl mx-auto">
              Getting funded has never been easier. Here's how FundSphere works.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8">
            {steps.map((s, i) => (
              <motion.div
                key={s.step}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.15, duration: 0.5 }}
                className="relative bg-white/[0.03] border border-white/5 rounded-2xl p-6 sm:p-8 text-center"
              >
                <div className="text-5xl sm:text-6xl font-extrabold text-blue-500/10 absolute top-4 right-4 sm:top-6 sm:right-6 select-none">{s.step}</div>
                <div className="relative z-10">
                  <div className="w-12 h-12 sm:w-14 sm:h-14 mx-auto mb-4 sm:mb-5 rounded-full bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-500/20">
                    <span className="text-white font-bold text-lg sm:text-xl">{s.step}</span>
                  </div>
                  <h3 className="text-lg sm:text-xl font-bold text-white mb-2 sm:mb-3">{s.title}</h3>
                  <p className="text-xs sm:text-sm text-gray-500 leading-relaxed">{s.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════ TESTIMONIALS ═══════════ */}
      <section id="testimonials" className="relative z-10 py-20 sm:py-28 px-4 sm:px-6">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12 sm:mb-16"
          >
            <h2 className="text-2xl sm:text-3xl md:text-5xl font-extrabold mb-3 sm:mb-4 tracking-tight">
              Loved by{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-orange-400">creators</span>
            </h2>
            <p className="text-gray-500 text-sm sm:text-lg max-w-xl mx-auto">Don't just take our word for it.</p>
          </motion.div>

          <motion.div
            variants={staggerContainer}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6"
          >
            {testimonials.map(t => (
              <motion.div
                key={t.name}
                variants={fadeUp}
                className="bg-white/[0.03] border border-white/5 rounded-2xl p-5 sm:p-6 flex flex-col"
              >
                <div className="flex gap-1 mb-3 sm:mb-4">
                  {Array.from({ length: t.stars }).map((_, i) => (
                    <Star key={i} className="w-4 h-4 text-amber-400 fill-amber-400" />
                  ))}
                </div>
                <p className="text-sm sm:text-base text-gray-300 leading-relaxed mb-4 sm:mb-6 flex-grow">"{t.quote}"</p>
                <div>
                  <p className="font-semibold text-white text-sm">{t.name}</p>
                  <p className="text-xs text-gray-500">{t.role}</p>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ═══════════ CTA ═══════════ */}
      <section className="relative z-10 py-20 sm:py-28 px-4 sm:px-6">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="max-w-4xl mx-auto text-center bg-gradient-to-br from-blue-600/10 to-indigo-600/10 border border-blue-500/10 rounded-2xl sm:rounded-3xl p-8 sm:p-12 md:p-16 relative overflow-hidden"
        >
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[300px] sm:w-[400px] h-[150px] sm:h-[200px] bg-blue-500/10 blur-[80px] rounded-full pointer-events-none" />
          <div className="relative z-10">
            <h2 className="text-2xl sm:text-3xl md:text-5xl font-extrabold mb-3 sm:mb-4 tracking-tight">Ready to launch?</h2>
            <p className="text-gray-400 text-sm sm:text-lg mb-6 sm:mb-8 max-w-xl mx-auto">
              Join thousands of creators who turned their ideas into funded realities. Your journey starts with a single click.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4">
              <button
                onClick={() => navigate('/register')}
                className="group w-full sm:w-auto px-7 sm:px-8 py-3.5 sm:py-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-semibold rounded-xl text-base sm:text-lg transition-all shadow-xl shadow-blue-600/20 hover:shadow-blue-500/40 inline-flex items-center justify-center gap-3"
              >
                Create Your First Project
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </button>
              <button
                onClick={() => navigate('/login')}
                className="w-full sm:w-auto px-7 sm:px-8 py-3.5 sm:py-4 bg-white/5 hover:bg-white/10 border border-white/10 text-gray-300 hover:text-white font-semibold rounded-xl text-base sm:text-lg transition-all inline-flex items-center justify-center gap-2"
              >
                Sign In to Dashboard
              </button>
            </div>
          </div>
        </motion.div>
      </section>

      {/* ═══════════ FOOTER ═══════════ */}
      <footer className="border-t border-white/5 py-8 sm:py-10 px-4 sm:px-6">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-2 text-gray-500 text-sm font-medium">
              <Rocket className="w-4 h-4 text-blue-500" />
              FundSphere &copy; {new Date().getFullYear()}
            </div>
            <div className="flex flex-wrap items-center justify-center gap-4 sm:gap-6 text-sm text-gray-600">
              <span className="hover:text-gray-400 cursor-pointer transition-colors">About</span>
              <span className="hover:text-gray-400 cursor-pointer transition-colors">Privacy</span>
              <span className="hover:text-gray-400 cursor-pointer transition-colors">Terms</span>
              <span className="hover:text-gray-400 cursor-pointer transition-colors">Blog</span>
              <span className="hover:text-gray-400 cursor-pointer transition-colors">Contact</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
