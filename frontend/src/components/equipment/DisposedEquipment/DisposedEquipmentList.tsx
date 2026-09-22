// components/equipment/DisposedEquipment/DisposedEquipmentList.tsx
import React, { useState } from 'react';
import { Equipment } from '../../../types';
import { format } from 'date-fns';
import { Trash2, RefreshCw, Box } from 'lucide-react';
import { ConfirmationModal } from '../../modals/ConfirmationModal';
import { getCategoryIconComponent } from '../categoryIcons';
import './styles/DisposedEquipmentList.css';

interface DisposedEquipmentListProps {
  equipment: Equipment[];
  onDelete: (id: string) => void;
  onRestore: (id: string) => void;
  onViewDetails: (equipment: Equipment) => void;
  /** Право на восстановление (change) */
  canRestore?: boolean;
  /** Право на удаление (delete) */
  canDelete?: boolean;
}

const safeFormatDate = (dateString: string | undefined | null): string => {
  if (!dateString) return '-';
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return '-';
    return format(date, 'dd.MM.yyyy');
  } catch {
    return '-';
  }
};

export function DisposedEquipmentList({
  equipment,
  onDelete,
  onRestore,
  onViewDetails,
  canRestore = false,
  canDelete = false,
}: DisposedEquipmentListProps) {
  const [modalState, setModalState] = useState<{
    type: 'delete' | 'restore';
    equipmentId: string | null;
  }>({ type: 'delete', equipmentId: null });

  const showActions = canRestore || canDelete;

  const handleDeleteClick = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    setModalState({ type: 'delete', equipmentId: id });
  };

  const handleRestoreClick = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    setModalState({ type: 'restore', equipmentId: id });
  };

  const handleConfirm = () => {
    const { type, equipmentId } = modalState;
    if (!equipmentId) return;
    if (type === 'delete') {
      onDelete(equipmentId);
    } else {
      onRestore(equipmentId);
    }
    setModalState({ type: 'delete', equipmentId: null });
  };

  const handleCancel = () => {
    setModalState({ type: 'delete', equipmentId: null });
  };

  if (equipment.length === 0) {
    return (
      <div className="det-empty-state">
        <p className="det-empty-text">Нет списанной техники</p>
      </div>
    );
  }

  return (
    <div className="det-table-container">
      <table className="det-equipment-table">
        <thead className="det-table-header">
          <tr>
            <th className="det-table-header-cell">№</th>
            <th className="det-table-header-cell">Название</th>
            <th className="det-table-header-cell">Серийный номер</th>
            <th className="det-table-header-cell">Инв. номер</th>
            <th className="det-table-header-cell">Дата производства</th>
            <th className="det-table-header-cell">Дата ввода в экспл.</th>
            <th className="det-table-header-cell">Модель</th>
            <th className="det-table-header-cell det-category-header">Категория</th>
            <th className="det-table-header-cell">В чьих интересах</th>
            <th className="det-table-header-cell">Подразделение</th>
            <th className="det-table-header-cell">Закреплено за</th>
            <th className="det-table-header-cell">№ акта списания</th>
            <th className="det-table-header-cell">Дата акта</th>
            <th className="det-table-header-cell">№ справки</th>
            <th className="det-table-header-cell">Дата справки</th>
            <th className="det-table-header-cell">Комментарии</th>
            {showActions && (
              <th className="det-table-header-cell det-actions-header">Действия</th>
            )}
          </tr>
        </thead>
        <tbody>
          {equipment.map((item, index) => {
            const CategoryIcon = getCategoryIconComponent(item.category) ?? Box;
            const categoryName = item.category?.name || item.category?.value || '';

            return (
              <tr
                key={item.id}
                onClick={() => onViewDetails(item)}
                className="det-table-row"
              >
                <td className="det-table-cell det-cell-index">{index + 1}</td>
                <td className="det-table-cell det-cell-name">{item.name}</td>
                <td className="det-table-cell">{item.serial_number}</td>
                <td className="det-table-cell">{item.inventory_number}</td>
                <td className="det-table-cell">{safeFormatDate(item.manufacturing_date)}</td>
                <td className="det-table-cell">{safeFormatDate(item.exploitation_date)}</td>
                <td className="det-table-cell">{item.type || '-'}</td>

                <td className="det-table-cell det-category-cell">
                  {item.category ? (
                    <CategoryIcon
                      size={16}
                      className="det-category-icon"
                      aria-label={categoryName}
                    >
                      <title>{categoryName}</title>
                    </CategoryIcon>
                  ) : (
                    <span className="det-category-fallback" title="Без категории">
                      —
                    </span>
                  )}
                </td>

                <td className="det-table-cell">{item.interest_organ?.name || '-'}</td>
                <td className="det-table-cell">
                  <div className="det-division-info">
                    <span>{item.division?.name || '-'}</span>
                    {item.subdivision?.name && (
                      <span className="det-subdivision-name">{item.subdivision.name}</span>
                    )}
                  </div>
                </td>
                <td className="det-table-cell">{item.assigned_to?.full_name || '-'}</td>
                <td className="det-table-cell">{item.disposal_info?.actNumber || '-'}</td>
                <td className="det-table-cell">
                  {safeFormatDate(item.disposal_info?.actDate)}
                </td>
                <td className="det-table-cell">
                  {item.disposal_info?.disposalCertNumber || '-'}
                </td>
                <td className="det-table-cell">
                  {safeFormatDate(item.disposal_info?.disposalCertDate)}
                </td>
                <td className="det-table-cell det-cell-comments">
                  {item.disposal_info?.comments || '-'}
                </td>

                {showActions && (
                  <td className="det-table-cell det-cell-actions">
                    <div className="det-actions-group">
                      {canRestore && (
                        <button
                          onClick={(e) => handleRestoreClick(e, String(item.id))}
                          className="det-restore-btn"
                          title="Восстановить"
                        >
                          <RefreshCw size={16} />
                        </button>
                      )}
                      {canDelete && (
                        <button
                          onClick={(e) => handleDeleteClick(e, String(item.id))}
                          className="det-delete-btn"
                          title="Удалить"
                        >
                          <Trash2 size={16} />
                        </button>
                      )}
                    </div>
                  </td>
                )}
              </tr>
            );
          })}
        </tbody>
      </table>

      {modalState.equipmentId && (
        <ConfirmationModal
          type={modalState.type}
          title={
            modalState.type === 'delete'
              ? 'Удаление списанной техники'
              : 'Восстановление техники'
          }
          message={
            modalState.type === 'delete'
              ? 'Вы уверены, что хотите удалить эту технику? Это действие нельзя отменить.'
              : 'Вы уверены, что хотите восстановить эту технику? Она вернётся в статус "В эксплуатации".'
          }
          onConfirm={handleConfirm}
          onCancel={handleCancel}
        />
      )}
    </div>
  );
}