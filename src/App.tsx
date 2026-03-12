import { useState } from 'react';
import Toolbar from './components/Toolbar';
import Sidebar from './components/Sidebar';
import BezierCurve from './components/BezierCurve';
import type { Vertex, CurveSegment } from './components/BezierCurve';
import './App.css';

const vertices: Vertex[] = [
  // Curve 1 Vertices
  { id: 'v1', x: 50, y: 150 },
  { id: 'v2', x: 200, y: 150 },
  { id: 'v3', x: 350, y: 150 },
  // Curve 2 Vertices
  { id: 'v4', x: 50, y: 300 },
  { id: 'v5', x: 200, y: 300 },
  { id: 'v6', x: 350, y: 300 },
];

const curve1: CurveSegment[] = [
  {
    id: 'c1-1',
    startVertexId: 'v1',
    endVertexId: 'v2',
    p1: { x: 100, y: 100 },
    p2: { x: 150, y: 200 },
  },
  {
    id: 'c1-2',
    startVertexId: 'v2',
    endVertexId: 'v3',
    p1: { x: 250, y: 100 },
    p2: { x: 300, y: 200 },
  },
];

const curve2: CurveSegment[] = [
  {
    id: 'c2-1',
    startVertexId: 'v4',
    endVertexId: 'v5',
    p1: { x: 100, y: 250 },
    p2: { x: 150, y: 350 },
  },
  {
    id: 'c2-2',
    startVertexId: 'v5',
    endVertexId: 'v6',
    p1: { x: 250, y: 250 },
    p2: { x: 300, y: 350 },
  },
];

function App() {
  const [selectedCurveId, setSelectedCurveId] = useState<string | null>('curve1');

  const handleCurveClick = (id: string) => {
    setSelectedCurveId(id);
  };

  const handleWorkspaceClick = () => {
    setSelectedCurveId(null);
  };

  return (
    <div className="app">
      <Toolbar />
      <div className="workspace" onClick={handleWorkspaceClick}>
        <svg
          width="100%"
          height="100%"
          viewBox="0 0 800 600"
          style={{ cursor: 'default' }}
        >
          <BezierCurve
            id="curve1"
            vertices={vertices}
            curves={curve1}
            isActive={selectedCurveId === 'curve1'}
            onClick={handleCurveClick}
            strokeWidth={3}
          />
          <BezierCurve
            id="curve2"
            vertices={vertices}
            curves={curve2}
            isActive={selectedCurveId === 'curve2'}
            onClick={handleCurveClick}
            strokeWidth={3}
          />
        </svg>
        <Sidebar />
      </div>
    </div>
  );
}

export default App;
