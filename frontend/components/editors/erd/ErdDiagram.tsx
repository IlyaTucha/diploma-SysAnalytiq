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

export interface ErdLayout {
    nodePositions: Record<string, { x: number; y: number }>;
    edgeData: Record<string, { sourceHandle?: string | null; targetHandle?: string | null; data?: any }>;
}

export interface ErdVisualEditorRef {
    handleExportImage: () => Promise<void>;
    getLayout: () => ErdLayout;
}

interface ErdVisualEditorProps {
    code: string;
    readOnly?: boolean;
    initialLayout?: ErdLayout | null;
}

const ErdVisualEditorContent = forwardRef<ErdVisualEditorRef, ErdVisualEditorProps>(({ code, readOnly = false, initialLayout }, ref) => {
  const nodeTypes = useMemo(() => ({ table: TableNode }), []);
  const edgeTypes = useMemo(() => ({ 
      'custom-bezier': CustomBezierEdge,
      'custom-step': CustomStepEdge
  }), []);

  const { getNodes, getEdges, fitView } = useReactFlow();
  const wrapperRef = useRef<HTMLDivElement>(null);
  const { handleExportImage } = useErdExport(wrapperRef);

  useImperativeHandle(ref, () => ({
    handleExportImage,
    getLayout: () => {
      const currentNodes = getNodes();
      const currentEdges = getEdges();
      const nodePositions: Record<string, { x: number; y: number }> = {};
      currentNodes.forEach(n => { nodePositions[n.id] = { x: n.position.x, y: n.position.y }; });
      const edgeData: Record<string, any> = {};
      currentEdges.forEach(e => { edgeData[e.id] = { sourceHandle: e.sourceHandle, targetHandle: e.targetHandle, data: e.data }; });
      return { nodePositions, edgeData };
    }
  }));

  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [edgeType, setEdgeType] = useState('smoothstep');
  const validConnectionsRef = useRef(new Set<string>());

  const [history, setHistory] = useState<{nodes: Node[], edges: Edge[]}[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [isInitialLoad, setIsInitialLoad] = useState(true);

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
    
    const currentNodes = getNodes();
    const currentEdges = getEdges();
    
    // Preserve edge positions (handle side + custom data like curvature/offsets)
    const mergedEdges = initialEdges.map(newEdge => {
        const existingEdge = currentEdges.find(e => e.id === newEdge.id);
        if (existingEdge) {
            return { 
                ...newEdge, 
                sourceHandle: existingEdge.sourceHandle || newEdge.sourceHandle,
                targetHandle: existingEdge.targetHandle || newEdge.targetHandle,
                data: existingEdge.data 
                    ? { ...newEdge.data, ...existingEdge.data } 
                    : newEdge.data,
            };
        }
        return newEdge;
    });

    // Preserve existing node positions for tables that still exist
    const existingPositions = new Map(currentNodes.map(n => [n.id, n.position]));
    const hasExistingLayout = currentNodes.length > 0;
    const newTableIds = initialNodes.filter(n => !existingPositions.has(n.id)).map(n => n.id);
    const removedIds = currentNodes.filter(n => !initialNodes.find(in2 => in2.id === n.id)).map(n => n.id);

    let resultNodes: Node[];
    let resultEdges: Edge[];
    
    if (hasExistingLayout && newTableIds.length < initialNodes.length) {
        // Some tables existed before — preserve their positions
        const mergedNodes = initialNodes.map(node => {
            const prevPos = existingPositions.get(node.id);
            if (prevPos) {
                return { ...node, position: prevPos };
            }
            return node;
        });
        
        // Only layout truly new nodes (place them relative to existing ones)
        if (newTableIds.length > 0) {
            // Detect renames: if exactly N nodes removed and N added, transfer positions
            if (newTableIds.length === removedIds.length && removedIds.length > 0) {
                // Assume rename — transfer old positions to new nodes
                const positionsToTransfer = removedIds.map(id => existingPositions.get(id)!).filter(Boolean);
                resultNodes = mergedNodes.map((n, _i) => {
                    const newIdx = newTableIds.indexOf(n.id);
                    if (newIdx !== -1 && newIdx < positionsToTransfer.length) {
                        return { ...n, position: positionsToTransfer[newIdx] };
                    }
                    return n;
                });
            } else {
                // Truly new nodes — place below existing at fixed position
                const allY = currentNodes.map(n => n.position.y);
                const allX = currentNodes.map(n => n.position.x);
                const maxY = Math.max(...allY, 0);
                const avgX = allX.length > 0 ? allX.reduce((a, b) => a + b, 0) / allX.length : 0;
                resultNodes = mergedNodes.map((n, _i) => {
                    const newIdx = newTableIds.indexOf(n.id);
                    if (newIdx !== -1) {
                        return { ...n, position: { x: avgX, y: maxY + 250 + newIdx * 300 } };
                    }
                    return n;
                });
            }
            resultEdges = mergedEdges;
        } else {
            resultNodes = mergedNodes;
            resultEdges = mergedEdges;
        }
    } else if (!hasExistingLayout && initialLayout?.nodePositions) {
        // First render with saved layout available — apply saved positions
        resultNodes = initialNodes.map(node => {
            const savedPos = initialLayout.nodePositions[node.id];
            return savedPos ? { ...node, position: savedPos } : node;
        });
        resultEdges = initialEdges.map(edge => {
            const saved = initialLayout.edgeData?.[edge.id];
            if (saved) {
                return {
                    ...edge,
                    sourceHandle: saved.sourceHandle || edge.sourceHandle,
                    targetHandle: saved.targetHandle || edge.targetHandle,
                    data: saved.data ? { ...edge.data, ...saved.data } : edge.data,
                };
            }
            return edge;
        });
    } else {
        // All new or empty — full dagre layout
        const { nodes: layoutedNodes, edges: layoutedEdges } = getLayoutedElements(initialNodes, mergedEdges);
        resultNodes = layoutedNodes;
        resultEdges = layoutedEdges;
    }

    setNodes(resultNodes);
    setEdges(resultEdges);
    setHistory([{ nodes: JSON.parse(JSON.stringify(resultNodes)), edges: JSON.parse(JSON.stringify(resultEdges)) }]);
    setHistoryIndex(0);
    validConnectionsRef.current = validConnections;
    setIsInitialLoad(true);
    
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [code, initialLayout]);

  // Center the diagram only on initial load
  useEffect(() => {
    if (nodes.length > 0 && isInitialLoad) {
      setTimeout(() => {
        fitView({ padding: 0.2, minZoom: 0.05, maxZoom: 0.8 });
        setIsInitialLoad(false);
      }, 100);
    }
  }, [nodes, fitView, isInitialLoad]);

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



  const onNodeDrag = useCallback((_: any, draggedNode: Node) => {
    const currentNodes = getNodes();
    
    setEdges((eds) => eds.map((edge) => {
      if (edge.source !== draggedNode.id && edge.target !== draggedNode.id) return edge;

      // Use the dragged node's live position; for other nodes, use getNodes()
      const sourceNode = edge.source === draggedNode.id 
        ? draggedNode 
        : currentNodes.find((n) => n.id === edge.source);
      const targetNode = edge.target === draggedNode.id 
        ? draggedNode 
        : currentNodes.find((n) => n.id === edge.target);

      if (!sourceNode || !targetNode) return edge;

      const nodeWidth = sourceNode.width || 220;
      const isTargetRight = targetNode.position.x > sourceNode.position.x + nodeWidth;
      const isTargetLeft = targetNode.position.x + (targetNode.width || 220) < sourceNode.position.x;
      
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
      } else if (isTargetLeft) {
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
  }, [getNodes, setEdges]);

    return (
        <div ref={wrapperRef} className="w-full h-full bg-slate-50 dark:bg-zinc-950 relative" style={{ width: '100%', height: '100%' }}>
                <ReactFlow
                nodes={nodes}
                edges={edges}
                onNodesChange={readOnly ? undefined : onNodesChangeWrapped}
                onEdgesChange={readOnly ? undefined : onEdgesChangeWrapped}
                onEdgeUpdate={readOnly ? undefined : onEdgeUpdate}
                onConnect={readOnly ? undefined : onConnect}
                onNodeDragStop={readOnly ? undefined : onNodeDragStop}
                onNodeDrag={readOnly ? undefined : onNodeDrag}
                isValidConnection={readOnly ? undefined : isValidConnection}
                nodesDraggable={!readOnly}
                nodesConnectable={!readOnly}
                elementsSelectable={!readOnly}
                nodeTypes={nodeTypes}
                edgeTypes={edgeTypes}
                edgeUpdaterRadius={readOnly ? 0 : 20}
                connectionRadius={readOnly ? 0 : 50}
                panActivationKeyCode={null}
                defaultEdgeOptions={{ 
                    type: edgeType === 'default' ? 'custom-bezier' : 'custom-step',
                    updatable: !readOnly,
                    interactionWidth: readOnly ? 0 : 2,
                    zIndex: 1000 
                }}
                fitViewOptions={{ padding: 0.2, minZoom: 0.05, maxZoom: 0.8 }}
                attributionPosition="bottom-right"
                >
                <CustomMarkers />
                <Background color="#999" gap={16} />
                <Controls />
                <MiniMap className="!bg-white dark:!bg-zinc-950 border dark:border-zinc-800" />
                {!readOnly && (
                  <ErdToolbar 
                      onUndo={handleUndo}
                      onRedo={handleRedo}
                      canUndo={historyIndex > 0}
                      canRedo={historyIndex < history.length - 1}
                      edgeType={edgeType}
                      setEdgeType={setEdgeType}
                  />
                )}
                </ReactFlow>
        </div>
    );
});

export const ErdDiagram = forwardRef<ErdVisualEditorRef, ErdVisualEditorProps>((props, ref) => (
  <ReactFlowProvider>
    <ErdVisualEditorContent {...props} ref={ref} />
  </ReactFlowProvider>
));
