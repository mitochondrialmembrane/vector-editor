import React, { useState, useRef } from 'react';
import Toolbar from './components/Toolbar';
import Sidebar from './components/Sidebar';
import BezierCurve from './components/BezierCurve';
import type { Vertex, CurveSegment } from './components/BezierCurve';
import './App.css';

const INITIAL_VERTICES: Vertex[] = [
  {
    id: 'v1',
    x: 50, y: 150,
    handleIn: null,
    handleOut: { x: 100, y: 100 },
  },
  {
    id: 'v2',
    x: 200, y: 150,
    handleIn: { x: 150, y: 200 },
    handleOut: { x: 250, y: 100 },
  },
  {
    id: 'v3',
    x: 350, y: 150,
    handleIn: { x: 300, y: 200 },
    handleOut: null,
  },
];

const INITIAL_CURVES: CurveSegment[] = [
  { id: 'c1', startVertexId: 'v1', endVertexId: 'v2' },
  { id: 'c2', startVertexId: 'v2', endVertexId: 'v3' },
];

function App() {
  const [vertices, setVertices] = useState<Vertex[]>(INITIAL_VERTICES);
  const [selectedCurveId, setSelectedCurveId] = useState<string | null>(null);
  const [selectedVertexId, setSelectedVertexId] = useState<string | null>(null);
  const [draggedVertexId, setDraggedVertexId] = useState<string | null>(null);
  const [draggedHandle, setDraggedHandle] = useState<{ vertexId: string; handle: 'in' | 'out' } | null>(null);
  const svgRef = useRef<SVGSVGElement>(null);

  const handleCurveClick = (id: string) => {
    setSelectedCurveId(id);
    setSelectedVertexId(null);
  };

  const handleBackgroundClick = () => {
    setSelectedCurveId(null);
    setSelectedVertexId(null);
  };

  const handleVertexMouseDown = (vertexId: string, _e: React.MouseEvent) => {
    setSelectedVertexId(vertexId);
    setDraggedVertexId(vertexId);
    setDraggedHandle(null);
  };

  const handleHandleMouseDown = (vertexId: string, handle: 'in' | 'out', _e: React.MouseEvent) => {
    setDraggedHandle({ vertexId, handle });
    setDraggedVertexId(null);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!svgRef.current) return;
    if (!draggedVertexId && !draggedHandle) return;

    const ctm = svgRef.current.getScreenCTM();
    if (!ctm) return;

    const newX = (e.clientX - ctm.e) / ctm.a;
    const newY = (e.clientY - ctm.f) / ctm.d;

    if (draggedVertexId) {
      // Dragging a vertex — shift vertex + both handles
      setVertices((prev) =>
        prev.map((v) => {
          if (v.id !== draggedVertexId) return v;
          const dx = newX - v.x;
          const dy = newY - v.y;
          return {
            ...v,
            x: newX,
            y: newY,
            handleIn: v.handleIn
              ? { x: v.handleIn.x + dx, y: v.handleIn.y + dy }
              : null,
            handleOut: v.handleOut
              ? { x: v.handleOut.x + dx, y: v.handleOut.y + dy }
              : null,
          };
        }),
      );
    } else if (draggedHandle) {
      // Dragging a control handle — only move that handle
      setVertices((prev) =>
        prev.map((v) => {
          if (v.id !== draggedHandle.vertexId) return v;
          if (draggedHandle.handle === 'in') {
            return { ...v, handleIn: { x: newX, y: newY } };
          } else {
            return { ...v, handleOut: { x: newX, y: newY } };
          }
        }),
      );
    }
  };

  const handleMouseUp = () => {
    setDraggedVertexId(null);
    setDraggedHandle(null);
  };

  return (
    <div className="app">
      <Toolbar />
      <div className="workspace">
        <svg
          ref={svgRef}
          width="100%"
          height="100%"
          viewBox="0 0 800 600"
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          onClick={handleBackgroundClick}
          style={{ cursor: (draggedVertexId || draggedHandle) ? 'move' : 'default' }}
        >
          <BezierCurve
            id="curve1"
            vertices={vertices}
            curves={INITIAL_CURVES}
            isActive={selectedCurveId === 'curve1'}
            selectedVertexId={selectedVertexId}
            onClick={handleCurveClick}
            onVertexMouseDown={handleVertexMouseDown}
            onHandleMouseDown={handleHandleMouseDown}
            strokeWidth={3}
          />
        </svg>
        <Sidebar />
      </div>
    </div>
  );
}

export default App;
