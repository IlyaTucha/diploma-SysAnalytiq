import { Submission } from '@/types/submission';
import { Group } from '@/types/group';
import { ReviewModuleCard } from './ReviewModuleCard';

interface ReviewListProps {
  sortedModules: any[];
  groupedSubmissions: Record<number, Submission[]>;
  openModules: number[];
  toggleModule: (moduleId: number) => void;
  handleOpenReview: (submission: Submission) => void;
  groups?: Group[];
}

export function ReviewList({
  sortedModules,
  groupedSubmissions,
  openModules,
  toggleModule,
  handleOpenReview,
  groups,
}: ReviewListProps) {
  return (
    <div className="space-y-4">
      {sortedModules.map((module) => {
        const moduleSubmissions = groupedSubmissions[module.id] || [];
        const moduleId = module.id;
        
        return (
          <ReviewModuleCard 
            key={moduleId}
            module={module}
            submissions={moduleSubmissions}
            isOpen={openModules.includes(moduleId)}
            onToggle={() => toggleModule(moduleId)}
            onOpenReview={handleOpenReview}
            groups={groups}
          />
        );
      })}
    </div>
  );
}
