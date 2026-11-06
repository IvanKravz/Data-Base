import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ReactFlow, Background, Controls, ConnectionMode,
  Node, Edge, NodeMouseHandler, OnNodeDrag, Connection,
  useNodesState, useEdgesState,
  type ReactFlowInstance,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import './SchemaEditor.css';
import { Plus, Pencil, Trash2, X } from 'lucide-react';

import { DivisionNode } from './nodes/DivisionNode';
import { FacilityNode } from './nodes/FacilityNode';
import { EquipmentNode } from './nodes/EquipmentNode';
import { DirectionEdge } from './edges/DirectionEdge';
import { AddDivisionModal } from './modal/AddDivisionModal';
import { AddFacilityModal } from './modal/AddFacilityModal';
import { AddEquipmentModal } from './modal/AddEquipmentModal';
import { ConnectionSetupModal, ConnectDraft } from './modal/ConnectionSetupModal';
import { useDragSave } from './useDragSave';
import {
  buildAutoLayout, mergePositions, EXPLICIT_SENTINEL,
  DIV_GAP, CANVAS_OFFSET, MIN_CELL_W,
} from './useNetworkSchema';
import { networksApi } from '../../../api/networksApi';
import { NetworkNodePosition, NetworkSchemaPayload } from '../../../types';

const nodeTypes = { division: DivisionNode, facility: FacilityNode, equipment: EquipmentNode };
const edgeTypes = { direction: DirectionEdge };

interface Props {
  token: string | null;
  networkId: string | undefined;
  payload: NetworkSchemaPayload | null;
  highlightedNode: string | null;
  selectedNode: string | null;
  selectedEdgeId?: string | null;
  onNodeSelect: (id: string) => void;
  onNodeHover?: (id: string | null) => void;
  onEdgeSelect?: (edgeId: string | null) => void;
  onPositionsSaved?: (positions: NetworkNodePosition[]) => void;
  onSchemaChanged?: () => void;
  drawerOpen?: boolean;
}

type CtxMenu =
  | { x: number; y: number; kind: 'edge'; id: string }
  | { x: number; y: number; kind: 'node'; id: string }
  | { x: number; y: number; kind: 'pane' };

export const SchemaEditor: React.FC<Props> = ({
  token, networkId, payload, highlightedNode, selectedNode,
  selectedEdgeId, onNodeSelect, onNodeHover, onEdgeSelect,
  onPositionsSaved, onSchemaChanged, drawerOpen = false,
}) => {
  const [nodes, setNodes, onNodesChange] = useNodesState<Node>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([]);
  const { schedule } = useDragSave(token, networkId, onPositionsSaved);
  const structureKeyRef = useRef<string>('');
  const reactFlowRef = useRef<ReactFlowInstance | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const fittedNetworkRef = useRef<string | null>(null);

  const payloadRef = useRef(payload);
  useEffect(() => { payloadRef.current = payload; }, [payload]);

  const edgesRef = useRef(edges);
  useEffect(() => { edgesRef.current = edges; }, [edges]);

  // ============ Модалки / меню ============
  const [addDivisionOpen, setAddDivisionOpen] = useState(false);
  const [addFacilityFor, setAddFacilityFor] = useState<{ id: number; name: string } | null>(null);
  const [addEquipmentFor, setAddEquipmentFor] = useState<{ id: number; name: string } | null>(null);
  const [connectDraft, setConnectDraft] = useState<ConnectDraft | null>(null);
  const [connectSaving, setConnectSaving] = useState(false);
  const [ctxMenu, setCtxMenu] = useState<CtxMenu | null>(null);

  // ============ FitView ============
  const safeFitView = useCallback(() => {
    const inst = reactFlowRef.current;
    if (!inst || typeof inst.fitView !== 'function') return;
    try {
      inst.fitView({ padding: 0.15, maxZoom: 1, minZoom: 0.15, duration: 250 });
    } catch (e) { console.warn('[SchemaEditor] fitView failed:', e); }
  }, []);

  // ============ Стабильные колбэки для узлов ============
  const openAddFacility = useCallback((divisionId: number, divisionName: string) => {
    setAddFacilityFor({ id: divisionId, name: divisionName });
  }, []);

  const openAddEquipment = useCallback((facilityId: number, facilityName: string) => {
    setAddEquipmentFor({ id: facilityId, name: facilityName });
  }, []);

  const removeDivision = useCallback(async (divisionId: number) => {
    const p = payloadRef.current;
    if (!p || !token || !networkId) return;
    const toDelete = p.memberships.filter((m: any) => m.division?.id === divisionId);
    if (toDelete.length > 0) {
      if (!window.confirm(
        `Удалить подразделение из схемы? Вместе с ним из сети будут удалены ` +
        `${toDelete.length} ед. техники (сама техника останется в базе).`,
      )) return;
    }
    try {
      for (const m of toDelete) {
        await networksApi.deleteNetworkMembership(token, m.id);
      }
      await networksApi.deleteNodePosition(token, networkId, 'division', divisionId)
        .catch(() => { /* позиции могло не быть */ });
      onSchemaChanged?.();
    } catch (e) {
      console.error('[SchemaEditor] removeDivision failed:', e);
      alert('Не удалось удалить подразделение из схемы');
    }
  }, [token, networkId, onSchemaChanged]);

  const removeFacility = useCallback(async (facilityId: number) => {
    const p = payloadRef.current;
    if (!p || !token || !networkId) return;
    const toDelete = p.memberships.filter((m: any) => m.facility?.id === facilityId);
    if (toDelete.length > 0) {
      if (!window.confirm(
        `Удалить объект из схемы? Вместе с ним из сети будут удалены ` +
        `${toDelete.length} ед. техники (сама техника останется в базе).`,
      )) return;
    }
    try {
      for (const m of toDelete) {
        await networksApi.deleteNetworkMembership(token, m.id);
      }
      await networksApi.deleteNodePosition(token, networkId, 'facility', facilityId)
        .catch(() => { /* позиции могло не быть */ });
      onSchemaChanged?.();
    } catch (e) {
      console.error('[SchemaEditor] removeFacility failed:', e);
      alert('Не удалось удалить объект из схемы');
    }
  }, [token, networkId, onSchemaChanged]);

  const removeEquipment = useCallback(async (equipmentId: number) => {
    const p = payloadRef.current;
    if (!p || !token || !networkId) return;
    const m = p.memberships.find((x: any) => x.equipment?.id === equipmentId);
    if (!m) return;
    if (!window.confirm('Удалить оборудование из сети? Сама техника останется в базе.')) return;
    try {
      await networksApi.deleteNetworkMembership(token, m.id);
      await networksApi.deleteNodePosition(token, networkId, 'equipment', equipmentId)
        .catch(() => { /* позиции могло не быть */ });
      onSchemaChanged?.();
    } catch (e) {
      console.error('[SchemaEditor] removeEquipment failed:', e);
      alert('Не удалось удалить оборудование из сети');
    }
  }, [token, networkId, onSchemaChanged]);

  // ============ 1) Построение структуры ============
  useEffect(() => {
    if (!payload) {
      structureKeyRef.current = '';
      fittedNetworkRef.current = null;
      setNodes([]);
      setEdges([]);
      return;
    }
    const key = JSON.stringify({
      n: payload.network?.id ?? null,
      m: payload.memberships.map((m: any) => [
        m.division?.id ?? null, m.facility?.id ?? null, m.equipment?.id ?? null,
      ]),
      d: payload.directions.map((d: any) => [
        d.id, d.from_handle, d.to_handle, d.from_interface, d.to_interface,
      ]),
      ed: ((payload as any).explicit_divisions || []).map((x: any) => x.id),
      ef: ((payload as any).explicit_facilities || []).map((x: any) => x.id),
    });
    if (key === structureKeyRef.current) return;
    structureKeyRef.current = key;

    const auto = buildAutoLayout(payload);
    const merged = mergePositions(payload, auto);
    const posMap = new Map(merged.map(p => [`${p.node_type}-${p.node_id}`, p]));

    const newNodes: Node[] = [];

    const pushEq = (eq: any, p: any) => {
      newNodes.push({
        id: `equipment-${eq.id}`,
        type: 'equipment',
        position: { x: p.x, y: p.y },
        parentId: p.parent_type ? `${p.parent_type}-${p.parent_id}` : undefined,
        extent: p.parent_type ? 'parent' : undefined,
        data: { equipment: eq, highlighted: false },
      });
    };

    const pushFac = (fac: any, p: any) => {
      newNodes.push({
        id: `facility-${fac.id}`,
        type: 'facility',
        position: { x: p.x, y: p.y },
        parentId: p.parent_type ? `${p.parent_type}-${p.parent_id}` : undefined,
        extent: p.parent_type ? 'parent' : undefined,
        style: { width: p.width, height: p.height },
        data: {
          facility: fac,
          onAddEquipment: openAddEquipment,
          onRemove: removeFacility,
        },
      });
    };

    const divMap = new Map<number, any>();
    payload.memberships.forEach((m: any) => {
      if (m.division && !divMap.has(m.division.id)) divMap.set(m.division.id, m.division);
    });
    ((payload as any).explicit_divisions || []).forEach((d: any) => {
      if (!divMap.has(d.id)) divMap.set(d.id, d);
    });
    divMap.forEach(d => {
      const p = posMap.get(`division-${d.id}`);
      if (!p) return;
      newNodes.push({
        id: `division-${d.id}`,
        type: 'division',
        position: { x: p.x, y: p.y },
        style: { width: p.width, height: p.height },
        data: {
          division: d,
          onAddFacility: openAddFacility,
          onRemove: removeDivision,
        },
      });
    });

    const facMap = new Map<number, any>();
    payload.memberships.forEach((m: any) => {
      if (m.facility && !facMap.has(m.facility.id)) facMap.set(m.facility.id, m.facility);
    });
    ((payload as any).explicit_facilities || []).forEach((f: any) => {
      if (!facMap.has(f.id)) facMap.set(f.id, f);
    });
    facMap.forEach(f => {
      const p = posMap.get(`facility-${f.id}`);
      if (p) pushFac(f, p);
    });

    const eqMap = new Map<number, any>();
    payload.memberships.forEach((m: any) => {
      if (m.equipment && !eqMap.has(m.equipment.id)) eqMap.set(m.equipment.id, m.equipment);
    });
    eqMap.forEach(e => {
      const p = posMap.get(`equipment-${e.id}`);
      if (p) pushEq(e, p);
    });

    const newEdges: Edge[] = [];
    payload.directions.forEach((d: any) => {
      const fromEq = d.from_membership_details?.equipment?.id;
      const toEq = d.to_membership_details?.equipment?.id;
      if (!fromEq || !toEq) return;
      newEdges.push({
        id: `dir-${d.id}`,
        source: `equipment-${fromEq}`,
        target: `equipment-${toEq}`,
        sourceHandle: d.from_handle || undefined,
        targetHandle: d.to_handle || undefined,
        type: 'direction',
        animated: true,
        data: {
          isDirection: true,
          label: d.label || (d.from_interface_name && d.to_interface_name
            ? `${d.from_interface_name}→${d.to_interface_name}` : ''),
          cable_type: d.cable_type || '',
          from_handle: d.from_handle || '',
          to_handle: d.to_handle || '',
        },
      });
    });

    setNodes(newNodes);
    setEdges(newEdges);

    const fitKey = networkId ?? null;
    if (fittedNetworkRef.current !== fitKey) {
      fittedNetworkRef.current = fitKey;
      requestAnimationFrame(safeFitView);
    }
  }, [
    payload, setNodes, setEdges, safeFitView, networkId,
    openAddFacility, openAddEquipment, removeDivision, removeFacility,
  ]);

  // ============ 2) Подсветка / выделение (переживают rebuild) ============
  useEffect(() => {
    setNodes(prev => {
      let changed = false;
      const next = prev.map(n => {
        const wantHi = n.id === highlightedNode;
        if (n.data?.highlighted === wantHi) return n;
        changed = true;
        return { ...n, data: { ...n.data, highlighted: wantHi } };
      });
      return changed ? next : prev;
    });
  }, [highlightedNode, payload, setNodes]);

  useEffect(() => {
    setNodes(prev => prev.map(n => ({ ...n, selected: n.id === selectedNode })));
    setEdges(prev => prev.map(e => ({ ...e, selected: e.id === selectedEdgeId })));
  }, [selectedNode, selectedEdgeId, payload, setNodes, setEdges]);

  // ============ 3) FitView по resize / drawer ============
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const startedAt = Date.now();
    let timer: number | null = null;
    const ro = new ResizeObserver(() => {
      if (Date.now() - startedAt < 200) return;
      if (timer !== null) window.clearTimeout(timer);
      timer = window.setTimeout(() => safeFitView(), 320);
    });
    ro.observe(el);
    return () => {
      if (timer !== null) window.clearTimeout(timer);
      ro.disconnect();
    };
  }, [safeFitView]);

  useEffect(() => {
    const timer = window.setTimeout(() => safeFitView(), 320);
    return () => window.clearTimeout(timer);
  }, [drawerOpen, safeFitView]);

  // ============ 4) Удаление ребра ============
  const deleteEdge = useCallback(async (edgeId: string) => {
    if (!token || !window.confirm('Удалить соединение?')) return;
    const numericId = edgeId.replace(/^dir-/, '');
    try {
      await networksApi.deleteNetworkDirection(token, numericId);
      onSchemaChanged?.();
    } catch (e) {
      console.error('[SchemaEditor] delete direction failed:', e);
      alert('Не удалось удалить соединение');
    }
  }, [token, onSchemaChanged]);

  // ============ 5) Горячие клавиши ============
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (target?.tagName === 'INPUT' || target?.tagName === 'TEXTAREA') return;
      if ((e.key === 'Delete' || e.key === 'Backspace') && selectedEdgeId) {
        e.preventDefault();
        deleteEdge(selectedEdgeId);
      }
      if (e.key === 'Escape') {
        onEdgeSelect?.(null);
        setCtxMenu(null);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [selectedEdgeId, deleteEdge, onEdgeSelect]);

  // ============ 6) Закрытие контекстного меню ============
  useEffect(() => {
    if (!ctxMenu) return;
    const close = () => setCtxMenu(null);
    const t = window.setTimeout(() => {
      window.addEventListener('click', close);
      window.addEventListener('contextmenu', close);
    }, 0);
    return () => {
      window.clearTimeout(t);
      window.removeEventListener('click', close);
      window.removeEventListener('contextmenu', close);
    };
  }, [ctxMenu]);

  // ============ 7) Обработчики узлов ============
  const onNodeClick: NodeMouseHandler = useCallback((_, node) => {
    if (node.id.startsWith('equipment-')) onNodeSelect(node.id);
    else if (node.id.startsWith('facility-')) onNodeSelect(node.id);
    else if (node.id.startsWith('division-')) onNodeSelect(node.id);
  }, [onNodeSelect]);

  const onNodeMouseEnter: NodeMouseHandler = useCallback(
    (_, node) => onNodeHover?.(node.id), [onNodeHover],
  );
  const onNodeMouseLeave: NodeMouseHandler = useCallback(
    () => onNodeHover?.(null), [onNodeHover],
  );

  const onDragStop: OnNodeDrag = useCallback((_, node) => {
    const [type, idStr] = node.id.split('-');
    if (!['division', 'facility', 'equipment'].includes(type)) return;
    schedule({
      node_type: type as 'division' | 'facility' | 'equipment',
      node_id: Number(idStr),
      x: node.position.x,
      y: node.position.y,
    });
  }, [schedule]);

  // ============ 8) Создание связи ============
  const onConnect = useCallback(async (params: Connection) => {
    if (!token || !networkId || !payload) return;

    if (params.source === params.target) {
      console.warn('[SchemaEditor] self-loop запрещён');
      return;
    }

    const duplicate = edgesRef.current.some(
      (e) =>
        e.source === params.source &&
        e.target === params.target &&
        (e.sourceHandle ?? undefined) === (params.sourceHandle ?? undefined) &&
        (e.targetHandle ?? undefined) === (params.targetHandle ?? undefined),
    );
    if (duplicate) {
      console.warn('[SchemaEditor] такая связь уже существует');
      return;
    }

    const fromEqId = params.source?.startsWith('equipment-')
      ? Number(params.source.slice('equipment-'.length)) : NaN;
    const toEqId = params.target?.startsWith('equipment-')
      ? Number(params.target.slice('equipment-'.length)) : NaN;
    if (!fromEqId || !toEqId) return;

    const fromM = payload.memberships.find((m: any) => m.equipment?.id === fromEqId);
    const toM = payload.memberships.find((m: any) => m.equipment?.id === toEqId);
    if (!fromM || !toM) return;

    const [fromIfs, toIfs] = await Promise.all([
      networksApi.getNetworkInterfaces(token, { equipment: fromEqId }).catch(() => []),
      networksApi.getNetworkInterfaces(token, { equipment: toEqId }).catch(() => []),
    ]);

    setConnectDraft({
      params,
      fromMembershipId: fromM.id,
      toMembershipId: toM.id,
      fromEquipment: fromM.equipment,
      toEquipment: toM.equipment,
      fromInterfaces: fromIfs,
      toInterfaces: toIfs,
    });
  }, [token, networkId, payload]);

  const confirmConnect = useCallback(async (
    { fromInterface, toInterface }: { fromInterface: number | null; toInterface: number | null },
  ) => {
    if (!token || !networkId || !connectDraft) return;
    setConnectSaving(true);
    try {
      await networksApi.createNetworkDirection(token, {
        network: Number(networkId),
        from_membership: connectDraft.fromMembershipId,
        to_membership: connectDraft.toMembershipId,
        from_handle: connectDraft.params.sourceHandle || 'bottom',
        to_handle: connectDraft.params.targetHandle || 'top',
        from_interface: fromInterface,
        to_interface: toInterface,
      } as any);
      onSchemaChanged?.();
    } catch (e) {
      console.error('[SchemaEditor] create direction failed:', e);
      alert('Не удалось создать связь');
    } finally {
      setConnectSaving(false);
      setConnectDraft(null);
    }
  }, [token, networkId, connectDraft, onSchemaChanged]);

  // ============ 9) Контекстное меню ============
  const onEdgeContextMenu = useCallback((event: React.MouseEvent, edge: Edge) => {
    event.preventDefault();
    onEdgeSelect?.(edge.id);
    setCtxMenu({ x: event.clientX, y: event.clientY, kind: 'edge', id: edge.id });
  }, [onEdgeSelect]);

  const onNodeContextMenu = useCallback((event: React.MouseEvent, node: Node) => {
    event.preventDefault();
    setCtxMenu({ x: event.clientX, y: event.clientY, kind: 'node', id: node.id });
  }, []);

  const onPaneContextMenu = useCallback((event: React.MouseEvent | MouseEvent) => {
    event.preventDefault();
    setCtxMenu({
      x: (event as any).clientX,
      y: (event as any).clientY,
      kind: 'pane',
    });
  }, []);

  const onEdgeClick = useCallback((_: any, edge: Edge) => {
    // Открываем редактор направления через тот же колбэк, что и для узлов
    onEdgeSelect?.(edge.id);
  }, [onEdgeSelect]);

  const onPaneClick = useCallback(() => {
    onEdgeSelect?.(null);
  }, [onEdgeSelect]);

  const onInit = useCallback((inst: ReactFlowInstance) => {
    reactFlowRef.current = inst;
  }, []);

  // ============ 10) Модалки: сохранение ============
  const handleAddDivision = useCallback(async (division: any) => {
    if (!token || !networkId) return;

    const p = payloadRef.current;
    let x = CANVAS_OFFSET;
    let y = CANVAS_OFFSET;

    if (p) {
      const auto = buildAutoLayout(p);
      const merged = mergePositions(p, auto);
      const divisions = merged.filter(dd => dd.node_type === 'division');
      if (divisions.length > 0) {
        const maxRight = Math.max(
          ...divisions.map(dd => dd.x + (dd.width || MIN_CELL_W)),
        );
        const minY = Math.min(...divisions.map(dd => dd.y));
        x = maxRight + DIV_GAP;
        y = minY;
      }
    }

    try {
      await networksApi.saveNodePositions(token, networkId, [{
        node_type: 'division',
        node_id: division.id,
        x,
        y,
        // @ts-expect-error — is_explicit уходит в bulk_upsert
        is_explicit: true,
      } as any]);
      onSchemaChanged?.();

      const inst = reactFlowRef.current;
      if (inst) {
        try {
          inst.setCenter(x + 150, y + 100, {
            zoom: inst.getZoom(),
            duration: 400,
          });
        } catch (err) {
          console.warn('[SchemaEditor] setCenter failed:', err);
        }
      }
    } catch (e) {
      console.error('[SchemaEditor] add division failed:', e);
      alert('Не удалось добавить подразделение на схему');
    }
  }, [token, networkId, onSchemaChanged]);

  const handleAddFacility = useCallback(async (facility: any) => {
    if (!token || !networkId) return;
    try {
      await networksApi.saveNodePositions(token, networkId, [{
        node_type: 'facility',
        node_id: facility.id,
        x: EXPLICIT_SENTINEL,
        y: EXPLICIT_SENTINEL,
        // @ts-expect-error — is_explicit уходит в bulk_upsert
        is_explicit: true,
      } as any]);
      onSchemaChanged?.();
    } catch (e) {
      console.error('[SchemaEditor] add facility failed:', e);
      alert('Не удалось добавить объект на схему');
    }
  }, [token, networkId, onSchemaChanged]);

  const handleAddEquipment = useCallback(async (equipment: any) => {
    if (!token || !networkId || !addEquipmentFor) return;
    const p = payloadRef.current;
    if (!p) return;

    const existing = p.memberships.find(
      (m: any) => m.equipment?.id === equipment.id,
    );
    if (existing) return;

    const divisionId = equipment.division?.id ?? equipment.division_id;
    const facilityId = addEquipmentFor.id;

    if (!divisionId) {
      alert('Не удалось определить подразделение оборудования');
      return;
    }

    try {
      await networksApi.createNetworkMembership(token, {
        network: Number(networkId),
        division_id: Number(divisionId),
        facility_id: Number(facilityId),
        equipment_id: Number(equipment.id),
      });
      // Позиции родительских контейнеров НЕ трогаем — иначе они «улетят».
      onSchemaChanged?.();
    } catch (e) {
      console.error('[SchemaEditor] add equipment membership failed:', e);
      alert('Не удалось добавить технику в сеть');
    }
  }, [token, networkId, onSchemaChanged, addEquipmentFor]);

  // ============ 11) Exclude-наборы для модалок ============
  const excludedDivisionIds = useMemo(() => {
    const s = new Set<number>();
    payload?.memberships.forEach((m: any) => {
      if (m.division?.id) s.add(m.division.id);
    });
    ((payload as any)?.explicit_divisions || []).forEach((d: any) => s.add(d.id));
    return s;
  }, [payload]);

  const excludedFacilityIds = useMemo(() => {
    const s = new Set<number>();
    payload?.memberships.forEach((m: any) => {
      if (m.facility?.id) s.add(m.facility.id);
    });
    ((payload as any)?.explicit_facilities || []).forEach((f: any) => s.add(f.id));
    return s;
  }, [payload]);

  const excludedEquipmentIds = useMemo(() => {
    const s = new Set<number>();
    payload?.memberships.forEach((m: any) => {
      if (m.equipment?.id) s.add(m.equipment.id);
    });
    return s;
  }, [payload]);

  // ============ 12) Удаление из контекстного меню (все три типа) ============
  const handleCtxDelete = useCallback((nodeId: string) => {
    if (nodeId.startsWith('division-')) {
      removeDivision(Number(nodeId.slice('division-'.length)));
    } else if (nodeId.startsWith('facility-')) {
      removeFacility(Number(nodeId.slice('facility-'.length)));
    } else if (nodeId.startsWith('equipment-')) {
      removeEquipment(Number(nodeId.slice('equipment-'.length)));
    }
  }, [removeDivision, removeFacility, removeEquipment]);

  return (
    <div className="schema-editor" ref={containerRef}>
      <div className="schema-toolbar">
        <button
          type="button"
          className="schema-toolbar__btn"
          onClick={() => setAddDivisionOpen(true)}
          title="Добавить подразделение на схему"
        >
          <Plus size={16} /> Подразделение
        </button>
      </div>

      <ReactFlow
        onInit={onInit}
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onNodeClick={onNodeClick}
        onNodeMouseEnter={onNodeMouseEnter}
        onNodeMouseLeave={onNodeMouseLeave}
        onNodeDragStop={onDragStop}
        onConnect={onConnect}
        onEdgeClick={onEdgeClick}
        onPaneClick={onPaneClick}
        onEdgeContextMenu={onEdgeContextMenu}
        onNodeContextMenu={onNodeContextMenu}
        onPaneContextMenu={onPaneContextMenu}
        connectionMode={ConnectionMode.Loose}
        fitView
        fitViewOptions={{ padding: 0.15, maxZoom: 1, minZoom: 0.15 }}
        minZoom={0.1}
        maxZoom={2}
        proOptions={{ hideAttribution: true }}
        deleteKeyCode={null}
      /* кликабельность рёбер по умолчанию true; interactionWidth задан в DirectionEdge */
      >
        <Background gap={20} />
        <Controls showInteractive={false} />
      </ReactFlow>

      {ctxMenu && (
        <div
          className="schema-context-menu"
          style={{ position: 'fixed', left: ctxMenu.x, top: ctxMenu.y, zIndex: 1200 }}
          onClick={e => e.stopPropagation()}
          onContextMenu={e => e.stopPropagation()}
        >
          {ctxMenu.kind === 'edge' && (
            <>
              <button onClick={() => { onEdgeSelect?.(ctxMenu.id); setCtxMenu(null); }}>
                <Pencil size={14} /> Редактировать связь
              </button>
              <button
                className="danger"
                onClick={() => { deleteEdge(ctxMenu.id); setCtxMenu(null); }}
              >
                <Trash2 size={14} /> Удалить связь
              </button>
            </>
          )}

          {ctxMenu.kind === 'node' && ctxMenu.id.startsWith('division-') && (
            <>
              <button
                onClick={() => {
                  const divId = Number(ctxMenu.id.slice('division-'.length));
                  const p = payloadRef.current;
                  const divData =
                    p?.memberships.find((m: any) => m.division?.id === divId)?.division
                    || ((p as any)?.explicit_divisions || []).find((d: any) => d.id === divId);
                  openAddFacility(divId, divData?.name || 'Подразделение');
                  setCtxMenu(null);
                }}
              >
                <Plus size={14} /> Добавить объект
              </button>
              <button
                className="danger"
                onClick={() => { handleCtxDelete(ctxMenu.id); setCtxMenu(null); }}
              >
                <Trash2 size={14} /> Удалить из схемы
              </button>
            </>
          )}

          {ctxMenu.kind === 'node' && ctxMenu.id.startsWith('facility-') && (
            <>
              <button
                onClick={() => {
                  const facId = Number(ctxMenu.id.slice('facility-'.length));
                  const p = payloadRef.current;
                  const facData =
                    p?.memberships.find((m: any) => m.facility?.id === facId)?.facility
                    || ((p as any)?.explicit_facilities || []).find((f: any) => f.id === facId);
                  openAddEquipment(facId, facData?.name || 'Объект');
                  setCtxMenu(null);
                }}
              >
                <Plus size={14} /> Добавить технику
              </button>
              <button
                className="danger"
                onClick={() => { handleCtxDelete(ctxMenu.id); setCtxMenu(null); }}
              >
                <Trash2 size={14} /> Удалить из схемы
              </button>
            </>
          )}

          {ctxMenu.kind === 'node' && ctxMenu.id.startsWith('equipment-') && (
            <>
              <button onClick={() => { onNodeSelect(ctxMenu.id); setCtxMenu(null); }}>
                <Pencil size={14} /> Настроить
              </button>
              <button
                className="danger"
                onClick={() => { handleCtxDelete(ctxMenu.id); setCtxMenu(null); }}
              >
                <Trash2 size={14} /> Удалить из схемы
              </button>
            </>
          )}

          {ctxMenu.kind === 'pane' && (
            <button onClick={() => setCtxMenu(null)}>
              <X size={14} /> Закрыть
            </button>
          )}
        </div>
      )}

      {addDivisionOpen && (
        <AddDivisionModal
          token={token}
          excludeIds={excludedDivisionIds}
          onClose={() => setAddDivisionOpen(false)}
          onPick={handleAddDivision}
        />
      )}

      {addFacilityFor && (
        <AddFacilityModal
          token={token}
          divisionId={addFacilityFor.id}
          divisionName={addFacilityFor.name}
          excludeIds={excludedFacilityIds}
          onClose={() => setAddFacilityFor(null)}
          onPick={handleAddFacility}
        />
      )}

      {addEquipmentFor && (
        <AddEquipmentModal
          token={token}
          facilityId={addEquipmentFor.id}
          facilityName={addEquipmentFor.name}
          excludeIds={excludedEquipmentIds}
          onClose={() => setAddEquipmentFor(null)}
          onPick={handleAddEquipment}
        />
      )}

      {connectDraft && (
        <ConnectionSetupModal
          draft={connectDraft}
          saving={connectSaving}
          onCancel={() => setConnectDraft(null)}
          onConfirm={confirmConnect}
        />
      )}
    </div>
  );
};