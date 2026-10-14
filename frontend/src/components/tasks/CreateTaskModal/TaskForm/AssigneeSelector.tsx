import React from 'react';
import '../style.css';
import { AssigneeOption } from '../../../../api/tasks';

interface AssigneeSelectorProps {
  assignees: AssigneeOption[];
  selectedAssigneeId: number | null;
  onChange: (assigneeId: number | null) => void;
  isLoading: boolean;
  hasDivision: boolean;
}

export function AssigneeSelector({
  assignees,
  selectedAssigneeId,
  onChange,
  isLoading,
  hasDivision,
}: AssigneeSelectorProps) {
  if (!hasDivision) return null;

  const renderLabel = (a: AssigneeOption) => {
    const parts = [a.full_name];
    if (a.position) parts.push(a.position);
    if (a.rank) parts.push(a.rank);
    return parts.join(' — ');
  };

  return (
    <div className="task-form-field">
      <label htmlFor="assignee-select" className="task-form-label">
        Ответственный исполнитель
      </label>
      <select
        id="assignee-select"
        value={selectedAssigneeId ?? ''}
        onChange={(e) => onChange(e.target.value === '' ? null : Number(e.target.value))}
        disabled={isLoading || assignees.length === 0}
        className="task-form-select"
        aria-busy={isLoading}
      >
        <option value="">
          {isLoading
            ? 'Загрузка сотрудников...'
            : assignees.length === 0
              ? 'Нет доступных сотрудников'
              : 'Не выбрано'}
        </option>
        {assignees.map((a) => (
          <option key={a.id} value={a.id}>
            {renderLabel(a)}
          </option>
        ))}
      </select>
    </div>
  );
}