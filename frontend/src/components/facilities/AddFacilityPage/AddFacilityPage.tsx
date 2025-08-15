import React, { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { EditFacilityForm } from '../forms/EditFacilityForm';
import { facilitiesApi } from '../../../api';
import { useDispatch } from 'react-redux';
import { addFacility } from '../../../store/slices/facilitiesSlice';
import { Facility } from '../../../types';
// import '../EditFacilityForm.css';

export function AddFacilityPage() {
    const { id: divisionId } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const dispatch = useDispatch();
    const token = localStorage.getItem('accessToken');

    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const initialData = {
        name: '',
        division: divisionId,
        subdivision: null,
        type: null,
        facility_class: null,
        communication_posts: [],
        is_closed: false,
        comments: '',
        city: '',
        street: '',
        house_number: '',
        inn: null,
        kz_size: null,
        has_transformer_in_kz: false,
        has_grounding_in_kz: false,
        acceptance_act_number: null,
        rim_act_number: null,
        commissioning_act_number: null,
        opening_permission_number: null
    };

    const handleSubmit = async (data: Partial<Facility>) => {
        if (!token) return;

        try {
            setIsSubmitting(true);
            setError(null);

            const newFacility = await facilitiesApi.createFacility({
                ...data,
                division: divisionId,
                type_id: data.type?.id || null,
                communication_post_ids: data.communication_posts?.map(p => p.id) || []
            });

            dispatch(addFacility(newFacility));
            navigate(`/divisions/${divisionId}/facilities`);
        } catch (err) {
            console.error('Ошибка при создании объекта:', err);
            setError('Не удалось создать объект');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleBack = () => {
        navigate(`/divisions/${divisionId}/facilities`);
    };

    console.log('initialData', initialData)

    return (
        <div className="facility-details-container">
            <div className="facility-edit-header">
                <button
                    onClick={handleBack}
                    className="back-button facility-btn--icon"
                >
                    <ArrowLeft size={20} />
                </button>
                <h1 className="facility-header__title">Добавление нового объекта</h1>
            </div>

            <div className="facility-card-edit facility-card--editing">
                <EditFacilityForm
                    initialData={initialData}
                    onSubmit={handleSubmit}
                    onCancel={handleBack}
                    isClosedFacility={false}
                    isEditing={false} // Указываем, что это режим добавления
                />
            </div>

            {error && (
                <div className="text-red-500 p-4 text-center">
                    {error}
                </div>
            )}
        </div>
    );
}