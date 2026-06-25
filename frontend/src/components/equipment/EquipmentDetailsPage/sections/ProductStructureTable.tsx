// sections/ProductStructureTable.tsx
import React, { useMemo } from 'react';
import { Equipment } from '../../../../types';
import { Section } from './Section';

interface ProductStructureTableProps {
  equipment: Equipment;
  searchTerm?: string;
}

export function ProductStructureTable({ equipment, searchTerm = '' }: ProductStructureTableProps) {
  const structures = equipment.product_structures || [];
  if (structures.length === 0) return null;

  const filteredRows = useMemo(() => {
    if (!searchTerm.trim()) return structures;
    const lower = searchTerm.toLowerCase().trim();
    return structures.filter(row =>
      row.name.toLowerCase().includes(lower) ||
      (row.model || '').toLowerCase().includes(lower) ||
      (row.serial_number || '').toLowerCase().includes(lower) ||
      (row.note || '').toLowerCase().includes(lower)
    );
  }, [structures, searchTerm]);

  if (filteredRows.length === 0) return null;

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
            {filteredRows.map((item, idx) => (
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