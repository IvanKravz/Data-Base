import React, { useState, useEffect } from 'react';
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


interface Division {
    id: string;
    name: string;
    subdivisions: { id: string; name: string }[];
    facilities: {
        id: string;
        name: string;
        type: 'station' | 'shd';
        class: string;
    }[];
}

interface EquipmentCategory {
    value: string;
    name: string;
    is_closed: boolean;
}

export function CreateEquipmentForm() {
    const navigate = useNavigate();
    const { id } = useParams<{ id: string }>();
    const location = useLocation();
    const token = localStorage.getItem('accessToken');

    const subdivisionId = location.state?.subdivisionId;
    const isClosedEquipment = location.state?.isClosed || false;

    const [formData, setFormData] = useState<Partial<Equipment>>({
        status: 'in-operation',
        comments: '',
        product_structures: [],
    });
    const [divisions, setDivisions] = useState<Division[]>([]);
    const [personnel, setPersonnel] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [categories, setCategories] = useState<EquipmentCategory[]>([]);

    useEffect(() => {
        const fetchAllData = async () => {
            if (!token) return;

            setIsLoading(true);
            try {
                const [divisionsData, categoriesData] = await Promise.all([
                    divisionsApi.getDivisions(token),
                    equipmentApi.getEquipmentCategories(token),
                ]);

                setDivisions(divisionsData);
                setCategories(categoriesData);

                // Установка начального подразделения
                if (id) {
                    const division = divisionsData.find(d => d.id === id);
                    if (division) {
                        setFormData(prev => ({
                            ...prev,
                            division: { id: division.id, name: division.name }
                        }));

                        // Загрузка персонала для выбранного подразделения
                        const personnelData = await employeesApi.getPersonnel(token, {
                            division: id,
                        });
                        setPersonnel(personnelData);

                        // Установка подразделения если передано
                        if (subdivisionId && division.subdivisions) {
                            const subdivision = division.subdivisions.find(s => s.id === subdivisionId);
                            if (subdivision) {
                                setFormData(prev => ({
                                    ...prev,
                                    subdivision: { id: subdivision.id, name: subdivision.name }
                                }));
                            }
                        }
                    }
                }
            } catch (error) {
                console.error('Ошибка загрузки данных:', error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchAllData();
    }, [token, id, subdivisionId]);

    const handleChange = async (data: Partial<Equipment>) => {
        const newFormData = { ...formData, ...data };
        setFormData(newFormData);

        if (data.division?.id && data.division.id !== formData.division?.id && token) {
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

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!token) {
            console.error('Токен отсутствует');
            return;
        }

        // Подготавливаем данные для отправки
        const dataToSend = {
            ...formData,
            category: formData.category?.value || null,
            is_closed: isClosedEquipment,
            division: formData.division?.id || null,
            subdivision: formData.subdivision?.id || null,
            facility: formData.facility?.id || null,
            assigned_to: formData.assigned_to?.id || null,
            product_structures: formData.product_structures || []
        };

        try {
            setIsLoading(true);
            await equipmentApi.createEquipment(token, dataToSend);
            navigate(`/divisions/${id}/equipment`);
        } catch (error) {
            console.error('Ошибка создания техники:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const getCurrentSubdivisions = () => {
        if (!formData.division?.id) return [];
        const division = divisions.find((d) => d.id === formData.division?.id);
        return division?.subdivisions || [];
    };

    // Фильтруем категории в зависимости от типа оборудования
    const currentCategories = categories.filter(cat =>
        isClosedEquipment ? cat.is_closed : !cat.is_closed
    );

    return (
        <div className="equipment-form-container">
            <div className="page-header">
                <button onClick={() => navigate(`/divisions/${id}/equipment`)} className="back-button">
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

                    <DatesInfo formData={formData} onChange={handleChange} />

                    <AssignmentInfo
                        formData={formData}
                        onChange={handleChange}
                        availableSubdivisions={getCurrentSubdivisions()}
                        availablePersonnel={personnel}
                        divisions={divisions}
                        isLoading={isLoading}
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
                    onCancel={() => navigate(`/divisions/${id}/equipment`)}
                    showDisposeButton={false}
                    isLoading={isLoading}
                />
            </form>
        </div>
    );
}