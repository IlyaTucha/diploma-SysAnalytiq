import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { X, Save } from 'lucide-react';

interface ModuleEditFormProps {
  formData: {
    title: string;
    slug: string;
    description: string;
    published: boolean;
  };
  setFormData: (data: any) => void;
  handleUpdate: () => void;
  setEditingId: (id: number | null) => void;
  resetForm: () => void;
}

export const ModuleEditForm = ({
  formData,
  setFormData,
  handleUpdate,
  setEditingId,
  resetForm
}: ModuleEditFormProps) => {
  return (
    <Card className="p-6 rounded-xl mb-6">
      <div className="flex items-center justify-between mb-6">
        <h2>Редактирование модуля</h2>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => {
            setEditingId(null);
            resetForm();
          }}
        >
          <X className="w-5 h-5" />
        </Button>
      </div>

      <div className="space-y-4">
        <div>
          <Label htmlFor="title">Название модуля</Label>
          <Input
            id="title"
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            placeholder="Например: Основы системного анализа"
            className="mt-1 bg-background text-foreground"
          />
        </div>

        <div>
          <Label htmlFor="description">Описание</Label>
          <Textarea
            id="description"
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            placeholder="Краткое описание модуля..."
            className="mt-1 bg-background text-foreground"
            rows={3}
          />
        </div>

        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            id="published"
            checked={formData.published}
            onChange={(e) => setFormData({ ...formData, published: e.target.checked })}
            className="w-4 h-4 rounded cursor-pointer"
          />
          <Label htmlFor="published" className="cursor-pointer">
            Опубликовать модуль
          </Label>
        </div>

        <div className="flex gap-3">
          <Button
            onClick={handleUpdate}
            style={{ backgroundColor: '#10B981' }}
          >
            <Save className="w-4 h-4 mr-2" />
            Сохранить
          </Button>
          <Button
            variant="outline"
            onClick={() => {
              setEditingId(null);
              resetForm();
            }}
          >
            Отмена
          </Button>
        </div>
      </div>
    </Card>
  );
};
