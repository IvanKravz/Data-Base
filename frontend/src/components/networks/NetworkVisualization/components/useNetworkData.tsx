// useNetworkData.tsx
import { useMemo } from 'react';

export interface Node {
  id: string;
  name: string;
  type: 'division' | 'facility' | 'equipment';
  position: [number, number, number];
  radius: number;
  color: string;
  emissive: string;
  originalColor: string;
  class_display?: string;
  type_name?: string;
}

export interface Connection {
  start: [number, number, number];
  end: [number, number, number];
  startId: string;
  endId: string;
  isDirection: boolean;
  bandwidth?: number;
  latency?: number;
  description?: string;
}

const pickLabel = (...vals: any[]): string => {
  for (const v of vals) {
    if (typeof v === 'string' && v.trim()) return v;
    if (v && typeof v === 'object' && typeof v.name === 'string' && v.name.trim()) return v.name;
  }
  return '';
};

// ── Уровни пирамиды
const DIVISION_Y = 18;
const FACILITY_Y = 0;
const EQUIPMENT_Y = -18;

export const useNetworkData = (network: any, memberships: any[], directions: any[]) => {
  return useMemo(() => {
    const nodes: Node[] = [];
    const connections: Connection[] = [];

    const divisionsMap = new Map<number, any>();
    const facilitiesMap = new Map<number, any>();
    const equipmentMap = new Map<number, any>();

    memberships.forEach(m => {
      if (m.division && !divisionsMap.has(m.division.id)) divisionsMap.set(m.division.id, m.division);
      if (m.facility && !facilitiesMap.has(m.facility.id)) facilitiesMap.set(m.facility.id, m.facility);
      if (m.equipment && !equipmentMap.has(m.equipment.id)) equipmentMap.set(m.equipment.id, m.equipment);
    });

    const divisions = Array.from(divisionsMap.values());
    const divisionRing = Math.max(30, divisions.length * 5);

    // ── Подразделения (кольцо сверху)
    const divPositions = new Map<number, [number, number, number]>();
    divisions.forEach((div, i) => {
      const angle = (i / Math.max(1, divisions.length)) * Math.PI * 2;
      const x = divisionRing * Math.cos(angle);
      const z = divisionRing * Math.sin(angle);
      divPositions.set(div.id, [x, DIVISION_Y, z]);

      nodes.push({
        id: `division-${div.id}`,
        name: div.name || 'Подразделение',
        type: 'division',
        position: [x, DIVISION_Y, z],
        radius: 2.4,
        color: '#60a5fa',
        emissive: '#3b82f6',
        originalColor: '#60a5fa',
        type_name: pickLabel(div.division_type_display, div.type_display, div.division_type, div.type),
      });
    });

    // ── Объекты (кластер под своим подразделением)
    const facilities = Array.from(facilitiesMap.values());
    const facilitiesByDiv = new Map<number | 'none', any[]>();
    facilities.forEach(fac => {
      const member = memberships.find(m => m.facility?.id === fac.id);
      const divId = member?.division?.id ?? 'none';
      if (!facilitiesByDiv.has(divId)) facilitiesByDiv.set(divId, []);
      facilitiesByDiv.get(divId)!.push(fac);
    });

    facilitiesByDiv.forEach((list, divId) => {
      const basePos = divId !== 'none' ? divPositions.get(divId as number) : undefined;
      const clusterR = list.length === 1 ? 0 : 5 + list.length * 0.6;
      list.forEach((fac, i) => {
        const angle = (i / Math.max(1, list.length)) * Math.PI * 2;
        const x = (basePos?.[0] ?? 0) + clusterR * Math.cos(angle);
        const z = (basePos?.[2] ?? 0) + clusterR * Math.sin(angle);

        nodes.push({
          id: `facility-${fac.id}`,
          name: fac.name || 'Объект',
          type: 'facility',
          position: [x, FACILITY_Y, z],
          radius: 1.4,
          color: '#22d3ee',
          emissive: '#06b6d4',
          originalColor: '#22d3ee',
          class_display: fac.class_display,
          type_name: pickLabel(
            fac.facility_type_display, fac.type_display,
            fac.category, fac.facility_type, fac.type,
          ),
        });

        if (basePos) {
          connections.push({
            start: basePos,
            end: [x, FACILITY_Y, z],
            startId: `division-${divId}`,
            endId: `facility-${fac.id}`,
            isDirection: false,
          });
        }
      });
    });

    // ── Оборудование (кластер под своим объектом)
    const equipmentList = Array.from(equipmentMap.values());
    const equipmentByFacility = new Map<number, any[]>();
    equipmentList.forEach(eq => {
      const member = memberships.find(m => m.equipment?.id === eq.id);
      const facId = member?.facility?.id;
      if (facId == null) return;
      if (!equipmentByFacility.has(facId)) equipmentByFacility.set(facId, []);
      equipmentByFacility.get(facId)!.push(eq);
    });

    equipmentByFacility.forEach((list, facId) => {
      const facNode = nodes.find(n => n.id === `facility-${facId}`);
      if (!facNode) return;

      const clusterR = list.length === 1 ? 0 : 2.5 + list.length * 0.7;
      list.forEach((eq, i) => {
        const angle = (i / Math.max(1, list.length)) * Math.PI * 2;
        const x = facNode.position[0] + clusterR * Math.cos(angle);
        const z = facNode.position[2] + clusterR * Math.sin(angle);

        nodes.push({
          id: `equipment-${eq.id}`,
          name: eq.name || 'Оборудование',
          type: 'equipment',
          position: [x, EQUIPMENT_Y, z],
          radius: 0.85,
          color: '#fb923c',      
          emissive: '#f97316',   
          originalColor: '#fb923c',
          type_name: pickLabel(eq.device_type_display, eq.category, eq.device_type),
        });
        connections.push({
          start: facNode.position,
          end: [x, EQUIPMENT_Y, z],
          startId: `facility-${facId}`,
          endId: `equipment-${eq.id}`,
          isDirection: false,
        });
      });
    });

    // ── Направления (equipment ↔ equipment)
    directions.forEach(d => {
      const fromEq = d.from_membership_details?.equipment;
      const toEq = d.to_membership_details?.equipment;
      if (!fromEq || !toEq) return;

      const fromNode = nodes.find(n => n.id === `equipment-${fromEq.id}`);
      const toNode = nodes.find(n => n.id === `equipment-${toEq.id}`);
      if (!fromNode || !toNode) return;

      connections.push({
        start: fromNode.position,
        end: toNode.position,
        startId: fromNode.id,
        endId: toNode.id,
        isDirection: true,
        bandwidth: d.bandwidth,
        latency: d.latency,
        description: d.description,
      });
    });

    return { nodes, connections };
  }, [network, memberships, directions]);
};