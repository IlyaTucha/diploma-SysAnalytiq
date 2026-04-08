import { MarkdownRenderer } from "@/components/ui/MarkdownRenderer";

interface ReviewTaskPanelProps {
  lessonTitle: string;
  taskDescription: string;
}

export function ReviewTaskPanel({ lessonTitle, taskDescription }: ReviewTaskPanelProps) {
  return (
    <div className="flex-1 flex flex-col min-h-0 border rounded-lg overflow-hidden bg-background">
       <div className="p-4 border-b bg-muted/30 flex justify-between items-center flex-shrink-0">
          <h3 className="font-medium">Задание</h3>
       </div>
       <div className="flex-1 p-4 overflow-y-auto">
          <h4 className="font-semibold mb-2">{lessonTitle}</h4>
          {taskDescription ? (
            <MarkdownRenderer content={taskDescription} />
          ) : (
            <p className="text-muted-foreground italic">Описание задания отсутствует</p>
          )}
       </div>
    </div>
  );
}
