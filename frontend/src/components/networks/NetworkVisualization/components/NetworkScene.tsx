// NetworkScene.tsx
import React, { useRef, useMemo, useEffect, useState, useCallback } from 'react';
import { useFrame } from '@react-three/fiber';
import { OrbitControls, Stars, Line, Html, Outlines } from '@react-three/drei';
import * as THREE from 'three';
import { Node, Connection } from './useNetworkData';

/** Цвета состояний: по требованию клик = hover */
const HOVER_COLOR = '#61dafb';
const SELECTED_COLOR = HOVER_COLOR; // цвет после клика такой же, как при наведении

interface NetworkSceneProps {
  nodes: Node[];
  connections: Connection[];
  highlightedNode: string | null;
  selectedNode: string | null;
  onNodeClick: (id: string) => void;
  onNodeHover: (id: string | null) => void;
}

/* ──────────────────────────────────────────────
   Дуговое соединение + частицы потока
   ────────────────────────────────────────────── */

const ConnectionLine: React.FC<{ conn: Connection; active: boolean }> = ({ conn, active }) => {
  const points = useMemo(() => {
    const start = new THREE.Vector3(...conn.start);
    const end = new THREE.Vector3(...conn.end);
    const mid = start.clone().add(end).multiplyScalar(0.5);
    mid.y += start.distanceTo(end) * 0.12;
    const curve = new THREE.CatmullRomCurve3([start, mid, end]);
    return curve.getPoints(40);
  }, [conn]);

  let color = '#22d3ee';
  let opacity = 0.5;
  let lineWidth = 1.4;

  if (conn.isDirection) {
    color = active ? '#fdba74' : '#f97316';
    opacity = active ? 1 : 0.8;
    lineWidth = active ? 3 : 2;
  } else if (conn.startId.startsWith('division-')) {
    color = active ? '#67e8f9' : '#22d3ee';
    opacity = active ? 1 : 0.55;
    lineWidth = active ? 2.2 : 1.4;
  } else {
    color = active ? '#fed7aa' : '#fdba74';
    opacity = active ? 1 : 0.5;
    lineWidth = active ? 2 : 1.2;
  }

  return (
    <>
      <Line
        points={points}
        color={color}
        lineWidth={lineWidth}
        transparent
        opacity={opacity}
        dashed={!conn.isDirection}
        dashSize={0.7}
        gapSize={0.35}
      />
      {conn.isDirection && active && <FlowParticles points={points} color="#fed7aa" />}
    </>
  );
};

const FlowParticles: React.FC<{ points: THREE.Vector3[]; color: string }> = ({ points, color }) => {
  const groupRef = useRef<THREE.Group>(null);
  const count = 4;

  useFrame(({ clock }) => {
    if (!groupRef.current) return;
    const t = clock.getElapsedTime();
    groupRef.current.children.forEach((child, i) => {
      const offset = (t * 0.35 + i / count) % 1;
      const idx = Math.min(points.length - 1, Math.floor(offset * (points.length - 1)));
      const p = points[idx];
      if (p) child.position.copy(p);
    });
  });

  return (
    <group ref={groupRef}>
      {Array.from({ length: count }).map((_, i) => (
        <mesh key={i}>
          <sphereGeometry args={[0.18, 8, 8]} />
          <meshBasicMaterial color={color} />
        </mesh>
      ))}
    </group>
  );
};

/* ──────────────────────────────────────────────
   Узел
   ────────────────────────────────────────────── */

const NodeMesh: React.FC<{
  node: Node;
  isHighlighted: boolean;
  isSelected: boolean;
  onClick: () => void;
  onHover: (hovering: boolean) => void;
}> = ({ node, isHighlighted, isSelected, onClick, onHover }) => {
  const meshRef = useRef<THREE.Mesh>(null);
  const haloRef = useRef<THREE.Mesh>(null);
  const [hovered, setHovered] = useState(false);

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();

    if (meshRef.current) {
      const targetScale = isSelected ? 1.45 : isHighlighted || hovered ? 1.2 : 1;
      const cur = meshRef.current.scale.x;
      meshRef.current.scale.setScalar(cur + (targetScale - cur) * 0.15);

      if (node.type === 'equipment') {
        meshRef.current.rotation.y += isSelected ? 0.02 : 0.008;
        meshRef.current.rotation.x += isSelected ? 0.01 : 0.004;
      } else if (node.type === 'division') {
        meshRef.current.rotation.y += 0.002;
      }
    }

    if (haloRef.current) {
      const pulse = 1 + Math.sin(t * 2 + node.position[0]) * 0.06;
      haloRef.current.scale.setScalar(pulse);
      const mat = haloRef.current.material as THREE.MeshBasicMaterial;
      const targetOpacity = isSelected ? 0.5 : isHighlighted || hovered ? 0.32 : 0.15;
      mat.opacity += (targetOpacity - mat.opacity) * 0.15;
    }
  });

  // Подсветка (hover) и выделение (select) — одинаковый цвет
  const activeColor = isSelected || isHighlighted || hovered
    ? (isSelected ? SELECTED_COLOR : HOVER_COLOR)
    : null;

  const color = activeColor || node.color;
  const emissive = activeColor || node.emissive;
  const emissiveIntensity = isSelected ? 1.4 : isHighlighted || hovered ? 0.9 : 0.55;
  const outlineColor = activeColor || node.color;

  const geometry = useMemo(() => {
    switch (node.type) {
      case 'division':
        return <icosahedronGeometry args={[node.radius, 0]} />;
      case 'facility':
        return <octahedronGeometry args={[node.radius, 0]} />;
      case 'equipment':
        return <boxGeometry args={[node.radius * 1.4, node.radius * 1.4, node.radius * 1.4]} />;
      default:
        return <sphereGeometry args={[node.radius, 16, 16]} />;
    }
  }, [node.type, node.radius]);

  return (
    <group position={node.position}>
      <mesh ref={haloRef}>
        <sphereGeometry args={[node.radius * 1.9, 16, 16]} />
        <meshBasicMaterial
          color={outlineColor}
          transparent
          opacity={0.15}
          side={THREE.BackSide}
          depthWrite={false}
        />
      </mesh>

      <mesh
        ref={meshRef}
        onClick={(e) => {
          e.stopPropagation();
          onClick();
        }}
        onPointerOver={(e) => {
          e.stopPropagation();
          setHovered(true);
          onHover(true);
          document.body.style.cursor = 'pointer';
        }}
        onPointerOut={() => {
          setHovered(false);
          onHover(false);
          document.body.style.cursor = 'default';
        }}
      >
        {geometry}
        <meshStandardMaterial
          color={color}
          emissive={emissive}
          emissiveIntensity={emissiveIntensity}
          metalness={0.15}
          roughness={0.4}
          flatShading
        />
        <Outlines
          thickness={isSelected ? 0.08 : isHighlighted || hovered ? 0.06 : 0.04}
          color={outlineColor}
          screenspace={false}
          transparent
          opacity={isSelected || isHighlighted || hovered ? 1 : 0.85}
        />
      </mesh>
    </group>
  );
};

/* ──────────────────────────────────────────────
   Подписи узлов — интерактивные, с двунаправленной подсветкой
   ────────────────────────────────────────────── */

const SceneLabels: React.FC<{
  nodes: Node[];
  selectedNode: string | null;
  highlightedNode: string | null;
  onNodeClick: (id: string) => void;
  onNodeHoverStart: (id: string) => void;
  onNodeHoverEnd: (id: string) => void;
}> = ({ nodes, selectedNode, highlightedNode, onNodeClick, onNodeHoverStart, onNodeHoverEnd }) => {
  const makeHandlers = (nodeId: string) => ({
    onClick: (e: React.MouseEvent) => {
      e.stopPropagation();
      onNodeClick(nodeId);
    },
    onPointerEnter: (e: React.PointerEvent) => {
      e.stopPropagation();
      onNodeHoverStart(nodeId);
    },
    onPointerLeave: () => {
      onNodeHoverEnd(nodeId);
    },
  });

  const cls = (nodeId: string, base: string) => {
    const parts = ['viz-label', base, 'viz-label--clickable'];
    if (selectedNode === nodeId) parts.push('viz-label--active');
    else if (highlightedNode === nodeId) parts.push('viz-label--hover');
    return parts.join(' ');
  };

  return (
    <>
      {nodes.filter(n => n.type === 'division').map(node => (
        <Html
          key={`lbl-${node.id}`}
          position={[node.position[0], node.position[1] + node.radius + 2, node.position[2]]}
          center
          distanceFactor={130}
          zIndexRange={[15, 10]}
        >
          <div className={cls(node.id, 'viz-label--division')} {...makeHandlers(node.id)}>
            {node.name}
          </div>
        </Html>
      ))}

      {nodes.filter(n => n.type === 'facility').map(node => (
        <Html
          key={`lbl-${node.id}`}
          position={[node.position[0], node.position[1] + node.radius + 1.4, node.position[2]]}
          center
          distanceFactor={95}
          zIndexRange={[14, 10]}
        >
          <div className={cls(node.id, 'viz-label--facility')} {...makeHandlers(node.id)}>
            {node.type_name || 'Объект'}
          </div>
        </Html>
      ))}

      {nodes.filter(n => n.type === 'equipment').map(node => (
        <Html
          key={`lbl-${node.id}`}
          position={[node.position[0], node.position[1] + node.radius + 0.9, node.position[2]]}
          center
          distanceFactor={75}
          zIndexRange={[13, 10]}
        >
          <div className={cls(node.id, 'viz-label--equipment')} {...makeHandlers(node.id)}>
            {node.name}
          </div>
        </Html>
      ))}
    </>
  );
};

/* ──────────────────────────────────────────────
   Сцена
   ────────────────────────────────────────────── */

const NetworkScene: React.FC<NetworkSceneProps> = ({
  nodes,
  connections,
  highlightedNode,
  selectedNode,
  onNodeClick,
  onNodeHover,
}) => {
  const controlsRef = useRef<any>(null);
  const shouldAutoRotate = !selectedNode && !highlightedNode;

  useEffect(() => {
    if (!controlsRef.current) return;
    controlsRef.current.autoRotate = shouldAutoRotate;
  }, [shouldAutoRotate]);

  /*
   * Учёт источников hover:
   * - mesh  — курсор над 3D-объектом
   * - text  — курсор над HTML-подписью
   *
   * Это устраняет гонку событий: пока активен хотя бы один источник,
   * узел остаётся подсвеченным.
   */
  const hoverStateRef = useRef<{ nodeId: string | null; sources: Set<string> }>({
    nodeId: null,
    sources: new Set(),
  });

  const handleHover = useCallback(
    (nodeId: string, source: 'mesh' | 'text', isHovering: boolean) => {
      const state = hoverStateRef.current;

      if (isHovering) {
        if (state.nodeId !== nodeId) {
          state.nodeId = nodeId;
          state.sources.clear();
        }
        state.sources.add(source);
        onNodeHover(nodeId);
      } else {
        if (state.nodeId === nodeId) {
          state.sources.delete(source);
          if (state.sources.size === 0) {
            state.nodeId = null;
            onNodeHover(null);
          }
        }
      }
    },
    [onNodeHover],
  );

  return (
    <>
      <color attach="background" args={['#0f172a']} />
      <fog attach="fog" args={['#0f172a', 160, 300]} />

      <ambientLight intensity={0.7} />
      <hemisphereLight args={['#a5b4fc', '#1e293b', 1.2]} />

      <directionalLight position={[40, 80, 40]} intensity={1.4} color="#ffffff" />
      <directionalLight position={[-50, 40, -30]} intensity={0.9} color="#7dd3fc" />
      <directionalLight position={[0, -50, 60]} intensity={0.6} color="#fdba74" />

      <pointLight position={[0, 60, 0]} intensity={0.5} color="#22d3ee" />

      <Stars
        radius={180}
        depth={80}
        count={400}      /* меньше точек, меньше «ряби» */
        factor={2}      /* звёзды мельче и тусклее */
        saturation={0}
                    /* дальние звёзды плавно гаснут */
              /* почти статично, мерцание почти уходит */
      />

      <gridHelper args={[280, 56, '#334155', '#1e293b']} position={[0, -32, 0]} />

      <OrbitControls
        ref={controlsRef}
        enableZoom
        enablePan
        enableRotate
        zoomSpeed={1}
        panSpeed={0.5}
        rotateSpeed={0.8}
        autoRotate
        autoRotateSpeed={0.05}
        minDistance={25}
        maxDistance={220}
        target={[0, 0, 0]}
      />

      {connections.map((conn, idx) => {
        const active =
          highlightedNode === conn.startId ||
          highlightedNode === conn.endId ||
          selectedNode === conn.startId ||
          selectedNode === conn.endId;
        return <ConnectionLine key={idx} conn={conn} active={active} />;
      })}

      {nodes.map(node => (
        <NodeMesh
          key={node.id}
          node={node}
          isHighlighted={highlightedNode === node.id}
          isSelected={selectedNode === node.id}
          onClick={() => onNodeClick(node.id)}
          onHover={(h) => handleHover(node.id, 'mesh', h)}
        />
      ))}

      <SceneLabels
        nodes={nodes}
        selectedNode={selectedNode}
        highlightedNode={highlightedNode}
        onNodeClick={onNodeClick}
        onNodeHoverStart={(id) => handleHover(id, 'text', true)}
        onNodeHoverEnd={(id) => handleHover(id, 'text', false)}
      />
    </>
  );
};

export default NetworkScene;