import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Play } from 'lucide-react';
import { useSqlRunner } from '@/components/editors/sql/hooks/UseSqlRunner';
import { useState } from 'react';
// import { toast } from 'sonner';
import { SqlResultsTable } from '@/components/editors/sql/ui/SqlResultsTable';

interface SqlFormFieldsProps {
  correctAnswer: string;
  onChange: (value: string) => void;
  hasError?: boolean;
}

export function SqlFormFields({ correctAnswer, onChange, hasError }: SqlFormFieldsProps) {
  const { executeQuery } = useSqlRunner();
  const [testResult, setTestResult] = useState<any[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleTestQuery = () => {
    if (!correctAnswer) return;
    
    try {
      const result = executeQuery(correctAnswer);
      if (Array.isArray(result)) {
        setTestResult(result);
        setError(null);
        // toast.success('Запрос корректен');
      } else {
        setTestResult(null);
        setError('Ошибка выполнения запроса');
        // toast.error('Ошибка выполнения');
      }
    } catch (e: any) {
      setTestResult(null);
      setError(e.message || 'Ошибка выполнения запроса');
      // toast.error('Ошибка выполнения');
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <Label htmlFor="lesson-answer" className={hasError ? "text-destructive" : ""}>
          SQL запрос <span className="text-destructive">*</span>
        </Label>
        <div className="flex gap-2 mt-1">
          <Textarea
            id="lesson-answer"
            value={correctAnswer}
            onChange={(e) => onChange(e.target.value)}
            placeholder="SELECT * FROM table..."
            className={`font-mono min-h-[100px] ${hasError ? "border-destructive" : ""}`}
          />
          <Button
            type="button"
            variant="outline"
            size="icon"
            className="mt-0 w-10 h-auto bg-primary text-primary-foreground hover:bg-primary/90"
            onClick={handleTestQuery}
            title="Проверить запрос"
          >
            <Play className="w-4 h-4" />
          </Button>
        </div>
        {error && <p className="text-sm text-destructive mt-1">{error}</p>}
      </div>

      {testResult && (
        <div className="border rounded-md p-2 bg-muted/50">
          <p className="text-xs text-muted-foreground mb-2">Результат выполнения:</p>
          <div className="max-h-[200px] overflow-auto">
            <SqlResultsTable results={testResult} />
          </div>
        </div>
      )}
    </div>
  );
}
