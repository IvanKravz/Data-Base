// components/networks/NetworkVisualization/NetworkVisualizationWithTabs.tsx
import React, { useState } from 'react';
import '../NetworkVisualization.css';
import NetworkVisualization from '../NetworkVisualization';
import NetworkSchema2D from '../../NetworkSchema2D/NetworkSchema2D';

interface NetworkVisualizationWithTabsProps {
  network: any;
  memberships: any[];
  directions: any[];
  highlightedNode?: string | null;
  selectedNode?: string | null;
  onNodeSelect?: (nodeId: string) => void;
  onClearSelection?: () => void;
  onNodeHover?: (nodeId: string | null) => void;
}

type ViewMode = '3d' | 'schema';

const NetworkVisualizationWithTabs: React.FC<NetworkVisualizationWithTabsProps> = ({
  network,
  memberships,
  directions,
  highlightedNode,
  selectedNode,
  onNodeSelect,
  onClearSelection,
  onNodeHover,
}) => {
  const [viewMode, setViewMode] = useState<ViewMode>('3d');

  return (
    <div className="network-visualization-container">
      <div className="network-visualization">
        <div className="view-tabs">
          <button
            className={`tab-button ${viewMode === '3d' ? 'active' : ''}`}
            onClick={() => setViewMode('3d')}
          >
            3D Визуализация
          </button>
          <button
            className={`tab-button ${viewMode === 'schema' ? 'active' : ''}`}
            onClick={() => setViewMode('schema')}
          >
            Структурная схема
          </button>
        </div>

        {viewMode === '3d' && (
          <NetworkVisualization
            network={network}
            memberships={memberships}
            directions={directions}
            highlightedNode={highlightedNode}
            selectedNode={selectedNode}
            onNodeSelect={onNodeSelect}
            onClearSelection={onClearSelection}
          />
        )}

        {viewMode === 'schema' && (
          <NetworkSchema2D
            network={network}
            memberships={memberships}
            directions={directions}
            highlightedNode={highlightedNode}
            selectedNode={selectedNode}
            onNodeSelect={onNodeSelect}
            onNodeHover={onNodeHover}
            onClearSelection={onClearSelection}
          />
        )}
      </div>
    </div>
  );
};

export default NetworkVisualizationWithTabs;