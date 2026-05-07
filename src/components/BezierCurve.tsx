import React, { useMemo } from 'react';
import VertexHandle from './VertexHandle';

export interface Point {
  x: number;
  y: number;
}

export interface Vertex {
  id: string;
  x: number;
  y: number;
  handleIn: Point | null;   // control point arriving at this vertex
  handleOut: Point | null;  // control point leaving this vertex
}

export interface CurveSegment {
  id: string;
  startVertexId: string;
  endVertexId: string;
}

interface BezierCurveProps {
  id: string;
  vertices: Vertex[];
  curves: CurveSegment[];
  isActive?: boolean;
  isClosed?: boolean;
  selectedVertexId?: string | null;
  onClick?: (id: string) => void;
  onCurveMouseDown?: (id: string, e: React.MouseEvent) => void;
  onVertexMouseDown?: (vertexId: string, e: React.MouseEvent) => void;
  onVertexClick?: (vertexId: string) => void;
  onHandleMouseDown?: (vertexId: string, handle: 'in' | 'out', e: React.MouseEvent) => void;
  strokeColor?: string;
  strokeWidth?: number;
  fillColor?: string;
  opacity?: number;
  blendMode?: string;
}

const BezierCurve: React.FC<BezierCurveProps> = ({
  id,
  vertices,
  curves,
  isActive = false,
  isClosed = false,
  selectedVertexId = null,
  onClick,
  onCurveMouseDown,
  onVertexMouseDown,
  onVertexClick,
  onHandleMouseDown,
  strokeColor = '#333333',
  strokeWidth = 3,
  fillColor = 'transparent',
  opacity = 1,
  blendMode = 'normal',
}) => {
  if (curves.length === 0) return null;

  const vertexMap = useMemo(
    () => new Map(vertices.map((v) => [v.id, v])),
    [vertices],
  );

  // Collect unique vertices used by this curve
  const curveVertices = useMemo(() => {
    const seen = new Set<string>();
    const result: Vertex[] = [];
    for (const seg of curves) {
      for (const vid of [seg.startVertexId, seg.endVertexId]) {
        if (!seen.has(vid)) {
          seen.add(vid);
          const v = vertexMap.get(vid);
          if (v) result.push(v);
        }
      }
    }
    return result;
  }, [curves, vertexMap]);

  // Build path d-string
  const firstVertex = vertexMap.get(curves[0].startVertexId);
  if (!firstVertex) return null;

  let d = `M ${firstVertex.x} ${firstVertex.y}`;
  for (const seg of curves) {
    const start = vertexMap.get(seg.startVertexId);
    const end = vertexMap.get(seg.endVertexId);
    if (!start || !end) continue;

    // p1 = start vertex's outgoing handle (fallback to start position)
    const p1 = start.handleOut ?? { x: start.x, y: start.y };
    // p2 = end vertex's incoming handle (fallback to end position)
    const p2 = end.handleIn ?? { x: end.x, y: end.y };

    d += ` C ${p1.x} ${p1.y}, ${p2.x} ${p2.y}, ${end.x} ${end.y}`;
  }

  if (isClosed) {
    d += ' Z';
  }

  const handleCurveClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onClick?.(id);
  };

  const handleCurveMouseDown = (e: React.MouseEvent) => {
    e.stopPropagation();
    onCurveMouseDown?.(id, e);
  };

  // Find the selected vertex object for rendering its handle lines
  const selectedVertex = selectedVertexId
    ? curveVertices.find((v) => v.id === selectedVertexId) ?? null
    : null;

  return (
    <g style={{ cursor: 'pointer' }} onClick={handleCurveClick}>
      {/* Wide invisible hit-test path */}
      <path
        d={d}
        stroke="transparent"
        strokeWidth={strokeWidth + 12}
        fill="none"
        pointerEvents="auto"
        onMouseDown={handleCurveMouseDown}
      />
      {/* Visible path */}
      <path
        d={d}
        stroke={strokeColor}
        strokeWidth={strokeWidth}
        fill={fillColor}
        strokeLinecap="round"
        strokeLinejoin="round"
        pointerEvents="none"
        opacity={opacity}
        style={{ mixBlendMode: blendMode as any }}
      />
      {/* Active highlight */}
      {isActive && (
        <path
          d={d}
          stroke="royalblue"
          strokeWidth={strokeWidth + 4}
          fill="none"
          strokeLinecap="round"
          strokeLinejoin="round"
          pointerEvents="none"
          opacity={0.3}
        />
      )}

      {/* Vertex handles — only when active */}
      {isActive &&
        curveVertices.map((v) => (
          <VertexHandle
            key={v.id}
            id={v.id}
            x={v.x}
            y={v.y}
            isActive={selectedVertexId === v.id}
            onMouseDown={onVertexMouseDown ?? (() => { })}
            onClick={onVertexClick}
          />
        ))}

      {/* Control-point handle lines + dots for the selected vertex */}
      {isActive && selectedVertex && (
        <g>
          {selectedVertex.handleIn && (
            <>
              <line
                x1={selectedVertex.x}
                y1={selectedVertex.y}
                x2={selectedVertex.handleIn.x}
                y2={selectedVertex.handleIn.y}
                stroke="royalblue"
                strokeWidth={1}
                strokeDasharray="4 2"
                pointerEvents="none"
              />
              <circle
                cx={selectedVertex.handleIn.x}
                cy={selectedVertex.handleIn.y}
                r={5}
                fill="white"
                stroke="royalblue"
                strokeWidth={1.5}
                style={{ cursor: 'move' }}
                onMouseDown={(e) => {
                  e.stopPropagation();
                  onHandleMouseDown?.(selectedVertex.id, 'in', e);
                }}
                onClick={(e) => e.stopPropagation()}
              />
            </>
          )}
          {selectedVertex.handleOut && (
            <>
              <line
                x1={selectedVertex.x}
                y1={selectedVertex.y}
                x2={selectedVertex.handleOut.x}
                y2={selectedVertex.handleOut.y}
                stroke="royalblue"
                strokeWidth={1}
                strokeDasharray="4 2"
                pointerEvents="none"
              />
              <circle
                cx={selectedVertex.handleOut.x}
                cy={selectedVertex.handleOut.y}
                r={5}
                fill="white"
                stroke="royalblue"
                strokeWidth={1.5}
                style={{ cursor: 'move' }}
                onMouseDown={(e) => {
                  e.stopPropagation();
                  onHandleMouseDown?.(selectedVertex.id, 'out', e);
                }}
                onClick={(e) => e.stopPropagation()}
              />
            </>
          )}
        </g>
      )}
    </g>
  );
};

export default BezierCurve;
