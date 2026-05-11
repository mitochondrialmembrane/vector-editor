import React from 'react';
import paper from 'paper';
import { Eye, Lock, Merge, Component, MinusCircle } from 'lucide-react';
import { useDocument, type ItemData } from '../context/DocumentContext';
import type { SelectedItemProps } from '../context/DocumentContext';

const BAUHAUS_PALETTE = [
  { name: 'Red', hex: '#D22B2B' },
  { name: 'Blue', hex: '#0047AB' },
  { name: 'Yellow', hex: '#FFBF00' },
  { name: 'Black', hex: '#111111' },
  { name: 'White', hex: '#F8F8F8' },
];

const BLEND_MODES = ['normal', 'multiply', 'screen', 'overlay', 'difference'];

interface Layer {
  id: string;
  name: string;
  visible: boolean;
  locked: boolean;
}

const PLACEHOLDER_LAYERS: Layer[] = [
  { id: '1', name: 'Layer 1', visible: true, locked: false },
];

export default function Sidebar() {
  const {
    selectedItemIds,
    setSelectedItemIds,
    selectedProps,
    setSelectedProps,
    items,
    setItems,
    nextId,
    setNextId,
  } = useDocument();

  function applyToPrimary(updater: (item: paper.Item) => void, propPatch: Partial<SelectedItemProps>) {
    const primaryId = selectedItemIds[0];
    if (primaryId === undefined) return;
    const item = paper.project.getItem({ data: { id: primaryId } });
    if (item) updater(item);
    paper.view.update();
    if (selectedProps) setSelectedProps({ ...selectedProps, ...propPatch });
  }

  const handleColorChange = (key: 'strokeColor' | 'fillColor', hex: string) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const color = hex === 'none' ? null : new paper.Color(hex);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    applyToPrimary(item => { (item as any)[key] = color; }, { [key]: hex });
  };

  const handleWidthChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseInt(e.target.value, 10);
    applyToPrimary(item => { item.strokeWidth = val; }, { strokeWidth: val });
  };

  const handleOpacityChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    applyToPrimary(item => { item.opacity = val; }, { opacity: val });
  };

  const handleBlendModeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const blendMode = e.target.value;
    applyToPrimary(item => { item.blendMode = blendMode; }, { blendMode });
  };

  const handleBooleanOp = (operation: 'union' | 'intersect' | 'subtract') => {
    if (selectedItemIds.length < 2) return;

    const paperItems = selectedItemIds
      .map(id => paper.project.getItem({ data: { id } }) as paper.PathItem | null)
      .filter((p): p is paper.PathItem => p !== null);
    if (paperItems.length < 2) return;

    const [primary, ...rest] = paperItems;
    let result: paper.PathItem = primary;
    for (const next of rest) {
      if (operation === 'union') {
        result = result.unite(next, { insert: false });
      } else if (operation === 'intersect') {
        result = result.intersect(next, { insert: false });
      } else {
        result = result.subtract(next, { insert: false });
      }
    }

    const pathData = result.pathData;
    if (!pathData) {
      setItems(prev => prev.filter(item => !selectedItemIds.includes(item.id)));
      setSelectedItemIds([]);
      setSelectedProps(null);
      return;
    }

    const primaryData = items.find(item => item.id === selectedItemIds[0]);
    const newId = nextId;
    const newItem: ItemData = {
      id: newId,
      pathData,
      fillColor: primaryData?.fillColor ?? 'none',
      strokeColor: primaryData?.strokeColor ?? '#111111',
      strokeWidth: primaryData?.strokeWidth ?? 3,
      opacity: primaryData?.opacity ?? 1,
      blendMode: primaryData?.blendMode ?? 'normal',
    };

    setItems(prev => [...prev.filter(item => !selectedItemIds.includes(item.id)), newItem]);
    setNextId(newId + 1);
    setSelectedItemIds([newId]);
    setSelectedProps({
      fillColor: newItem.fillColor!,
      strokeColor: newItem.strokeColor!,
      strokeWidth: newItem.strokeWidth!,
      opacity: newItem.opacity!,
      blendMode: newItem.blendMode!,
    });
  };

  const canBoolean = selectedItemIds.length >= 2;

  return (
    <div className="sidebar">
      <section className="sidebar-section">
        <h3 className="sidebar-heading">Layers</h3>
        <div className="layer-list">
          {PLACEHOLDER_LAYERS.map(layer => (
            <div key={layer.id} className="layer-item">
              <span className="layer-name">{layer.name}</span>
              <div className="layer-actions">
                <button className="layer-action-btn" title="Toggle visibility">
                  <Eye size={13} />
                </button>
                <button className="layer-action-btn" title="Toggle lock">
                  <Lock size={13} />
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="sidebar-section">
        <h3 className="sidebar-heading">Boolean Operations</h3>
        <div className="boolean-actions">
          <button
            className="boolean-action-btn"
            title="Union all selected"
            disabled={!canBoolean}
            onClick={() => handleBooleanOp('union')}
          >
            <Merge size={16} /> Union
          </button>
          <button
            className="boolean-action-btn"
            title="Intersect all selected"
            disabled={!canBoolean}
            onClick={() => handleBooleanOp('intersect')}
          >
            <Component size={16} /> Intersect
          </button>
          <button
            className="boolean-action-btn"
            title="Subtract secondary selection from primary"
            disabled={!canBoolean}
            onClick={() => handleBooleanOp('subtract')}
          >
            <MinusCircle size={16} /> Difference
          </button>
        </div>
      </section>

      <section className="sidebar-section">
        <h3 className="sidebar-heading">Properties</h3>
        {selectedProps ? (
          <div className="properties-panel">
            <div className="property-row">
              <label>Fill</label>
              <div className="color-palette">
                <button
                  className={`color-swatch none-swatch ${selectedProps.fillColor === 'none' ? 'active' : ''}`}
                  onClick={() => handleColorChange('fillColor', 'none')}
                  title="None"
                />
                {BAUHAUS_PALETTE.map(c => (
                  <button
                    key={c.name}
                    className={`color-swatch ${selectedProps.fillColor === c.hex ? 'active' : ''}`}
                    style={{ backgroundColor: c.hex }}
                    onClick={() => handleColorChange('fillColor', c.hex)}
                    title={c.name}
                  />
                ))}
              </div>
            </div>
            <div className="property-row">
              <label>Stroke</label>
              <div className="color-palette">
                <button
                  className={`color-swatch none-swatch ${selectedProps.strokeColor === 'none' ? 'active' : ''}`}
                  onClick={() => handleColorChange('strokeColor', 'none')}
                  title="None"
                />
                {BAUHAUS_PALETTE.map(c => (
                  <button
                    key={c.name}
                    className={`color-swatch ${selectedProps.strokeColor === c.hex ? 'active' : ''}`}
                    style={{ backgroundColor: c.hex }}
                    onClick={() => handleColorChange('strokeColor', c.hex)}
                    title={c.name}
                  />
                ))}
              </div>
            </div>
            <div className="property-row">
              <label>Width ({selectedProps.strokeWidth}px)</label>
              <input
                type="range"
                min="1"
                max="20"
                value={selectedProps.strokeWidth}
                onChange={handleWidthChange}
              />
            </div>
            <div className="property-row">
              <label>Opacity ({Math.round(selectedProps.opacity * 100)}%)</label>
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={selectedProps.opacity}
                onChange={handleOpacityChange}
              />
            </div>
            <div className="property-row">
              <label>Blend</label>
              <select value={selectedProps.blendMode} onChange={handleBlendModeChange}>
                {BLEND_MODES.map(bm => (
                  <option key={bm} value={bm}>{bm}</option>
                ))}
              </select>
            </div>
          </div>
        ) : (
          <p className="sidebar-empty">No object selected</p>
        )}
      </section>
    </div>
  );
}
