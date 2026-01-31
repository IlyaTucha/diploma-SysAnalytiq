import { toast } from "sonner";

export const downloadBpmn = (bpmnCode: string) => {
  const blob = new Blob([bpmnCode], { type: 'text/xml' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'BPMNDiagram.bpmn';
  a.click();
  toast.success('Файл скачан');
};

export const downloadBpmnSvg = async (editorRef: any) => {
  if (editorRef) {
    try {
      const svg = await editorRef.saveSVG();
      const blob = new Blob([svg], { type: 'image/svg+xml' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'BPMNDiagram.svg';
      a.click();
      toast.success('SVG экспортирован');
    } catch (e) {
      console.error(e);
      toast.error('Ошибка экспорта SVG');
    }
  }
};
