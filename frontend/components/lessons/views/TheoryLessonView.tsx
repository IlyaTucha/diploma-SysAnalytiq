import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { BookOpen } from 'lucide-react';
import { useTheme } from '@/components/contexts/ThemeProvider';
import { useProgress } from '@/components/contexts/ProgressContext';
import { useLessonNavigation } from '../UseLessonNavigation';
import { MarkdownRenderer } from '@/components/ui/MarkdownRenderer';
import { LessonLayout } from '@/components/layouts/LessonLayout';

interface TheoryLessonViewProps {
  lesson: any;
}

export function TheoryLessonView({ lesson }: TheoryLessonViewProps) {
  const { getThemeColor } = useTheme();
  const { isLessonCompleted, markLessonCompleted } = useProgress();
  
  const { nextLink, prevLink, nextLabel, prevLabel } = useLessonNavigation();
  
  const currentLessonId = lesson?.id || 0;
  const completed = isLessonCompleted(currentLessonId);
  const moduleId = lesson?.moduleId.toString() || '1';
  
  const content = lesson || {
    title: 'Урок не найден',
    content: 'Содержимое урока не найдено.'
  };

  return (
    <LessonLayout
      moduleId={moduleId}
      lessonTitle={content.title}
      backLink={prevLink}
      nextLink={nextLink}
      backLabel={prevLabel}
      nextLabel={nextLabel}
      isNextDisabled={!completed}
      nextTooltip="Отметьте урок как пройденный, чтобы продолжить"
    >
      <div className="mb-8">
        <Badge style={{ backgroundColor: getThemeColor('#4F46E5') }} className="text-white mb-4">
          <BookOpen className="w-3 h-3 mr-1" />
          Теория
        </Badge>
        <h1 className="mb-2">{content.title}</h1>
      </div>

      <Card className="p-8 mb-6 rounded-xl">
        <div className="prose prose-lg max-w-none">
          <MarkdownRenderer content={content.content || ''} />
        </div>
      </Card>

      <div className="flex flex-col sm:flex-row items-center justify-end gap-4">
        <div className="flex items-center gap-3">
          <Checkbox
            id="completed"
            checked={completed}
            onCheckedChange={(checked) => markLessonCompleted(currentLessonId, checked as boolean)}
          />
          <label htmlFor="completed" className="cursor-pointer">
            Отметить пройденным
          </label>
        </div>
      </div>
    </LessonLayout>
  );
}
