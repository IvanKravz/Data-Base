import React, { useState, useMemo, useRef } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls, Text } from '@react-three/drei';
import * as THREE from 'three';
import './NetworkVisualization.css';
import { Network } from '../../../types';

interface Node {
  id: string;
  name: string;
  type: 'division' | 'subdivision' | 'facility';
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
        
        const material = new THREE.LineBasicMaterial({
          color: isHighlighted ? 0x61dafb : 0xffffff,
          opacity: isHighlighted ? 1 : 0.3,
          transparent: true
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
      
      // Group elements by division
      const divisions = network.divisions || [];
      const subdivisions = network.subdivisions || [];
      const facilities = network.facilities || [];
      
      // Group subdivisions by division
      const subdivisionsByDivision: Record<number, typeof subdivisions> = {};
      subdivisions.forEach(sub => {
        const parentDivision = divisions.find(d => d.id == sub.division); // Используем id подразделения для поиска родителя
        if (parentDivision) {
          if (!subdivisionsByDivision[parentDivision.id]) {
            subdivisionsByDivision[parentDivision.id] = [];
          }
          subdivisionsByDivision[parentDivision.id].push(sub);
        }
      });
      
      // Group facilities by subdivision
      const facilitiesBySubdivision: Record<number, typeof facilities> = {};
      facilities.forEach(fac => {
        const parentSubdivision = subdivisions.find(s => s.id == fac.subdivision); // Используем id объекта для поиска родителя
        if (parentSubdivision) {
          if (!facilitiesBySubdivision[parentSubdivision.id]) {
            facilitiesBySubdivision[parentSubdivision.id] = [];
          }
          facilitiesBySubdivision[parentSubdivision.id].push(fac);
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
        nodes.push({
          id: `division-${div.id}`,
          name: div.name,
          type: 'division',
          position: [divX, 20, divZ],
          radius: 2.0,
          color: '#4a6fa5',
          originalColor: '#4a6fa5'
        });
        
        // Position subdivisions for this division in a circle around it
        const subs = subdivisionsByDivision[div.id] || [];
        const subRadius = 6;
        const subAngleStep = subs.length > 0 ? (2 * Math.PI) / subs.length : 0;
        
        subs.forEach((sub, subIndex) => {
          const subAngle = subIndex * subAngleStep;
          const subX = divX + subRadius * Math.cos(subAngle);
          const subZ = divZ + subRadius * Math.sin(subAngle);
          
          nodes.push({
            id: `subdivision-${sub.id}`,
            name: sub.name,
            type: 'subdivision',
            position: [subX, 15, subZ],
            radius: 1.6,
            color: '#63b3ed',
            originalColor: '#63b3ed'
          });
          
          // Connect division to subdivision
          connections.push({
            start: [divX, 22, divZ],
            end: [subX, 15, subZ],
            startId: `division-${div.id}`,
            endId: `subdivision-${sub.id}`
          });
          
          // Position facilities for this subdivision in a circle around it
          const facs = facilitiesBySubdivision[sub.id] || [];
          const facRadius = 5;
          const facAngleStep = facs.length > 0 ? (2 * Math.PI) / facs.length : 0;
          
          facs.forEach((fac, facIndex) => {
            const facAngle = facIndex * facAngleStep;
            const facX = subX + facRadius * Math.cos(facAngle);
            const facZ = subZ + facRadius * Math.sin(facAngle);
            
            nodes.push({
              id: `facility-${fac.id}`,
              name: fac.name,
              type: 'facility',
              position: [facX, 8, facZ],
              radius: 1.5,
              color: '#90cdf4',
              originalColor: '#90cdf4'
            });
            
            // Connect subdivision to facility
            connections.push({
              start: [subX, 15, subZ],
              end: [facX, 8, facZ],
              startId: `subdivision-${sub.id}`,
              endId: `facility-${fac.id}`
            });
          });
        });
      });
      
      // Add orphaned subdivisions (without parent division)
      let orphanSubIndex = 0;
      subdivisions.forEach(sub => {
        if (!divisions.some(d => d.id == sub.id) && !nodes.some(n => n.id == `subdivision-${sub.id}`)) {
          nodes.push({
            id: `subdivision-${sub.id}`,
            name: sub.name,
            type: 'subdivision',
            position: [30, 0, orphanSubIndex * 8 - 16],
            radius: 1.6,
            color: '#63b3ed',
            originalColor: '#63b3ed'
          });
          orphanSubIndex++;
        }
      });
      
      // Add orphaned facilities (without parent subdivision)
      let orphanFacIndex = 0;
      facilities.forEach(fac => {
        if (!subdivisions.some(s => s.id == fac.id) && !nodes.some(n => n.id == `facility-${fac.id}`)) {
          nodes.push({
            id: `facility-${fac.id}`,
            name: fac.name,
            type: 'facility',
            position: [30, -10, orphanFacIndex * 8 - 16],
            radius: 1.4,
            color: '#90cdf4',
            originalColor: '#90cdf4'
          });
          orphanFacIndex++;
        }
      });
      
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
      case 'subdivision':
        node = network.subdivisions?.find(s => s.id === parseInt(id));
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