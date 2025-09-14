import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch, RootState } from '../../../store/store';
import { fetchNetwork, updateNetwork } from '../../../store/slices/networksSlice';
import { divisionsApi } from '../../../api/divisions';
import { facilitiesApi } from '../../../api/facilities';
import { equipmentApi } from '../../../api/equipment';
import { networksApi } from '../../../api/networksApi';
import NetworkHeader from './components/NetworkHeader';
import BasicInfoSection from './components/BasicInfoSection';
import ClassificationSection from './components/ClassificationSection';
import TechnicalParamsSection from './components/TechnicalParamsSection';
import MembershipSection from './components/MembershipSection';
import ConnectionSection from './components/ConnectionSection';
import NetworkActions from './components/NetworkActions';
import ConnectionsDisplay from './components/ConnectionsDisplay';
import './EditNetwork.css';

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
    const { id, divisionId } = useParams<{ id: string; divisionId: string }>();
    const navigate = useNavigate();
    const dispatch = useDispatch<AppDispatch>();

    const { currentNetwork, loading, error } = useSelector((state: RootState) => state.networks);
    const [saving, setSaving] = useState(false);

    const [divisions, setDivisions] = useState<any[]>([]);
    const [facilities, setFacilities] = useState<any[]>([]);
    const [equipment, setEquipment] = useState<any[]>([]);
    const [selectedConnections, setSelectedConnections] = useState<SelectedItem[]>([]);
    const [selectedDirections, setSelectedDirections] = useState<NetworkDirection[]>([]);

    const [currentDivision, setCurrentDivision] = useState<string>('');
    const [currentFacility, setCurrentFacility] = useState<string>('');
    const [currentEquipment, setCurrentEquipment] = useState<string>('');

    useEffect(() => {
        const token = localStorage.getItem('accessToken');
        if (token && id) {
            dispatch(fetchNetwork({ token, id }));
            divisionsApi.getDivisions(token).then(setDivisions);
        }
    }, [id, dispatch]);

    useEffect(() => {
        const loadNetworkData = async () => {
            const token = localStorage.getItem('accessToken');
            if (token && id && currentNetwork) {
                try {
                    // Загрузка членств
                    const memberships = await networksApi.getNetworkMemberships(token, id);
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
                    const directions = await networksApi.getNetworkDirections(token, id);
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
    }, [currentNetwork, id]);

    const handleDivisionChange = async (divisionId: string) => {
        const token = localStorage.getItem('accessToken');
        setCurrentDivision(divisionId);
        setCurrentFacility('');
        setCurrentEquipment('');

        if (token && divisionId) {
            try {
                const facilitiesData = await facilitiesApi.getFacilities({
                    token,
                    division: divisionId
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
            console.error('Не все поля выбраны');
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
            } else {
                console.log('Такая связь уже существует');
            }
        } else {
            console.error('Не удалось найти выбранные элементы');
        }
    };

    const handleRemoveConnection = (index: number) => {
        const newConnections = [...selectedConnections];
        newConnections.splice(index, 1);
        setSelectedConnections(newConnections);
    };

    const handleAddDirection = (direction: NetworkDirection) => {
        setSelectedDirections([...selectedDirections, direction]);
    };

    const handleRemoveDirection = (index: number) => {
        const newDirections = [...selectedDirections];
        newDirections.splice(index, 1);
        setSelectedDirections(newDirections);
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

                // Преобразуем направления для отправки
                const directionsToSend = selectedDirections.map(direction => {
                    // Находим ID членств для from и to оборудования
                    const fromMembership = createdMemberships.find(
                        (m: any) => m.equipment.id.toString() === direction.from.equipment.id
                    );
                    const toMembership = createdMemberships.find(
                        (m: any) => m.equipment.id.toString() === direction.to.equipment.id
                    );

                    if (!fromMembership || !toMembership) {
                        throw new Error('Не найдено членство для оборудования в направлении');
                    }

                    return {
                        from_membership: fromMembership.id,
                        to_membership: toMembership.id,
                        bandwidth: direction.bandwidth,
                        latency: direction.latency,
                        description: direction.description || ''
                    };
                });

                // Сохраняем направления
                if (directionsToSend.length > 0) {
                    await networksApi.bulkUpdateNetworkDirections(
                        token,
                        currentNetwork.id,
                        directionsToSend
                    );
                }

                navigate(`/divisions/${divisionId}/networks`);
            } catch (error) {
                console.error('Ошибка обновления сети:', error);
                setSaving(false);
            }
        }
    };

    const handleCancel = () => {
        navigate(`/divisions/${divisionId}/networks`);
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
        return <div className="edit-network-container">Загрузка...</div>;
    }

    if (error) {
        return (
            <div className="edit-network-container">
                <div className="edit-network-error-message">{error}</div>
                <button
                    className="edit-network-back-button"
                    onClick={handleCancel}
                >
                    Назад к списку
                </button>
            </div>
        );
    }

    if (!currentNetwork) {
        return <div className="edit-network-container">Сеть не найдена</div>;
    }

    return (
        <div className="edit-network-container">
            <NetworkHeader
                networkName={currentNetwork.name}
                onCancel={handleCancel}
            />

            {error && <div className="edit-network-error-message">{error}</div>}

            <form onSubmit={handleSubmit} className="edit-network-form">
                <div className="edit-network-sections">
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
                <div className="edit-network-connections-container">
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
                    />

                    <ConnectionSection
                        selectedConnections={selectedConnections}
                        selectedDirections={selectedDirections}
                        onAddDirection={handleAddDirection}
                        onRemoveDirection={handleRemoveDirection}
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
                />
            </form>
        </div>
    );
};

export default EditNetwork;