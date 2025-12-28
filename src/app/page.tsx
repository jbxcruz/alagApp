'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { Heart, Activity, Pill, UtensilsCrossed, Bot, Shield, Sparkles, ArrowRight, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui';

const features = [
  { icon: Activity, title: 'Health Tracking', description: 'Monitor vitals, sleep, weight with beautiful visualizations.', color: 'text-purple-500', bg: 'bg-purple-100 dark:bg-purple-900/30' },
  { icon: Pill, title: 'Medication Management', description: 'Never miss a dose with smart reminders and tracking.', color: 'text-primary-500', bg: 'bg-primary-100 dark:bg-primary-900/30' },
  { icon: UtensilsCrossed, title: 'Nutrition Logging', description: 'Track meals and get AI-powered insights.', color: 'text-orange-500', bg: 'bg-orange-100 dark:bg-orange-900/30' },
  { icon: Bot, title: 'AI Health Assistant', description: 'Get personalized tips powered by Google Gemini.', color: 'text-blue-500', bg: 'bg-blue-100 dark:bg-blue-900/30' },
];

const benefits = ['AI-generated personalized health tips', 'Secure and private data storage', 'Beautiful charts and progress tracking', 'Works on any device', 'Daily wellness check-ins', 'Emergency health card'];

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#0B1120]">
      {/* Navbar */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 dark:bg-[#0B1120]/80 backdrop-blur-lg border-b border-slate-200/50 dark:border-[#293548]/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-2">
              <div className="h-9 w-9 rounded-xl overflow-hidden">
                <img src="/logo.svg" alt="AlagApp" className="h-full w-full object-cover" />
              </div>
              <span className="text-xl font-bold text-slate-900 dark:text-white">AlagApp</span>
            </div>
            <div className="flex items-center gap-4">
              <Link href="/login"><Button variant="ghost">Sign In</Button></Link>
              <Link href="/register"><Button>Get Started</Button></Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative pt-32 pb-20 overflow-hidden">
        <div className="absolute top-20 right-0 w-96 h-96 bg-primary-200/30 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-80 h-80 bg-blue-200/30 rounded-full blur-3xl" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
            <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary-100 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400 text-sm font-medium mb-6">
              <Sparkles className="h-4 w-4" /> Powered by Google Gemini AI
            </span>
          </motion.div>
          <motion.h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-slate-900 dark:text-white leading-tight" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
            Your AI-Powered<br /><span className="text-gradient">Personal Health Companion</span>
          </motion.h1>
          <motion.p className="mt-6 text-lg sm:text-xl text-slate-600 dark:text-slate-400 max-w-2xl mx-auto" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
            Track your health, manage medications, log nutrition, and get personalized AI insights — all in one beautiful, secure app.
          </motion.p>
          <motion.div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
            <Link href="/register"><Button size="xl" rightIcon={<ArrowRight className="h-5 w-5" />}>Start Free Today</Button></Link>
            <Link href="/login"><Button size="xl" variant="outline">Sign In</Button></Link>
          </motion.div>
          <motion.div className="mt-12 flex items-center justify-center gap-8 text-sm text-slate-500" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }}>
            <div className="flex items-center gap-2"><Shield className="h-5 w-5 text-primary-500" /> Secure & Private</div>
          </motion.div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20 bg-white dark:bg-[#131C2E]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 dark:text-white">Everything You Need</h2>
            <p className="mt-4 text-lg text-slate-600 dark:text-slate-400">Comprehensive health tracking with intelligent insights.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feature, i) => (
              <motion.div key={feature.title} className="p-6 rounded-2xl bg-slate-50 dark:bg-[#1A2742] border border-slate-200 dark:border-[#293548] card-hover" initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }}>
                <div className={`inline-flex p-3 rounded-xl ${feature.bg} mb-4`}><feature.icon className={`h-6 w-6 ${feature.color}`} /></div>
                <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">{feature.title}</h3>
                <p className="text-slate-600 dark:text-slate-400">{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 dark:text-white mb-6">Smart Health Tracking,<br /><span className="text-gradient">Made Simple</span></h2>
              <p className="text-lg text-slate-600 dark:text-slate-400 mb-8">AlagApp combines AI with intuitive design to help you understand and improve your health every day.</p>
              <ul className="space-y-4">
                {benefits.map((benefit, i) => (
                  <motion.li key={benefit} className="flex items-center gap-3" initial={{ opacity: 0, x: -20 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }}>
                    <CheckCircle2 className="h-5 w-5 text-primary-500 flex-shrink-0" />
                    <span className="text-slate-700 dark:text-slate-300">{benefit}</span>
                  </motion.li>
                ))}
              </ul>
              <div className="mt-8"><Link href="/register"><Button size="lg" rightIcon={<ArrowRight className="h-5 w-5" />}>Get Started Free</Button></Link></div>
            </div>
            <div className="relative">
              <div className="aspect-square rounded-3xl bg-gradient-to-br from-primary-100 to-primary-200 dark:from-primary-900/30 dark:to-primary-800/30 p-8 flex items-center justify-center">
                <div className="grid grid-cols-2 gap-4 w-full max-w-sm">
                  {[
                    { icon: Heart, label: 'Heart Rate', value: '72 bpm', color: 'bg-rose-500' },
                    { icon: Activity, label: 'Blood Pressure', value: '120/80', color: 'bg-purple-500' },
                  ].map((stat, i) => (
                    <motion.div key={stat.label} className="bg-white dark:bg-[#131C2E] rounded-2xl p-4 shadow-soft" initial={{ opacity: 0, scale: 0.9 }} whileInView={{ opacity: 1, scale: 1 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }}>
                      <div className={`w-8 h-8 rounded-lg ${stat.color} flex items-center justify-center mb-2`}><stat.icon className="h-4 w-4 text-white" /></div>
                      <p className="text-xs text-slate-500 dark:text-slate-400">{stat.label}</p>
                      <p className="text-lg font-semibold text-slate-900 dark:text-white">{stat.value}</p>
                    </motion.div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 bg-gradient-to-br from-primary-500 to-primary-600">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-3xl sm:text-4xl font-bold text-white mb-6">Ready to Take Control of Your Health?</h2>
          <p className="text-lg text-white/80 mb-8">Join AlagApp today and start your journey to better health with AI-powered insights.</p>
          <Link href="/register"><Button size="xl" variant="secondary" className="bg-white text-primary-600 hover:bg-slate-100" rightIcon={<ArrowRight className="h-5 w-5" />}>Create Free Account</Button></Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 bg-slate-900">
        <div className="max-w-7xl mx-auto px-4 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg overflow-hidden"><img src="/logo.svg" alt="AlagApp" className="h-full w-full object-cover" /></div>
            <span className="text-lg font-semibold text-white">AlagApp</span>
          </div>
          <p className="text-slate-400 text-sm">© {new Date().getFullYear()} AlagApp. Your health companion.</p>
        </div>
      </footer>
    </div>
  );
}