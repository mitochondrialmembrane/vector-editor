import { Eye, Lock } from 'lucide-react';

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
        <h3 className="sidebar-heading">Properties</h3>
        <p className="sidebar-empty">No object selected</p>
      </section>
    </div>
  );
}
