import { Dialog, DialogContent } from "@/components/ui/dialog";
import { ReviewDialogHeader } from "./ReviewDialogHeader";
import { ReviewSolutionPanel } from "./ReviewSolutionPanel";
import { ReviewTaskPanel } from "./ReviewTaskPanel";
import { ReviewCommentsPanel } from "./ReviewCommentsPanel";
import { Submission } from "@/types/submission";
import { Comment } from "@/types/comment";
import { usersData } from "@/mocks/UsersMock";
import { lessonsData } from "@/mocks/LessonsMock";
import { modulesData } from "@/mocks/ModulesMock";

interface ReviewDialogProps {
  reviewingSubmission: Submission | null;
  handleCloseReview: () => void;
  generalComment: string;
  setGeneralComment: (comment: string) => void;
  inlineComments: Comment[];
  setInlineComments: (comments: Comment[] | ((prev: Comment[]) => Comment[])) => void;
  activeSelection: { text: string; lineStart: number; lineEnd: number } | null;
  setActiveSelection: (selection: { text: string; lineStart: number; lineEnd: number } | null) => void;
  handleRemoveInlineComment: (id: string) => void;
  handleEditorDidMount: (editor: any, monaco: any) => void;
  theme: string;
  onApprove: () => void;
  onReject: () => void;
}

export function ReviewDialog({
  reviewingSubmission,
  handleCloseReview,
  generalComment,
  setGeneralComment,
  inlineComments,
  setInlineComments,
  activeSelection,
  setActiveSelection,
  handleRemoveInlineComment,
  handleEditorDidMount,
  theme,
  onApprove,
  onReject
}: ReviewDialogProps) {
  if (!reviewingSubmission) return null;

  const student = usersData.find(u => u.id === reviewingSubmission.studentId);
  const lesson = lessonsData.find(l => l.id === reviewingSubmission.lessonId);
  const module = modulesData.find(m => m.id === reviewingSubmission.moduleId);

  const studentName = student?.name || 'Unknown Student';
  const lessonTitle = lesson?.title || 'Unknown Lesson';
  const moduleName = module?.title || 'Unknown Module';

  return (
    <Dialog open={!!reviewingSubmission} onOpenChange={() => handleCloseReview()}>
      <DialogContent className="!max-w-[98vw] w-[98vw] h-[95vh] overflow-hidden flex flex-col p-0">
        <ReviewDialogHeader 
          studentName={studentName} 
          lessonTitle={lessonTitle} 
        />

        <div className="flex-1 flex flex-row gap-6 min-h-0 overflow-hidden p-6 pt-0">
          <div className="flex-1 min-w-0 flex flex-col">
            <ReviewSolutionPanel 
              reviewingSubmission={reviewingSubmission}
              handleEditorDidMount={handleEditorDidMount}
              theme={theme}
              moduleName={moduleName}
            />
          </div>

          <div className="w-[500px] flex flex-col min-h-0 gap-4 flex-shrink-0">
            <ReviewTaskPanel 
              lessonTitle={lessonTitle} 
              taskDescription={reviewingSubmission.taskDescription}
            />
            <ReviewCommentsPanel
              generalComment={generalComment}
              setGeneralComment={setGeneralComment}
              activeSelection={activeSelection}
              setActiveSelection={setActiveSelection}
              inlineComments={inlineComments}
              setInlineComments={setInlineComments}
              handleRemoveInlineComment={handleRemoveInlineComment}
              handleCloseReview={handleCloseReview}
              onReject={onReject}
              onApprove={onApprove}
            />
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

