import React from 'react';
import { Equipment } from '../../../../types';
import '../style.css';

interface ProductStructureTableProps {
  equipment: Equipment;
}

export function ProductStructureTable({ equipment }: ProductStructureTableProps) {
  if (!equipment.product_structures || equipment.product_structures.length === 0) {
    return null;
  }

  return (
    <div className="equipment-card equipment-structure-table">
      <h2 className="equipment-card__title">Состав изделия</h2>
      <div className="table-container">
        <table className="structure-table">
          <thead>
            <tr>
              <th>Наименование</th>
              <th>Модель</th>
              <th>Заводской номер</th>
              <th>Примечание</th>
            </tr>
          </thead>
          <tbody>
            {equipment.product_structures.map((item, index) => (
              <tr key={index}>
                <td>{item.name}</td>
                <td>{item.model || '-'}</td>
                <td>{item.serial_number || '-'}</td>
                <td>{item.note || '-'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}