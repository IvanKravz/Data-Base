import React from 'react';
import { Employee } from '../../../../types';
import { Trash2, Shield, ClipboardList, CircleUserRound } from 'lucide-react';
import './style.css';

interface TableViewProps {
  personnel: Employee[]; // Уже отсортированный список сотрудников
  onPersonClick: (person: Employee) => void;
  onDelete: (id: string) => void;
  divisionName: string;
}

export function TableView({ personnel, onPersonClick, onDelete }: TableViewProps) {

  return (
    <div className="table-container">
      <table className="table">
        <thead className="table-header">
          <tr>
            <th className="table-header-cell">Фамилия, имя, отчество</th>
            <th className="table-header-cell">Звание</th>
            <th className="table-header-cell">Должность</th>
            <th className="table-header-cell">Подразделение</th>
            <th className="table-header-cell">Телефон</th>
            <th className="table-header-cell">Класс сети/ Форма ГТ</th>
            <th className="table-header-cell text-right">Действия</th>
          </tr>
        </thead>
        <tbody className="table-body">
          {personnel.map((person) => (
            <tr
              key={person.id}
              onClick={() => onPersonClick(person)}
              className="table-row"
            >
              <td className="table-cell">
                <div className="flex items-center">
                  <div className="user-avatar">
                    <span>{person.full_name.charAt(0)}</span>
                  </div>
                  <div className="ml-3">
                    <div className="text-sm font-medium text-gray-900">
                      {person.full_name.length > 30
                        ? `${person.full_name.substring(0, 30)}...`
                        : person.full_name}
                    </div>
                    <div className="flex items-center gap-1 mt-0.5">
                      {person.category === "management" && (
                        <div className="badge badge--red">
                          <CircleUserRound className="h-4 w-4" />
                        </div>
                      )}
                      {person.is_material_responsible && (
                        <div className="badge badge--blue">
                          <ClipboardList className="h-3 w-3" />
                          <span>МОЛ</span>
                        </div>
                      )}
                      {person.is_sha_worker && (
                        <div className="badge badge--green">
                          <Shield className="h-3 w-3" />
                          <span>ШР</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </td>
              <td className="table-cell">
                <div className="text-sm text-gray-900">
                  {person.rank || '—'}
                </div>
              </td>
              <td className="table-cell">
                <div className="text-sm text-gray-900">
                  {person.position.length > 30
                    ? `${person.position.substring(0, 30)}...`
                    : person.position}
                </div>
              </td>
              <td className="table-cell">
                <div className="text-sm text-gray-900">
                  {person.division?.name}
                </div>
                <div className="text-xs text-gray-500">
                  {person.subdivision?.name}
                </div>
              </td>
              <td className="table-cell">
                <div className="text-sm text-gray-900">
                  <div>раб. {person.work_phone}</div>
                  <div>сот. {person.personal_phone}</div>
                </div>
              </td>
              <td className="table-cell">
                <div className="text-sm text-gray-900">
                {person.sha_details && `${person.sha_details.access_level} класс / `} 
                {person.form_state_secrets}
                </div>
              </td>
              <td className="table-cell text-right">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onDelete(person.id);
                  }}
                  className="delete-button"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}