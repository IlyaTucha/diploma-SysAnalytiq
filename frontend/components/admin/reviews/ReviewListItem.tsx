import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { User, Calendar, ExternalLink, History, CheckCircle, XCircle } from 'lucide-react';
import { Submission } from '@/types/submission';
import { Group } from '@/types/group';
import { useData } from '@/lib/data';
import { TelegramLink } from '@/components/ui/TelegramLink';
import { getNoun } from '@/components/ui/utils';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { ReviewHistoryDialog } from './ReviewHistoryDialog';

interface ReviewListItemProps {
  submission: Submission;
  onOpenReview: (submission: Submission) => void;
  groups?: Group[];
  hideLesson?: boolean;
}

export function ReviewListItem({ submission, onOpenReview, groups, hideLesson }: ReviewListItemProps) {
  const { lessons: lessonsData } = useData();
  const [showHistory, setShowHistory] = useState(false);
  const [selectedHistoryEntry, setSelectedHistoryEntry] = useState<any>(null);
  const studentName = submission.studentName || 'Неизвестный студент';
  const studentTg = submission.studentTelegramUsername || '';
  const lesson = lessonsData.find(l => l.id === submission.lessonId);
  const lessonTitle = lesson?.title || 'Unknown Lesson';
  const groupName = groups?.find(g => g.id === submission.studentGroupId)?.name;

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleString('ru-RU', {
      day: 'numeric',
      month: 'long',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const reviewHistory = (submission as any).reviewHistory || [];
  const reviewCount = reviewHistory.length;

  return (
    <>
    <div className={`border-b border-border last:border-b-0 ${submission.status !== 'pending' ? 'bg-muted/30 opacity-70 hover:opacity-100' : ''}`}>
      <div className="p-4 hover:bg-muted/50 transition-colors">
        <div className="flex items-center justify-between gap-4 mb-3">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <User className="w-4 h-4 text-muted-foreground" />
              <span>{studentName}</span>
              {studentTg && (
                <TelegramLink username={studentTg} className="text-sm" />
              )}
              {groupName && (
                <span className="text-xs bg-muted px-1.5 py-0.5 rounded">{groupName}</span>
              )}
              {submission.status === 'approved' && (
                <Badge className="bg-success text-success-foreground ml-2">Принято</Badge>
              )}
              {submission.status === 'rejected' && (
                <Badge variant="destructive" className="ml-2">На доработке</Badge>
              )}
            </div>
            {!hideLesson && <h4 className="mb-1">{lessonTitle}</h4>}
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <div className="flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5" />
                {formatDate(submission.submittedDate)}
              </div>
            </div>
          </div>
          <div className="flex flex-col items-end gap-2">
            <Button
              onClick={() => onOpenReview(submission)}
              variant={submission.status === 'pending' ? 'default' : 'outline'}
              size="sm"
            >
              {submission.status === 'pending' ? 'Проверить' : 'Просмотреть'}
              <ExternalLink className="w-4 h-4 ml-2" />
            </Button>
            {reviewCount > 0 && (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button
                      onClick={(e) => { e.stopPropagation(); setShowHistory(!showHistory); }}
                      className="text-xs text-warning font-medium hover:underline cursor-pointer flex items-center gap-1"
                    >
                      <History className="w-3 h-3" />
                      {reviewCount} {getNoun(reviewCount, 'проверка', 'проверки', 'проверок')}
                    </button>
                  </TooltipTrigger>
                  <TooltipContent>{showHistory ? 'Скрыть историю проверок' : 'Показать историю проверок'}</TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}
          </div>
        </div>

        {showHistory && reviewHistory.length > 0 && (
          <div className="mt-2 border-t pt-3 space-y-2 animate-in fade-in slide-in-from-top-2">
            <h5 className="text-xs font-medium text-muted-foreground mb-2 flex items-center gap-1">
              <History className="w-3 h-3" /> История проверок
            </h5>
            {[...reviewHistory].reverse().map((entry: any, idx: number) => {
              const attemptNum = reviewHistory.length - idx;
              return (
                <div
                  key={idx}
                  className="flex items-center gap-2 text-sm p-2 rounded-md bg-muted/50 cursor-pointer hover:bg-accent hover:text-accent-foreground transition-colors"
                  onClick={() => setSelectedHistoryEntry(entry)}
                >
                  {entry.status === 'approved' ? (
                    <CheckCircle className="w-3.5 h-3.5 text-success flex-shrink-0" />
                  ) : (
                    <XCircle className="w-3.5 h-3.5 text-destructive flex-shrink-0" />
                  )}
                  <span className="font-medium">
                    {attemptNum} попытка{idx === 0 ? ' (последняя)' : ''}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>

    <ReviewHistoryDialog
      entry={selectedHistoryEntry}
      studentName={studentName}
      lessonTitle={lessonTitle}
      moduleId={submission.moduleId}
      onClose={() => setSelectedHistoryEntry(null)}
    />
    </>
  );
}
