// components/networks/NetworkVisualization/NetworkVisualization.tsx
import React, { useState, useEffect } from 'react';
import { Canvas, useThree } from '@react-three/fiber';
import './NetworkVisualization.css';
import { useNetworkData } from './components/useNetworkData';
import NetworkScene from './components/NetworkScene';

/**
 * Мост размера: при изменении size.width/size.height в R3F
 * форсируем re-render — это гарантирует, что <Html> из drei
 * (который подписан на size) обновит позицию в том же кадре,
 * что и WebGL, а не «догонит» позже.
 */
const ResizeBridge: React.FC = () => {
  const width = useThree((s) => s.size.width);
  const height = useThree((s) => s.size.height);
  const invalidate = useThree((s) => s.invalidate);

  useEffect(() => {
    // R3F с frameloop="always" и так рендерит каждый кадр,
    // но invalidate() гарантирует немедленный кадр после смены size.
    invalidate();
  }, [width, height, invalidate]);

  return null;
};

interface NetworkVisualizationProps {
  network: any;
  memberships: any[];
  directions: any[];
  highlightedNode?: string | null;
  selectedNode?: string | null;
  onNodeSelect?: (nodeId: string) => void;
  onClearSelection?: () => void;
}

const NetworkVisualization: React.FC<NetworkVisualizationProps> = ({
  network,
  memberships,
  directions,
  highlightedNode: externalHighlightedNode,
  selectedNode: externalSelectedNode,
  onNodeSelect,
  onClearSelection,
}) => {
  const [internalSelectedNode, setInternalSelectedNode] = useState<string | null>(null);
  const [internalHighlightedNode, setInternalHighlightedNode] = useState<string | null>(null);

  const selectedNode = externalSelectedNode !== undefined
    ? externalSelectedNode
    : internalSelectedNode;

  const highlightedNode = externalHighlightedNode !== undefined
    ? externalHighlightedNode
    : internalHighlightedNode;

  const { nodes, connections } = useNetworkData(network, memberships, directions);

  const handleNodeClick = (nodeId: string) => {
    const isDeselect = selectedNode === nodeId;
    if (externalSelectedNode === undefined) {
      setInternalSelectedNode(isDeselect ? null : nodeId);
    }
    if (isDeselect) {
      onClearSelection?.();
    } else {
      onNodeSelect?.(nodeId);
    }
  };

  return (
    <div className="network-visualization-container">
      <div className="network-visualization">
        <header className="network-viz-header">
          <h3 className="network-viz-title">
            <span className="network-viz-title-label">Визуализация сети</span>
            <span className="network-viz-title-name">{network.name}</span>
          </h3>

          <div className="network-viz-legend">
            <span><i className="viz-dot viz-dot--division" /> Подразделение</span>
            <span><i className="viz-dot viz-dot--facility" /> Объект</span>
            <span><i className="viz-dot viz-dot--equipment" /> Оборудование</span>
            <span><i className="viz-dot viz-dot--direction" /> Направление</span>
          </div>
        </header>

        <div className="network-viz-canvas">
          <Canvas
            camera={{ position: [55, 45, 95], fov: 40 }}
            dpr={[1, 2]}
            gl={{ antialias: true, alpha: false }}
            resize={{ debounce: 0, scroll: false }}   /* ← ключевой фикс */
            frameloop="always"
            style={{ width: '100%', height: '100%' }}
          >
            <ResizeBridge />
            <NetworkScene
              nodes={nodes}
              connections={connections}
              highlightedNode={highlightedNode || null}
              selectedNode={selectedNode || null}
              onNodeClick={handleNodeClick}
              onNodeHover={setInternalHighlightedNode}
            />
          </Canvas>
        </div>
      </div>
    </div>
  );
};

export default NetworkVisualization;