// AddFacilityPage.tsx
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { RootState } from '../../../../store/store';
import { ArrowLeft } from 'lucide-react';
import { EditFacilityPage } from '../EditFacilityPage/EditFacilityPage';
import { facilitiesApi, divisionsApi, communicationPostsApi } from '../../../../api';
import { useDispatch } from 'react-redux';
import { addFacility } from '../../../../store/slices/facilitiesSlice';
import { Facility } from '../../../../types';
import './AddFacilityPage.css';

export function AddFacilityPage() {
  const { id: divisionId } = useParams<{ id: string }>();
  const location = useLocation();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const token = localStorage.getItem('accessToken');

  const user = useSelector((state: RootState) => state.auth.user);
  const isExploitationUser = useMemo(
    () =>
      user?.roles?.includes('exploitation_chief') ||
      user?.roles?.includes('exploitation_employee'),
    [user]
  );

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [divisions, setDivisions] = useState<any[]>([]);
  const [facilityTypes, setFacilityTypes] = useState<any[]>([]);
  const [communicationPosts, setCommunicationPosts] = useState<any[]>([]);
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

  const navigationState = location.state as {
    divisionId?: string;
    subdivisionId?: string;
    divisionName?: string;
    subdivisionName?: string;
    fromSubdivision?: boolean;
  } | undefined;

  const searchParams = useMemo(() => new URLSearchParams(location.search), [location.search]);
  const subdivisionIdFromUrl = searchParams.get('subdivision');
  const subdivisionIdFromState = navigationState?.subdivisionId;
  const preSelectedSubdivision = subdivisionIdFromState || subdivisionIdFromUrl;
  const fromSubdivision = navigationState?.fromSubdivision || false;

  const effectiveDivisionId = useMemo(() => {
    return (
      divisionId ||
      navigationState?.divisionId ||
      (isExploitationUser && user?.division_info?.id ? user.division_info.id : null)
    );
  }, [divisionId, navigationState?.divisionId, isExploitationUser, user]);

  const effectiveSubdivisionId = useMemo(() => {
    return (
      preSelectedSubdivision ||
      (isExploitationUser && !preSelectedSubdivision && user?.division_info?.subdivision?.id
        ? user.division_info.subdivision.id
        : null)
    );
  }, [preSelectedSubdivision, isExploitationUser, user]);

  const isGlobalMode = useMemo(
    () => !divisionId && !isExploitationUser,
    [divisionId, isExploitationUser]
  );

  const fixedDivision = useMemo(() => !!effectiveDivisionId, [effectiveDivisionId]);
  const fixedSubdivision = useMemo(
    () => !!effectiveSubdivisionId && fromSubdivision,
    [effectiveSubdivisionId, fromSubdivision]
  );

  // Загрузка справочников
  useEffect(() => {
    const fetchAllData = async () => {
      if (!token) {
        console.error('Token not available');
        return;
      }

      try {
        setIsLoadingData(true);
        setError(null);

        const [divisionsData, facilityTypesData, communicationPostsData] = await Promise.all([
          divisionsApi.getDivisions({ token }),
          facilitiesApi.getFacilityTypes(token),
          communicationPostsApi.getCommunicationPosts({ token }),
        ]);

        setDivisions(divisionsData);
        setFacilityTypes(facilityTypesData);
        setCommunicationPosts(communicationPostsData);
      } catch (err: any) {
        console.error('Ошибка при загрузке данных:', err);
        setError('Не удалось загрузить справочники. Проверьте соединение.');
      } finally {
        setIsLoadingData(false);
      }
    };

    fetchAllData();
  }, [token]);

  const initialData = useMemo(() => {
    const divisionObj =
      effectiveDivisionId && divisions.length > 0
        ? divisions.find((d) => String(d.id) === String(effectiveDivisionId))
        : null;
    const subdivisionObj =
      effectiveSubdivisionId && divisionObj && divisionObj.subdivisions
        ? divisionObj.subdivisions.find((s) => String(s.id) === String(effectiveSubdivisionId))
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
      opening_permission_number: null,
    };
  }, [effectiveDivisionId, effectiveSubdivisionId, divisions]);

  const handleSubmit = useCallback(
    async (data: Partial<Facility>) => {
      if (!token) {
        setError('Отсутствует авторизация');
        return;
      }

      // Проверяем, что подразделение выбрано
      const divisionIdToSend = data.division?.id || effectiveDivisionId;
      if (!divisionIdToSend) {
        setError('Пожалуйста, выберите подразделение');
        return;
      }

      try {
        setIsSubmitting(true);
        setError(null);
        setValidationErrors({});

        const newFacility = await facilitiesApi.createFacility({
          ...data,
          division_id: divisionIdToSend,
          type_id: data.type?.id || null,
          communication_post_ids: data.communication_posts?.map((p) => p.id) || [],
        });

        dispatch(addFacility(newFacility));

        // Навигация после создания
        if (location.state?.from === 'facilities-section') {
          const backState = {
            divisionId: location.state.divisionId,
            subdivisionId: location.state.subdivisionId,
            activeTab: location.state.activeTab,
            fromSubdivision: location.state.fromSubdivision,
          };
          if (isGlobalMode) {
            navigate('/facilities', { state: backState });
          } else if (effectiveDivisionId) {
            if (fromSubdivision && effectiveSubdivisionId) {
              navigate(
                `/divisions/${effectiveDivisionId}/facilities?subdivision=${effectiveSubdivisionId}`,
                { state: backState }
              );
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
            navigate(
              `/divisions/${effectiveDivisionId}/facilities?subdivision=${effectiveSubdivisionId}`
            );
          } else {
            navigate(`/divisions/${effectiveDivisionId}/facilities`);
          }
        } else {
          navigate('/facilities');
        }
      } catch (err: any) {
        console.error('Ошибка при создании объекта:', err);
        const errorResponse = err.response?.data;
        if (errorResponse && typeof errorResponse === 'object') {
          const errors: Record<string, string> = {};
          Object.entries(errorResponse).forEach(([field, msgs]) => {
            errors[field] = Array.isArray(msgs) ? msgs.join(', ') : String(msgs);
          });
          setValidationErrors(errors);
          const errorMessages = Object.entries(errors)
            .map(([field, msg]) => `${field}: ${msg}`)
            .join('; ');
          setError(`Ошибка валидации: ${errorMessages}`);
        } else {
          setError('Не удалось создать объект. Проверьте соединение или обратитесь к администратору.');
        }
      } finally {
        setIsSubmitting(false);
      }
    },
    [
      token,
      effectiveDivisionId,
      effectiveSubdivisionId,
      fromSubdivision,
      isGlobalMode,
      location.state,
      navigate,
      dispatch,
    ]
  );

  const handleBack = useCallback(() => {
    if (location.state?.from === 'facilities-section') {
      const backState = {
        divisionId: location.state.divisionId,
        subdivisionId: location.state.subdivisionId,
        activeTab: location.state.activeTab,
        fromSubdivision: location.state.fromSubdivision,
      };
      if (isGlobalMode) {
        navigate('/facilities', { state: backState });
      } else if (effectiveDivisionId) {
        if (fromSubdivision && effectiveSubdivisionId) {
          navigate(
            `/divisions/${effectiveDivisionId}/facilities?subdivision=${effectiveSubdivisionId}`,
            { state: backState }
          );
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
        navigate(
          `/divisions/${effectiveDivisionId}/facilities?subdivision=${effectiveSubdivisionId}`
        );
      } else {
        navigate(`/divisions/${effectiveDivisionId}/facilities`);
      }
    } else {
      navigate('/facilities');
    }
  }, [
    location.state,
    isGlobalMode,
    effectiveDivisionId,
    effectiveSubdivisionId,
    fromSubdivision,
    navigate,
  ]);

  return (
    <div className="ep-add-facility-page">
      <div className="ep-add-facility-header">
        <button onClick={handleBack} className="ep-add-facility-back-btn">
          <ArrowLeft size={20} />
        </button>
        <h1 className="ep-add-facility-title">Добавление нового объекта</h1>
      </div>

      <div className="ep-add-facility-content">
        {error && (
          <div className="ep-add-facility-error" style={{ whiteSpace: 'pre-line', marginBottom: '1rem' }}>
            {error}
          </div>
        )}
        <EditFacilityPage
          initialData={initialData}
          onSubmit={handleSubmit}
          onCancel={handleBack}
          isEditing={false}
          divisions={divisions}
          facilityTypes={facilityTypes}
          communicationPosts={communicationPosts}
          isLoadingData={isLoadingData}
          fixedDivision={fixedDivision}
          fixedSubdivision={fixedSubdivision}
          validationErrors={validationErrors}
        />
      </div>
    </div>
  );
}