import { useState } from 'react';
import { MousePointer2, Pen, Square, Circle } from 'lucide-react';

type Tool = 'select' | 'pen' | 'rect' | 'ellipse';

interface ToolDef {
  id: Tool;
  label: string;
  icon: React.ReactNode;
  shortcut: string;
}

const TOOLS: ToolDef[] = [
  { id: 'select',  label: 'Select',    icon: <MousePointer2 size={16} />, shortcut: 'V' },
  { id: 'pen',     label: 'Pen',       icon: <Pen size={16} />,           shortcut: 'P' },
  { id: 'rect',    label: 'Rectangle', icon: <Square size={16} />,        shortcut: 'R' },
  { id: 'ellipse', label: 'Ellipse',   icon: <Circle size={16} />,        shortcut: 'E' },
];

export default function Toolbar() {
  const [activeTool, setActiveTool] = useState<Tool>('select');

  return (
    <div className="toolbar">
      {TOOLS.map(tool => (
        <button
          key={tool.id}
          className={`toolbar-btn${activeTool === tool.id ? ' active' : ''}`}
          onClick={() => setActiveTool(tool.id)}
          title={`${tool.label} (${tool.shortcut})`}
        >
          {tool.icon}
        </button>
      ))}
    </div>
  );
}
