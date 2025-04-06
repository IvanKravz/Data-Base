import React from 'react';
import { Users, Database, Building2, ListTodo } from 'lucide-react';
import { Division, Equipment, Person, Facility, Task } from '../../../../types';
import './style.css';

interface SubdivisionsListProps {
  division: Division;
  onSubdivisionClick: (subdivision: string) => void;
  equipment: Equipment[];
  personnel: Person[];
  facilities: Facility[];
  tasks: Task[];
}

export function SubdivisionsList({ 
  division,
  onSubdivisionClick,
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

  const subdivisions = division.name === "1 отдел" 
    ? ["Отделение A", "Отделение B", "Отделение C"]
    : division.name === "2 отдел" 
      ? ["Отделение D", "Отделение E", "Отделение F"]
      : [];

  if (subdivisions.length === 0) {
    return null;
  }

  return (
    <div className="subdivisions-container">
      <h2 className="subdivisions-title">Отделения</h2>
      <div className="subdivisions-grid">
        {subdivisions.map(subdivision => {
          const counts = getSubdivisionCounts(subdivision);
          return (
            <div 
              key={subdivision} 
              onClick={() => onSubdivisionClick(subdivision)}
              className="subdivision-card"
            >
              <h3 className="subdivision-card-title">{subdivision}</h3>
              <div className="space-y-4">
                <div className="subdivision-card-detail">
                  <div className="subdivision-card-detail-label">
                    <Users className="h-4 w-4 text-blue-500" />
                    <span className="text-sm text-gray-600">Персонал</span>
                  </div>
                  <div className="text-sm">
                    <span className="font-medium text-gray-900">{counts.personnel.total}</span>
                    <span className="text-gray-500 ml-1">
                      (МОЛ: {counts.personnel.mol}, ШаР: {counts.personnel.sha})
                    </span>
                  </div>
                </div>

                <div className="subdivision-card-detail">
                  <div className="subdivision-card-detail-label">
                    <Database className="h-4 w-4 text-purple-500" />
                    <span className="text-sm text-gray-600">Техника</span>
                  </div>
                  <div className="text-sm">
                    <span className="font-medium text-gray-900">{counts.equipment.total}</span>
                    <span className="text-gray-500 ml-1">
                      (О: {counts.equipment.open}, З: {counts.equipment.closed})
                    </span>
                  </div>
                </div>

                <div className="subdivision-card-detail">
                  <div className="subdivision-card-detail-label">
                    <Building2 className="h-4 w-4 text-green-500" />
                    <span className="text-sm text-gray-600">Объекты</span>
                  </div>
                  <div className="text-sm">
                    <span className="font-medium text-gray-900">{counts.facilities.total}</span>
                    <span className="text-gray-500 ml-1">
                      (СТ: {counts.facilities.stations}, ШД: {counts.facilities.shd})
                    </span>
                  </div>
                </div>

                <div className="subdivision-card-detail">
                  <div className="subdivision-card-detail-label">
                    <ListTodo className="h-4 w-4 text-orange-500" />
                    <span className="text-sm text-gray-600">Задачи</span>
                  </div>
                  <div className="text-sm">
                    <span className="font-medium text-gray-900">{counts.tasks.total}</span>
                    <span className="text-gray-500 ml-1">
                      (А: {counts.tasks.inProgress}, З: {counts.tasks.completed})
                    </span>
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