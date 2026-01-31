import { useMemo, useRef, useEffect } from 'react';
import { useTheme } from '@/components/contexts/ThemeProvider';
// @ts-ignore
import plantumlEncoder from 'plantuml-encoder';
import { Eye } from 'lucide-react';



interface PlantUmlPreviewProps {
  code: string;
  className?: string;
}

export const PlantUmlPreview = ({ code, className }: PlantUmlPreviewProps) => {
  const { theme } = useTheme();
  const containerRef = useRef<HTMLDivElement>(null);
  const imgRef = useRef<HTMLImageElement>(null);

  const imageUrl = useMemo(() => {
    try {
      const encoded = plantumlEncoder.encode(code);
      return `https://www.plantuml.com/plantuml/svg/${encoded}`;
    } catch {
      try {
        return `https://www.plantuml.com/plantuml/svg/${btoa(encodeURIComponent(code))}`;
      } catch {
        return '';
      }
    }
  }, [code]);

  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollTop = 0;
    }
  }, [imageUrl]);

  return (
    <div ref={containerRef} className={className || ''}>
      <div
        className={`p-4 relative min-h-[300px] max-h-[80vh] overflow-auto w-full ${theme === 'dark' ? 'bg-zinc-950' : 'bg-white'}`}
      >
        <div className="min-w-full min-h-full flex justify-center items-center">
          {imageUrl ? (
            <img
              ref={imgRef}
              src={imageUrl}
              alt="PlantUML Diagram"
              className={`block ${theme === 'dark' ? ' invert hue-rotate-180' : ''}`}
              style={{ background: 'transparent' }}
            />
          ) : (
            <div className="text-center text-muted-foreground py-8 w-full m-auto">
              <Eye className="w-8 h-8 mx-auto mb-2" />
              <p>Диаграмма появится здесь</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
