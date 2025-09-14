import React, { useState, useMemo, useRef } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls, Text } from '@react-three/drei';
import * as THREE from 'three';
import './NetworkVisualization.css';

interface Node {
  id: string;
  name: string;
  type: 'division' | 'facility' | 'equipment';
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
  isDirection: boolean;
  bandwidth?: number;
  latency?: number;
  description?: string;
}

interface NetworkVisualizationProps {
  network: any;
  memberships: any[];
  directions: any[];
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

        if (conn.isDirection) {
          lineColor = 0xff0000; // Красный для направлений
          opacity = isHighlighted ? 0.9 : 0.6;
          lineWidth = 2; // Более толстые линии для направлений
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
  memberships,
  directions,
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
    const divisionsMap = new Map<number, any>();
    const facilitiesMap = new Map<number, any>();
    const equipmentMap = new Map<number, any>();

    // Собираем все уникальные подразделения, объекты и оборудование из членств
    memberships.forEach(membership => {
      if (membership.division && !divisionsMap.has(membership.division.id)) {
        divisionsMap.set(membership.division.id, membership.division);
      }
      if (membership.facility && !facilitiesMap.has(membership.facility.id)) {
        facilitiesMap.set(membership.facility.id, membership.facility);
      }
      if (membership.equipment && !equipmentMap.has(membership.equipment.id)) {
        equipmentMap.set(membership.equipment.id, membership.equipment);
      }
    });

    // Создаем узлы для подразделений
    const divisions = Array.from(divisionsMap.values());
    const divisionRadius = 15;
    const divisionAngleStep = (2 * Math.PI) / Math.max(1, divisions.length);
    
    divisions.forEach((div, divIndex) => {
      const divisionAngle = divIndex * divisionAngleStep;
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
    });

    // Создаем узлы для объектов и связываем их с подразделениями
    const facilities = Array.from(facilitiesMap.values());
    facilities.forEach((fac, facIndex) => {
      // Находим подразделение для этого объекта
      const divisionMembership = memberships.find(m => 
        m.facility && m.facility.id === fac.id && m.division
      );
      
      let divX = 0, divZ = 0;
      if (divisionMembership && divisionMembership.division) {
        const divIndex = divisions.findIndex(d => d.id === divisionMembership.division.id);
        const divisionAngle = divIndex * divisionAngleStep;
        divX = divisionRadius * Math.cos(divisionAngle);
        divZ = divisionRadius * Math.sin(divisionAngle);
      }
      
      // Позиционируем объекты вокруг их подразделений
      const facRadius = 8;
      const facAngle = (facIndex % 8) * (Math.PI / 4); // 8 объектов вокруг каждого подразделения
      const facX = divX + facRadius * Math.cos(facAngle);
      const facZ = divZ + facRadius * Math.sin(facAngle);
      const facY = 8;
      
      nodes.push({
        id: `facility-${fac.id}`,
        name: fac.name,
        type: 'facility',
        position: [facX, facY, facZ],
        radius: 1.5,
        color: '#90cdf4',
        originalColor: '#90cdf4'
      });
      
      // Создаем соединение между подразделением и объектами
      if (divisionMembership && divisionMembership.division) {
        connections.push({
          start: [divX, 20, divZ],
          end: [facX, facY, facZ],
          startId: `division-${divisionMembership.division.id}`,
          endId: `facility-${fac.id}`,
          isDirection: false
        });
      }
    });

    // Создаем узлы для оборудования и связываем их с объектами
    const equipmentList = Array.from(equipmentMap.values());
    equipmentList.forEach((eq, eqIndex) => {
      // Находим объект для этого оборудования
      const facilityMembership = memberships.find(m => 
        m.equipment && m.equipment.id === eq.id && m.facility
      );
      
      if (facilityMembership && facilityMembership.facility) {
        const facilityNode = nodes.find(n => n.id === `facility-${facilityMembership.facility.id}`);
        if (facilityNode) {
          const eqRadius = 4;
          const eqAngle = (eqIndex % 6) * (Math.PI / 3); // 6 единиц оборудования вокруг каждого объекта
          const eqX = facilityNode.position[0] + eqRadius * Math.cos(eqAngle);
          const eqZ = facilityNode.position[2] + eqRadius * Math.sin(eqAngle);
          const eqY = 0;
          
          nodes.push({
            id: `equipment-${eq.id}`,
            name: eq.name,
            type: 'equipment',
            position: [eqX, eqY, eqZ],
            radius: 1.0,
            color: '#f6ad55',
            originalColor: '#f6ad55'
          });
          
          // Создаем соединение между объектами и оборудованием
          connections.push({
            start: facilityNode.position,
            end: [eqX, eqY, eqZ],
            startId: `facility-${facilityMembership.facility.id}`,
            endId: `equipment-${eq.id}`,
            isDirection: false
          });
        }
      }
    });

    // Создаем соединения для направлений
    directions.forEach(direction => {
      if (direction.from_membership_details && direction.to_membership_details) {
        const fromEquipment = direction.from_membership_details.equipment;
        const toEquipment = direction.to_membership_details.equipment;
        
        if (fromEquipment && toEquipment) {
          const fromNode = nodes.find(n => n.id === `equipment-${fromEquipment.id}`);
          const toNode = nodes.find(n => n.id === `equipment-${toEquipment.id}`);
          
          if (fromNode && toNode) {
            connections.push({
              start: fromNode.position,
              end: toNode.position,
              startId: `equipment-${fromEquipment.id}`,
              endId: `equipment-${toEquipment.id}`,
              isDirection: true,
              bandwidth: direction.bandwidth,
              latency: direction.latency,
              description: direction.description
            });
          }
        }
      }
    });

    return { nodes, connections };
  }, [network, memberships, directions]);

  const handleNodeClick = (nodeId: string) => {
    setSelectedNode(prev => prev === nodeId ? null : nodeId);
  };
  
  const renderNodeDetails = (nodeId: string) => {
    const [type, id] = nodeId.split('-');
    let node;
    
    switch(type) {
      case 'division':
        const division = Array.from(new Map(memberships.map(m => 
          [m.division.id, m.division])).values()).find(d => d.id === parseInt(id));
        node = division;
        break;
      case 'facility':
        const facility = Array.from(new Map(memberships.map(m => 
          [m.facility.id, m.facility])).values()).find(f => f.id === parseInt(id));
        node = facility;
        break;
      case 'equipment':
        const equipment = Array.from(new Map(memberships.map(m => 
          [m.equipment.id, m.equipment])).values()).find(e => e.id === parseInt(id));
        node = equipment;
        break;
      default:
        return null;
    }

    if (!node) return null;

    return (
      <>
        <div className="network-details-item">
          <div className="network-details-label">Название</div>
          <div className="network-details-value">{node.name}</div>
        </div>
        <div className="network-details-item">
          <div className="network-details-label">Тип</div>
          <div className="network-details-value">{type === 'division' ? 'Подразделение' : 
                                              type === 'facility' ? 'Объект' : 'Оборудование'}</div>
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
            {selectedNode ? selectedNode.split('-')[0] === 'division' ? 'Подразделение' :
                          selectedNode.split('-')[0] === 'facility' ? 'Объект' : 'Оборудование' 
                          : 'Детали'}
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