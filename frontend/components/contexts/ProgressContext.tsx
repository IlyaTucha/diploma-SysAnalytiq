import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { progressApi, getAccessToken } from '@/lib/api';
import { useAuth } from '@/components/contexts/AuthContext';

interface ProgressContextType {
  completedLessons: string[];
  markLessonCompleted: (lessonId: string, completed: boolean) => void;
  isLessonCompleted: (lessonId: string) => boolean;
}

const ProgressContext = createContext<ProgressContextType | undefined>(undefined);

export function ProgressProvider({ children }: { children: ReactNode }) {
  const { isAuthenticated } = useAuth();
  const [completedLessons, setCompletedLessons] = useState<string[]>(() => {
    const saved = localStorage.getItem('completedLessons');
    return saved ? JSON.parse(saved) : [];
  });

  useEffect(() => {
    if (!isAuthenticated || !getAccessToken()) return;

    progressApi.get()
      .then(data => {
        const ids = data.completedLessons.map(String);
        setCompletedLessons(ids);
        localStorage.setItem('completedLessons', JSON.stringify(ids));
      })
      .catch(() => {});
  }, [isAuthenticated]);

  useEffect(() => {
    localStorage.setItem('completedLessons', JSON.stringify(completedLessons));
  }, [completedLessons]);

  const markLessonCompleted = (lessonId: string, completed: boolean) => {
    setCompletedLessons(prev => {
      if (completed) {
        return prev.includes(lessonId) ? prev : [...prev, lessonId];
      } else {
        return prev.filter(id => id !== lessonId);
      }
    });

    if (completed) {
      progressApi.complete(lessonId).catch(() => {});
    } else {
      progressApi.uncomplete(lessonId).catch(() => {});
    }
  };

  const isLessonCompleted = (lessonId: string) => completedLessons.includes(lessonId);

  return (
    <ProgressContext.Provider value={{ completedLessons, markLessonCompleted, isLessonCompleted }}>
      {children}
    </ProgressContext.Provider>
  );
}

export function useProgress() {
  const context = useContext(ProgressContext);
  if (context === undefined) {
    throw new Error('useProgress must be used within a ProgressProvider');
  }
  return context;
}
