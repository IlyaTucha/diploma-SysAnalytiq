import { Panel } from 'reactflow';
import { Spline, Activity, Maximize2, Minimize2 } from 'lucide-react';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { Button } from '@/components/ui/button';
import { UndoRedoControls } from '@/components/ui/undo-redo-controls';

interface ErdToolbarProps {
    onUndo: () => void;
    onRedo: () => void;
    canUndo: boolean;
    canRedo: boolean;
    edgeType: string;
    setEdgeType: (type: string) => void;
    isFullscreen: boolean;
    onToggleFullscreen: () => void;
    readOnly?: boolean;
}

export const ErdToolbar = ({
    onUndo,
    onRedo,
    canUndo,
    canRedo,
    edgeType,
    setEdgeType,
    isFullscreen,
    onToggleFullscreen,
    readOnly = false
}: ErdToolbarProps) => {
    return (
        <>
            {!readOnly && (
                <Panel position="top-left" className="flex gap-2 items-center" style={{ zIndex: 50 }}>
                    <div className="bg-white dark:bg-zinc-950 p-1 rounded-md border shadow-sm flex gap-1">
                        <UndoRedoControls
                            onUndo={onUndo}
                            onRedo={onRedo}
                            canUndo={canUndo}
                            canRedo={canRedo}
                            variant="ghost"
                        />
                    </div>
                </Panel>
            )}
            <Panel position="top-right" className="flex gap-2 items-center" style={{ zIndex: 50 }}>
                {!readOnly && (
                    <div className="bg-white dark:bg-zinc-950 p-1 rounded-md border shadow-sm">
                        <ToggleGroup type="single" value={edgeType} onValueChange={(val) => { if (val) setEdgeType(val); }}>
                            <ToggleGroupItem value="smoothstep" size="sm" aria-label="Straight Lines" title="Прямые линии">
                                <Activity className="h-4 w-4" />
                            </ToggleGroupItem>
                            <ToggleGroupItem value="default" size="sm" aria-label="Curved Lines" title="Изогнутые линии">
                                <Spline className="h-4 w-4" />
                            </ToggleGroupItem>
                        </ToggleGroup>
                    </div>
                )}
                <div className="bg-white dark:bg-zinc-950 p-1 rounded-md border shadow-sm">
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={onToggleFullscreen}
                        title={isFullscreen ? 'Свернуть (Esc)' : 'Развернуть на весь экран'}
                        aria-label={isFullscreen ? 'Свернуть' : 'Развернуть'}
                    >
                        {isFullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
                    </Button>
                </div>
            </Panel>
        </>
    );
};
