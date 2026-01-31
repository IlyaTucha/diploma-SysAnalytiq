import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface ProgressContextType {
  completedLessons: string[];
  markLessonCompleted: (lessonId: string, completed: boolean) => void;
  isLessonCompleted: (lessonId: string) => boolean;
}

const ProgressContext = createContext<ProgressContextType | undefined>(undefined);

export function ProgressProvider({ children }: { children: ReactNode }) {
  const [completedLessons, setCompletedLessons] = useState<string[]>(() => {
    const saved = localStorage.getItem('completedLessons');
    return saved ? JSON.parse(saved) : [];
  });

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
