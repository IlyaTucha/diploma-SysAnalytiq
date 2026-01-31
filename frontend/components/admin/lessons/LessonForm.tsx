import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Save, X } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { lessonTypes } from '@/const';
import { SqlFormFields } from './form-fields/sql/SqlFormFields';
import { ErdFormFields } from './form-fields/erd/ErdFormFields';
import { BpmnFormFields } from './form-fields/bpmn/BpmnFormFields';
import { PlantUMLFormFields } from './form-fields/plantuml/PlantUMLFormFields';
import { SwaggerFormFields } from './form-fields/swagger/SwaggerFormFields';

interface LessonFormData {
  title: string;
  type: string;
  content: string;
  correctAnswer: string;
  hint: string;
  published: boolean;
}

interface LessonFormProps {
  formData: LessonFormData;
  setFormData: (data: LessonFormData) => void;
  onSubmit: () => void;
  onCancel: () => void;
  title?: string;
  moduleType?: string;
  errors?: Record<string, boolean>;
}

export function LessonForm({ formData, setFormData, onSubmit, onCancel, title, moduleType, errors = {} }: LessonFormProps) {
  return (
    <Card className="p-6 rounded-xl mb-6">
      <div className="flex items-center justify-between mb-6">
        <h2>{title}</h2>
        <Button variant="ghost" size="icon" onClick={onCancel}>
          <X className="w-5 h-5" />
        </Button>
      </div>

      <div className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="lesson-title" className={errors.title ? "text-destructive" : ""}>
              Название урока <span className="text-destructive">*</span>
            </Label>
            <Input
              id="lesson-title"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="Введите название урока"
              className={`mt-1 bg-background text-foreground ${errors.title ? 'border-destructive' : ''}`}
            />
          </div>

          <div>
            <Label htmlFor="lesson-type" className={errors.type ? "text-destructive" : ""}>
              Тип урока <span className="text-destructive">*</span>
            </Label>
            <Select
              value={formData.type}
              onValueChange={(value) => setFormData({ ...formData, type: value })}
            >
              <SelectTrigger className={`mt-1 bg-background text-foreground ${errors.type ? 'border-destructive' : ''}`}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {lessonTypes.map((type) => (
                  <SelectItem key={type.value} value={type.value}>
                    <div className="flex items-center gap-2">
                      {type.icon}
                      {type.label}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div>
          <Label htmlFor="lesson-content" className={errors.content ? "text-destructive" : ""}>
            Содержание урока <span className="text-destructive">*</span>
          </Label>
          <Textarea
            id="lesson-content"
            value={formData.content}
            onChange={(e) => setFormData({ ...formData, content: e.target.value })}
            placeholder={
              formData.type === 'theory'
                ? 'Текст урока в формате Markdown...'
                : 'Описание задания в формате Markdown...'
            }
            className={`mt-1 font-mono bg-background text-foreground ${errors.content ? 'border-destructive' : ''}`}
            rows={6}
          />
        </div>

        {formData.type === 'practice' && (
          <>
            {moduleType === 'sql' ? (
              <SqlFormFields 
                correctAnswer={formData.correctAnswer}
                onChange={(value) => setFormData({ ...formData, correctAnswer: value })}
                hasError={errors.correctAnswer}
              />
            ) : moduleType === 'erd' ? (
              <ErdFormFields
                correctAnswer={formData.correctAnswer}
                onChange={(value) => setFormData({ ...formData, correctAnswer: value })}
                hasError={errors.correctAnswer}
              />
            ) : moduleType === 'bpmn' ? (
              <BpmnFormFields
                correctAnswer={formData.correctAnswer}
                onChange={(value) => setFormData({ ...formData, correctAnswer: value })}
                hasError={errors.correctAnswer}
              />
            ) : moduleType === 'plantuml' ? (
              <PlantUMLFormFields
                correctAnswer={formData.correctAnswer}
                onChange={(value) => setFormData({ ...formData, correctAnswer: value })}
                hasError={errors.correctAnswer}
              />
            ) : moduleType === 'swagger' ? (
              <SwaggerFormFields
                correctAnswer={formData.correctAnswer}
                onChange={(value) => setFormData({ ...formData, correctAnswer: value })}
                hasError={errors.correctAnswer}
              />
            ) : null}

            <div>
              <Label htmlFor="lesson-hint">Подсказка</Label>
              <Textarea
                id="lesson-hint"
                value={formData.hint}
                onChange={(e) => setFormData({ ...formData, hint: e.target.value })}
                placeholder="Подсказка для студента..."
                className="mt-1 bg-background text-foreground"
                rows={3}
              />
            </div>
          </>
        )}

        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            id="lesson-published"
            checked={formData.published}
            onChange={(e) => setFormData({ ...formData, published: e.target.checked })}
            className="w-4 h-4 rounded"
          />
          <Label htmlFor="lesson-published" className="cursor-pointer">
            Опубликовать урок
          </Label>
        </div>

        <div className="flex gap-3">
          <Button onClick={onSubmit} style={{ backgroundColor: '#10B981' }}>
            <Save className="w-4 h-4 mr-2" />
            Сохранить
          </Button>
          <Button variant="outline" onClick={onCancel}>
            Отмена
          </Button>
        </div>
      </div>
    </Card>
  );
}




