'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Trophy, 
  X, 
  Star,
  Flame,
  Heart,
  Smile,
  CheckCircle,
  Award,
  Target,
  Dumbbell,
  Utensils,
  Pill,
  Activity,
  Sparkles,
} from 'lucide-react';
import { Button } from '@/components/ui';
import { Achievement, getIconColor } from '@/lib/achievements';
import { cn } from '@/lib/utils';

interface AchievementCelebrationModalProps {
  achievement: Achievement | null;
  isOpen: boolean;
  onClose: () => void;
}

const iconMap: Record<string, React.ElementType> = {
  trophy: Trophy,
  star: Star,
  flame: Flame,
  heart: Heart,
  smile: Smile,
  'check-circle': CheckCircle,
  award: Award,
  target: Target,
  dumbbell: Dumbbell,
  utensils: Utensils,
  pill: Pill,
  activity: Activity,
  sparkles: Sparkles,
};

export function AchievementCelebrationModal({ achievement, isOpen, onClose }: AchievementCelebrationModalProps) {
  const [showConfetti, setShowConfetti] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setShowConfetti(true);
      const timer = setTimeout(() => setShowConfetti(false), 3000);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  if (!achievement) return null;

  const IconComponent = iconMap[achievement.icon] || Trophy;
  const colorClasses = getIconColor(achievement.color);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
            onClick={onClose}
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.8, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: 20 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
          >
            <div className="bg-white rounded-3xl shadow-2xl max-w-sm w-full overflow-hidden relative">
              {/* Close button */}
              <button
                onClick={onClose}
                className="absolute top-4 right-4 p-2 rounded-full hover:bg-gray-100 transition-colors z-10"
              >
                <X className="w-5 h-5 text-gray-400" />
              </button>

              {/* Confetti animation */}
              {showConfetti && (
                <div className="absolute inset-0 pointer-events-none overflow-hidden">
                  {[...Array(20)].map((_, i) => (
                    <motion.div
                      key={i}
                      initial={{ 
                        y: -20, 
                        x: Math.random() * 300,
                        rotate: 0,
                        opacity: 1,
                      }}
                      animate={{ 
                        y: 400, 
                        x: Math.random() * 300,
                        rotate: Math.random() * 360,
                        opacity: 0,
                      }}
                      transition={{ 
                        duration: 2 + Math.random(),
                        delay: Math.random() * 0.5,
                      }}
                      className={cn(
                        "absolute w-3 h-3 rounded-sm",
                        ['bg-yellow-400', 'bg-primary-400', 'bg-green-400', 'bg-blue-400', 'bg-pink-400'][i % 5]
                      )}
                    />
                  ))}
                </div>
              )}

              {/* Header background */}
              <div className="h-32 bg-gradient-to-br from-primary-400 via-primary-500 to-primary-600 relative">
                <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-10" />
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.2, type: 'spring', damping: 15 }}
                  className="absolute -bottom-10 left-1/2 -translate-x-1/2"
                >
                  <div className={cn(
                    "w-20 h-20 rounded-2xl flex items-center justify-center shadow-lg",
                    colorClasses.split(' ')[1],
                    "border-4 border-white"
                  )}>
                    <IconComponent className={cn("w-10 h-10", colorClasses.split(' ')[0])} />
                  </div>
                </motion.div>
              </div>

              {/* Content */}
              <div className="pt-14 pb-6 px-6 text-center">
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                >
                  <p className="text-sm font-medium text-primary-600 mb-1">Achievement Unlocked!</p>
                  <h2 className="text-2xl font-bold text-gray-900 mb-2">{achievement.name}</h2>
                  <p className="text-gray-500 mb-4">{achievement.description}</p>

                  {/* Points badge */}
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.4, type: 'spring' }}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-yellow-50 rounded-full mb-6"
                  >
                    <Star className="w-5 h-5 text-yellow-500 fill-yellow-500" />
                    <span className="font-bold text-yellow-600">+{achievement.points} points</span>
                  </motion.div>

                  {/* Category badge */}
                  <div className="flex justify-center mb-6">
                    <span className="px-3 py-1 bg-gray-100 rounded-full text-xs font-medium text-gray-600 capitalize">
                      {achievement.category}
                    </span>
                  </div>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.5 }}
                >
                  <Button onClick={onClose} className="w-full">
                    Awesome!
                  </Button>
                </motion.div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}