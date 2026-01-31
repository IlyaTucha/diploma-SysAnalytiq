import { DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";

interface ReviewDialogHeaderProps {
  studentName: string;
  lessonTitle: string;
}

export function ReviewDialogHeader({ studentName, lessonTitle }: ReviewDialogHeaderProps) {
  return (
    <DialogHeader className="p-6 pb-2 flex-shrink-0">
      <DialogTitle>Проверка работы</DialogTitle>
      <DialogDescription>
        {studentName} • {lessonTitle}
      </DialogDescription>
    </DialogHeader>
  );
}
