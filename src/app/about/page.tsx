'use client';

import { motion } from 'framer-motion';
import {
  Heart,
  Target,
  Users,
  Smartphone,
  Shield,
  TrendingUp,
  Pill,
  Activity,
  Sparkles,
  ArrowLeft,
  GraduationCap,
  Code,
} from 'lucide-react';
import { Card } from '@/components/ui';
import { DashboardShell } from '@/components/layout';
import { useRouter } from 'next/navigation';

const goals = [
  {
    icon: Heart,
    title: 'Health Awareness',
    description: 'Promote health awareness and self-monitoring through a user-friendly platform.',
    color: 'text-red-500',
    bg: 'bg-red-50 dark:bg-red-900/20',
  },
  {
    icon: Smartphone,
    title: 'Accessible Support',
    description: 'Provide accessible and reliable health support anytime, anywhere.',
    color: 'text-blue-500',
    bg: 'bg-blue-50 dark:bg-blue-900/20',
  },
  {
    icon: TrendingUp,
    title: 'Healthy Lifestyle',
    description: 'Encourage healthy lifestyle habits with personalized recommendations.',
    color: 'text-green-500',
    bg: 'bg-green-50 dark:bg-green-900/20',
  },
  {
    icon: Pill,
    title: 'Medication Compliance',
    description: 'Improve medication compliance through timely reminders and tracking.',
    color: 'text-purple-500',
    bg: 'bg-purple-50 dark:bg-purple-900/20',
  },
  {
    icon: Sparkles,
    title: 'AI-Powered Guidance',
    description: 'Strengthen health guidance through AI-assisted support and insights.',
    color: 'text-yellow-500',
    bg: 'bg-yellow-50 dark:bg-yellow-900/20',
  },
];

const students = [
  'Bea Lorraine P. Abenes',
  'Nick Lawrence C. Alivio',
  'Harlene F. Bohol',
  'Queeny Capistrano',
  'Ericka De Guzman',
  'Samantha Marie T. Egay',
  'Ysabelle Veesha T. Esperanza',
  'Kissy Goloran',
  'Jesaiah Grace D. Minoza',
  'Samantha Nicole E. Sarim',
];

export default function AboutPage() {
  const router = useRouter();

  return (
    <DashboardShell>
      <div className="max-w-3xl mx-auto px-4 sm:px-0 space-y-6 pb-24 lg:pb-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-4"
        >
          <button
            onClick={() => router.back()}
            className="p-2 hover:bg-gray-100 dark:hover:bg-[#1A2742] rounded-xl transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-gray-600 dark:text-slate-400" />
          </button>
          <div>
            <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900 dark:text-white">About AlagApp</h1>
            <p className="text-sm sm:text-base text-gray-500 dark:text-slate-400 mt-1">Empowering Healthier Choices</p>
          </div>
        </motion.div>

        {/* About Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card className="p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-gradient-to-br from-primary-500 to-primary-600 rounded-xl flex items-center justify-center">
                <Heart className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">What is AlagApp?</h2>
                <p className="text-sm text-gray-500 dark:text-slate-400">Your AI-powered health companion</p>
              </div>
            </div>
            <p className="text-gray-600 dark:text-slate-300 leading-relaxed">
              AlagApp is a comprehensive health monitoring platform designed to help Filipinos track, understand, and manage their health from anywhere. The app combines health tracking, medication management, nutrition logging, and AI-powered insights into one seamless experience.
            </p>
            
            <div className="mt-6 p-4 bg-primary-50 dark:bg-primary-900/20 rounded-xl border border-primary-100 dark:border-primary-800/30">
              <h3 className="font-semibold text-primary-700 dark:text-primary-300 mb-2">Our Vision</h3>
              <p className="text-sm text-primary-600 dark:text-primary-400">
                A healthier Philippines with increased access to healthcare by enabling Filipinos to use innovative technology to monitor, comprehend, and control their health at any time and from any location.
              </p>
            </div>

            <div className="mt-4 p-4 bg-gray-50 dark:bg-[#1A2742] rounded-xl border border-gray-100 dark:border-[#293548]">
              <h3 className="font-semibold text-gray-700 dark:text-slate-300 mb-2">Our Mission</h3>
              <p className="text-sm text-gray-600 dark:text-slate-400">
                To increase access to healthcare by enabling Filipinos to use innovative technology to monitor, comprehend, and control their health at any time and from any location.
              </p>
            </div>
          </Card>
        </motion.div>

        {/* Goals Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card className="p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-gradient-to-br from-yellow-500 to-orange-500 rounded-xl flex items-center justify-center">
                <Target className="w-5 h-5 text-white" />
              </div>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Our Goals</h2>
            </div>
            <div className="grid gap-4">
              {goals.map((goal, index) => (
                <motion.div
                  key={goal.title}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.3 + index * 0.1 }}
                  className={`flex items-start gap-4 p-4 rounded-xl ${goal.bg}`}
                >
                  <div className={`p-2 rounded-lg bg-white dark:bg-[#131C2E] ${goal.color}`}>
                    <goal.icon className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-medium text-gray-900 dark:text-white">{goal.title}</h3>
                    <p className="text-sm text-gray-600 dark:text-slate-400 mt-1">{goal.description}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </Card>
        </motion.div>

        {/* Original Concept Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <Card className="p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-xl flex items-center justify-center">
                <GraduationCap className="w-5 h-5 text-white" />
              </div>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Original Concept</h2>
            </div>
            
            <p className="text-gray-600 dark:text-slate-300 mb-6">
              Envisioned by nursing students from <span className="font-medium text-gray-900 dark:text-white">Father Saturnino Urios University</span>, Butuan City (November 2025) as part of NCM 210 – The NursePreneur Caravan: <em className="text-gray-500 dark:text-slate-400">"Journeying Beyond the Bedside: Transforming Nursing Expertise into Sustainable Health Innovations."</em>
            </p>

            <div className="bg-gray-50 dark:bg-[#1A2742] rounded-xl p-4 border border-gray-100 dark:border-[#293548]">
              <div className="flex flex-col space-y-2">
                {students.map((student, index) => (
                  <motion.p
                    key={student}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.5 + index * 0.05 }}
                    className="text-gray-700 dark:text-slate-300 text-sm text-center"
                  >
                    {student}
                  </motion.p>
                ))}
              </div>
            </div>
          </Card>
        </motion.div>

        {/* Creator Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
        >
          <Card className="p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-emerald-500 rounded-xl flex items-center justify-center">
                <Code className="w-5 h-5 text-white" />
              </div>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Creator</h2>
            </div>
            
            <div className="text-center">
              <div className="inline-block">
                <div className="w-16 h-16 bg-gradient-to-br from-primary-500 to-primary-600 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl font-bold text-white">JB</span>
                </div>
                <p className="text-gray-500 dark:text-slate-400 mt-1">App Developer</p>
              </div>
            </div>
          </Card>
        </motion.div>

        {/* Footer */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.7 }}
          className="text-center py-6"
        >
          <p className="text-sm text-gray-400 dark:text-slate-500">
            Made with ❤️ for a healthier Philippines
          </p>
        </motion.div>
      </div>
    </DashboardShell>
  );
}