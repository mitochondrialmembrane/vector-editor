import React from 'react';
import paper from 'paper';
import { Eye, Lock, Merge, Component, MinusCircle } from 'lucide-react';
import { useDocument } from '../context/DocumentContext';
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
  const { selectedItemId, selectedProps, setSelectedProps } = useDocument();

  function applyToSelected(updater: (item: paper.Item) => void, propPatch: Partial<SelectedItemProps>) {
    if (selectedItemId === null) return;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const item = paper.project.getItem({ id: selectedItemId } as any);
    if (!item) return;
    updater(item);
    paper.view.update();
    if (selectedProps) setSelectedProps({ ...selectedProps, ...propPatch });
  }

  const handleColorChange = (key: 'strokeColor' | 'fillColor', hex: string) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const color = hex === 'none' ? null : new paper.Color(hex);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    applyToSelected(item => { (item as any)[key] = color; }, { [key]: hex });
  };

  const handleWidthChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseInt(e.target.value, 10);
    applyToSelected(item => { item.strokeWidth = val; }, { strokeWidth: val });
  };

  const handleOpacityChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    applyToSelected(item => { item.opacity = val; }, { opacity: val });
  };

  const handleBlendModeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value;
    applyToSelected(item => { item.blendMode = val; }, { blendMode: val });
  };

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
          <button className="boolean-action-btn" title="Union">
            <Merge size={16} /> Union
          </button>
          <button className="boolean-action-btn" title="Intersect">
            <Component size={16} /> Intersect
          </button>
          <button className="boolean-action-btn" title="Subtract">
            <MinusCircle size={16} /> Subtract
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
