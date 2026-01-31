import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { User, Calendar, ExternalLink } from 'lucide-react';
import { Submission } from '@/types/submission';
import { usersData } from '@/mocks/UsersMock';
import { lessonsData } from '@/mocks/LessonsMock';

interface ReviewListItemProps {
  submission: Submission;
  onOpenReview: (submission: Submission) => void;
}

export function ReviewListItem({ submission, onOpenReview }: ReviewListItemProps) {
  const student = usersData.find(u => u.id === submission.studentId);
  const studentEmail = student?.email || '';
  const lesson = lessonsData.find(l => l.id === submission.lessonId);
  const lessonTitle = lesson?.title || 'Unknown Lesson';

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleString('ru-RU', {
      day: 'numeric',
      month: 'long',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className={`border-b border-border last:border-b-0 ${submission.status !== 'pending' ? 'bg-muted/30 opacity-70 hover:opacity-100' : ''}`}>
      <div className="p-4 hover:bg-muted/50 transition-colors">
        <div className="flex items-center justify-between gap-4 mb-3">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <User className="w-4 h-4 text-muted-foreground" />
              <span>{student?.name || 'Неизвестный студент'}</span>
              <span className="text-sm text-muted-foreground">
                ({studentEmail})
              </span>
              {submission.status === 'approved' && (
                <Badge className="bg-success text-success-foreground ml-2">Принято</Badge>
              )}
              {submission.status === 'rejected' && (
                <Badge variant="destructive" className="ml-2">На доработке</Badge>
              )}
            </div>
            <h4 className="mb-1">{lessonTitle}</h4>
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <div className="flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5" />
                {formatDate(submission.submittedDate)}
              </div>
            </div>
          </div>
          <Button
            onClick={() => onOpenReview(submission)}
            variant={submission.status === 'pending' ? 'default' : 'outline'}
            size="sm"
          >
            {submission.status === 'pending' ? 'Проверить' : 'Просмотреть'}
            <ExternalLink className="w-4 h-4 ml-2" />
          </Button>
        </div>
      </div>
    </div>
  );
}
