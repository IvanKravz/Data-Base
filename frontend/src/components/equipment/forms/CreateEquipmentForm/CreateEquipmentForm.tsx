import React, { useState, useEffect, useMemo } from 'react';
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
import { useAppPermissions } from '../../../../api/utils/AppPermissionsContext';
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

// Создаем объект прав по умолчанию
const defaultFieldPermissions = {
    canEditName: false,
    canEditCategory: false,
    canEditModel: false,
    canEditStatus: false,
    canEditSoftwareVersion: false,
    canEditManufacturingDate: false,
    canEditExploitationDate: false,
    canEditServiceLife: false,
    canEditSecretLevel: false,
    canEditInterestOrgan: false,
    canEditFreeUse: false,
    canEditDivision: false,
    canEditSubdivision: false,
    canEditAssignedTo: false,
    canEditFacility: false,
    canEditComments: false,
    canEditProductStructure: false,
    canEditDocuments: false,
    canEditIdentification: false,
};

export function CreateEquipmentForm() {
    const navigate = useNavigate();
    const { id } = useParams<{ id: string }>();
    const location = useLocation();
    const token = localStorage.getItem('accessToken');

    // Получаем пользователя из Redux
    const user = useSelector((state: RootState) => state.auth.user);
    const permissions = user?.permissions;

    const hasCreatePermission = useMemo(() => 
        permissions?.models?.Equipment?.includes('add') ?? false, [permissions]);

    const fieldPermissions = useEquipmentFieldPermissions();
    const effectivePermissions = fieldPermissions || defaultFieldPermissions;

    const navigationState = location.state as {
        divisionId?: string;
        subdivisionId?: string;
        divisionName?: string;
        subdivisionName?: string;
        isClosed?: boolean;
        fromSubdivision?: boolean;
    } | undefined;

    const isClosedEquipment = navigationState?.isClosed || false;
    const isGlobalMode = !id;

    const [formData, setFormData] = useState<Partial<Equipment>>({
        status: 'in-operation',
        comments: '',
        product_structures: [],
        is_network: false,
    });
    const [divisions, setDivisions] = useState<Division[]>([]);
    const [personnel, setPersonnel] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [categories, setCategories] = useState<EquipmentCategory[]>([]);
    const [interestOrgans, setInterestOrgans] = useState<any[]>([]);

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

                const divisionIdToUse = id || navigationState?.divisionId;
                if (divisionIdToUse) {
                    const division = divisionsData.find(d => String(d.id) === String(divisionIdToUse));
                    if (division) {
                        const personnelData = await employeesApi.getPersonnel(token, { division: divisionIdToUse });
                        setPersonnel(personnelData);
                        const updatedFormData: Partial<Equipment> = {
                            status: 'in-operation',
                            comments: '',
                            product_structures: [],
                            division: { id: division.id, name: division.name }
                        };
                        if (navigationState?.subdivisionId && navigationState.fromSubdivision && division.subdivisions) {
                            const subdivision = division.subdivisions.find(s => String(s.id) === String(navigationState.subdivisionId));
                            if (subdivision) updatedFormData.subdivision = { id: subdivision.id, name: subdivision.name };
                        }
                        setFormData(updatedFormData);
                    }
                }
            } catch (error) {
                console.error('Ошибка загрузки данных:', error);
            } finally {
                setIsLoading(false);
            }
        };
        fetchAllData();
    }, [token, id, navigationState]);

    const handleChange = async (data: Partial<Equipment>) => {
        const newFormData = { ...formData, ...data };
        setFormData(newFormData);
        if (data.division?.id && data.division.id !== formData.division?.id && token && !fixedDivision) {
            setIsLoading(true);
            try {
                const personnelData = await employeesApi.getPersonnel(token, { division: data.division.id });
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

    const handleCancel = () => {
        if (id) {
            if (navigationState?.subdivisionId) {
                navigate(`/divisions/${id}/equipment?subdivision=${navigationState.subdivisionId}`);
            } else {
                navigate(`/divisions/${id}/equipment`);
            }
        } else {
            navigate('/equipment');
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!token) return;
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
                secret_level: formData.secret_level === '' ? null : formData.secret_level,
            };
            await equipmentApi.createEquipment(token, dataToSend);
            await new Promise(resolve => setTimeout(resolve, 100));
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
            if (error.response?.data) console.error('Детали ошибки:', error.response.data);
        } finally {
            setIsLoading(false);
        }
    };

    const getCurrentSubdivisions = () => {
        if (!formData.division?.id) return [];
        const division = divisions.find(d => String(d.id) === String(formData.division?.id));
        return division?.subdivisions || [];
    };

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
                        permissions={effectivePermissions}
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
                        permissions={effectivePermissions}
                    />
                    <DocumentsInfo
                        formData={formData}
                        onChange={handleChange}
                        isDisposed={false}
                        permissions={effectivePermissions}
                    />
                    <IdentificationInfo
                        formData={formData}
                        onChange={handleChange}
                        permissions={effectivePermissions}
                    />
                    <DatesInfo
                        formData={formData}
                        onChange={handleChange}
                        serviceLife={formData.service_life}
                        onServiceLifeChange={(value) => handleChange({ service_life: value })}
                        permissions={effectivePermissions}
                    />
                    <AdditionalInfo
                        formData={formData}
                        onChange={handleChange}
                        interestOrgans={interestOrgans}
                        isDisposed={false}
                        permissions={effectivePermissions}
                    />
                    <EditCommentsCard
                        comments={formData.comments || ''}
                        onChange={(value) => handleChange({ comments: value })}
                        permissions={effectivePermissions}
                    />
                </div>
                <div className="equipment-form-structure">
                    <ProductStructureEditor
                        productStructures={formData.product_structures || []}
                        onChange={handleStructureChange}
                        isDisposed={false}
                        permissions={effectivePermissions}
                    />
                </div>
                <FormActions
                    onCancel={handleCancel}
                    showDisposeButton={false}
                    onDispose={undefined}
                    isLoading={isLoading}
                    hasEditPermission={hasCreatePermission}
                    isCreating={true}
                />
            </form>
        </div>
    );
}