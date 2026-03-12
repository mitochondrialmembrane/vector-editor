import React from 'react';

export interface Vertex {
  id: string;
  x: number;
  y: number;
}

export interface CurveSegment {
  id: string;
  startVertexId: string;
  endVertexId: string;
  p1: { x: number; y: number }; // Control point 1
  p2: { x: number; y: number }; // Control point 2
}

interface BezierCurveProps {
  id: string;
  vertices: Vertex[];
  curves: CurveSegment[];
  isActive?: boolean;
  onClick?: (id: string) => void;
  activeColor?: string;
  inactiveColor?: string;
  strokeWidth?: number;
  className?: string;
}

const BezierCurve: React.FC<BezierCurveProps> = ({
  id,
  vertices,
  curves,
  isActive = false,
  onClick,
  activeColor = 'royalblue',
  inactiveColor = '#ccc',
  strokeWidth = 3,
  className = '',
}) => {
  if (curves.length === 0) return null;

  const vertexMap = new Map(vertices.map((v) => [v.id, v]));

  // Start the path at the first curve's start vertex
  const firstCurve = curves[0];
  const firstVertex = vertexMap.get(firstCurve.startVertexId);
  if (!firstVertex) return null;

  let d = `M ${firstVertex.x} ${firstVertex.y}`;

  for (const curve of curves) {
    const endVertex = vertexMap.get(curve.endVertexId);
    if (!endVertex) continue;

    d += ` C ${curve.p1.x} ${curve.p1.y}, ${curve.p2.x} ${curve.p2.y}, ${endVertex.x} ${endVertex.y}`;
  }

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onClick) onClick(id);
  };

  return (
    <g className={`bezier-curve ${className}`} onClick={handleClick} style={{ cursor: 'pointer' }}>
      {/* Hit test path: wide and invisible to make selection easier */}
      <path
        d={d}
        stroke="transparent"
        strokeWidth={strokeWidth + 10}
        fill="none"
        pointerEvents="auto"
      />
      {/* Visual path */}
      <path
        d={d}
        stroke={isActive ? activeColor : inactiveColor}
        strokeWidth={strokeWidth}
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
        style={{ transition: 'stroke 0.2s ease' }}
      />
    </g>
  );
};

export default BezierCurve;
