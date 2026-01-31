import { useEffect, useRef, useImperativeHandle, forwardRef } from 'react';
import { useTheme } from '@/components/contexts/ThemeProvider';
import BpmnModeler from 'bpmn-js/lib/Modeler';
import BpmnViewer from 'bpmn-js/lib/NavigatedViewer';
// @ts-ignore
import 'bpmn-js/dist/assets/diagram-js.css';
// @ts-ignore
import 'bpmn-js/dist/assets/bpmn-font/css/bpmn.css';
import { customIdModule } from './internal/CustomIdModule';

interface BpmnEditorProps {
  code: string;
  onChange: (xml: string) => void;
  onHistoryChange?: (state: { canUndo: boolean; canRedo: boolean }) => void;
  className?: string;
  readOnly?: boolean;
}

export interface BpmnEditorRef {
  undo: () => void;
  redo: () => void;
  center: () => void;
  saveSVG: () => Promise<string>;
}

export const BpmnEditor = forwardRef<BpmnEditorRef, BpmnEditorProps>(({ code, onChange, onHistoryChange, className, readOnly }, ref) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const modelerRef = useRef<any>(null);
  const lastXmlRef = useRef<string>(code);
  const { theme } = useTheme();

  useImperativeHandle(ref, () => ({
    undo: () => {
      if (modelerRef.current) {
        modelerRef.current.get('commandStack').undo();
      }
    },
    redo: () => {
      if (modelerRef.current) {
        modelerRef.current.get('commandStack').redo();
      }
    },
    center: () => {
      if (modelerRef.current) {
        modelerRef.current.get('canvas').zoom('fit-viewport');
      }
    },
    saveSVG: async () => {
      if (modelerRef.current) {
        const { svg } = await modelerRef.current.saveSVG();
        return svg;
      }
      return '';
    }
  }));

  useEffect(() => {
    if (!containerRef.current) return;

    const BpmnConstructor = readOnly ? BpmnViewer : BpmnModeler;
    const modeler = new BpmnConstructor({
      container: containerRef.current,
      keyboard: { bindTo: document },
      additionalModules: readOnly ? [] : [
        customIdModule
      ]
    });

    modelerRef.current = modeler;

    const resizeObserver = new ResizeObserver(() => {
      try {
        (modeler.get('canvas') as any).resized();
      } catch {
        // ignore
      }
    });
    
    if (containerRef.current) {
      resizeObserver.observe(containerRef.current);
    }

    // Small delay to ensure DOM is ready
    const timer = setTimeout(() => {
      try {
        // Check if modeler is still mounted/valid
        if (modelerRef.current) {
          const xmlToImport = code || `<?xml version="1.0" encoding="UTF-8"?>
<bpmn:definitions xmlns:bpmn="http://www.omg.org/spec/BPMN/20100524/MODEL" xmlns:bpmndi="http://www.omg.org/spec/BPMN/20100524/DI" xmlns:dc="http://www.omg.org/spec/DD/20100524/DC" id="Definitions_1" targetNamespace="http://bpmn.io/schema/bpmn">
  <bpmn:process id="Process_1" isExecutable="false" />
  <bpmndi:BPMNDiagram id="BPMNDiagram_1">
    <bpmndi:BPMNPlane id="BPMNPlane_1" bpmnElement="Process_1" />
  </bpmndi:BPMNDiagram>
</bpmn:definitions>`;

          modeler.importXML(xmlToImport).then(({ warnings }: any) => {
            if (warnings?.length) console.log('Warnings', warnings);
            const canvas = modeler.get('canvas') as any;
            // Only zoom if canvas has dimensions to avoid "non-finite" error
            const container = containerRef.current;
            if (container && container.clientWidth > 0 && container.clientHeight > 0) {
               canvas.zoom('fit-viewport');
            }
            // Update parent if we used default XML
            if (!code && !readOnly) {
              onChange(xmlToImport);
            }
          }).catch((err: any) => {
            console.error('BPMN Import Error', err);
          });
        }
      } catch (err) {
        console.error('BPMN Import Error', err);
      }
    }, 100);

    modeler.on('commandStack.changed', async () => {
      if (readOnly) return;
      try {
        const { xml } = await modeler.saveXML({ format: true });
        if (xml) {
          lastXmlRef.current = xml;
          onChange(xml);
        }
        
        if (onHistoryChange) {
          const commandStack = modeler.get('commandStack') as any;
          onHistoryChange({
            canUndo: commandStack.canUndo(),
            canRedo: commandStack.canRedo()
          });
        }
      } catch (e) {
        console.error(e);
      }
    });

    return () => {
      clearTimeout(timer);
      resizeObserver.disconnect();
      modeler.destroy();
      modelerRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Watch for external code changes
  useEffect(() => {
    const modeler = modelerRef.current;
    if (modeler && code && code !== lastXmlRef.current) {
       modeler.importXML(code).catch((err: any) => console.error('BPMN Import Error', err));
       lastXmlRef.current = code;
    }
  }, [code]);

  return (
    <div className={`flex flex-col h-full w-full min-h-0 ${className || ''}`} style={{ height: '100%' }}>
      <div 
        className="flex-1 relative bg-white overflow-hidden h-full w-full" 
        ref={containerRef}
        style={{
          filter: theme === 'dark' ? 'invert(1) hue-rotate(180deg)' : 'none'
        }}
      ></div>
    </div>
  );
});
BpmnEditor.displayName = 'BpmnEditor';
