import React, { createContext, useContext, useState } from 'react';

export interface SelectedItemProps {
  fillColor: string;
  strokeColor: string;
  strokeWidth: number;
  opacity: number;
  blendMode: string;
}

interface DocumentContextValue {
  selectedItemId: number | null;
  setSelectedItemId: (id: number | null) => void;
  selectedProps: SelectedItemProps | null;
  setSelectedProps: (props: SelectedItemProps | null) => void;
}

const DocumentContext = createContext<DocumentContextValue | null>(null);

export function DocumentProvider({ children }: { children: React.ReactNode }) {
  const [selectedItemId, setSelectedItemId] = useState<number | null>(null);
  const [selectedProps, setSelectedProps] = useState<SelectedItemProps | null>(null);

  return (
    <DocumentContext.Provider value={{ selectedItemId, setSelectedItemId, selectedProps, setSelectedProps }}>
      {children}
    </DocumentContext.Provider>
  );
}

export function useDocument() {
  const ctx = useContext(DocumentContext);
  if (!ctx) throw new Error('useDocument must be used within DocumentProvider');
  return ctx;
}
