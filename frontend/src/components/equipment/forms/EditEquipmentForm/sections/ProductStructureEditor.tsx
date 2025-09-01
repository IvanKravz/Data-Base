import React, { useState } from 'react';
import { Equipment, ProductStructure } from '../../../../../types';
import { Plus, Trash2 } from 'lucide-react';
import '../style.css';

interface ProductStructureEditorProps {
  productStructures: ProductStructure[];
  onChange: (structures: ProductStructure[]) => void;
  isDisposed?: boolean;
}

export function ProductStructureEditor({
  productStructures = [],
  onChange,
  isDisposed = false,
}: ProductStructureEditorProps) {
  const [newItem, setNewItem] = useState<Omit<ProductStructure, 'id'>>({
    name: '',
    model: '',
    serial_number: '',
    note: '',
  });

  const handleAddItem = () => {
    if (!newItem.name.trim()) return;
    onChange([...productStructures, { ...newItem, id: Date.now().toString() }]);
    setNewItem({
      name: '',
      model: '',
      serial_number: '',
      note: '',
    });
  };

  const handleRemoveItem = (id: string) => {
    onChange(productStructures.filter(item => item.id !== id));
  };

  const handleUpdateItem = (id: string, field: keyof ProductStructure, value: string) => {
    onChange(
      productStructures.map(item =>
        item.id === id ? { ...item, [field]: value } : item
      )
    );
  };

  return (
    <div className="equipment-card-table">
      <div className="equipment-card-header">
        <h3 className="equipment-card-title">Состав изделия</h3>
      </div>
      <div className="equipment-card-content-edit">
        <div className="structure-table-container">
          <table className="structure-table">
            <thead>
              <tr>
                <th>Наименование</th>
                <th>Модель</th>
                <th>Заводской номер</th>
                <th>Примечание</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {/* Существующие компоненты */}
              {productStructures.map((item) => (
                <tr key={item.id}>
                  <td>
                    <input
                      type="text"
                      value={item.name}
                      onChange={(e) => handleUpdateItem(item.id, 'name', e.target.value)}
                      className="form-input-edit"
                      disabled={isDisposed}
                    />
                  </td>
                  <td>
                    <input
                      type="text"
                      value={item.model || ''}
                      onChange={(e) => handleUpdateItem(item.id, 'model', e.target.value)}
                      className="form-input-edit"
                      disabled={isDisposed}
                    />
                  </td>
                  <td>
                    <input
                      type="text"
                      value={item.serial_number || ''}
                      onChange={(e) => handleUpdateItem(item.id, 'serial_number', e.target.value)}
                      className="form-input-edit"
                      disabled={isDisposed}
                    />
                  </td>
                  <td>
                    <input
                      type="text"
                      value={item.note || ''}
                      onChange={(e) => handleUpdateItem(item.id, 'note', e.target.value)}
                      className="form-input-edit"
                      disabled={isDisposed}
                    />
                  </td>
                  <td>
                    {!isDisposed && (
                      <button
                        type="button"
                        onClick={() => handleRemoveItem(item.id)}
                        className="btn btn-danger"
                        style={{ padding: '0.25rem' }}
                      >
                        <Trash2 size={16} />
                      </button>
                    )}
                  </td>
                </tr>
              ))}

              {/* Строка для добавления нового компонента */}
              {!isDisposed && (
                <tr className="add-new-row">
                  <td>
                    <input
                      type="text"
                      value={newItem.name}
                      onChange={(e) => setNewItem({ ...newItem, name: e.target.value })}
                      className="form-input-edit"
                      placeholder="Введите наименование"
                    />
                  </td>
                  <td>
                    <input
                      type="text"
                      value={newItem.model}
                      onChange={(e) => setNewItem({ ...newItem, model: e.target.value })}
                      className="form-input-edit"
                      placeholder="Введите модель"
                    />
                  </td>
                  <td>
                    <input
                      type="text"
                      value={newItem.serial_number}
                      onChange={(e) => setNewItem({ ...newItem, serial_number: e.target.value })}
                      className="form-input-edit"
                      placeholder="Введите номер"
                    />
                  </td>
                  <td>
                    <input
                      type="text"
                      value={newItem.note}
                      onChange={(e) => setNewItem({ ...newItem, note: e.target.value })}
                      className="form-input-edit"
                      placeholder="Введите примечание"
                    />
                  </td>
                  <td>
                    <button
                      type="button"
                      onClick={handleAddItem}
                      className="btn btn-primary"
                      style={{ padding: '0.25rem' }}
                      disabled={!newItem.name.trim()}
                    >
                      <Plus size={16} />
                    </button>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}