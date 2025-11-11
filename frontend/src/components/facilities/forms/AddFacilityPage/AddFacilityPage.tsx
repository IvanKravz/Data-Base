import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { EditFacilityForm } from '../EditFacilityForm/EditFacilityForm';
import { facilitiesApi, divisionsApi } from '../../../../api';
import { useDispatch } from 'react-redux';
import { addFacility } from '../../../../store/slices/facilitiesSlice';
import { Facility } from '../../../../types';

export function AddFacilityPage() {
    const { id: divisionId } = useParams<{ id: string }>();
    const location = useLocation();
    const navigate = useNavigate();
    const dispatch = useDispatch();
    const token = localStorage.getItem('accessToken');

    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [divisions, setDivisions] = useState<any[]>([]);
    const [isLoadingDivisions, setIsLoadingDivisions] = useState(true);

    // Получаем subdivisionId из state навигации или из search params
    const searchParams = new URLSearchParams(location.search);
    const subdivisionIdFromUrl = searchParams.get('subdivision');
    const subdivisionIdFromState = location.state?.subdivisionId;
    const preSelectedSubdivision = subdivisionIdFromState || subdivisionIdFromUrl;

    // ДОБАВЛЕНО: Получаем флаг fromSubdivision из state
    const fromSubdivision = location.state?.fromSubdivision || false;

    // Загружаем список подразделений
    useEffect(() => {
        const fetchDivisions = async () => {
            if (!token) return;
            try {
                const divisionsData = await divisionsApi.getDivisions(token);
                setDivisions(divisionsData);
            } catch (err) {
                console.error('Ошибка при загрузке подразделений:', err);
            } finally {
                setIsLoadingDivisions(false);
            }
        };
        fetchDivisions();
    }, [token]);

    const initialData = {
        name: '',
        division: divisionId || null,
        subdivision: preSelectedSubdivision || null,
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
                division: data.division?.id || divisionId,
                type_id: data.type?.id || null,
                communication_post_ids: data.communication_posts?.map(p => p.id) || []
            });

            dispatch(addFacility(newFacility));

            // ВАЖНОЕ ИЗМЕНЕНИЕ: Навигация после создания с учетом subdivisionId
            if (location.state?.from === 'facilities-section') {
                const backState = {
                    divisionId: location.state.divisionId,
                    subdivisionId: location.state.subdivisionId,
                    activeTab: location.state.activeTab,
                    fromSubdivision: location.state.fromSubdivision
                };

                if (divisionId) {
                    // Возвращаемся к списку объектов с учетом контекста отделения
                    if (fromSubdivision && preSelectedSubdivision) {
                        navigate(`/divisions/${divisionId}/facilities?subdivision=${preSelectedSubdivision}`, { state: backState });
                    } else {
                        navigate(`/divisions/${divisionId}/facilities`, { state: backState });
                    }
                } else {
                    navigate('/facilities', { state: backState });
                }
            } else if (divisionId) {
                // Стандартный возврат
                if (fromSubdivision && preSelectedSubdivision) {
                    navigate(`/divisions/${divisionId}/facilities?subdivision=${preSelectedSubdivision}`);
                } else {
                    navigate(`/divisions/${divisionId}/facilities`);
                }
            } else {
                navigate('/facilities');
            }
        } catch (err) {
            console.error('Ошибка при создании объекта:', err);
            setError('Не удалось создать объект');
        } finally {
            setIsSubmitting(false);
        }
    };


    const handleBack = () => {
        // ВАЖНОЕ ИЗМЕНЕНИЕ: Логика возврата с учетом контекста отделения
        if (location.state?.from === 'facilities-section') {
            const backState = {
                divisionId: location.state.divisionId,
                subdivisionId: location.state.subdivisionId,
                activeTab: location.state.activeTab,
                fromSubdivision: location.state.fromSubdivision
            };

            if (divisionId) {
                // Возвращаемся к списку объектов с учетом контекста отделения
                if (fromSubdivision && preSelectedSubdivision) {
                    navigate(`/divisions/${divisionId}/facilities?subdivision=${preSelectedSubdivision}`, { state: backState });
                } else {
                    navigate(`/divisions/${divisionId}/facilities`, { state: backState });
                }
            } else {
                navigate('/facilities', { state: backState });
            }
        } else if (divisionId) {
            // Стандартный возврат
            if (fromSubdivision && preSelectedSubdivision) {
                navigate(`/divisions/${divisionId}/facilities?subdivision=${preSelectedSubdivision}`);
            } else {
                navigate(`/divisions/${divisionId}/facilities`);
            }
        } else {
            navigate('/facilities');
        }
    };

    return (
        <div className="facility-details-container">
            <div className="facility-edit-header">
                <button
                    onClick={handleBack}
                    className="back-button facility-btn--icon"
                >
                    <ArrowLeft size={20} />
                </button>
                <h1 className="facilities-title">Добавление нового объекта</h1>
            </div>

            <div className="facility-card-edit facility-card--editing">
                <EditFacilityForm
                    initialData={initialData}
                    onSubmit={handleSubmit}
                    onCancel={handleBack}
                    isEditing={false}
                    preSelectedDivision={divisionId}
                    preSelectedSubdivision={preSelectedSubdivision}
                    divisions={divisions}
                    isLoadingDivisions={isLoadingDivisions}
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