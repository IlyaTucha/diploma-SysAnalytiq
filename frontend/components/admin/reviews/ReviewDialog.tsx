import { Dialog, DialogContent } from "@/components/ui/dialog";
import { ReviewDialogHeader } from "./ReviewDialogHeader";
import { ReviewSolutionPanel } from "./ReviewSolutionPanel";
import { ReviewCommentsPanel } from "./ReviewCommentsPanel";
import { Submission } from "@/types/submission";
import { Comment } from "@/types/comment";
import { useData } from "@/lib/data";

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
  onAiCheck: () => void;
  aiCheckLoading?: boolean;
  highlightedCommentId?: string | null;
  setHighlightedCommentId?: (id: string | null) => void;
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
  onReject,
  onAiCheck,
  aiCheckLoading,
  highlightedCommentId,
  setHighlightedCommentId,
}: ReviewDialogProps) {
  const { lessons: lessonsData, modules: modulesData } = useData();

  if (!reviewingSubmission) return null;

  const lesson = lessonsData.find((l: any) => l.id === reviewingSubmission.lessonId);
  const module = modulesData.find((m: any) => m.id === reviewingSubmission.moduleId);

  const studentName = reviewingSubmission.studentName || 'Unknown Student';
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

          <div className="w-[600px] flex flex-col min-h-0 flex-shrink-0">
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
              onAiCheck={onAiCheck}
              aiCheckLoading={aiCheckLoading}
              highlightedCommentId={highlightedCommentId}
              setHighlightedCommentId={setHighlightedCommentId}
            />
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

