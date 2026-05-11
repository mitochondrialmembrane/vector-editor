import { useEffect, useLayoutEffect, useRef, useState, type MouseEvent } from 'react';
import paper from 'paper';
import { useActiveTool } from '../context/ActiveToolContext';
import { useDocument, type ItemData } from '../context/DocumentContext';

const isCompoundPathData = (pathData: string) => (pathData.match(/[Mm]/g) || []).length > 1;

const createPathItem = (pathData: string, insert = true): paper.PathItem => {
  if (isCompoundPathData(pathData)) {
    return new paper.CompoundPath({ pathData, insert });
  }
  return new paper.Path({ pathData, insert });
};

const shapePathData = (tool: 'rect' | 'ellipse' | 'line', from: paper.Point, to: paper.Point): string => {
  let path: paper.Path;
  if (tool === 'rect') {
    path = new paper.Path.Rectangle({ from, to, insert: false });
  } else if (tool === 'ellipse') {
    path = new paper.Path.Ellipse({ from, to, insert: false });
  } else {
    path = new paper.Path({ segments: [from, to], insert: false });
  }
  return path.pathData;
};

const findTopPaperItem = (item: paper.Item | null): paper.Item | null => {
  let cur: paper.Item | null = item;
  while (cur) {
    if (typeof cur.data?.id === 'number') return cur;
    cur = cur.parent;
  }
  return null;
};

export default function CanvasContainer() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const { activeToolName } = useActiveTool();
  const {
    selectedItemIds,
    selectedProps,
    setSelectedItemIds,
    setSelectedProps,
    items,
    setItems,
    nextId,
    setNextId,
  } = useDocument();
  const [drawingId, setDrawingId] = useState<number | null>(null);
  const [dragStart, setDragStart] = useState<paper.Point | null>(null);
  const [cursor, setCursor] = useState('default');
  const panStartScreen = useRef<paper.Point | null>(null);
  const selectedDragItemId = useRef<number | null>(null);
  const [canvasSize, setCanvasSize] = useState({ width: 800, height: 600 });

  const updateCanvasSize = () => {
    if (!containerRef.current || !canvasRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    if (!rect.width || !rect.height) return;
    const width = Math.floor(rect.width);
    const height = Math.floor(rect.height);
    if (width === canvasSize.width && height === canvasSize.height) return;
    setCanvasSize({ width, height });
  };

  const applyItemStyle = (paperItem: paper.Item, data: ItemData) => {
    if (data.strokeColor !== undefined) {
      paperItem.strokeColor = data.strokeColor === 'none'
        ? null as unknown as paper.Color
        : new paper.Color(data.strokeColor);
    }
    if (data.strokeWidth !== undefined) {
      paperItem.strokeWidth = data.strokeWidth;
    }
    if (data.fillColor !== undefined) {
      paperItem.fillColor = data.fillColor === 'none'
        ? null as unknown as paper.Color
        : new paper.Color(data.fillColor);
    }
    if (data.opacity !== undefined) {
      paperItem.opacity = data.opacity;
    }
    if (data.blendMode !== undefined) {
      paperItem.blendMode = data.blendMode;
    }
  };

  const translatePathData = (pathData: string, delta: paper.Point): string => {
    const tmp = createPathItem(pathData, false);
    const shiftPath = (path: paper.Path) => {
      path.segments.forEach(seg => {
        seg.point = new paper.Point(seg.point.x + delta.x, seg.point.y + delta.y);
      });
    };
    if (tmp instanceof paper.CompoundPath) {
      tmp.children.forEach(child => {
        if (child instanceof paper.Path) shiftPath(child);
      });
    } else if (tmp instanceof paper.Path) {
      shiftPath(tmp);
    }
    return tmp.pathData;
  };

  const drawItems = () => {
    const layer = paper.project.activeLayer;
    if (!layer) return;
    layer.removeChildren();

    items.forEach(item => {
      if (!item.pathData) return;
      const paperItem = createPathItem(item.pathData);
      paperItem.data = { id: item.id };
      applyItemStyle(paperItem, item);
      const isSelected = selectedItemIds.includes(item.id);
      paperItem.selected = isSelected;
      if (isSelected) {
        const isPrimary = selectedItemIds[0] === item.id;
        paperItem.selectedColor = isPrimary ? null as unknown as paper.Color : new paper.Color('#9ca3af');
      }
    });

    paper.view.update();
  };

  useLayoutEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    canvas.width = canvasSize.width;
    canvas.height = canvasSize.height;
    canvas.style.width = `${canvasSize.width}px`;
    canvas.style.height = `${canvasSize.height}px`;

    paper.setup(canvas);
    paper.view.viewSize = new paper.Size(canvasSize.width, canvasSize.height);
    drawItems();

    return () => {
      paper.project.clear();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    canvas.width = canvasSize.width;
    canvas.height = canvasSize.height;
    canvas.style.width = `${canvasSize.width}px`;
    canvas.style.height = `${canvasSize.height}px`;
    paper.view.viewSize = new paper.Size(canvasSize.width, canvasSize.height);
    paper.view.update();
  }, [canvasSize]);

  useEffect(() => {
    if (paper.project) {
      drawItems();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [items, selectedItemIds]);

  useEffect(() => {
    if (selectedItemIds.length > 0 && selectedProps) {
      setItems(prev => prev.map(item => {
        if (item.id !== selectedItemIds[0]) return item;
        return { ...item, ...selectedProps };
      }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedItemIds, selectedProps]);

  useEffect(() => {
    updateCanvasSize();
    window.addEventListener('resize', updateCanvasSize);
    return () => window.removeEventListener('resize', updateCanvasSize);
  }, []);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Backspace' || event.key === 'Delete') {
        if (selectedItemIds.length > 0) {
          setItems(prev => prev.filter(item => !selectedItemIds.includes(item.id)));
          setSelectedItemIds([]);
          setSelectedProps(null);
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedItemIds, setSelectedItemIds, setSelectedProps]);

  const projectPoint = (event: MouseEvent<HTMLCanvasElement>) => {
    const bounds = event.currentTarget.getBoundingClientRect();
    const viewPoint = new paper.Point(event.clientX - bounds.left, event.clientY - bounds.top);
    return paper.view.viewToProject(viewPoint);
  };

  useEffect(() => {
    if (activeToolName === 'select') {
      setCursor('pointer');
    } else if (activeToolName === 'rect' || activeToolName === 'ellipse' || activeToolName === 'line') {
      setCursor('crosshair');
    } else {
      setCursor('default');
    }
  }, [activeToolName]);

  const handleMouseDown = (event: MouseEvent<HTMLCanvasElement>) => {
    const point = projectPoint(event);

    if (activeToolName === 'select') {
      const hit = paper.project.hitTest(point, { fill: true, stroke: true, tolerance: 10 });
      const topItem = findTopPaperItem(hit?.item ?? null);
      if (topItem) {
        const itemId = topItem.data.id as number;
        selectedDragItemId.current = itemId;
        const isShiftPressed = event.shiftKey;
        let nextIds: number[];
        if (isShiftPressed) {
          nextIds = selectedItemIds.includes(itemId)
            ? selectedItemIds.filter(id => id !== itemId)
            : [...selectedItemIds, itemId];
        } else {
          nextIds = [itemId];
        }
        setSelectedItemIds(nextIds);
        const newPrimaryId = nextIds[0];
        const newPrimary = newPrimaryId !== undefined
          ? items.find(it => it.id === newPrimaryId)
          : undefined;
        if (newPrimary) {
          setSelectedProps({
            fillColor: newPrimary.fillColor ?? 'none',
            strokeColor: newPrimary.strokeColor ?? 'none',
            strokeWidth: newPrimary.strokeWidth ?? 1,
            opacity: newPrimary.opacity ?? 1,
            blendMode: newPrimary.blendMode ?? 'normal',
          });
        } else {
          setSelectedProps(null);
        }
        setDragStart(point);
        setCursor('grabbing');
        return;
      }
      selectedDragItemId.current = null;
      if (!event.shiftKey) {
        setSelectedItemIds([]);
        setSelectedProps(null);
      }
      panStartScreen.current = new paper.Point(event.clientX, event.clientY);
      setCursor('grabbing');
      return;
    }

    if (activeToolName === 'rect' || activeToolName === 'ellipse' || activeToolName === 'line') {
      const id = nextId;
      const initialTo = point.add(new paper.Point(1, 1));
      const newItem: ItemData = {
        id,
        pathData: shapePathData(activeToolName, point, initialTo),
        fillColor: 'none',
        strokeColor: '#111111',
        strokeWidth: 3,
        opacity: 1,
      };
      setItems(prev => [...prev, newItem]);
      setNextId(id + 1);
      setDrawingId(id);
      setDragStart(point);
    }
  };

  const handleMouseMove = (event: MouseEvent<HTMLCanvasElement>) => {
    const point = projectPoint(event);

    if (activeToolName === 'select') {
      if (selectedDragItemId.current !== null && dragStart) {
        const delta = point.subtract(dragStart);
        setItems(prev => prev.map(item => {
          if (!selectedItemIds.includes(item.id)) return item;
          return { ...item, pathData: translatePathData(item.pathData, delta) };
        }));
        setDragStart(point);
        return;
      }

      if (panStartScreen.current) {
        const screenDelta = new paper.Point(event.clientX, event.clientY).subtract(panStartScreen.current);
        const projectOrigin = paper.view.viewToProject(new paper.Point(0, 0));
        const projectOffset = paper.view.viewToProject(screenDelta).subtract(projectOrigin);
        paper.view.center = paper.view.center.subtract(projectOffset);
        panStartScreen.current = new paper.Point(event.clientX, event.clientY);
        paper.view.update();
        return;
      }
    }

    if ((activeToolName === 'rect' || activeToolName === 'ellipse' || activeToolName === 'line')
        && drawingId !== null && dragStart) {
      const tool = activeToolName;
      const newPathData = shapePathData(tool, dragStart, point);
      setItems(prev => prev.map(item => {
        if (item.id !== drawingId) return item;
        return { ...item, pathData: newPathData };
      }));
    }
  };

  const handleMouseUp = () => {
    if (drawingId !== null) {
      const createdItem = items.find(item => item.id === drawingId);
      setSelectedItemIds([drawingId]);
      if (createdItem) {
        setSelectedProps({
          fillColor: createdItem.fillColor ?? 'none',
          strokeColor: createdItem.strokeColor ?? 'none',
          strokeWidth: typeof createdItem.strokeWidth === 'number' ? createdItem.strokeWidth : 1,
          opacity: typeof createdItem.opacity === 'number' ? createdItem.opacity : 1,
          blendMode: createdItem.blendMode || 'normal',
        });
      }
      setDrawingId(null);
      setDragStart(null);
    }
    if (panStartScreen.current) {
      panStartScreen.current = null;
    }
    if (selectedDragItemId.current !== null) {
      selectedDragItemId.current = null;
      setDragStart(null);
    }
    if (activeToolName === 'select') {
      setCursor('pointer');
    } else if (activeToolName === 'rect' || activeToolName === 'ellipse' || activeToolName === 'line') {
      setCursor('crosshair');
    } else {
      setCursor('default');
    }
  };

  const handleMouseLeave = () => {
    panStartScreen.current = null;
    selectedDragItemId.current = null;
    setDragStart(null);
    if (activeToolName === 'select') {
      setCursor('pointer');
    } else if (activeToolName === 'rect' || activeToolName === 'ellipse' || activeToolName === 'line') {
      setCursor('crosshair');
    } else {
      setCursor('default');
    }
  };

  return (
    <div ref={containerRef} className="canvas-container">
      <canvas
        ref={canvasRef}
        style={{ cursor }}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseLeave}
      />
    </div>
  );
}
