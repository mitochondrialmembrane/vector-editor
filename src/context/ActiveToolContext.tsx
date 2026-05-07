import React, { createContext, useContext, useState } from 'react';
import type { ToolName } from '../tools/types';

interface ActiveToolContextValue {
  activeToolName: ToolName;
  setActiveToolName: (name: ToolName) => void;
}

const ActiveToolContext = createContext<ActiveToolContextValue | null>(null);

export function ActiveToolProvider({ children }: { children: React.ReactNode }) {
  const [activeToolName, setActiveToolName] = useState<ToolName>('select');

  return (
    <ActiveToolContext.Provider value={{ activeToolName, setActiveToolName }}>
      {children}
    </ActiveToolContext.Provider>
  );
}

export function useActiveTool() {
  const ctx = useContext(ActiveToolContext);
  if (!ctx) throw new Error('useActiveTool must be used within ActiveToolProvider');
  return ctx;
}
