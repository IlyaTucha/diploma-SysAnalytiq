import React, { useState } from 'react';
import {
  BaseEdge,
  EdgeProps,
  getBezierPath,
  useReactFlow,
  Position
} from 'reactflow';

export const CustomBezierEdge = ({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  style = {},
  markerEnd,
  markerStart,
  data,
  selected: _selected
}: EdgeProps) => {
  const { setEdges, getZoom } = useReactFlow();
  const [hovered, setHovered] = useState(false);
  const [edgePath] = getBezierPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
    curvature: data?.curvature ?? 0.25
  });

  const onEdgeMouseDown = (evt: React.MouseEvent) => {
      evt.stopPropagation();
      const startMouseY = evt.clientY;
      const startCurvature = data?.curvature ?? 0.25;
      const zoom = getZoom();

      const moveHandler = (e: MouseEvent) => {
          const dy = (e.clientY - startMouseY) / zoom;
          const delta = dy * 0.005; 
          
          setEdges((edges) => edges.map((ed) => {
              if (ed.id === id) {
                  return { ...ed, data: { ...ed.data, curvature: Math.max(-2, Math.min(2, startCurvature + delta)) } };
              }
              return ed;
          }));
      };

      const upHandler = () => {
          document.removeEventListener('mousemove', moveHandler);
          document.removeEventListener('mouseup', upHandler);
          window.dispatchEvent(new Event('erd-edge-change'));
      };

      document.addEventListener('mousemove', moveHandler);
      document.addEventListener('mouseup', upHandler);
  };

  const hoverStyle = hovered ? { ...style, stroke: '#3b82f6', strokeWidth: 2.5, transition: 'stroke 0.15s, stroke-width 0.15s' } : { ...style, transition: 'stroke 0.15s, stroke-width 0.15s' };

  return (
    <>
      <BaseEdge path={edgePath} markerEnd={markerEnd} markerStart={markerStart} style={hoverStyle} />
      <path
        d={edgePath}
        fill="none"
        strokeOpacity={0}
        strokeWidth={4}
        onMouseDown={onEdgeMouseDown}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        style={{ cursor: 'grab', pointerEvents: 'all', zIndex: 9999 }}
      />
    </>
  );
};

function getSmartEdgeParams(
  sx: number, sy: number, tx: number, ty: number,
  sPos: Position, tPos: Position,
  data: any
) {
  const defaultStub = 30;
  const sSide = sPos;
  const tSide = tPos;

  let isZShape = false;
  
  if (sSide === Position.Right && tSide === Position.Left) {
      if (sx < tx - defaultStub * 2) isZShape = true;
  }
  else if (sSide === Position.Left && tSide === Position.Right) {
      if (sx > tx + defaultStub * 2) isZShape = true;
  }

  if (isZShape) {
     const midX = (sx + tx) / 2;
     const centerX = data?.centerX ?? midX;
     
     const path = `M ${sx} ${sy} L ${centerX} ${sy} L ${centerX} ${ty} L ${tx} ${ty}`;
     
     return {
       type: 'Z',
       path,
       segments: [
         { type: 'H', x1: sx, y1: sy, x2: centerX, y2: sy, draggable: true, id: 'centerX', val: centerX },
         { type: 'V', x1: centerX, y1: sy, x2: centerX, y2: ty, draggable: true, id: 'centerX', val: centerX },
         { type: 'H', x1: centerX, y1: ty, x2: tx, y2: ty, draggable: true, id: 'centerX', val: centerX }
       ]
     };
  } else {
     // U-Shape
     const sDir = sSide === Position.Right ? 1 : -1;
     const tDir = tSide === Position.Right ? 1 : -1;
     
     const sStub = data?.sourceStub ?? defaultStub;
     const tStub = data?.targetStub ?? defaultStub;
     
     const midY = (sy + ty) / 2;
     const centerY = data?.centerY ?? midY;
     
     const x1 = sx + sStub * sDir;
     const x2 = tx + tStub * tDir;
     
     const path = `M ${sx} ${sy} L ${x1} ${sy} L ${x1} ${centerY} L ${x2} ${centerY} L ${x2} ${ty} L ${tx} ${ty}`;
     
     return {
       type: 'U',
       path,
       segments: [
         { type: 'H', x1: sx, y1: sy, x2: x1, y2: sy, draggable: true, id: 'sourceStub', val: sStub, dir: sDir, base: sx },
         { type: 'V', x1: x1, y1: sy, x2: x1, y2: centerY, draggable: true, id: 'sourceStub', val: sStub, dir: sDir, base: sx },
         { type: 'H', x1: x1, y1: centerY, x2: x2, y2: centerY, draggable: true, id: 'centerY', val: centerY },
         { type: 'V', x1: x2, y1: centerY, x2: x2, y2: ty, draggable: true, id: 'targetStub', val: tStub, dir: tDir, base: tx },
         { type: 'H', x1: x2, y1: ty, x2: tx, y2: ty, draggable: true, id: 'targetStub', val: tStub, dir: tDir, base: tx }
       ]
     };
  }
}

export const CustomStepEdge = ({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  style = {},
  markerEnd,
  markerStart,
  data,
  selected: _selected
}: EdgeProps) => {
  const { setEdges, getZoom, screenToFlowPosition, getNode } = useReactFlow();
  const [cursor, setCursor] = useState('default');
  const [hovered, setHovered] = useState(false);
  
  const { path: edgePath, segments } = getSmartEdgeParams(
      sourceX, sourceY, targetX, targetY, 
      sourcePosition, targetPosition, 
      data
  );

  const isNear = (x: number, y: number, x1: number, y1: number, x2: number, y2: number, threshold: number) => {
      const minX = Math.min(x1, x2) - threshold;
      const maxX = Math.max(x1, x2) + threshold;
      const minY = Math.min(y1, y2) - threshold;
      const maxY = Math.max(y1, y2) + threshold;
      return x >= minX && x <= maxX && y >= minY && y <= maxY;
  };

  const onEdgeMouseMove = (evt: React.MouseEvent) => {
      const { x, y } = screenToFlowPosition({ x: evt.clientX, y: evt.clientY });
      const hitThreshold = 20;
      let newCursor = 'default';

      for (const seg of segments) {
          if (seg.draggable && isNear(x, y, seg.x1, seg.y1, seg.x2, seg.y2, hitThreshold)) {
              if (seg.type === 'V') newCursor = 'ew-resize';
              else if (seg.type === 'H') newCursor = 'ns-resize';
              break;
          }
      }
      setCursor(newCursor);
  };

  const onEdgeMouseDown = (evt: React.MouseEvent) => {
      evt.stopPropagation();
      const startMouseX = evt.clientX;
      const startMouseY = evt.clientY;
      const zoom = getZoom();
      
      const { x, y } = screenToFlowPosition({ x: evt.clientX, y: evt.clientY });
      const hitThreshold = 20;
      
      let draggedSegment: any = null;
      for (const seg of segments) {
          if (seg.draggable && isNear(x, y, seg.x1, seg.y1, seg.x2, seg.y2, hitThreshold)) {
              draggedSegment = seg;
              break;
          }
      }

      if (!draggedSegment) return;

      const startVal = draggedSegment.val;

      const moveHandler = (e: MouseEvent) => {
          const dx = (e.clientX - startMouseX) / zoom;
          const dy = (e.clientY - startMouseY) / zoom;
          
          setEdges((edges) => edges.map((ed) => {
              if (ed.id === id) {
                  const newData = { ...ed.data };
                  let newSourceHandle = ed.sourceHandle;
                  let newTargetHandle = ed.targetHandle;
                  
                  if (draggedSegment.id === 'centerX') {
                      const newCenterX = startVal + dx;
                      newData.centerX = newCenterX;

                      const sourceNode = getNode(ed.source);
                      const targetNode = getNode(ed.target);
                      
                      const sWidth = sourceNode?.width ?? 220;
                      const tWidth = targetNode?.width ?? 220;

                      if (sourceNode) {
                          const sCenter = sourceNode.position.x + sWidth / 2;
                          if (newCenterX < sCenter && newSourceHandle?.includes('right')) {
                              newSourceHandle = newSourceHandle.replace('right', 'left');
                          } else if (newCenterX > sCenter && newSourceHandle?.includes('left')) {
                              newSourceHandle = newSourceHandle.replace('left', 'right');
                          }
                      }
                      if (targetNode) {
                          const tCenter = targetNode.position.x + tWidth / 2;
                          if (newCenterX < tCenter && newTargetHandle?.includes('right')) {
                              newTargetHandle = newTargetHandle.replace('right', 'left');
                          } else if (newCenterX > tCenter && newTargetHandle?.includes('left')) {
                              newTargetHandle = newTargetHandle.replace('left', 'right');
                          }
                      }
                  } 
                  else if (draggedSegment.id === 'centerY') {
                      newData.centerY = startVal + dy;
                  }
                  else if (draggedSegment.id === 'sourceStub') {
                      const rawStub = startVal + dx * draggedSegment.dir;
                      newData.sourceStub = Math.max(10, rawStub);
                      
                      const sourceNode = getNode(ed.source);
                      if (sourceNode) {
                          if (rawStub < 0) {
                              if (draggedSegment.dir === 1) { // Right -> Left
                                  newSourceHandle = newSourceHandle?.replace('right', 'left');
                              } else { // Left -> Right
                                  newSourceHandle = newSourceHandle?.replace('left', 'right');
                              }
                              newData.sourceStub = 20;
                          }
                      }
                  }
                  else if (draggedSegment.id === 'targetStub') {
                      const rawStub = startVal + dx * draggedSegment.dir;
                      newData.targetStub = Math.max(10, rawStub);
                      
                      const targetNode = getNode(ed.target);
                      if (targetNode) {
                          if (rawStub < 0) {
                              if (draggedSegment.dir === 1) { // Right -> Left
                                  newTargetHandle = newTargetHandle?.replace('right', 'left');
                              } else { // Left -> Right
                                  newTargetHandle = newTargetHandle?.replace('left', 'right');
                              }
                              newData.targetStub = 20;
                          }
                      }
                  }

                  return { 
                      ...ed, 
                      sourceHandle: newSourceHandle,
                      targetHandle: newTargetHandle,
                      data: newData
                  };
              }
              return ed;
          }));
      };

      const upHandler = () => {
          document.removeEventListener('mousemove', moveHandler);
          document.removeEventListener('mouseup', upHandler);
          window.dispatchEvent(new Event('erd-edge-change'));
      };

      document.addEventListener('mousemove', moveHandler);
      document.addEventListener('mouseup', upHandler);
  };

  const hoverStyle = hovered ? { ...style, stroke: '#3b82f6', strokeWidth: 2.5, transition: 'stroke 0.15s, stroke-width 0.15s' } : { ...style, transition: 'stroke 0.15s, stroke-width 0.15s' };

  return (
    <>
      <BaseEdge path={edgePath} markerEnd={markerEnd} markerStart={markerStart} style={hoverStyle} />
      <path
        d={edgePath}
        fill="none"
        strokeOpacity={0}
        strokeWidth={6}
        onMouseMove={onEdgeMouseMove}
        onMouseDown={onEdgeMouseDown}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        style={{ cursor: cursor, pointerEvents: 'all' }}
      />
    </>
  );
};
