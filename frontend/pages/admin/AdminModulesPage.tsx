import { useState } from 'react';
import { Shield } from 'lucide-react';
import { toast } from "sonner";
import { useData } from '@/lib/data';
import { modulesApi } from '@/lib/api';
import { useTheme } from '@/components/contexts/ThemeProvider';
import { moduleSlugOrder } from '@/const';
import { ModuleEditForm } from '@/components/admin/modules/ModuleEditForm';
import { ModuleList } from '@/components/admin/modules/ModuleList';

export default function AdminModules() {
  const { getThemeColor } = useTheme();
  const { modules: modulesData, lessons: lessonsData } = useData();
  const [editingId, setEditingId] = useState<number | null>(null);
  
  const [modules, setModules] = useState(() => {
    const mapped = modulesData.map(m => {
      const lessonCount = lessonsData.filter(l => l.moduleId === m.id).length;
      return {
        id: m.id,
        title: m.title,
        slug: m.slug,
        description: m.description,
        lessons: lessonCount,
        published: m.published ?? true,
        color: m.color,
        icon: m.icon,
      };
    });
    return [...mapped].sort((a, b) => {
      const idxA = moduleSlugOrder.indexOf(a.slug);
      const idxB = moduleSlugOrder.indexOf(b.slug);
      return (idxA === -1 ? 999 : idxA) - (idxB === -1 ? 999 : idxB);
    });
  });

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

  const handleUpdate = async () => {
    if (!formData.title || !formData.description) {
      toast.error('Заполните все поля');
      return;
    }

    const module = modules.find(m => m.id === editingId);
    if (!module) return;

    try {
      await modulesApi.update(module.slug, {
        title: formData.title,
        description: formData.description,
        published: formData.published,
      });
      setModules(modules.map(m => 
        m.id === editingId
          ? { ...m, title: formData.title, slug: formData.slug, description: formData.description, published: formData.published }
          : m
      ));
      setFormData({ title: '', slug: '', description: '', published: false });
      setEditingId(null);
      toast.success('Модуль обновлен!');
    } catch {
      toast.error('Ошибка при обновлении модуля');
    }
  };

  const resetForm = () => {
    setFormData({ title: '', slug: '', description: '', published: false });
  };

  return (
    <div className="flex-1 flex flex-col">
      <div className="bg-card border-b border-border p-6">
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center gap-3">
                  <Shield className="w-8 h-8" style={{ color: getThemeColor('#4F46E5') }} />
                  <h1>Управление модулями</h1>
                </div>
              </div>
            </div>
        </div>

        <div className="flex-1 p-4 md:p-8">
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
  );
}
