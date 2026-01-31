import { useState } from 'react';
import { toast } from "sonner";
import { Bell } from 'lucide-react';
import { useTheme } from '@/components/contexts/ThemeProvider';
import { reviewsData } from '@/mocks/ReviewsMock';
import { Submission } from '@/types/submission';
import { Comment } from '@/types/comment';
import { modulesData } from '@/mocks/ModulesMock';
import { ReviewList } from '@/components/admin/reviews/ReviewList';
import { ReviewDialog } from '@/components/admin/reviews/ReviewDialog';
import { moduleOrder } from '@/const';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { groupsData } from '@/mocks/GroupsMock';
import { usersData } from '@/mocks/UsersMock';

export default function AdminReviews() {
  const { getThemeColor, theme } = useTheme();
  const [openModules, setOpenModules] = useState<number[]>([]);
  const [reviewingSubmission, setReviewingSubmission] = useState<Submission | null>(null);
  const [generalComment, setGeneralComment] = useState('');
  const [inlineComments, setInlineComments] = useState<Comment[]>([]);
  const [activeSelection, setActiveSelection] = useState<{
    text: string;
    lineStart: number;
    lineEnd: number;
  } | null>(null);

  const [submissions, setSubmissions] = useState<Submission[]>(reviewsData);
  const [selectedGroup, setSelectedGroup] = useState<string>('all');

  const filteredSubmissions = submissions.filter(s => {
    if (selectedGroup === 'all') return true;
    const student = usersData.find(u => u.id === s.studentId);
    if (!student || !student.groupId) return false;
    const group = groupsData.find(g => g.id === student.groupId);
    return group?.name === selectedGroup;
  });

  const groupedSubmissions = filteredSubmissions.reduce((acc, submission) => {
    if (!acc[submission.moduleId]) {
      acc[submission.moduleId] = [];
    }
    acc[submission.moduleId].push(submission);
    return acc;
  }, {} as Record<number, Submission[]>);
  
  Object.keys(groupedSubmissions).forEach(moduleId => {
    groupedSubmissions[Number(moduleId)].sort((a, b) => {
        if (a.status === 'pending' && b.status !== 'pending') return -1;
        if (a.status !== 'pending' && b.status === 'pending') return 1;
        return new Date(b.submittedDate).getTime() - new Date(a.submittedDate).getTime();
    });
  });

  // сортировка модулей в определенном порядке
  const sortedModules = [...modulesData].sort((a, b) => {
      const indexA = moduleOrder.indexOf(a.slug);
      const indexB = moduleOrder.indexOf(b.slug);
      return (indexA === -1 ? 999 : indexA) - (indexB === -1 ? 999 : indexB);
  });

  const toggleModule = (moduleId: number) => {
    setOpenModules((prev) =>
      prev.includes(moduleId)
        ? prev.filter((id) => id !== moduleId)
        : [...prev, moduleId]
    );
  };

  const handleOpenReview = (submission: Submission) => {
    setReviewingSubmission(submission);
    setGeneralComment(submission.comments || '');
    setInlineComments(submission.inlineComments || []);
  };

  const handleCloseReview = () => {
    setReviewingSubmission(null);
    setGeneralComment('');
    setInlineComments([]);
    setActiveSelection(null);
  };

  const handleRemoveInlineComment = (commentId: string) => {
    setInlineComments(inlineComments.filter(c => c.id !== commentId));
    toast.success('Комментарий удален');
  };

  const handleEditorDidMount = (editor: any, _monaco: any) => {
    editor.onDidChangeCursorSelection((_e: any) => {
        const selection = editor.getSelection();
        if (selection && !selection.isEmpty()) {
            const model = editor.getModel();
            const text = model.getValueInRange(selection);
            setActiveSelection({
                text,
                lineStart: selection.startLineNumber,
                lineEnd: selection.endLineNumber
            });
        } else {
            setActiveSelection(null);
        }
    });

    editor.addAction({
      id: 'add-comment',
      label: 'Добавить комментарий',
      contextMenuGroupId: 'navigation',
      run: (ed: any) => {
        const selection = ed.getSelection();
        if (selection && !selection.isEmpty()) {
          const model = ed.getModel();
          const text = model.getValueInRange(selection);
          const newComment: Comment = {
            id: Date.now().toString(),
            lineStart: selection.startLineNumber,
            lineEnd: selection.endLineNumber,
            text: '', 
            highlightedText: text
          };
          setInlineComments(prev => [...prev, newComment]);
          setActiveSelection(null);
          toast.success('Комментарий добавлен.');
        }
      }
    });
  };

  const handleApprove = () => {
    if (reviewingSubmission) {
      setSubmissions(prev => prev.map(s => 
        s.id === reviewingSubmission.id 
          ? { ...s, status: 'approved', comments: generalComment, inlineComments: inlineComments }
          : s
      ));
    }
    
    toast.success('Работа принята!');
    handleCloseReview();
  };

  const handleReject = () => {
    if (!generalComment.trim() && inlineComments.length === 0) {
      toast.error('Пожалуйста, укажите, что нужно исправить');
      return;
    }
    
    if (reviewingSubmission) {
      setSubmissions(prev => prev.map(s => 
        s.id === reviewingSubmission.id 
          ? { ...s, status: 'rejected', comments: generalComment, inlineComments: inlineComments }
          : s
      ));
    }

    toast.success('Работа отправлена на доработку');
    handleCloseReview();
  };

  return (
    <div className="flex-1 flex flex-col">
      <div className="bg-card border-b border-border p-6">
          <div className="max-w-7xl mx-auto">
            <div className="flex items-center gap-3">
              <Bell className="w-8 h-8" style={{ color: getThemeColor('#4F46E5') }} />
              <h1>Проверка заданий</h1>
            </div>
          </div>
        </div>

        <div className="flex-1 p-4 md:p-8">
          <div className="max-w-7xl mx-auto space-y-6">
            <div className="w-[200px]">
              <Select
                value={selectedGroup}
                onValueChange={setSelectedGroup}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Выберите группу" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Все группы</SelectItem>
                  {groupsData.map((group) => (
                    <SelectItem key={group.id} value={group.name}>
                      {group.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <ReviewList 
                sortedModules={sortedModules}
                groupedSubmissions={groupedSubmissions}
                openModules={openModules}
                toggleModule={toggleModule}
                handleOpenReview={handleOpenReview}
              />
          </div>
        </div>

        <ReviewDialog 
          reviewingSubmission={reviewingSubmission}
          handleCloseReview={handleCloseReview}
          generalComment={generalComment}
          setGeneralComment={setGeneralComment}
          inlineComments={inlineComments}
          setInlineComments={setInlineComments}
          activeSelection={activeSelection}
          setActiveSelection={setActiveSelection}
          handleRemoveInlineComment={handleRemoveInlineComment}
          handleEditorDidMount={handleEditorDidMount}
          theme={theme}
          onApprove={handleApprove}
          onReject={handleReject}
        />
    </div>
  );
}