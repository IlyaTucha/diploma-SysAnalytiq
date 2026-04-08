import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { Module } from '@/types/module';
import { Lesson } from '@/types/lesson';
import { Submission } from '@/types/submission';
import { modulesApi, submissionsApi, getAccessToken } from '@/lib/api';
import { useAuth } from '@/components/contexts/AuthContext';
import { Database, GitBranch, Workflow, Code, FileText, BookOpen } from 'lucide-react';

const ICON_MAP: Record<string, any> = {
  database: Database,
  'git-branch': GitBranch,
  workflow: Workflow,
  code: Code,
  'file-text': FileText,
};

function resolveIcon(name: string): any {
  return ICON_MAP[name] || BookOpen;
}

interface DataContextType {
  modules: Module[];
  lessons: Lesson[];
  submissions: Submission[];
  loading: boolean;
  reloadLessons: () => Promise<void>;
  reloadSubmissions: () => Promise<void>;
}

const DataContext = createContext<DataContextType>({
  modules: [],
  lessons: [],
  submissions: [],
  loading: true,
  reloadLessons: async () => {},
  reloadSubmissions: async () => {},
});

export function DataProvider({ children }: { children: ReactNode }) {
  const { isAuthenticated } = useAuth();
  const [modules, setModules] = useState<Module[]>([]);
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);

  const loadLessons = useCallback(async (mods: any[]) => {
    const allLessons: Lesson[] = [];
    for (const m of mods) {
      try {
        const moduleLessons = await modulesApi.lessons(m.slug);
        allLessons.push(...(moduleLessons as Lesson[]));
      } catch (err) {
        console.error(err);
      }
    }
    setLessons(allLessons);
  }, []);

  const loadSubmissions = useCallback(async () => {
    if (!getAccessToken()) return;
    try {
      const subs = await submissionsApi.list();
      setSubmissions(subs as Submission[]);
    } catch (err) {
      console.error(err);
    }
  }, []);

  const loadData = useCallback(async () => {
    try {
      const mods = await modulesApi.list();
      const mapped = mods.map((m: any) => ({
        ...m,
        icon: resolveIcon(m.icon),
      }));
      setModules(mapped);
      await loadLessons(mods);
      await loadSubmissions();
    } catch (err) {
      console.error('Ошибка загрузки данных:', err);
    } finally {
      setLoading(false);
    }
  }, [loadLessons, loadSubmissions]);

  useEffect(() => {
    loadData();

    const interval = setInterval(() => {
      if (getAccessToken()) {
        loadSubmissions();
      }
    }, 30000);

    const handleVisibility = () => {
      if (document.visibilityState === 'visible' && getAccessToken()) {
        modulesApi.list().then(mods => loadLessons(mods)).catch(() => {});
      }
    };
    document.addEventListener('visibilitychange', handleVisibility);

    return () => {
      clearInterval(interval);
      document.removeEventListener('visibilitychange', handleVisibility);
    };
  }, [isAuthenticated, loadData, loadSubmissions, loadLessons]);

  const reloadLessons = useCallback(async () => {
    try {
      const mods = await modulesApi.list();
      await loadLessons(mods);
    } catch (err) {
      console.error('Ошибка перезагрузки уроков:', err);
    }
  }, [loadLessons]);

  const reloadSubmissions = useCallback(async () => {
    await loadSubmissions();
  }, [loadSubmissions]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-muted-foreground">Загрузка...</p>
        </div>
      </div>
    );
  }

  return (
    <DataContext.Provider value={{ modules, lessons, submissions, loading, reloadLessons, reloadSubmissions }}>
      {children}
    </DataContext.Provider>
  );
}

export function useData() {
  return useContext(DataContext);
}
