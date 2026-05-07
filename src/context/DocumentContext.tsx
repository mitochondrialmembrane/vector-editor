import React, { createContext, useContext, useState } from 'react';

export interface SelectedItemProps {
  fillColor: string;
  strokeColor: string;
  strokeWidth: number;
  opacity: number;
  blendMode: string;
}

type ItemType = 'Rectangle' | 'Ellipse' | 'Path';

export type ItemData = {
  id: number;
  type: ItemType;
  props: Record<string, any>;
};

interface DocumentContextValue {
  selectedItemIds: number[];
  setSelectedItemIds: (ids: number[]) => void;
  selectedProps: SelectedItemProps | null;
  setSelectedProps: (props: SelectedItemProps | null) => void;
  items: ItemData[];
  setItems: React.Dispatch<React.SetStateAction<ItemData[]>>;
}

const DocumentContext = createContext<DocumentContextValue | null>(null);

export function DocumentProvider({ children }: { children: React.ReactNode }) {
  const [selectedItemIds, setSelectedItemIds] = useState<number[]>([]);
  const [selectedProps, setSelectedProps] = useState<SelectedItemProps | null>(null);
  const [items, setItems] = useState<ItemData[]>([]);

  return (
    <DocumentContext.Provider value={{ selectedItemIds, setSelectedItemIds, selectedProps, setSelectedProps, items, setItems }}>
      {children}
    </DocumentContext.Provider>
  );
}

export function useDocument() {
  const ctx = useContext(DocumentContext);
  if (!ctx) throw new Error('useDocument must be used within DocumentProvider');
  return ctx;
}
