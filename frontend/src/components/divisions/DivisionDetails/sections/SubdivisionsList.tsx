import React from 'react';
import { Users, Database, Building2, ListTodo } from 'lucide-react';
import { Division, Equipment, Person, Facility, Task, Subdivision } from '../../../../types';
import './style.css';

interface SubdivisionsListProps {
  division: Division;
  handleSectionClick: (section: string) => void;
  equipment: Equipment[];
  personnel: Person[];
  facilities: Facility[];
  tasks: Task[];
}

export function SubdivisionsList({ 
  division,
  handleSectionClick,
  equipment,
  personnel,
  facilities,
  tasks
}: SubdivisionsListProps) {
  const getSubdivisionCounts = (subdivisionName: string) => {
    const subdivisionEquipment = equipment.filter(
      item => item.division === division.name && item.subdivision === subdivisionName
    );
    const subdivisionPersonnel = personnel.filter(
      person => person.division === division.name && person.subdivision === subdivisionName
    );
    const subdivisionFacilities = facilities.filter(
      facility => facility.division === division.name && facility.subdivision === subdivisionName
    );
    const subdivisionTasks = tasks.filter(
      task => task.divisionId === division.id
    );

    return {
      equipment: {
        total: subdivisionEquipment.length,
        open: subdivisionEquipment.filter(e => e.category !== 'closed').length,
        closed: subdivisionEquipment.filter(e => e.category === 'closed').length
      },
      personnel: {
        total: subdivisionPersonnel.length,
        mol: subdivisionPersonnel.filter(p => p.is_material_responsible).length,
        sha: subdivisionPersonnel.filter(p => p.is_sha_worker).length
      },
      facilities: {
        total: subdivisionFacilities.length,
        stations: subdivisionFacilities.filter(f => f.type === 'station').length,
        shd: subdivisionFacilities.filter(f => f.type === 'shd').length
      },
      tasks: {
        total: subdivisionTasks.length,
        inProgress: subdivisionTasks.filter(t => !t.steps.every(s => s.isCompleted)).length,
        completed: subdivisionTasks.filter(t => t.steps.every(s => s.isCompleted)).length
      }
    };
  };

  const subdivisions = division.subdivisions || [];
  
  if (subdivisions.length === 0) {
    return null;
  }

  return (
    <div className="subdivisions-container">
      <h2 className="subdivisions-title">Отделения</h2>
      <div className="subdivisions-grid">
        {subdivisions.map(subdivision => {
          return (
            <div 
              key={subdivision.id}
              className="subdivision-card"
            >
              <h3 className="subdivision-card-title">{subdivision.name}</h3>
              <div className="subdivision-metrics">
                <div 
                  className="subdivision-card-detail clickable-metric"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleSectionClick('personnel', subdivision.id); // Добавляем subdivision.id
                  }}
                >
                  <div className="subdivision-card-detail-label">
                    <Users className="h-4 w-4 metric-icon--blue" />
                    <span className="text-card-subdivision">Персонал</span>
                  </div>
                  <div className="text-sm">
                    <span className="text-card-count font-medium text-gray-900">{subdivision.employees_count}</span>
                  </div>
                </div>

                <div 
                  className="subdivision-card-detail clickable-metric"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleSectionClick('equipment', subdivision.id); // Добавляем subdivision.id
                  }}
                >
                  <div className="subdivision-card-detail-label">
                    <Database className="h-4 w-4 metric-icon--green" />
                    <span className="text-card-subdivision">Техника</span>
                  </div>
                  <div className="text-sm">
                    <span className="text-card-count font-medium text-gray-900">{subdivision.equipment_count}</span>
                  </div>
                </div>

                <div 
                  className="subdivision-card-detail clickable-metric"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleSectionClick('facilities', subdivision.id); // Добавляем subdivision.id
                  }}
                >
                  <div className="subdivision-card-detail-label">
                    <Building2 className="h-4 w-4 metric-icon--purple" />
                    <span className="text-card-subdivision">Объекты</span>
                  </div>
                  <div className="text-sm">
                    <span className="text-card-count font-medium text-gray-900">{subdivision.facilities_count}</span>
                  </div>
                </div>

                <div 
                  className="subdivision-card-detail clickable-metric"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleSectionClick('tasks', subdivision.id); // Добавляем subdivision.id
                  }}
                >
                  <div className="subdivision-card-detail-label">
                    <ListTodo className="h-4 w-4 metric-icon--orange" />
                    <span className="text-card-subdivision">Задачи</span>
                  </div>
                  <div className="text-sm">
                    <span className="text-card-count font-medium text-gray-900">{subdivision.tasks_count}</span>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}