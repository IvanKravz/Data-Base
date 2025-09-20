import { useMemo } from 'react';

export interface Node {
  id: string;
  name: string;
  type: 'division' | 'facility' | 'equipment';
  position: [number, number, number];
  radius: number;
  color: string;
  originalColor: string;
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

export const useNetworkData = (network: any, memberships: any[], directions: any[]) => {
  return useMemo(() => {
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
    const divisionRadius = 14;
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
      const facRadius = 9;
      const facAngle = (facIndex % 8) * (Math.PI / 4);
      const facX = divX + facRadius * Math.cos(facAngle);
      const facZ = divZ + facRadius * Math.sin(facAngle);
      const facY = 14;
      
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
          const eqRadius = 6;
          const eqAngle = (eqIndex % 6) * (Math.PI / 3);
          const eqX = facilityNode.position[0] + eqRadius * Math.cos(eqAngle);
          const eqZ = facilityNode.position[2] + eqRadius * Math.sin(eqAngle);
          const eqY = 7;
          
          nodes.push({
            id: `equipment-${eq.id}`,
            name: eq.name,
            type: 'equipment',
            position: [eqX, eqY, eqZ],
            radius: 1.1,
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
};