import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch, RootState } from '../../../../store/store';
import { fetchNetwork, setError, updateNetwork } from '../../../../store/slices/networksSlice';
import { divisionsApi } from '../../../../api/divisions';
import { facilitiesApi } from '../../../../api/facilities';
import { equipmentApi } from '../../../../api/equipment';
import { networksApi } from '../../../../api/networksApi';
import NetworkHeader from '../components/NetworkHeader';
import BasicInfoSection from '../components/BasicInfoSection';
import ClassificationSection from '../components/ClassificationSection';
import TechnicalParamsSection from '../components/TechnicalParamsSection';
import MembershipSection from '../components/MembershipSection';
import ConnectionSection from '../components/ConnectionSection';
import NetworkActions from '../components/NetworkActions';
import ConnectionsDisplay from '../components/ConnectionsDisplay';
import '../NetworkForm.css';

interface SelectedItem {
    division: { id: string; name: string };
    facility: { id: string; name: string };
    equipment: { id: string; name: string; serial_number: string };
}

interface NetworkDirection {
    from: SelectedItem;
    to: SelectedItem;
    bandwidth?: number;
    latency?: number;
    description?: string;
}

const EditNetwork: React.FC = () => {
    const { id: networkId } = useParams<{ id: string }>();
    const location = useLocation();
    const navigate = useNavigate();
    const dispatch = useDispatch<AppDispatch>();

    const { currentNetwork, loading, error } = useSelector((state: RootState) => state.networks);
    const [saving, setSaving] = useState(false);
    const [connectionError, setConnectionError] = useState<string | null>(null);
    const [directionError, setDirectionError] = useState<string | null>(null);

    const [divisions, setDivisions] = useState<any[]>([]);
    const [facilities, setFacilities] = useState<any[]>([]);
    const [equipment, setEquipment] = useState<any[]>([]);
    const [selectedConnections, setSelectedConnections] = useState<SelectedItem[]>([]);
    const [selectedDirections, setSelectedDirections] = useState<NetworkDirection[]>([]);

    const [currentDivision, setCurrentDivision] = useState<string>('');
    const [currentFacility, setCurrentFacility] = useState<string>('');
    const [currentEquipment, setCurrentEquipment] = useState<string>('');

    // Получаем divisionId из состояния навигации
    const divisionId = location.state?.divisionId;

    useEffect(() => {
        const token = localStorage.getItem('accessToken');
        if (token && networkId) {
            dispatch(fetchNetwork({ token, id: networkId }));
            divisionsApi.getDivisions(token).then(setDivisions);
        }
    }, [networkId, dispatch]);

    useEffect(() => {
        const loadNetworkData = async () => {
            const token = localStorage.getItem('accessToken');
            if (token && networkId && currentNetwork) {
                try {
                    // Загрузка членств
                    const memberships = await networksApi.getNetworkMemberships(token, networkId);
                    const items: SelectedItem[] = memberships
                        .filter((membership: any) =>
                            membership?.division?.id &&
                            membership?.facility?.id &&
                            membership?.equipment?.id
                        )
                        .map((membership: any) => ({
                            division: {
                                id: membership.division.id.toString(),
                                name: membership.division.name || 'Неизвестное подразделение'
                            },
                            facility: {
                                id: membership.facility.id.toString(),
                                name: membership.facility.name || 'Неизвестный объект'
                            },
                            equipment: {
                                id: membership.equipment.id.toString(),
                                name: membership.equipment.name || 'Неизвестное оборудование',
                                serial_number: membership.equipment.serial_number || 'N/A'
                            }
                        }));

                    setSelectedConnections(items);

                    // Загрузка направлений
                    const directions = await networksApi.getNetworkDirections(token, networkId);
                    const formattedDirections: NetworkDirection[] = directions.map((dir: any) => ({
                        from: {
                            division: {
                                id: dir.from_membership_details.division.id.toString(),
                                name: dir.from_membership_details.division.name
                            },
                            facility: {
                                id: dir.from_membership_details.facility.id.toString(),
                                name: dir.from_membership_details.facility.name
                            },
                            equipment: {
                                id: dir.from_membership_details.equipment.id.toString(),
                                name: dir.from_membership_details.equipment.name,
                                serial_number: dir.from_membership_details.equipment.serial_number
                            }
                        },
                        to: {
                            division: {
                                id: dir.to_membership_details.division.id.toString(),
                                name: dir.to_membership_details.division.name
                            },
                            facility: {
                                id: dir.to_membership_details.facility.id.toString(),
                                name: dir.to_membership_details.facility.name
                            },
                            equipment: {
                                id: dir.to_membership_details.equipment.id.toString(),
                                name: dir.to_membership_details.equipment.name,
                                serial_number: dir.to_membership_details.equipment.serial_number
                            }
                        },
                        bandwidth: dir.bandwidth,
                        latency: dir.latency,
                        description: dir.description
                    }));

                    setSelectedDirections(formattedDirections);
                } catch (error) {
                    console.error('Ошибка загрузки данных сети:', error);
                }
            }
        };

        if (currentNetwork) {
            loadNetworkData();
        }
    }, [currentNetwork, networkId]);

    const handleDivisionChange = async (id: string) => {
        const token = localStorage.getItem('accessToken');
        setCurrentDivision(id);
        setCurrentFacility('');
        setCurrentEquipment('');
        setConnectionError(null);

        if (token && id) {
            try {
                const facilitiesData = await facilitiesApi.getFacilities({
                    token,
                    division: id
                });
                setFacilities(facilitiesData);
                setEquipment([]);
            } catch (error) {
                console.error('Ошибка загрузки объектов:', error);
            }
        }
    };

    const handleFacilityChange = async (facilityId: string) => {
        const token = localStorage.getItem('accessToken');
        setCurrentFacility(facilityId);
        setCurrentEquipment('');
        setConnectionError(null);

        if (token && facilityId) {
            try {
                const equipmentData = await equipmentApi.getShdEquipment(
                    token,
                    undefined,
                    facilityId
                );
                setEquipment(equipmentData);
            } catch (error) {
                console.error('Ошибка загрузки техники:', error);
            }
        }
    };

    const handleAddItem = () => {
        if (!currentDivision || !currentFacility || !currentEquipment) {
            setConnectionError('Не все поля выбраны');
            return;
        }

        const selectedDivision = divisions.find(d => d.id?.toString() === currentDivision);
        const selectedFacility = facilities.find(f => f.id?.toString() === currentFacility);
        const selectedEquipment = equipment.find(e => e.id?.toString() === currentEquipment);

        if (selectedDivision && selectedFacility && selectedEquipment) {
            const newConnection: SelectedItem = {
                division: {
                    id: selectedDivision.id.toString(),
                    name: selectedDivision.name || 'Неизвестное подразделение'
                },
                facility: {
                    id: selectedFacility.id.toString(),
                    name: selectedFacility.name || 'Неизвестный объект'
                },
                equipment: {
                    id: selectedEquipment.id.toString(),
                    name: selectedEquipment.name || 'Неизвестное оборудование',
                    serial_number: selectedEquipment.serial_number || 'N/A'
                }
            };

            const exists = selectedConnections.some(conn =>
                conn.division.id === newConnection.division.id &&
                conn.facility.id === newConnection.facility.id &&
                conn.equipment.id === newConnection.equipment.id
            );

            if (!exists) {
                setSelectedConnections([...selectedConnections, newConnection]);
                setConnectionError(null);
            } else {
                setConnectionError('Такая связь уже существует');
            }
        } else {
            setConnectionError('Не удалось найти выбранные элементы');
        }
    };

    const handleRemoveConnection = (index: number) => {
        const connectionToRemove = selectedConnections[index];
        const equipmentIdToRemove = connectionToRemove.equipment.id;

        // Проверяем, есть ли направления, использующие это оборудование
        const relatedDirections = selectedDirections.filter(
            dir => dir.from.equipment.id === equipmentIdToRemove ||
                dir.to.equipment.id === equipmentIdToRemove
        );

        if (relatedDirections.length > 0) {
            const confirmMessage = `Внимание! Удаление этой связи приведет к удалению ${relatedDirections.length} направлений, которые ее используют. Продолжить?`;

            if (!window.confirm(confirmMessage)) {
                return; // Пользователь отменил удаление
            }

            // Удаляем связанные направления
            const newDirections = selectedDirections.filter(
                dir => dir.from.equipment.id !== equipmentIdToRemove &&
                    dir.to.equipment.id !== equipmentIdToRemove
            );
            setSelectedDirections(newDirections);
        }

        // Удаляем связь
        const newConnections = [...selectedConnections];
        newConnections.splice(index, 1);
        setSelectedConnections(newConnections);
        setConnectionError(null);
    };

    const handleAddDirection = (direction: NetworkDirection) => {
        const exists = selectedDirections.some(dir =>
            dir.from.equipment.id === direction.from.equipment.id &&
            dir.to.equipment.id === direction.to.equipment.id
        );

        if (!exists) {
            setSelectedDirections([...selectedDirections, direction]);
            setDirectionError(null);
        } else {
            setDirectionError('Такое направление уже существует');
        }
    };

    const handleRemoveDirection = (index: number) => {
        const newDirections = [...selectedDirections];
        newDirections.splice(index, 1);
        setSelectedDirections(newDirections);
        setDirectionError(null);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!currentNetwork) return;

        setSaving(true);
        const token = localStorage.getItem('accessToken');

        if (token) {
            try {
                const { memberships, ...networkData } = currentNetwork;
                const networkToUpdate = networkData;

                await dispatch(updateNetwork({
                    token,
                    id: currentNetwork.id,
                    networkData: networkToUpdate
                })).unwrap();

                // Сначала сохраняем членства
                const membershipsToSend = selectedConnections.map(conn => ({
                    division: parseInt(conn.division.id),
                    facility: parseInt(conn.facility.id),
                    equipment: parseInt(conn.equipment.id)
                }));

                const createdMemberships = await networksApi.bulkUpdateNetworkMemberships(
                    token,
                    currentNetwork.id,
                    membershipsToSend
                );

                // Преобразуем направления для отправки, проверяя существование членств
                const directionsToSend = [];

                for (const direction of selectedDirections) {
                    // Находим ID членств для from и to оборудования
                    const fromMembership = createdMemberships.find(
                        (m: any) => m.equipment.id.toString() === direction.from.equipment.id
                    );
                    const toMembership = createdMemberships.find(
                        (m: any) => m.equipment.id.toString() === direction.to.equipment.id
                    );

                    if (!fromMembership || !toMembership) {
                        console.warn('Пропускаем направление: не найдено членство для оборудования');
                        continue;
                    }

                    directionsToSend.push({
                        from_membership: fromMembership.id,
                        to_membership: toMembership.id,
                        bandwidth: direction.bandwidth,
                        latency: direction.latency,
                        description: direction.description || ''
                    });
                }

                // Сохраняем направления
                if (directionsToSend.length > 0) {
                    await networksApi.bulkUpdateNetworkDirections(
                        token,
                        currentNetwork.id,
                        directionsToSend
                    );
                }

                if (location.state?.from) {
                    navigate(location.state.from);
                } else if (divisionId) {
                    navigate(`/divisions/${divisionId}/networks`);
                } else {
                    navigate('/networks');
                }
            } catch (error) {
                console.error('Ошибка обновления сети:', error);
                setError('Ошибка при обновлении сети. Проверьте, что все направления ссылаются на существующие связи.');
                setSaving(false);
            }
        }
    };

    const handleCancel = () => {
        if (location.state?.from) {
            navigate(location.state.from);
        } else if (divisionId) {
            navigate(`/divisions/${divisionId}/networks`);
        } else {
            navigate('/networks');
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        if (!currentNetwork) return;

        const { name, value } = e.target;
        const updatedNetwork = {
            ...currentNetwork,
            [name]: value
        };

        dispatch({ type: 'networks/setCurrentNetwork', payload: updatedNetwork });
    };

    if (loading) {
        return <div className="network-form-container">Загрузка...</div>;
    }

    if (error) {
        return (
            <div className="network-form-container">
                <div className="network-form-error-message">{error}</div>
                <button
                    className="network-form-back-button"
                    onClick={handleCancel}
                >
                    Назад к списку
                </button>
            </div>
        );
    }

    if (!currentNetwork) {
        return <div className="network-form-container">Сеть не найдена</div>;
    }

    return (
        <div className="network-form-container">
            <NetworkHeader
                title={`Редактирование сети: ${currentNetwork.name}`}
                onCancel={handleCancel}
            />

            {error && <div className="network-form-error-message">{error}</div>}

            <form onSubmit={handleSubmit} className="network-form">
                <div className="network-form-sections">
                    <BasicInfoSection
                        currentNetwork={currentNetwork}
                        onChange={handleChange}
                    />

                    <ClassificationSection
                        currentNetwork={currentNetwork}
                        onChange={handleChange}
                    />

                    <TechnicalParamsSection
                        currentNetwork={currentNetwork}
                        onChange={handleChange}
                    />
                </div>

                {/* Контейнер для форм принадлежности и направлений */}
                <div className="network-form-connections-container">
                    <MembershipSection
                        divisions={divisions}
                        facilities={facilities}
                        equipment={equipment}
                        currentDivision={currentDivision}
                        currentFacility={currentFacility}
                        currentEquipment={currentEquipment}
                        selectedConnections={selectedConnections}
                        onDivisionChange={handleDivisionChange}
                        onFacilityChange={handleFacilityChange}
                        onEquipmentChange={setCurrentEquipment}
                        onAddItem={handleAddItem}
                        onRemoveConnection={handleRemoveConnection}
                        connectionError={connectionError}
                    />

                    <ConnectionSection
                        selectedConnections={selectedConnections}
                        selectedDirections={selectedDirections}
                        onAddDirection={handleAddDirection}
                        onRemoveDirection={handleRemoveDirection}
                        directionError={directionError}
                    />
                </div>

                {/* Новый компонент для отображения связей и направлений */}
                <ConnectionsDisplay
                    selectedConnections={selectedConnections}
                    selectedDirections={selectedDirections}
                    onRemoveConnection={handleRemoveConnection}
                    onRemoveDirection={handleRemoveDirection}
                />

                <NetworkActions
                    saving={saving}
                    onCancel={handleCancel}
                    submitText="Сохранить изменения"
                />
            </form>
        </div>
    );
};

export default EditNetwork;