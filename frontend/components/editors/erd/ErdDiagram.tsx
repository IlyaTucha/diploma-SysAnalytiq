import React, { useCallback, useEffect, useMemo, useState, useRef, forwardRef, useImperativeHandle } from 'react';
import ReactFlow, {
    Background,
    Controls,
    MiniMap,
    useNodesState,
    useEdgesState,
    Node,
    Edge,
    reconnectEdge,
    Connection,
    useReactFlow,
    ReactFlowProvider,
    addEdge,
    type EdgeChange,
    type NodeChange
} from 'reactflow';
// @ts-ignore
import 'reactflow/dist/style.css';

import { CustomBezierEdge, CustomStepEdge } from './ui/CustomEdges';
import { TableNode } from './ui/TableNode';
import { CustomMarkers } from './ui/CustomMarkers';
import { parseDbmlToFlow, getLayoutedElements } from './internal/ErdGraphUtils';
import { useErdExport } from './internal/ErdExport';
import { ErdToolbar } from './ui/ErdToolbar';

export interface ErdVisualEditorRef {
    handleExportImage: () => Promise<void>;
}

const ErdVisualEditorContent = forwardRef<ErdVisualEditorRef, { code: string }>(({ code }, ref) => {
  const nodeTypes = useMemo(() => ({ table: TableNode }), []);
  const edgeTypes = useMemo(() => ({ 
      'custom-bezier': CustomBezierEdge,
      'custom-step': CustomStepEdge
  }), []);

  const { getNodes, getEdges } = useReactFlow();
  const wrapperRef = useRef<HTMLDivElement>(null);
  const { handleExportImage } = useErdExport(wrapperRef);

  useImperativeHandle(ref, () => ({
    handleExportImage
  }));

  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [edgeType, setEdgeType] = useState('smoothstep');
  const validConnectionsRef = useRef(new Set<string>());

  const [history, setHistory] = useState<{nodes: Node[], edges: Edge[]}[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);

  const addToHistory = useCallback((newNodes: Node[], newEdges: Edge[]) => {
      setHistoryIndex(currentIndex => {
          const nextIndex = currentIndex + 1;
          setHistory(currentHistory => {
              const historySlice = currentHistory.slice(0, nextIndex);
              return [...historySlice, { nodes: JSON.parse(JSON.stringify(newNodes)), edges: JSON.parse(JSON.stringify(newEdges)) }];
          });
          return nextIndex;
      });
  }, []);

  const handleUndo = useCallback(() => {
      if (historyIndex > 0) {
          const prevState = history[historyIndex - 1];
          setNodes(prevState.nodes);
          const currentType = edgeType === 'default' ? 'custom-bezier' : 'custom-step';
          setEdges(prevState.edges.map(e => ({ ...e, type: currentType })));
          setHistoryIndex(historyIndex - 1);
      }
  }, [history, historyIndex, setNodes, setEdges, edgeType]);

  const handleRedo = useCallback(() => {
      if (historyIndex < history.length - 1) {
          const nextState = history[historyIndex + 1];
          setNodes(nextState.nodes);
          const currentType = edgeType === 'default' ? 'custom-bezier' : 'custom-step';
          setEdges(nextState.edges.map(e => ({ ...e, type: currentType })));
          setHistoryIndex(historyIndex + 1);
      }
  }, [history, historyIndex, setNodes, setEdges, edgeType]);

  useEffect(() => {
    const { nodes: initialNodes, edges: initialEdges, validConnections } = parseDbmlToFlow(code, edgeType === 'default' ? 'custom-bezier' : 'custom-step');
    
    const currentEdges = getEdges();
    const mergedEdges = initialEdges.map(newEdge => {
        const existingEdge = currentEdges.find(e => e.id === newEdge.id);
        if (existingEdge && existingEdge.data) {
            return { 
                ...newEdge, 
                data: { 
                    ...newEdge.data, 
                    curvature: existingEdge.data.curvature,
                    offset: existingEdge.data.offset
                } 
            };
        }
        return newEdge;
    });

    const { nodes: layoutedNodes, edges: layoutedEdges } = getLayoutedElements(initialNodes, mergedEdges);
    setNodes(layoutedNodes);
    setEdges(layoutedEdges);
    
    setHistory([{ nodes: JSON.parse(JSON.stringify(layoutedNodes)), edges: JSON.parse(JSON.stringify(layoutedEdges)) }]);
    setHistoryIndex(0);

    validConnectionsRef.current = validConnections;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [code]);

  useEffect(() => {
    setEdges((eds) => eds.map((e) => ({ ...e, type: edgeType === 'default' ? 'custom-bezier' : 'custom-step' })));
  }, [edgeType, setEdges]);

  useEffect(() => {
      setEdges((eds) => [...eds]);
  }, [setEdges]);

  useEffect(() => {
      const handleEdgeChange = () => {
          setTimeout(() => {
              addToHistory(getNodes(), getEdges());
          }, 10);
      };
      window.addEventListener('erd-edge-change', handleEdgeChange);
      return () => window.removeEventListener('erd-edge-change', handleEdgeChange);
  }, [addToHistory, getNodes, getEdges]);

  const isValidConnection = useCallback((connection: Connection) => {
      const sourceCol = connection.sourceHandle?.replace(/-(left|right)-(source|target)$/, '');
      const targetCol = connection.targetHandle?.replace(/-(left|right)-(source|target)$/, '');
      
      if (!sourceCol || !targetCol) return false;
      
      const key = `${connection.source}:${sourceCol}-${connection.target}:${targetCol}`;
      return validConnectionsRef.current.has(key);
  }, []);

  const onConnect = useCallback(
    (params: Connection) => {
      const currentEdges = getEdges();
      const newEdges = addEdge(params, currentEdges);
      setEdges(newEdges);
      setTimeout(() => {
          addToHistory(getNodes(), newEdges);
      }, 0);
    },
    [getEdges, getNodes, setEdges, addToHistory]
  );

  const onNodesChangeWrapped = useCallback(
    (changes: NodeChange[]) => {
      onNodesChange(changes);
      if (changes.some((c) => c.type === 'remove')) {
        setTimeout(() => {
            addToHistory(getNodes(), getEdges());
        }, 0);
      }
    },
    [onNodesChange, getNodes, getEdges, addToHistory]
  );

  const onEdgesChangeWrapped = useCallback(
    (changes: EdgeChange[]) => {
      onEdgesChange(changes);
      if (changes.some((c) => c.type === 'remove')) {
        setTimeout(() => {
            addToHistory(getNodes(), getEdges());
        }, 0);
      }
    },
    [onEdgesChange, getEdges, getNodes, addToHistory]
  );

  const onEdgeUpdate = useCallback(
    (oldEdge: Edge, newConnection: Connection) => {
      const currentEdges = getEdges();
      const newEdges = reconnectEdge(oldEdge, newConnection, currentEdges).map(e => {
          if (e.id === oldEdge.id) {
              return {
                  ...e,
                  data: {
                      ...e.data,
                      centerX: undefined,
                      centerY: undefined
                  }
              };
          }
          return e;
      });

      setEdges(newEdges);
      setTimeout(() => {
          addToHistory(getNodes(), newEdges);
      }, 0);
    },
    [getEdges, getNodes, setEdges, addToHistory]
  );

  const onNodeDragStop = useCallback(
    (_: React.MouseEvent, node: Node) => {
        const currentEdges = getEdges();
        const currentNodes = getNodes();

        const connectedEdges = currentEdges.filter(
            (e) => e.source === node.id || e.target === node.id
        );

        const updates: { id: string; sourceHandle?: string | null; targetHandle?: string | null }[] = [];

        connectedEdges.forEach((edge) => {
            const sourceNode = node.id === edge.source ? node : currentNodes.find((n) => n.id === edge.source);
            const targetNode = node.id === edge.target ? node : currentNodes.find((n) => n.id === edge.target);
            
            if (!sourceNode || !targetNode) return;

            const nodeWidth = 220;
            const isSourceLeftOfTarget = sourceNode.position.x + nodeWidth < targetNode.position.x;
            const isSourceRightOfTarget = sourceNode.position.x > targetNode.position.x + nodeWidth;

            let newSourceHandle = edge.sourceHandle;
            let newTargetHandle = edge.targetHandle;

            if (isSourceLeftOfTarget) {
                if (newSourceHandle?.includes('-left-')) {
                    newSourceHandle = newSourceHandle.replace('-left-', '-right-');
                }
                if (newTargetHandle?.includes('-right-')) {
                    newTargetHandle = newTargetHandle.replace('-right-', '-left-');
                }
            } else if (isSourceRightOfTarget) {
                if (newSourceHandle?.includes('-right-')) {
                    newSourceHandle = newSourceHandle.replace('-right-', '-left-');
                }
                if (newTargetHandle?.includes('-left-')) {
                    newTargetHandle = newTargetHandle.replace('-left-', '-right-');
                }
            }

            if (newSourceHandle !== edge.sourceHandle || newTargetHandle !== edge.targetHandle) {
                updates.push({
                    id: edge.id,
                    sourceHandle: newSourceHandle,
                    targetHandle: newTargetHandle
                });
            }
        });

        let nextEdges = currentEdges;
        if (updates.length > 0) {
            nextEdges = currentEdges.map((e) => {
                    const update = updates.find((u) => u.id === e.id);
                    if (update) {
                        return {
                            ...e,
                            sourceHandle: update.sourceHandle ?? e.sourceHandle,
                            targetHandle: update.targetHandle ?? e.targetHandle,
                            data: { ...e.data, centerX: undefined, centerY: undefined }
                        };
                    }
                    return e;
                });
            setEdges(nextEdges);
        }

        const nextNodes = currentNodes.map(n => n.id === node.id ? node : n);
        setTimeout(() => {
            addToHistory(nextNodes, nextEdges);
        }, 0);
    },
    [getEdges, getNodes, setEdges, addToHistory]
  );



  const onNodeDrag = useCallback((_: any, node: Node) => {
    setEdges((eds) => eds.map((edge) => {
      if (edge.source !== node.id && edge.target !== node.id) return edge;

      const sourceNode = nodes.find((n) => n.id === edge.source);
      const targetNode = nodes.find((n) => n.id === edge.target);

      if (!sourceNode || !targetNode) return edge;

      const isTargetRight = targetNode.position.x > sourceNode.position.x + (sourceNode.width || 200);
      
      let newSourceHandle = edge.sourceHandle;
      let newTargetHandle = edge.targetHandle;

      const switchHandle = (handleId: string | null | undefined, side: 'left' | 'right') => {
          if (!handleId) return handleId;
          const parts = handleId.split('-');
          if (parts.length >= 3) {
              parts[parts.length - 2] = side;
              return parts.join('-');
          }
          return handleId;
      };

      if (isTargetRight) {
          newSourceHandle = switchHandle(edge.sourceHandle, 'right');
          newTargetHandle = switchHandle(edge.targetHandle, 'left');
      } else {
          newSourceHandle = switchHandle(edge.sourceHandle, 'left');
          newTargetHandle = switchHandle(edge.targetHandle, 'right');
      }

      if (newSourceHandle !== edge.sourceHandle || newTargetHandle !== edge.targetHandle) {
          return {
              ...edge,
              sourceHandle: newSourceHandle,
              targetHandle: newTargetHandle,
              data: { ...edge.data, centerX: undefined, centerY: undefined }
          };
      }

      return edge;
    }));
  }, [nodes, setEdges]);

    return (
        <div ref={wrapperRef} className="w-full h-full min-h-[600px] bg-slate-50 dark:bg-zinc-950 relative" style={{ width: '100%', height: '100%' }}>
                <ReactFlow
                nodes={nodes}
                edges={edges}
                onNodesChange={onNodesChangeWrapped}
                onEdgesChange={onEdgesChangeWrapped}
                onEdgeUpdate={onEdgeUpdate}
                onConnect={onConnect}
                onNodeDragStop={onNodeDragStop}
                onNodeDrag={onNodeDrag}
                isValidConnection={isValidConnection}
                nodeTypes={nodeTypes}
                edgeTypes={edgeTypes}
                edgeUpdaterRadius={20}
                connectionRadius={50}
                panActivationKeyCode={null}
                defaultEdgeOptions={{ 
                    type: edgeType === 'default' ? 'custom-bezier' : 'custom-step',
                    updatable: true,
                    interactionWidth: 30,
                    zIndex: 1000 
                }}
                fitView
                attributionPosition="bottom-right"
                >
                <CustomMarkers />
                <Background color="#999" gap={16} />
                <Controls />
                <MiniMap className="!bg-white dark:!bg-zinc-950 border dark:border-zinc-800" />
                <ErdToolbar 
                    onUndo={handleUndo}
                    onRedo={handleRedo}
                    canUndo={historyIndex > 0}
                    canRedo={historyIndex < history.length - 1}
                    edgeType={edgeType}
                    setEdgeType={setEdgeType}
                />
                </ReactFlow>
        </div>
    );
});

export const ErdDiagram = forwardRef<ErdVisualEditorRef, { code: string }>((props, ref) => (
  <ReactFlowProvider>
    <ErdVisualEditorContent {...props} ref={ref} />
  </ReactFlowProvider>
));
