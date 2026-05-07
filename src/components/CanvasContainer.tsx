import { useEffect, useLayoutEffect, useRef, useState, type MouseEvent } from 'react';
import paper from 'paper';
import { useActiveTool } from '../context/ActiveToolContext';
import { useDocument } from '../context/DocumentContext';

type ItemType = 'Rectangle' | 'Ellipse' | 'Path';

type ItemData = {
  id: number;
  type: ItemType;
  props: Record<string, any>;
};

export default function CanvasContainer() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const { activeToolName } = useActiveTool();
  const { selectedItemId, selectedProps, setSelectedItemId, setSelectedProps } = useDocument();

  const [items, setItems] = useState<ItemData[]>([
  ]);
  const [nextId, setNextId] = useState(2);
  const [drawingId, setDrawingId] = useState<number | null>(null);
  const [dragStart, setDragStart] = useState<paper.Point | null>(null);
  const [cursor, setCursor] = useState('default');
  const panStart = useRef<paper.Point | null>(null);
  const panStartScreen = useRef<paper.Point | null>(null);
  const selectedDragItem = useRef<paper.Item | null>(null);
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

  const applyItemStyle = (item: paper.Item, props: Record<string, any>) => {
    if ('strokeColor' in props) {
      item.strokeColor = new paper.Color(props.strokeColor);
    }
    if ('strokeWidth' in props) {
      item.strokeWidth = props.strokeWidth;
    }
    if ('fillColor' in props) {
      item.fillColor = props.fillColor === 'none' ? null as unknown as paper.Color : new paper.Color(props.fillColor);
    }
    if ('opacity' in props) {
      item.opacity = props.opacity;
    }
  };

  const moveItemProps = (item: ItemData, delta: paper.Point): ItemData => {
    const dx = delta.x;
    const dy = delta.y;

    if (item.type === 'Rectangle' || item.type === 'Ellipse') {
      const from = new paper.Point(item.props.from);
      const to = new paper.Point(item.props.to);
      return {
        ...item,
        props: {
          ...item.props,
          from: [from.x + dx, from.y + dy],
          to: [to.x + dx, to.y + dy],
        },
      };
    }

    if (item.type === 'Path' && Array.isArray(item.props.segments)) {
      return {
        ...item,
        props: {
          ...item.props,
          segments: item.props.segments.map((segment: any) => [segment[0] + dx, segment[1] + dy]),
        },
      };
    }

    return item;
  };

  const drawItems = () => {
    const layer = paper.project.activeLayer;
    if (!layer) return;
    layer.removeChildren();

    items.forEach(item => {
      let paperItem: paper.Item | null = null;
      switch (item.type) {
        case 'Rectangle': {
          const from = new paper.Point(item.props.from);
          const to = new paper.Point(item.props.to);
          paperItem = new paper.Path.Rectangle(new paper.Rectangle(from, to));
          break;
        }
        case 'Ellipse': {
          const from = new paper.Point(item.props.from);
          const to = new paper.Point(item.props.to);
          paperItem = new paper.Path.Ellipse(new paper.Rectangle(from, to));
          break;
        }
        case 'Path': {
          if (Array.isArray(item.props.segments)) {
            const path = new paper.Path();
            item.props.segments.forEach((segment: any) => {
              path.add(new paper.Point(segment));
            });
            paperItem = path;
          }
          break;
        }
        default:
          break;
      }
      if (paperItem) {
        paperItem.data = { id: item.id };
        applyItemStyle(paperItem, item.props);
        paperItem.selected = item.id === selectedItemId;
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
  }, [items, selectedItemId]);

  useEffect(() => {
    if (selectedItemId !== null && selectedProps) {
      setItems(prev => prev.map(item => {
        if (item.id !== selectedItemId) return item;
        return {
          ...item,
          props: {
            ...item.props,
            ...selectedProps,
          },
        };
      }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedItemId, selectedProps]);

  useEffect(() => {
    updateCanvasSize();
    window.addEventListener('resize', updateCanvasSize);
    return () => window.removeEventListener('resize', updateCanvasSize);
  }, []);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Backspace' || event.key === 'Delete') {
        if (selectedItemId !== null) {
          setItems(prev => prev.filter(item => item.id !== selectedItemId));
          setSelectedItemId(null);
          setSelectedProps(null);
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedItemId, setSelectedItemId, setSelectedProps]);

  const projectPoint = (event: MouseEvent<HTMLCanvasElement>) => {
    const bounds = event.currentTarget.getBoundingClientRect();
    const viewPoint = new paper.Point(event.clientX - bounds.left, event.clientY - bounds.top);
    return paper.view.viewToProject(viewPoint);
  };

  useEffect(() => {
    if (activeToolName === 'select') {
      setCursor('pointer');
    } else {
      setCursor('crosshair');
    }
  }, [activeToolName]);

  const handleMouseDown = (event: MouseEvent<HTMLCanvasElement>) => {
    const point = projectPoint(event);

    if (activeToolName === 'select') {
      const hit = paper.project.hitTest(point, { fill: true, stroke: true, tolerance: 5 });
      if (hit?.item) {
        selectedDragItem.current = hit.item;
        const itemId = Number(hit.item.data?.id ?? null);
        if (!Number.isNaN(itemId)) {
          selectedDragItemId.current = itemId;
          setSelectedItemId(itemId);
          setSelectedProps({
            fillColor: hit.item.fillColor?.toCSS(true) ?? 'none',
            strokeColor: hit.item.strokeColor?.toCSS(true) ?? 'none',
            strokeWidth: typeof hit.item.strokeWidth === 'number' ? hit.item.strokeWidth : 1,
            opacity: typeof hit.item.opacity === 'number' ? hit.item.opacity : 1,
            blendMode: hit.item.blendMode || 'normal',
          });
          setDragStart(point);
          setCursor('grabbing');
          return;
        }
      }
      selectedDragItem.current = null;
      selectedDragItemId.current = null;
      panStart.current = point;
      panStartScreen.current = new paper.Point(event.clientX, event.clientY);
      setSelectedItemId(null);
      setSelectedProps(null);
      setCursor('grabbing');
      return;
    }

    if (activeToolName === 'rect') {
      const id = nextId;
      const newItem: ItemData = {
        id,
        type: 'Rectangle',
        props: {
          from: [point.x, point.y],
          to: [point.x + 1, point.y + 1],
          fillColor: 'none',
          strokeColor: '#111111',
          strokeWidth: 3,
          opacity: 1,
        },
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
          if (item.id !== selectedDragItemId.current) return item;
          return moveItemProps(item, delta);
        }));
        setDragStart(point);
        return;
      }

      if (panStart.current) {
        const screenDelta = new paper.Point(event.clientX, event.clientY).subtract(panStartScreen.current!);
        paper.view.center = paper.view.center.subtract(paper.view.viewToProject(screenDelta));
        panStartScreen.current = new paper.Point(event.clientX, event.clientY);
        paper.view.update();
        return;
      }
    }

    if (activeToolName === 'rect' && drawingId !== null && dragStart) {
      setItems(prev => prev.map(item => {
        if (item.id !== drawingId) return item;
        return {
          ...item,
          props: {
            ...item.props,
            to: [point.x, point.y],
          },
        };
      }));
    }
  };

  const handleMouseUp = () => {
    if (drawingId !== null) {
      setDrawingId(null);
      setDragStart(null);
    }
    if (panStart.current) {
      panStart.current = null;
      panStartScreen.current = null;
    }
    if (selectedDragItem.current) {
      selectedDragItem.current = null;
      selectedDragItemId.current = null;
      setDragStart(null);
    }
    if (activeToolName === 'select') {
      setCursor('pointer');
    } else if (activeToolName === 'rect') {
      setCursor('crosshair');
    } else {
      setCursor('default');
    }
  };

  const handleMouseLeave = () => {
    panStart.current = null;
    panStartScreen.current = null;
    selectedDragItem.current = null;
    selectedDragItemId.current = null;
    setDragStart(null);
    if (activeToolName === 'select') {
      setCursor('pointer');
    } else if (activeToolName === 'rect') {
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
