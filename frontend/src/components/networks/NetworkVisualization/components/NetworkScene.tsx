import React, { useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { OrbitControls, Text } from '@react-three/drei';
import * as THREE from 'three';
import { Node, Connection } from './useNetworkData';

interface NetworkSceneProps {
  nodes: Node[];
  connections: Connection[];
  highlightedNode: string | null;
  selectedNode: string | null;
  onNodeClick: (id: string) => void;
  onNodeHover: (id: string | null) => void;
}

const NetworkScene: React.FC<NetworkSceneProps> = ({ 
  nodes, 
  connections, 
  highlightedNode, 
  selectedNode, 
  onNodeClick, 
  onNodeHover 
}) => {
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
        let opacity = 0.4;
        let lineWidth = 1;

        if (conn.isDirection) {
          lineColor = 0xff0000;
          opacity = isHighlighted ? 1 : 0.6;
          lineWidth = 2;
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

export default NetworkScene;