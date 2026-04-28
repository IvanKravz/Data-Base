import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { ArrowLeft } from 'lucide-react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { RootState } from '../../../../store/store';
import { Equipment } from '../../../../types';
import { BasicInformation } from '../EditEquipmentForm/sections/BasicInformation';
import { IdentificationInfo } from '../EditEquipmentForm/sections/IdentificationInfo';
import { DatesInfo } from '../EditEquipmentForm/sections/DatesInfo';
import { AssignmentInfo } from '../EditEquipmentForm/sections/AssignmentInfo';
import { FormActions } from '../EditEquipmentForm/sections/FormActions';
import { divisionsApi, employeesApi, equipmentApi } from '../../../../api';
import '../EditEquipmentForm/style.css';
import { EditCommentsCard } from '../EditEquipmentForm/sections/EditCommentsCard';
import { DocumentsInfo } from '../EditEquipmentForm/sections/DocumentsInfo';
import { ProductStructureEditor } from '../EditEquipmentForm/sections/ProductStructureEditor';
import { AdditionalInfo } from '../EditEquipmentForm/sections/AdditionalInfo';
import { useEquipmentFieldPermissions } from '../../../../api/utils/useEquipmentFieldPermissions';

interface Division {
    id: string;
    name: string;
    subdivisions: { id: string; name: string }[];
    facilities: {
        id: string;
        name: string;
        type_name: 'station' | 'shd';
        class: string;
        class_display: string;
    }[];
}

interface EquipmentCategory {
    value: string;
    name: string;
    is_closed: boolean;
}

export function CreateEquipmentForm() {
    const navigate = useNavigate();
    const { id: paramDivisionId } = useParams<{ id: string }>();
    const location = useLocation();
    const token = localStorage.getItem('accessToken');

    const user = useSelector((state: RootState) => state.auth.user);
    const permissions = user?.permissions;
    const hasCreatePermission = useMemo(
        () => permissions?.models?.Equipment?.includes('add') ?? false,
        [permissions]
    );

    const fieldPermissions = useEquipmentFieldPermissions();
    // Права могут быть ещё не загружены – показываем лоадер, а не подставляем заглушку
    const [isPermissionsReady, setIsPermissionsReady] = useState(false);

    useEffect(() => {
        if (fieldPermissions !== null) {
            setIsPermissionsReady(true);
        }
    }, [fieldPermissions]);

    const navigationState = location.state as {
        divisionId?: string;
        subdivisionId?: string;
        divisionName?: string;
        subdivisionName?: string;
        isClosed?: boolean;
        fromSubdivision?: boolean;
    } | undefined;

    const isClosedEquipment = navigationState?.isClosed || false;
    const isGlobalMode = !paramDivisionId;

    const [formData, setFormData] = useState<Partial<Equipment>>({
        status: 'in-operation',
        comments: '',
        product_structures: [],
        is_network: false,
    });
    const [divisions, setDivisions] = useState<Division[]>([]);
    const [personnel, setPersonnel] = useState<any[]>([]);
    const [categories, setCategories] = useState<EquipmentCategory[]>([]);
    const [interestOrgans, setInterestOrgans] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

    const fixedDivision = navigationState?.divisionId
        ? { id: navigationState.divisionId, name: navigationState.divisionName || '' }
        : null;
    const fixedSubdivision =
        navigationState?.subdivisionId && navigationState.fromSubdivision
            ? { id: navigationState.subdivisionId, name: navigationState.subdivisionName || '' }
            : null;

    // Загрузка справочников
    useEffect(() => {
        const fetchData = async () => {
            if (!token) return;
            setLoading(true);
            setError(null);
            try {
                const [divisionsData, categoriesData, organsData] = await Promise.all([
                    divisionsApi.getDivisions(token),
                    equipmentApi.getEquipmentCategories(token),
                    equipmentApi.getInterestOrgans(token),
                ]);
                setDivisions(divisionsData);
                setCategories(categoriesData);
                setInterestOrgans(organsData);

                const divisionIdToUse = paramDivisionId || navigationState?.divisionId;
                if (divisionIdToUse) {
                    const division = divisionsData.find((d) => String(d.id) === String(divisionIdToUse));
                    if (division) {
                        const personnelData = await employeesApi.getPersonnel(token, { division: divisionIdToUse });
                        setPersonnel(personnelData);
                        const updatedFormData: Partial<Equipment> = {
                            status: 'in-operation',
                            comments: '',
                            product_structures: [],
                            division: { id: division.id, name: division.name },
                        };
                        if (
                            navigationState?.subdivisionId &&
                            navigationState.fromSubdivision &&
                            division.subdivisions
                        ) {
                            const subdivision = division.subdivisions.find(
                                (s) => String(s.id) === String(navigationState.subdivisionId)
                            );
                            if (subdivision) updatedFormData.subdivision = { id: subdivision.id, name: subdivision.name };
                        }
                        setFormData(updatedFormData);
                    }
                }
            } catch (err) {
                console.error('Ошибка загрузки данных:', err);
                setError('Не удалось загрузить необходимые данные. Обновите страницу.');
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [token, paramDivisionId, navigationState]);

    const handleChange = useCallback(
        async (data: Partial<Equipment>) => {
            setFormData((prev) => ({ ...prev, ...data }));
            // Если изменилось подразделение – перезагружаем персонал
            if (data.division?.id && data.division.id !== formData.division?.id && token && !fixedDivision) {
                setLoading(true);
                try {
                    const personnelData = await employeesApi.getPersonnel(token, { division: data.division.id });
                    setPersonnel(personnelData);
                } catch (err) {
                    console.error('Ошибка загрузки персонала:', err);
                } finally {
                    setLoading(false);
                }
            }
        },
        [formData.division?.id, token, fixedDivision]
    );

    const handleStructureChange = (structures: any[]) => {
        handleChange({ product_structures: structures });
    };

    const handleCancel = () => {
        if (paramDivisionId) {
            const url = navigationState?.subdivisionId
                ? `/divisions/${paramDivisionId}/equipment?subdivision=${navigationState.subdivisionId}`
                : `/divisions/${paramDivisionId}/equipment`;
            navigate(url);
        } else {
            navigate('/equipment');
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setValidationErrors({});

        if (!token) {
            setError('Отсутствует токен авторизации');
            return;
        }
        if (!formData.division) {
            setError('Пожалуйста, выберите подразделение');
            return;
        }
        if (!formData.name?.trim()) {
            setError('Введите название техники');
            return;
        }

        setLoading(true);
        setError(null);
        try {
            const dataToSend = {
                ...formData,
                name: formData.name?.trim(),
                type: formData.type || '',
                status: formData.status || 'in-operation',
                category: formData.category
                    ? {
                        value: formData.category.value || formData.category,
                        name: formData.category.name || formData.category,
                    }
                    : null,
                is_closed: isClosedEquipment,
                division_id: formData.division ? formData.division.id : null,
                subdivision_id: formData.subdivision ? formData.subdivision.id : null,
                facility_id: formData.facility ? formData.facility.id : null,
                assigned_to_id: formData.assigned_to ? formData.assigned_to.id : null,
                interest_organ_id: formData.interest_organ?.id || formData.interest_organ_id || null,
                product_structures: formData.product_structures || [],
                secret_level: formData.secret_level === '' ? null : formData.secret_level,
            };
            await equipmentApi.createEquipment(token, dataToSend);

            // Успешное создание – переход
            if (paramDivisionId) {
                const url = navigationState?.subdivisionId
                    ? `/divisions/${paramDivisionId}/equipment?subdivision=${navigationState.subdivisionId}`
                    : `/divisions/${paramDivisionId}/equipment`;
                navigate(url);
            } else {
                navigate('/equipment');
            }
        } catch (err: any) {
            console.error('Ошибка создания техники:', err);
            const errorData = err.response?.data;
            if (errorData && typeof errorData === 'object') {
                // Если есть валидационные ошибки – показываем их
                const errors: Record<string, string> = {};
                Object.entries(errorData).forEach(([field, msgs]) => {
                    errors[field] = Array.isArray(msgs) ? msgs.join(', ') : String(msgs);
                });
                setValidationErrors(errors);
                setError('Пожалуйста, исправьте ошибки в форме');
            } else {
                setError('Не удалось создать технику. Проверьте соединение или обратитесь к администратору.');
            }
        } finally {
            setLoading(false);
        }
    };

    const getCurrentSubdivisions = () => {
        if (!formData.division?.id) return [];
        const division = divisions.find((d) => String(d.id) === String(formData.division?.id));
        return division?.subdivisions || [];
    };

    const currentCategories = categories.filter((cat) =>
        isClosedEquipment ? cat.is_closed : !cat.is_closed || cat.value === 'shd'
    );

    // Ожидание загрузки прав (если ещё не готовы)
    if (!isPermissionsReady && fieldPermissions === null) {
        return <div className="equipment-form-container">Загрузка прав доступа...</div>;
    }

    return (
        <div className="equipment-form-container">
            <div className="page-header">
                <button onClick={handleCancel} className="back-button">
                    <ArrowLeft className="back-button-icon" />
                </button>
                <h2>Добавление новой техники</h2>
            </div>

            {error && (
                <div className="form-error-message" style={{ whiteSpace: 'pre-line', marginBottom: '1rem' }}>
                    {error}
                </div>
            )}

            <form onSubmit={handleSubmit}>
                <div className="equipment-form">
                    <BasicInformation
                        formData={formData}
                        onChange={handleChange}
                        isClosedEquipment={isClosedEquipment}
                        isDisposed={false}
                        equipmentCategories={currentCategories}
                        permissions={fieldPermissions ?? {}}
                        validationErrors={validationErrors}
                    />
                    <AssignmentInfo
                        formData={formData}
                        onChange={handleChange}
                        availableSubdivisions={getCurrentSubdivisions()}
                        availablePersonnel={personnel}
                        divisions={divisions}
                        isLoading={loading}
                        fixedDivision={!!fixedDivision}
                        fixedSubdivision={!!fixedSubdivision}
                        permissions={fieldPermissions ?? {}}
                        validationErrors={validationErrors}
                    />
                    <DocumentsInfo
                        formData={formData}
                        onChange={handleChange}
                        isDisposed={false}
                        permissions={fieldPermissions ?? {}}
                        validationErrors={validationErrors}
                    />
                    <IdentificationInfo
                        formData={formData}
                        onChange={handleChange}
                        permissions={fieldPermissions ?? {}}
                        validationErrors={validationErrors}
                    />
                    <DatesInfo
                        formData={formData}
                        onChange={handleChange}
                        serviceLife={formData.service_life}
                        onServiceLifeChange={(value) => handleChange({ service_life: value })}
                        permissions={fieldPermissions ?? {}}
                        validationErrors={validationErrors}
                    />
                    <AdditionalInfo
                        formData={formData}
                        onChange={handleChange}
                        interestOrgans={interestOrgans}
                        isDisposed={false}
                        permissions={fieldPermissions ?? {}}
                        validationErrors={validationErrors}
                    />
                    <EditCommentsCard
                        comments={formData.comments || ''}
                        onChange={(value) => handleChange({ comments: value })}
                        permissions={fieldPermissions ?? {}}
                    />
                </div>
                <div className="equipment-form-structure">
                    <ProductStructureEditor
                        productStructures={formData.product_structures || []}
                        onChange={handleStructureChange}
                        isDisposed={false}
                        permissions={fieldPermissions ?? {}}
                    />
                </div>
                <FormActions
                    onCancel={handleCancel}
                    showDisposeButton={false}
                    onDispose={undefined}
                    isLoading={loading}
                    hasEditPermission={hasCreatePermission}
                    isCreating={true}
                />
            </form>
        </div>
    );
}