import React, { useState, useEffect, useCallback } from 'react';
import { ArrowLeft } from 'lucide-react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
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
    const { id } = useParams<{ id: string }>(); // id будет undefined в глобальном режиме
    const location = useLocation();
    const token = localStorage.getItem('accessToken');

    // Получаем данные из состояния навигации
    const navigationState = location.state as {
        divisionId?: string;
        subdivisionId?: string;
        divisionName?: string;
        subdivisionName?: string;
        isClosed?: boolean;
        fromSubdivision?: boolean;
    } | undefined;

    const isClosedEquipment = navigationState?.isClosed || false;

    // Определяем, находимся ли мы в глобальном режиме (без id подразделения)
    const isGlobalMode = !id;

    // Убираем начальную установку formData - будет в useEffect
    const [formData, setFormData] = useState<Partial<Equipment>>({
        status: 'in-operation',
        comments: '',
        product_structures: [],
    });
    const [divisions, setDivisions] = useState<Division[]>([]);
    const [personnel, setPersonnel] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [categories, setCategories] = useState<EquipmentCategory[]>([]);
    const [interestOrgans, setInterestOrgans] = useState<any[]>([]);

    // Определяем фиксированные значения отдельно
    const fixedDivision = navigationState?.divisionId
        ? { id: navigationState.divisionId, name: navigationState.divisionName || '' }
        : null;

    const fixedSubdivision = navigationState?.subdivisionId && navigationState.fromSubdivision
        ? { id: navigationState.subdivisionId, name: navigationState.subdivisionName || '' }
        : null;

    useEffect(() => {
        const fetchAllData = async () => {
            if (!token) return;

            setIsLoading(true);
            try {
                const [divisionsData, categoriesData, organsData] = await Promise.all([
                    divisionsApi.getDivisions(token),
                    equipmentApi.getEquipmentCategories(token),
                    equipmentApi.getInterestOrgans(token),
                ]);

                setDivisions(divisionsData);
                setCategories(categoriesData);
                setInterestOrgans(organsData);

                // КРИТИЧЕСКОЕ ИСПРАВЛЕНИЕ: Определяем divisionId для использования
                const divisionIdToUse = id || navigationState?.divisionId;

                if (divisionIdToUse) {
                    // ИСПРАВЛЕНИЕ: Правильно находим подразделение (учитываем, что id могут быть строкой или числом)
                    const division = divisionsData.find(d =>
                        String(d.id) === String(divisionIdToUse)
                    );

                    if (division) {
                        // Загрузка персонала для выбранного подразделения
                        const personnelData = await employeesApi.getPersonnel(token, {
                            division: divisionIdToUse,
                        });
                        setPersonnel(personnelData);

                        // Создаем обновленные данные формы
                        const updatedFormData: Partial<Equipment> = {
                            status: 'in-operation',
                            comments: '',
                            product_structures: [],
                            division: { id: division.id, name: division.name }
                        };

                        // Установка отделения если передано и мы в контексте отделения
                        if (navigationState?.subdivisionId && navigationState.fromSubdivision && division.subdivisions) {
                            // ИСПРАВЛЕНИЕ: Правильно находим отделение
                            const subdivision = division.subdivisions.find(s =>
                                String(s.id) === String(navigationState.subdivisionId)
                            );
                            if (subdivision) {
                                updatedFormData.subdivision = {
                                    id: subdivision.id,
                                    name: subdivision.name
                                };
                            }
                        }

                        setFormData(updatedFormData);
                    } else {
                        console.warn('Division not found:', divisionIdToUse);
                    }
                }
                // В глобальном режиме не устанавливаем подразделение по умолчанию
            } catch (error) {
                console.error('Ошибка загрузки данных:', error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchAllData();
    }, [token, id]); // Убраны лишние зависимости

    const handleChange = async (data: Partial<Equipment>) => {
        const newFormData = { ...formData, ...data };
        setFormData(newFormData);

        // Загружаем персонал только если изменилось подразделение и оно не фиксировано
        if (data.division?.id && data.division.id !== formData.division?.id && token && !fixedDivision) {
            setIsLoading(true);
            try {
                const personnelData = await employeesApi.getPersonnel(token, {
                    division: data.division.id,
                });
                setPersonnel(personnelData);
            } catch (error) {
                console.error('Ошибка загрузки персонала:', error);
            } finally {
                setIsLoading(false);
            }
        }
    };

    const handleStructureChange = (structures: any[]) => {
        handleChange({ product_structures: structures });
    };

    // Обработчик отмены для глобального режима
    const handleCancel = () => {
        if (id) {
            // Режим подразделения - возвращаемся к списку техники подразделения
            // ВАЖНОЕ ИЗМЕНЕНИЕ: Учитываем наличие subdivisionId для возврата в контекст отделения
            if (navigationState?.subdivisionId) {
                navigate(`/divisions/${id}/equipment?subdivision=${navigationState.subdivisionId}`);
            } else {
                navigate(`/divisions/${id}/equipment`);
            }
        } else {
            // Глобальный режим - возвращаемся к глобальному списку техники
            navigate('/equipment');
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        console.log('Form data before send:', formData);
        if (!token) {
            console.error('Токен отсутствует');
            return;
        }

        // Проверка обязательных полей
        if (!formData.division) {
            alert('Пожалуйста, выберите подразделение');
            return;
        }

        try {
            setIsLoading(true);
            const dataToSend = {
                ...formData,
                name: formData.name || '',
                type: formData.type || '',
                status: formData.status || 'in-operation',
                category: formData.category ? {
                    value: formData.category.value || formData.category,
                    name: formData.category.name || formData.category
                } : null,
                is_closed: isClosedEquipment,
                division_id: formData.division ? formData.division.id : null,
                subdivision_id: formData.subdivision ? formData.subdivision.id : null,
                facility_id: formData.facility ? formData.facility.id : null,
                assigned_to_id: formData.assigned_to ? formData.assigned_to.id : null,
                interest_organ_id: formData.interest_organ?.id || formData.interest_organ_id || null,
                product_structures: formData.product_structures || [],
                // Исправление: Преобразуем пустую строку в null для secret_level
                secret_level: formData.secret_level === '' ? null : formData.secret_level,
            };
            console.log('dataToSend', dataToSend);

            await equipmentApi.createEquipment(token, dataToSend);
            await new Promise(resolve => setTimeout(resolve, 100));

            // ВАЖНОЕ ИЗМЕНЕНИЕ: Навигация после создания с учетом subdivisionId
            if (id) {
                if (navigationState?.subdivisionId) {
                    navigate(`/divisions/${id}/equipment?subdivision=${navigationState.subdivisionId}`);
                } else {
                    navigate(`/divisions/${id}/equipment`);
                }
            } else {
                navigate('/equipment');
            }
        } catch (error: any) {
            console.error('Ошибка создания техники:', error);
            if (error.response?.data) {
                console.error('Детали ошибки:', error.response.data);
            }
        } finally {
            setIsLoading(false);
        }
    };

    const getCurrentSubdivisions = () => {
        if (!formData.division?.id) return [];
        const division = divisions.find((d) => String(d.id) === String(formData.division?.id));
        return division?.subdivisions || [];
    };

    // Фильтруем категории в зависимости от типа оборудования, но всегда включаем категорию SHD
    const currentCategories = categories.filter(cat =>
        isClosedEquipment ? cat.is_closed : !cat.is_closed || cat.value === 'shd'
    );

    return (
        <div className="equipment-form-container">
            <div className="page-header">
                <button onClick={handleCancel} className="back-button">
                    <ArrowLeft className="back-button-icon" />
                </button>
                <h2>Добавление новой техники</h2>
            </div>

            <form onSubmit={handleSubmit}>
                <div className="equipment-form">
                    <BasicInformation
                        formData={formData}
                        onChange={handleChange}
                        isClosedEquipment={isClosedEquipment}
                        isDisposed={false}
                        equipmentCategories={currentCategories}
                    />

                    <DocumentsInfo
                        formData={formData}
                        onChange={handleChange}
                        isDisposed={false}
                    />

                    <IdentificationInfo formData={formData} onChange={handleChange} />

                    <DatesInfo
                        formData={formData}
                        onChange={handleChange}
                        serviceLife={formData.service_life}
                        onServiceLifeChange={(value) => handleChange({ service_life: value })}
                    />

                    <AdditionalInfo
                        formData={formData}
                        onChange={handleChange}
                        interestOrgans={interestOrgans}
                        isDisposed={false}
                    />

                    <AssignmentInfo
                        formData={formData}
                        onChange={handleChange}
                        availableSubdivisions={getCurrentSubdivisions()}
                        availablePersonnel={personnel}
                        divisions={divisions}
                        isLoading={isLoading}
                        fixedDivision={!!fixedDivision}
                        fixedSubdivision={!!fixedSubdivision}
                    />

                    <EditCommentsCard
                        comments={formData.comments || ''}
                        onChange={(value) => handleChange({ comments: value })}
                    />
                </div>

                <ProductStructureEditor
                    productStructures={formData.product_structures || []}
                    onChange={handleStructureChange}
                    isDisposed={false}
                />

                <FormActions
                    onCancel={handleCancel}
                    showDisposeButton={false}
                    isLoading={isLoading}
                />
            </form>
        </div>
    );
}