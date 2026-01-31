import { toast } from "sonner";

export const useSwaggerExport = () => {
  const handleExport = (code: string) => {
    const blob = new Blob([code], { type: 'text/yaml' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'openapi.yaml';
    a.click();
    toast.success('Файл скачан');
  };

  return { handleExport };
};
