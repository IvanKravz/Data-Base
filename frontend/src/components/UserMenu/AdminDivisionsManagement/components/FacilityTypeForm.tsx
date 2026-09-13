import React, { useState } from 'react';
import { facilityTypesApi } from '../../../../api/facilityTypes';
import { FacilityType } from '../../../../types';
import './Forms.css';
import { Input } from '../../../common/Input/Input';
import { Checkbox } from '../../../common/Checkbox/Checkbox';
import { Button } from '../../../common/Button/Button';

interface Props {
    initialData?: FacilityType | null;
    onSuccess: () => void;
    onCancel: () => void;
}

export const FacilityTypeForm: React.FC<Props> = ({ initialData, onSuccess, onCancel }) => {
    const [formData, setFormData] = useState<Partial<FacilityType>>({
        name: initialData?.name || '',
        description: initialData?.description || '',
        is_closed_type: initialData?.is_closed_type || false,
    });
    const [loading, setLoading] = useState(false);
    const token = localStorage.getItem('accessToken') || '';

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value, type, checked } = e.target as HTMLInputElement;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value,
        }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            if (initialData) {
                await facilityTypesApi.updateFacilityType(initialData.id, formData, token);
            } else {
                await facilityTypesApi.createFacilityType(formData, token);
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
                <label className="form-label">Описание</label>
                <textarea name="description" value={formData.description} onChange={handleChange} className="form-textarea" rows={3} />
            </div>
            <div className="form-group checkbox-group">
                <Checkbox label="Закрытый тип" name="is_closed_type" checked={formData.is_closed_type} onChange={handleChange} />
            </div>
            <div className="form-actions">
                <Button type="submit" loading={loading}>Сохранить</Button>
                <Button variant="secondary" onClick={onCancel}>Отмена</Button>
            </div>
        </form>
    );
};