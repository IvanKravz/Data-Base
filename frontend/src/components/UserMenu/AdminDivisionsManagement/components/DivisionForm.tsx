import React, { useState } from 'react';
import { Division } from '../../../../types';
import './Forms.css';
import { divisionsApi } from '../../../../api';
import { Input } from '../../../common/Input/Input';
import { Button } from '../../../common/Button/Button';

interface Props {
    initialData?: Division | null;
    onSuccess: () => void;
    onCancel: () => void;
}

export const DivisionForm: React.FC<Props> = ({ initialData, onSuccess, onCancel }) => {
    const [formData, setFormData] = useState<Partial<Division>>({
        name: initialData?.name || '',
        order: initialData?.order ?? 0,
        staff_planned_total: initialData?.staff_planned_total ?? 0,
        staff_planned_management: initialData?.staff_planned_management ?? 0,
        staff_planned_officers: initialData?.staff_planned_officers ?? 0,
        staff_planned_warrant_officers: initialData?.staff_planned_warrant_officers ?? 0,
        staff_planned_civilian: initialData?.staff_planned_civilian ?? 0,
    });
    const [loading, setLoading] = useState(false);
    const token = localStorage.getItem('accessToken') || '';

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value, type } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'number' ? Number(value) : value,
        }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            if (initialData) {
                await divisionsApi.updateDivision(initialData.id, formData, token);
            } else {
                await divisionsApi.createDivision(formData, token);
            }
            onSuccess();
        } catch (error) {
            console.error('Ошибка сохранения', error);
            alert('Ошибка сохранения');
        } finally {
            setLoading(false);
        }
    };

    return (
        <form className="admin-form" onSubmit={handleSubmit}>
            <div className="form-group">
                <Input label="Название *" name="name" value={formData.name} onChange={handleChange} required />
            </div>
            <div className="form-group">
                <Input label="Порядок сортировки" type="number" name="order" value={formData.order} onChange={handleChange} />
            </div>
            <div className="form-row">
                <div className="form-group">
                    <Input label="Штат (всего)" type="number" name="staff_planned_total" value={formData.staff_planned_total} onChange={handleChange} />
                </div>
                <div className="form-group">
                    <Input label="Руководство" type="number" name="staff_planned_management" value={formData.staff_planned_management} onChange={handleChange} />
                </div>
            </div>
            <div className="form-row">
                <div className="form-group">
                    <Input label="Офицеры" type="number" name="staff_planned_officers" value={formData.staff_planned_officers} onChange={handleChange} />
                </div>
                <div className="form-group">
                    <Input label="Прапорщики" type="number" name="staff_planned_warrant_officers" value={formData.staff_planned_warrant_officers} onChange={handleChange} />
                </div>
                <div className="form-group">
                    <Input label="Гражданские" type="number" name="staff_planned_civilian" value={formData.staff_planned_civilian} onChange={handleChange} />
                </div>
            </div>
            <div className="form-actions">
                <Button type="submit" loading={loading}>Сохранить</Button>
                <Button variant="secondary" onClick={onCancel}>Отмена</Button>
            </div>
        </form>
    );
};