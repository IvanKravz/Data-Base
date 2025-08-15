import React, { useState, useMemo, useRef } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls, Text } from '@react-three/drei';
import * as THREE from 'three';
import './NetworkVisualization.css';
import { Network } from '../../../types';

interface Node {
  id: string;
  name: string;
  type: 'division' | 'facility';
  position: [number, number, number];
  radius: number;
  color: string;
  originalColor: string;
}

interface Connection {
  start: [number, number, number];
  end: [number, number, number];
  startId: string;
  endId: string;
  isFacilityConnection?: boolean;
}

interface NetworkVisualizationProps {
  network: Network;
  highlightedNode?: string | null;
}

const NetworkScene: React.FC<{
  nodes: Node[];
  connections: Connection[];
  highlightedNode: string | null;
  selectedNode: string | null;
  onNodeClick: (id: string) => void;
  onNodeHover: (id: string | null) => void;
}> = ({ nodes, connections, highlightedNode, selectedNode, onNodeClick, onNodeHover }) => {
  const materialRef = useRef<THREE.MeshBasicMaterial[]>([]);
  const textRefs = useRef<THREE.Group[]>([]);
  const camera = useThree(state => state.camera);
  
  useFrame(() => {
    // Обновляем цвета узлов
    nodes.forEach((node, i) => {
      if (materialRef.current[i]) {
        materialRef.current[i].color.setStyle(
          selectedNode === node.id ? '#FFD700' :
          highlightedNode === node.id ? '#61dafb' : 
          node.originalColor
        );
      }
    });
    
    // Обновляем направление текста к камере
    textRefs.current.forEach(textRef => {
      if (textRef) {
        textRef.lookAt(camera.position);
      }
    });
  });

  return (
    <>
      <ambientLight intensity={0.5} />
      <pointLight position={[10, 10, 10]} intensity={1} />
      <pointLight position={[-10, -10, -10]} intensity={0.5} />
      
      <OrbitControls 
        enableZoom={true}
        enablePan={true}
        enableRotate={true}
        zoomSpeed={0.6}
        panSpeed={0.5}
        rotateSpeed={0.8}
      />
      
      {connections.map((conn, idx) => {
        const isHighlighted = 
          highlightedNode === conn.startId || 
          highlightedNode === conn.endId ||
          selectedNode === conn.startId || 
          selectedNode === conn.endId;
        
        // Определяем стиль соединения
        let lineColor = 0xffffff;
        let opacity = 0.3;
        let lineWidth = 1;

        if (conn.isFacilityConnection) {
          lineColor = 0xff0000; // Красный для связей между объектами
          opacity = isHighlighted ? 0.9 : 0.2;
          lineWidth = 2; // Более толстые линии
        } else if (isHighlighted) {
          lineColor = 0x61dafb;
          opacity = 1;
        }

        const material = new THREE.LineBasicMaterial({
          color: lineColor,
          opacity: opacity,
          transparent: true,
          linewidth: lineWidth
        });
        
        const geometry = new THREE.BufferGeometry().setFromPoints([
          new THREE.Vector3(...conn.start),
          new THREE.Vector3(...conn.end)
        ]);
        
        return (
          <line key={idx} geometry={geometry} material={material} />
        );
      })}
      
      {nodes.map((node, idx) => (
        <group key={node.id}>
          <mesh
            position={new THREE.Vector3(...node.position)}
            onClick={() => onNodeClick(node.id)}
            onPointerOver={() => onNodeHover(node.id)}
            onPointerOut={() => onNodeHover(null)}
          >
            <sphereGeometry args={[node.radius, 32, 32]} />
            <meshBasicMaterial 
              ref={el => materialRef.current[idx] = el!} 
              color={node.originalColor} 
            />
          </mesh>
          <group
            ref={el => textRefs.current[idx] = el!}
            position={[node.position[0], node.position[1] - node.radius - 1, node.position[2]]}
          >
            <Text
              color="white"
              fontSize={1}
              anchorX="center"
              anchorY="middle"
              maxWidth={node.radius * 4}
            >
              {node.name}
            </Text>
          </group>
        </group>
      ))}
    </>
  );
};

const NetworkVisualization: React.FC<NetworkVisualizationProps> = ({ 
  network,
  highlightedNode: externalHighlightedNode
}) => {
  const [selectedNode, setSelectedNode] = useState<string | null>(null);
  const [internalHighlightedNode, setInternalHighlightedNode] = useState<string | null>(null);
  
  const highlightedNode = externalHighlightedNode !== undefined 
    ? externalHighlightedNode 
    : internalHighlightedNode;

    const { nodes, connections } = useMemo(() => {
      const nodes: Node[] = [];
      const connections: Connection[] = [];
      const allFacilities: Node[] = [];
      
      // Group elements by division
      const divisions = network.divisions || [];
      const subdivisions = network.subdivisions || [];
      const facilities = network.facilities || [];
      
      // Group facilities by division through subdivision
      const facilitiesByDivision: Record<number, typeof facilities> = {};
      
      // Initialize empty arrays for each division
      divisions.forEach(div => {
        facilitiesByDivision[div.id] = [];
      });
      
      // Map facilities to their divisions
      subdivisions.forEach(sub => {
        if (facilitiesByDivision[sub.division]) {
          const facs = facilities.filter(fac => fac.subdivision === sub.id);
          facilitiesByDivision[sub.division].push(...facs);
        }
      });
      
      // Position divisions in a circle
      const divisionRadius = 15;
      const divisionAngleStep = (2 * Math.PI) / Math.max(1, divisions.length);
      
      divisions.forEach((div, divIndex) => {
        const divisionAngle = divIndex * divisionAngleStep;
        
        // Position division
        const divX = divisionRadius * Math.cos(divisionAngle);
        const divZ = divisionRadius * Math.sin(divisionAngle);
        const divY = 20;
        nodes.push({
          id: `division-${div.id}`,
          name: div.name,
          type: 'division',
          position: [divX, divY, divZ],
          radius: 2.0,
          color: '#4a6fa5',
          originalColor: '#4a6fa5'
        });
        
        // Position facilities for this division in a circle around it
        const facs = facilitiesByDivision[div.id] || [];
        const facRadius = 8;
        const facAngleStep = facs.length > 0 ? (2 * Math.PI) / facs.length : 0;
        
        facs.forEach((fac, facIndex) => {
          const facAngle = facIndex * facAngleStep;
          const facX = divX + facRadius * Math.cos(facAngle);
          const facZ = divZ + facRadius * Math.sin(facAngle);
          const facY = 8;
          
          const facilityNode: Node = {
            id: `facility-${fac.id}`,
            name: fac.name,
            type: 'facility',
            position: [facX, facY, facZ],
            radius: 1.5,
            color: '#90cdf4',
            originalColor: '#90cdf4'
          };
          nodes.push(facilityNode);
          allFacilities.push(facilityNode);
          
          // Connect division to facility
          connections.push({
            start: [divX, divY, divZ],
            end: [facX, facY, facZ],
            startId: `division-${div.id}`,
            endId: `facility-${fac.id}`
          });
        });
      });
      
      // Add orphaned facilities (without parent division)
      const processedFacilityIds = new Set(allFacilities.map(f => f.id));
      facilities.forEach(fac => {
        if (!processedFacilityIds.has(`facility-${fac.id}`)) {
          const orphanedFacilityNode: Node = {
            id: `facility-${fac.id}`,
            name: fac.name,
            type: 'facility',
            position: [30, -10, allFacilities.length * 8 - 16],
            radius: 1.4,
            color: '#90cdf4',
            originalColor: '#90cdf4'
          };
          nodes.push(orphanedFacilityNode);
          allFacilities.push(orphanedFacilityNode);
        }
      });
      
      // Create connections between all facilities
      for (let i = 0; i < allFacilities.length; i++) {
        for (let j = i + 1; j < allFacilities.length; j++) {
          connections.push({
            start: allFacilities[i].position,
            end: allFacilities[j].position,
            startId: allFacilities[i].id,
            endId: allFacilities[j].id,
            isFacilityConnection: true
          });
        }
      }
      
      return { nodes, connections };
    }, [network]);
  
  const handleNodeClick = (nodeId: string) => {
    setSelectedNode(prev => prev === nodeId ? null : nodeId);
  };
  
  const renderNodeDetails = (nodeId: string) => {
    const [type, id] = nodeId.split('-');
    let node;
    
    switch(type) {
      case 'division':
        node = network.divisions?.find(d => d.id === parseInt(id));
        break;
      case 'facility':
        node = network.facilities?.find(f => f.id === parseInt(id));
        break;
      default:
        return null;
    }

    if (!node) return null;

    return (
      <>
        <div className="network-details-item">
          <div className="network-details-label">Name</div>
          <div className="network-details-value">{node.name}</div>
        </div>
        <div className="network-details-item">
          <div className="network-details-label">Type</div>
          <div className="network-details-value">{type}</div>
        </div>
        <div className="network-details-item">
          <div className="network-details-label">ID</div>
          <div className="network-details-value">{node.id}</div>
        </div>
      </>
    );
  };

  return (
    <div className="network-visualization-container">
      <div className="network-visualization">
        <h3 className="network-visualization-title">Визуализация сети: {network.name}</h3>
        
        <div className="network-visualization-nodes">
          <Canvas camera={{ position: [0, 10, 60], fov: 50 }}>
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
        
        <div className={`network-visualization-details ${selectedNode ? 'active' : ''}`}>
          <h4 className="network-visualization-details-title">
            {selectedNode ? selectedNode.split('-')[0] : 'Node'} Details
          </h4>
          <div className="network-visualization-details-content">
            {selectedNode && renderNodeDetails(selectedNode)}
          </div>
        </div>
      </div>
    </div>
  );
};

export default NetworkVisualization;