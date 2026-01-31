import { useCallback } from 'react';
import { useReactFlow, getNodesBounds } from 'reactflow';
import { toast } from "sonner";

export const useErdExport = (wrapperRef: React.RefObject<HTMLDivElement>) => {
    const { getNodes } = useReactFlow();

    const handleExportImage = useCallback(async () => {
        const nodes = getNodes();
        if (nodes.length === 0) return;
        
        const nodesBounds = getNodesBounds(nodes);
        if (!wrapperRef.current) return;

        const margin = 150;
        const width = nodesBounds.width + margin * 2;
        const height = nodesBounds.height + margin * 2;
        
        const { toPng } = await import('html-to-image');
        
        try {
            const clone = wrapperRef.current.cloneNode(true) as HTMLElement;
            
            clone.style.position = 'fixed';
            clone.style.left = '0';
            clone.style.top = '0';
            clone.style.zIndex = '-9999';
            clone.style.width = `${width}px`;
            clone.style.height = `${height}px`;
            clone.style.overflow = 'hidden';
            clone.style.margin = '0';
            clone.style.padding = '0';
            
            clone.classList.remove('dark');
            clone.classList.add('light');
            clone.style.backgroundColor = '#ffffff';
            clone.style.color = '#000000';
            
            clone.style.setProperty('--background', '#ffffff');
            clone.style.setProperty('--foreground', '#000000');
            clone.style.setProperty('--card', '#ffffff');
            clone.style.setProperty('--card-foreground', '#000000');
            clone.style.setProperty('--popover', '#ffffff');
            clone.style.setProperty('--popover-foreground', '#000000');
            clone.style.setProperty('--primary', '#4F46E5');
            clone.style.setProperty('--primary-foreground', '#ffffff');
            clone.style.setProperty('--secondary', '#f1f5f9');
            clone.style.setProperty('--secondary-foreground', '#0f172a');
            clone.style.setProperty('--muted', '#ececf0');
            clone.style.setProperty('--muted-foreground', '#717182');
            clone.style.setProperty('--accent', '#e9ebef');
            clone.style.setProperty('--accent-foreground', '#030213');
            clone.style.setProperty('--destructive', '#d4183d');
            clone.style.setProperty('--destructive-foreground', '#ffffff');
            clone.style.setProperty('--border', 'rgba(0, 0, 0, 0.1)');
            clone.style.setProperty('--input', 'transparent');
            clone.style.setProperty('--ring', '#0f172a');
            
            document.body.appendChild(clone);

            const viewport = clone.querySelector('.react-flow__viewport') as HTMLElement;
            if (viewport) {
                viewport.style.transform = `translate(${-nodesBounds.x + margin}px, ${-nodesBounds.y + margin}px) scale(1)`;
                viewport.style.width = '100%';
                viewport.style.height = '100%';
            }

            const controlsToRemove = clone.querySelectorAll('.react-flow__controls, .react-flow__minimap, .react-flow__panel');
            controlsToRemove.forEach(el => el.remove());

            await new Promise(resolve => setTimeout(resolve, 100));

            const dataUrl = await toPng(clone, {
                backgroundColor: '#ffffff',
                width: width,
                height: height,
                fontEmbedCSS: '',
            });
            
            const a = document.createElement('a');
            a.href = dataUrl;
            a.download = 'ERDiagram.png';
            a.click();
            
            document.body.removeChild(clone);
        } catch (e) {
            console.error("Export failed", e);
            toast.error("Ошибка экспорта");
        }
    }, [getNodes, wrapperRef]);

    return { handleExportImage };
};
