import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { getNoun } from '@/components/ui/utils';

interface ModuleHeaderProps {
  title?: string;
  description?: string;
  lessonCount: number;
}

export function ModuleHeader({ title, description, lessonCount }: ModuleHeaderProps) {
  return (
    <div className="mb-8">
      <Link to="/admin/modules">
        <Button variant="ghost" className="mb-4">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Назад к модулям
        </Button>
      </Link>
      <h1 className="mb-2">{title}</h1>
      <p className="text-muted-foreground">
        {description}
      </p>
      <div className="flex items-center gap-4 mt-2">
        <p className="text-sm text-muted-foreground">
          {lessonCount} {getNoun(lessonCount, 'урок', 'урока', 'уроков')}
        </p>
      </div>
    </div>
  );
}
