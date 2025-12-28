'use client';

import { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { Achievement, AchievementUnlock, checkAndUnlockAchievements } from '@/lib/achievements';
import { AchievementCelebrationModal } from '@/components/ui/achievement-celebration-modal';

interface AchievementsContextType {
  checkAchievements: () => Promise<void>;
  showCelebration: (achievement: Achievement) => void;
  pendingAchievements: Achievement[];
}

const AchievementsContext = createContext<AchievementsContextType | null>(null);

export function useAchievements() {
  const context = useContext(AchievementsContext);
  // Return safe defaults if not in provider (SSG/SSR)
  if (!context) {
    return {
      checkAchievements: async () => {},
      showCelebration: () => {},
      pendingAchievements: [] as Achievement[],
    };
  }
  return context;
}

interface AchievementsProviderProps {
  children: ReactNode;
}

export function AchievementsProvider({ children }: AchievementsProviderProps) {
  const [pendingAchievements, setPendingAchievements] = useState<Achievement[]>([]);
  const [currentCelebration, setCurrentCelebration] = useState<Achievement | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const showNextCelebration = useCallback(() => {
    setPendingAchievements((prev) => {
      if (prev.length === 0) {
        setIsModalOpen(false);
        setCurrentCelebration(null);
        return [];
      }
      
      const [next, ...rest] = prev;
      setCurrentCelebration(next);
      setIsModalOpen(true);
      return rest;
    });
  }, []);

  const checkAchievements = useCallback(async () => {
    try {
      const unlocked = await checkAndUnlockAchievements();
      
      if (unlocked.length > 0) {
        const newAchievements = unlocked
          .filter(u => u.isNew)
          .map(u => u.achievement);
        
        if (newAchievements.length > 0) {
          setPendingAchievements((prev) => [...prev, ...newAchievements]);
          
          // Show first one immediately if not already showing
          if (!isModalOpen && newAchievements.length > 0) {
            setCurrentCelebration(newAchievements[0]);
            setIsModalOpen(true);
            setPendingAchievements(newAchievements.slice(1));
          }
        }
      }
    } catch (error) {
      console.error('Error checking achievements:', error);
    }
  }, [isModalOpen]);

  const showCelebration = useCallback((achievement: Achievement) => {
    setCurrentCelebration(achievement);
    setIsModalOpen(true);
  }, []);

  const handleCloseModal = useCallback(() => {
    setIsModalOpen(false);
    // Show next pending achievement after a short delay
    setTimeout(() => {
      showNextCelebration();
    }, 300);
  }, [showNextCelebration]);

  return (
    <AchievementsContext.Provider
      value={{
        checkAchievements,
        showCelebration,
        pendingAchievements,
      }}
    >
      {children}
      <AchievementCelebrationModal
        achievement={currentCelebration}
        isOpen={isModalOpen}
        onClose={handleCloseModal}
      />
    </AchievementsContext.Provider>
  );
}