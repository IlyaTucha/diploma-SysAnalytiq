import { ChevronDown, ChevronRight } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { getNoun } from '@/components/ui/utils';
import { ReviewListItem } from './ReviewListItem';
import { Submission } from '@/types/submission';

interface ReviewModuleCardProps {
  module: any;
  submissions: Submission[];
  isOpen: boolean;
  onToggle: () => void;
  onOpenReview: (submission: Submission) => void;
}

export function ReviewModuleCard({
  module,
  submissions,
  isOpen,
  onToggle,
  onOpenReview
}: ReviewModuleCardProps) {
  const pendingCount = submissions.filter(s => s.status === 'pending').length;

  return (
    <Card className="overflow-hidden">
      <Collapsible
        open={isOpen}
        onOpenChange={onToggle}
        disabled={submissions.length === 0}
      >
        <CollapsibleTrigger className={`w-full p-4 transition-colors ${submissions.length === 0 ? 'opacity-50 cursor-not-allowed' : 'hover:bg-muted/50'}`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {submissions.length > 0 ? (
                  isOpen ? (
                  <ChevronDown className="w-5 h-5 text-muted-foreground" />
                  ) : (
                  <ChevronRight className="w-5 h-5 text-muted-foreground" />
                  )
              ) : (
                  <div className="w-5 h-5" />
              )}
              <module.icon 
                className={`w-5 h-5 ${submissions.length === 0 ? 'text-muted-foreground' : ''}`} 
                style={submissions.length > 0 ? { color: module.color } : {}} 
              />
              <h3 className={submissions.length === 0 ? 'text-muted-foreground' : ''}>{module.title}</h3>
            </div>
            <Badge 
              variant={submissions.length === 0 ? "secondary" : "default"} 
              className={pendingCount > 0 ? "bg-warning text-warning-foreground" : "bg-muted text-muted-foreground"}
            >
              {submissions.length === 0 
                ? 'Нет работ'
                : pendingCount > 0 
                  ? `${pendingCount} ${getNoun(pendingCount, 'работа', 'работы', 'работ')} на проверку` 
                  : 'Все проверено'}
            </Badge>
          </div>
        </CollapsibleTrigger>

        <CollapsibleContent>
          <div className="border-t border-border">
            {submissions.map((submission) => (
              <ReviewListItem 
                key={submission.id}
                submission={submission}
                onOpenReview={onOpenReview}
              />
            ))}
          </div>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  );
}
