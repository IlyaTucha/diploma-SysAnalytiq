import { useState } from 'react';
import { BookOpen } from 'lucide-react';
import { toast } from "sonner";
import { modulesData } from '@/mocks/ModulesMock';
import { lessonsData } from '@/mocks/LessonsMock';
import { useTheme } from '@/components/contexts/ThemeProvider';
import { ModuleEditForm } from '@/components/admin/modules/ModuleEditForm';
import { ModuleList } from '@/components/admin/modules/ModuleList';

export default function AdminModules() {
  const { getThemeColor } = useTheme();
  const [editingId, setEditingId] = useState<number | null>(null);
  
  const [modules, setModules] = useState(modulesData.map(m => {
    const lessonCount = lessonsData.filter(l => l.moduleId === m.id).length;
    return {
      id: m.id,
      title: m.title,
      slug: m.slug,
      description: m.description,
      lessons: lessonCount,
      published: true,
      color: m.color,
      icon: m.icon,
    };
  }));

  const [formData, setFormData] = useState({
    title: '',
    slug: '',
    description: '',
    published: false,
  });

  const handleEdit = (id: number) => {
    const module = modules.find(m => m.id === id);
    if (module) {
      setFormData({
        title: module.title,
        slug: module.slug || '',
        description: module.description,
        published: module.published,
      });
      setEditingId(id);
      setTimeout(() => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }, 100);
    }
  };

  const handleUpdate = () => {
    if (!formData.title || !formData.description) {
      toast.error('Заполните все поля');
      return;
    }

    setModules(modules.map(m => 
      m.id === editingId
        ? { ...m, title: formData.title, slug: formData.slug, description: formData.description, published: formData.published }
        : m
    ));
    setFormData({ title: '', slug: '', description: '', published: false });
    setEditingId(null);
    toast.success('Модуль обновлен!');
  };

  const resetForm = () => {
    setFormData({ title: '', slug: '', description: '', published: false });
  };

  return (
    <div className="flex-1 flex flex-col">
      <div className="bg-card border-b border-border p-6">
          <div className="max-w-7xl mx-auto">
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center gap-3">
                  <BookOpen className="w-8 h-8" style={{ color: getThemeColor('#4F46E5') }} />
                  <h1>Управление модулями</h1>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="flex-1 p-4 md:p-8">
          <div className="max-w-7xl mx-auto">
          {editingId && (
            <ModuleEditForm
              formData={formData}
              setFormData={setFormData}
              handleUpdate={handleUpdate}
              setEditingId={setEditingId}
              resetForm={resetForm}
            />
          )}

          <ModuleList
            modules={modules}
            editingId={editingId}
            handleEdit={handleEdit}
          />
        </div>
        </div>
    </div>
  );
}
