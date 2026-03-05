import { useRef } from 'react';

export default function CanvasContainer() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  return (
    <div className="canvas-container">
      <canvas ref={canvasRef} className="main-canvas" />
    </div>
  );
}
