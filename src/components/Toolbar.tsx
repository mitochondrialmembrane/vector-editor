import { MousePointer2, Minus, Square, Circle, Hexagon } from 'lucide-react';
import { useActiveTool } from '../context/ActiveToolContext';
import type { ToolName } from '../tools/types';

interface ToolDef {
  id: ToolName;
  label: string;
  icon: React.ReactNode;
  shortcut: string;
}

const TOOLS: ToolDef[] = [
  { id: 'select', label: 'Select', icon: <MousePointer2 size={16} />, shortcut: 'V' },
  { id: 'line', label: 'Line', icon: <Minus size={16} />, shortcut: 'L' },
  { id: 'rect', label: 'Rectangle', icon: <Square size={16} />, shortcut: 'R' },
  { id: 'ellipse', label: 'Ellipse', icon: <Circle size={16} />, shortcut: 'E' },
  { id: 'polygon', label: 'Polygon', icon: <Hexagon size={16} />, shortcut: 'P' },
];

export default function Toolbar() {
  const { activeToolName, setActiveToolName } = useActiveTool();

  return (
    <div className="toolbar">
      {TOOLS.map(tool => (
        <button
          key={tool.id}
          className={`toolbar-btn${activeToolName === tool.id ? ' active' : ''}`}
          onClick={() => setActiveToolName(tool.id)}
          title={`${tool.label} (${tool.shortcut})`}
        >
          {tool.icon}
        </button>
      ))}
    </div>
  );
}
