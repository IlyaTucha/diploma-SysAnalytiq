import { ChevronDown, ChevronRight, FileText } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { getNoun } from '@/components/ui/utils';
import { ReviewListItem } from './ReviewListItem';
import { Submission } from '@/types/submission';
import { Group } from '@/types/group';
import { MarkdownRenderer } from '@/components/ui/MarkdownRenderer';

interface Lesson {
  id: string;
  title: string;
  content?: string;
}

interface ReviewLessonCardProps {
  lesson: Lesson;
  submissions: Submission[];
  isOpen: boolean;
  onToggle: () => void;
  onOpenReview: (submission: Submission) => void;
  groups?: Group[];
}

export function ReviewLessonCard({
  lesson,
  submissions,
  isOpen,
  onToggle,
  onOpenReview,
  groups,
}: ReviewLessonCardProps) {
  const pendingCount = submissions.filter(s => s.status === 'pending').length;

  return (
    <div className="border-b border-border last:border-b-0">
      <Collapsible open={isOpen} onOpenChange={onToggle}>
        <CollapsibleTrigger className="w-full p-3 hover:bg-muted/50 transition-colors">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {isOpen ? (
                <ChevronDown className="w-4 h-4 text-muted-foreground" />
              ) : (
                <ChevronRight className="w-4 h-4 text-muted-foreground" />
              )}
              <FileText className="w-4 h-4 text-muted-foreground" />
              <span className="font-medium text-sm">{lesson.title}</span>
            </div>
            <Badge
              variant="default"
              className={pendingCount > 0 ? "bg-warning text-warning-foreground" : "bg-muted text-muted-foreground"}
            >
              {pendingCount > 0
                ? `${pendingCount} ${getNoun(pendingCount, 'работа', 'работы', 'работ')}`
                : `${submissions.length} ${getNoun(submissions.length, 'работа', 'работы', 'работ')}`}
            </Badge>
          </div>
        </CollapsibleTrigger>

        <CollapsibleContent>
          <div className="px-4 pb-3">
            {lesson.content && (
              <div className="bg-muted/30 rounded-lg p-4 mb-3 border border-border">
                <h4 className="text-sm font-medium text-muted-foreground mb-2">Условие задания</h4>
                <div className="prose prose-sm dark:prose-invert max-w-none">
                  <MarkdownRenderer content={lesson.content} />
                </div>
              </div>
            )}

            <div className="space-y-0 border rounded-lg overflow-hidden">
              {submissions.map((submission) => (
                <ReviewListItem
                  key={submission.id}
                  submission={submission}
                  onOpenReview={onOpenReview}
                  groups={groups}
                  hideLesson
                />
              ))}
            </div>
          </div>
        </CollapsibleContent>
      </Collapsible>
    </div>
  );
}
