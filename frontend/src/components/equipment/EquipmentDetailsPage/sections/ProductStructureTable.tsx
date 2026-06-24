// ProductStructureTable.tsx
import React from 'react';
import { Equipment } from '../../../../types';
import { Section } from './Section';

export function ProductStructureTable({ equipment }: { equipment: Equipment }) {
  if (!equipment.product_structures || equipment.product_structures.length === 0) {
    return null;
  }

  return (
    <Section title="Состав изделия">
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
            {equipment.product_structures.map((item, idx) => (
              <tr key={idx}>
                <td>{item.name}</td>
                <td>{item.model || '-'}</td>
                <td>{item.serial_number || '-'}</td>
                <td>{item.note || '-'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Section>
  );
}