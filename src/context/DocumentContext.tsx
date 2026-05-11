import React, { createContext, useContext, useState } from 'react';

export interface SelectedItemProps {
  fillColor: string;
  strokeColor: string;
  strokeWidth: number;
  opacity: number;
  blendMode: string;
}

export type ItemData = {
  id: number;
  pathData: string;
  fillColor?: string;
  strokeColor?: string;
  strokeWidth?: number;
  opacity?: number;
  blendMode?: string;
};

interface DocumentContextValue {
  selectedItemIds: number[];
  setSelectedItemIds: React.Dispatch<React.SetStateAction<number[]>>;
  selectedProps: SelectedItemProps | null;
  setSelectedProps: (props: SelectedItemProps | null) => void;
  items: ItemData[];
  setItems: React.Dispatch<React.SetStateAction<ItemData[]>>;
  nextId: number;
  setNextId: React.Dispatch<React.SetStateAction<number>>;
}

const DocumentContext = createContext<DocumentContextValue | null>(null);

export function DocumentProvider({ children }: { children: React.ReactNode }) {
  const [selectedItemIds, setSelectedItemIds] = useState<number[]>([]);
  const [selectedProps, setSelectedProps] = useState<SelectedItemProps | null>(null);
  const [items, setItems] = useState<ItemData[]>([]);
  const [nextId, setNextId] = useState(1);

  return (
    <DocumentContext.Provider value={{ selectedItemIds, setSelectedItemIds, selectedProps, setSelectedProps, items, setItems, nextId, setNextId }}>
      {children}
    </DocumentContext.Provider>
  );
}

export function useDocument() {
  const ctx = useContext(DocumentContext);
  if (!ctx) throw new Error('useDocument must be used within DocumentProvider');
  return ctx;
}
