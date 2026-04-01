
import React, { createContext, useContext, useState, useEffect } from 'react';
import { api } from '../services/api';
import { useAuth } from './AuthContext';

interface TutorialContextType {
  run: boolean;
  steps: any[];
  setSteps: (steps: any[]) => void;
  startTutorial: (tutorialId: string, steps: any[]) => void;
  completeTutorial: (tutorialId: string) => Promise<void>;
  isCompleted: (tutorialId: string) => boolean;
  activeTutorialId: string | null;
  loading: boolean;
}

const TutorialContext = createContext<TutorialContextType | undefined>(undefined);

const LS_KEY = 'mars_completed_tutorials';

/** Read completed tutorials from localStorage as fallback */
const getLocalCompleted = (): string[] => {
  try {
    return JSON.parse(localStorage.getItem(LS_KEY) || '[]');
  } catch {
    return [];
  }
};

const saveLocalCompleted = (list: string[]) => {
  try {
    localStorage.setItem(LS_KEY, JSON.stringify(list));
  } catch {
    // ignore
  }
};

export const TutorialProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [run, setRun] = useState(false);
  const [steps, setSteps] = useState<any[]>([]);
  const [completedTutorials, setCompletedTutorials] = useState<string[]>([]);
  const [activeTutorialId, setActiveTutorialId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // Fetch completed tutorials when user changes
  useEffect(() => {
    const fetchTutorials = async () => {
      if (!user) {
        setCompletedTutorials([]);
        setLoading(false);
        return;
      }

      try {
        const data = await api.getUserTutorials();
        // Merge with local storage to avoid data loss on API failure
        const merged = [...new Set([...getLocalCompleted(), ...(data || [])])];
        setCompletedTutorials(merged);
        saveLocalCompleted(merged);
      } catch (error) {
        // API unavailable (e.g. table not yet migrated) — fall back to localStorage
        console.warn('Tutorial API unavailable, using local fallback:', error);
        setCompletedTutorials(getLocalCompleted());
      } finally {
        setLoading(false);
      }
    };

    fetchTutorials();
  }, [user?.id]); // Only re-fetch when the actual user ID changes

  const startTutorial = (tutorialId: string, tutorialSteps: any[]) => {
    setActiveTutorialId(tutorialId);
    setSteps(tutorialSteps);
    setRun(true);
  };

  const completeTutorial = async (tutorialId: string) => {
    if (!user) return;

    // Update state and localStorage immediately for instant feedback
    setCompletedTutorials(prev => {
      const next = [...new Set([...prev, tutorialId])];
      saveLocalCompleted(next);
      return next;
    });
    setRun(false);
    setActiveTutorialId(null);

    // Then persist to API (fire-and-forget, failure is acceptable)
    try {
      await api.saveUserTutorial(tutorialId);
    } catch (error) {
      console.warn('Failed to persist tutorial to API, kept in localStorage:', error);
    }
  };

  const isCompleted = (tutorialId: string) => {
    return completedTutorials.includes(tutorialId);
  };

  return (
    <TutorialContext.Provider value={{
      run,
      steps,
      setSteps,
      startTutorial,
      completeTutorial,
      isCompleted,
      activeTutorialId,
      loading
    }}>
      {children}
    </TutorialContext.Provider>
  );
};

export const useTutorial = () => {
  const context = useContext(TutorialContext);
  if (context === undefined) {
    throw new Error('useTutorial must be used within a TutorialProvider');
  }
  return context;
};
