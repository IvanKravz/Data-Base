import React, { useEffect, useState } from 'react';
import { Canvas } from '@react-three/fiber';
import './NetworkVisualization.css';
import { useNetworkData } from './components/useNetworkData';
import NetworkScene from './components/NetworkScene';
import NetworkDetailsPanel from './components/NetworkDetailsPanel';

interface NetworkVisualizationProps {
  network: any;
  memberships: any[];
  directions: any[];
  highlightedNode?: string | null;
  selectedNode?: string | null; // Новый пропс
  onNodeSelect?: (nodeId: string) => void; // Новый пропс
  onClearSelection?: () => void; // Новый пропс
}

const NetworkVisualization: React.FC<NetworkVisualizationProps> = ({
  network,
  memberships,
  directions,
  highlightedNode: externalHighlightedNode,
  selectedNode: externalSelectedNode, // Новый пропс
  onNodeSelect, // Новый пропс
  onClearSelection // Новый пропс
}) => {
  const [selectedNode, setSelectedNode] = useState<string | null>(null);
  const [internalHighlightedNode, setInternalHighlightedNode] = useState<string | null>(null);

  const highlightedNode = externalHighlightedNode !== undefined
    ? externalHighlightedNode
    : internalHighlightedNode;

  // Синхронизируем внутреннее и внешнее состояние выбранного узла
  useEffect(() => {
    if (externalSelectedNode !== undefined) {
      setSelectedNode(externalSelectedNode);
    }
  }, [externalSelectedNode]);

  const { nodes, connections } = useNetworkData(network, memberships, directions);

  const handleNodeClick = (nodeId: string) => {
    setSelectedNode(prev => prev === nodeId ? null : nodeId);
    if (onNodeSelect) {
      onNodeSelect(nodeId);
    }
  };

  const handleClosePanel = () => {
    setSelectedNode(null);
    if (onClearSelection) {
      onClearSelection();
    }
  };

  return (
    <div className="network-visualization-container">
      <div className="network-visualization">
        <h3 className="network-visualization-title">Визуализация сети: {network.name}</h3>

        <div className="network-visualization-nodes">
          <Canvas camera={{ position: [40, 50, 30], fov: 45 }}>
            <NetworkScene
              nodes={nodes}
              connections={connections}
              highlightedNode={highlightedNode || null}
              selectedNode={selectedNode}
              onNodeClick={handleNodeClick}
              onNodeHover={setInternalHighlightedNode}
            />
          </Canvas>
        </div>

        <NetworkDetailsPanel
          selectedNode={selectedNode}
          memberships={memberships}
          onClosePanel={handleClosePanel} // Передаем обработчик закрытия
        />
      </div>
    </div>
  );
};

export default NetworkVisualization;