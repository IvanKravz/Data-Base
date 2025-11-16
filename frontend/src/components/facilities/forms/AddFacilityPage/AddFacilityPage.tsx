import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { EditFacilityForm } from '../EditFacilityForm/EditFacilityForm';
import { facilitiesApi, divisionsApi, communicationPostsApi } from '../../../../api';
import { useDispatch } from 'react-redux';
import { addFacility } from '../../../../store/slices/facilitiesSlice';
import { Facility } from '../../../../types';
import { getCurrentUser, isExploitationChief, isExploitationEmployee } from '../../../../api/utils/permissions';

export function AddFacilityPage() {
    const { id: divisionId } = useParams<{ id: string }>();
    const location = useLocation();
    const navigate = useNavigate();
    const dispatch = useDispatch();
    const token = localStorage.getItem('accessToken');

    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [divisions, setDivisions] = useState<any[]>([]);
    const [facilityTypes, setFacilityTypes] = useState<any[]>([]);
    const [communicationPosts, setCommunicationPosts] = useState<any[]>([]);
    const [isLoadingData, setIsLoadingData] = useState(true);

    // Получаем данные из состояния навигации
    const navigationState = location.state as {
        divisionId?: string;
        subdivisionId?: string;
        divisionName?: string;
        subdivisionName?: string;
        fromSubdivision?: boolean;
    } | undefined;

    // Получаем данные текущего пользователя с useMemo
    const currentUser = useMemo(() => getCurrentUser(), []);
    const isExploitationUser = useMemo(() => isExploitationChief() || isExploitationEmployee(), []);

    // Получаем subdivisionId из state навигации или из search params
    const searchParams = useMemo(() => new URLSearchParams(location.search), [location.search]);
    const subdivisionIdFromUrl = searchParams.get('subdivision');
    const subdivisionIdFromState = navigationState?.subdivisionId;
    const preSelectedSubdivision = subdivisionIdFromState || subdivisionIdFromUrl;

    // Получаем флаг fromSubdivision из state
    const fromSubdivision = navigationState?.fromSubdivision || false;

    // Определяем эффективные значения для подразделения и отделения
    const effectiveDivisionId = useMemo(() => {
        // Приоритеты: divisionId из URL > divisionId из state > подразделение пользователя
        return divisionId ||
            navigationState?.divisionId ||
            (isExploitationUser && currentUser?.division_info?.id ? currentUser.division_info.id : null);
    }, [divisionId, navigationState?.divisionId, isExploitationUser, currentUser]);

    const effectiveSubdivisionId = useMemo(() => {
        // Приоритеты: subdivisionId из state > subdivisionId из URL > отделение пользователя
        return preSelectedSubdivision ||
            (isExploitationUser && !preSelectedSubdivision && currentUser?.division_info?.subdivision?.id ?
                currentUser.division_info.subdivision.id : null);
    }, [preSelectedSubdivision, isExploitationUser, currentUser]);

    // Определяем, находимся ли мы в глобальном режиме
    const isGlobalMode = useMemo(() => !divisionId && !isExploitationUser, [divisionId, isExploitationUser]);

    // Упрощаем логику фиксированных значений
    const fixedDivision = useMemo(() => !!effectiveDivisionId, [effectiveDivisionId]);
    const fixedSubdivision = useMemo(() => !!effectiveSubdivisionId && fromSubdivision,
        [effectiveSubdivisionId, fromSubdivision]);

    // Централизованная загрузка всех данных как в технике
    useEffect(() => {
        const fetchAllData = async () => {
          if (!token) {
            console.error('Token not available');
            return;
          }
          
          try {
            setIsLoadingData(true);
            setError(null);
      
            // Проверяем доступность методов API
            if (!facilitiesApi.getFacilityTypes) {
              throw new Error('getFacilityTypes method not available');
            }
            if (!communicationPostsApi.getCommunicationPosts) {
              throw new Error('getCommunicationPosts method not available');
            }
      
            const [divisionsData, facilityTypesData, communicationPostsData] = await Promise.all([
              divisionsApi.getDivisions({ token }),
              facilitiesApi.getFacilityTypes(token),
              communicationPostsApi.getCommunicationPosts({ token })
            ]);
      
            setDivisions(divisionsData);
            setFacilityTypes(facilityTypesData);
            setCommunicationPosts(communicationPostsData);
            
          } catch (err) {
            console.error('Ошибка при загрузке данных:', err);
            setError(`Ошибка загрузки данных: ${err.message}`);
          } finally {
            setIsLoadingData(false);
          }
        };
        
        fetchAllData();
      }, [token]);

    // Правильно формируем initialData с объектами подразделения и отделения
    const initialData = useMemo(() => {
        // Находим объект подразделения по ID
        const divisionObj = effectiveDivisionId && divisions.length > 0
            ? divisions.find(d => String(d.id) === String(effectiveDivisionId))
            : null;

        // Находим объект отделения по ID
        const subdivisionObj = effectiveSubdivisionId && divisionObj && divisionObj.subdivisions
            ? divisionObj.subdivisions.find(s => String(s.id) === String(effectiveSubdivisionId))
            : null;

        return {
            name: '',
            division: divisionObj || null,
            subdivision: subdivisionObj || null,
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
    }, [effectiveDivisionId, effectiveSubdivisionId, divisions]);

    const handleSubmit = useCallback(async (data: Partial<Facility>) => {
        if (!token) return;

        try {
            setIsSubmitting(true);
            setError(null);

            const newFacility = await facilitiesApi.createFacility({
                ...data,
                division: data.division?.id || effectiveDivisionId,
                type_id: data.type?.id || null,
                communication_post_ids: data.communication_posts?.map(p => p.id) || []
            });

            dispatch(addFacility(newFacility));

            // Навигация после создания с учетом контекста
            if (location.state?.from === 'facilities-section') {
                const backState = {
                    divisionId: location.state.divisionId,
                    subdivisionId: location.state.subdivisionId,
                    activeTab: location.state.activeTab,
                    fromSubdivision: location.state.fromSubdivision
                };

                if (isGlobalMode) {
                    navigate('/facilities', { state: backState });
                } else if (effectiveDivisionId) {
                    if (fromSubdivision && effectiveSubdivisionId) {
                        navigate(`/divisions/${effectiveDivisionId}/facilities?subdivision=${effectiveSubdivisionId}`, { state: backState });
                    } else {
                        navigate(`/divisions/${effectiveDivisionId}/facilities`, { state: backState });
                    }
                } else {
                    navigate('/facilities', { state: backState });
                }
            } else if (isGlobalMode) {
                navigate('/facilities');
            } else if (effectiveDivisionId) {
                if (fromSubdivision && effectiveSubdivisionId) {
                    navigate(`/divisions/${effectiveDivisionId}/facilities?subdivision=${effectiveSubdivisionId}`);
                } else {
                    navigate(`/divisions/${effectiveDivisionId}/facilities`);
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
    }, [token, effectiveDivisionId, effectiveSubdivisionId, fromSubdivision, isGlobalMode, location.state, navigate, dispatch]);

    const handleBack = useCallback(() => {
        if (location.state?.from === 'facilities-section') {
            const backState = {
                divisionId: location.state.divisionId,
                subdivisionId: location.state.subdivisionId,
                activeTab: location.state.activeTab,
                fromSubdivision: location.state.fromSubdivision
            };

            if (isGlobalMode) {
                navigate('/facilities', { state: backState });
            } else if (effectiveDivisionId) {
                if (fromSubdivision && effectiveSubdivisionId) {
                    navigate(`/divisions/${effectiveDivisionId}/facilities?subdivision=${effectiveSubdivisionId}`, { state: backState });
                } else {
                    navigate(`/divisions/${effectiveDivisionId}/facilities`, { state: backState });
                }
            } else {
                navigate('/facilities', { state: backState });
            }
        } else if (isGlobalMode) {
            navigate('/facilities');
        } else if (effectiveDivisionId) {
            if (fromSubdivision && effectiveSubdivisionId) {
                navigate(`/divisions/${effectiveDivisionId}/facilities?subdivision=${effectiveSubdivisionId}`);
            } else {
                navigate(`/divisions/${effectiveDivisionId}/facilities`);
            }
        } else {
            navigate('/facilities');
        }
    }, [location.state, isGlobalMode, effectiveDivisionId, effectiveSubdivisionId, fromSubdivision, navigate]);

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
                    preSelectedDivision={effectiveDivisionId}
                    preSelectedSubdivision={effectiveSubdivisionId}
                    divisions={divisions}
                    facilityTypes={facilityTypes}
                    communicationPosts={communicationPosts}
                    isLoadingData={isLoadingData}
                    fixedDivision={fixedDivision}
                    fixedSubdivision={fixedSubdivision}
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