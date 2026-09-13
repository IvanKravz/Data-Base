import React, { useState, useEffect } from 'react';
import { facilityTypesApi } from '../../../../api/facilityTypes';
import { FacilityType } from '../../../../types';
import './FacilityTypesTab.css';
import { Button } from '../../../common/Button/Button';
import { Modal } from '../../../common/Modal/Modal';
import { FacilityTypeForm } from '../components/FacilityTypeForm';
// Импорт иконок из lucide-react
import { Pencil, Trash2, Check, X } from 'lucide-react';

export const FacilityTypesTab: React.FC = () => {
    const [types, setTypes] = useState<FacilityType[]>([]);
    const [loading, setLoading] = useState(false);
    const [modalOpen, setModalOpen] = useState(false);
    const [editingType, setEditingType] = useState<FacilityType | null>(null);
    const token = localStorage.getItem('accessToken') || '';

    const loadTypes = async () => {
        setLoading(true);
        try {
            const data = await facilityTypesApi.getFacilityTypes(token);
            setTypes(data);
        } catch (error) {
            console.error('Ошибка загрузки типов', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadTypes();
    }, []);

    const handleAdd = () => {
        setEditingType(null);
        setModalOpen(true);
    };

    const handleEdit = (type: FacilityType) => {
        setEditingType(type);
        setModalOpen(true);
    };

    const handleDelete = async (id: number) => {
        if (window.confirm('Удалить тип объекта?')) {
            await facilityTypesApi.deleteFacilityType(id, token);
            loadTypes();
        }
    };

    const handleModalClose = () => {
        setModalOpen(false);
        setEditingType(null);
    };

    const handleModalSuccess = () => {
        handleModalClose();
        loadTypes();
    };

    return (
        <div className="facility-types-tab">
            <div className="panel-header">
                <h2>Типы объектов</h2>
                <Button onClick={handleAdd}>Добавить</Button>
            </div>

            {loading && <div className="loading">Загрузка...</div>}

            <div className="table-wrapper">
                <table className="types-table">
                    <thead>
                        <tr>
                            <th>Название</th>
                            <th>Описание</th>
                            <th>Закрытый тип</th>
                            <th>Действия</th>
                        </tr>
                    </thead>
                    <tbody>
                        {types.map(type => (
                            <tr key={type.id}>
                                <td>{type.name}</td>
                                <td>{type.description || '-'}</td>
                                <td>
                                    <span className={`status-badge ${type.is_closed_type ? 'open' : 'closed'}`}>
                                        {type.is_closed_type ? (
                                            <Check size={18} strokeWidth={2.5} />
                                        ) : (
                                            <X size={18} strokeWidth={2.5} />
                                        )}
                                    </span>
                                </td>
                                <td>
                                    <div className="actions-cell">
                                        <button
                                            className="btn-action"
                                            onClick={() => handleEdit(type)}
                                            aria-label="Редактировать"
                                        >
                                            <Pencil size={18} strokeWidth={2} />
                                        </button>
                                        <button
                                            className="btn-action danger"
                                            onClick={() => handleDelete(type.id)}
                                            aria-label="Удалить"
                                        >
                                            <Trash2 size={18} strokeWidth={2} />
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            <Modal isOpen={modalOpen} onClose={handleModalClose} title={editingType ? 'Редактирование типа' : 'Новый тип'}>
                <FacilityTypeForm initialData={editingType} onSuccess={handleModalSuccess} onCancel={handleModalClose} />
            </Modal>
        </div>
    );
};