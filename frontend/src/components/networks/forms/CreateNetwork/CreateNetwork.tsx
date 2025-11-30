import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { AppDispatch } from '../../../../store/store';
import { createNetwork } from '../../../../store/slices/networksSlice';
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
import ConnectionsDisplay from '../components/ConnectionsDisplay/ConnectionsDisplay';
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

const CreateNetwork: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const location = useLocation();
    const navigate = useNavigate();
    const dispatch = useDispatch<AppDispatch>();

    // Удаляем получение id из useParams, используем состояние навигации
    const divisionId = location.state?.divisionId;

    const [newNetwork, setNewNetwork] = useState({
        name: '',
        description: '',
        network_class: '',
        security_level: 'public',
        protocol: 'TCP/IP',
        ip_range: '',
        throughput: 0,
    });
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);
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

    useEffect(() => {
        const token = localStorage.getItem('accessToken');
        if (token) {
            divisionsApi.getDivisions(token).then(setDivisions);
        }
    }, []);

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

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setNewNetwork(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        // Проверка наличия хотя бы одной связи
        if (selectedConnections.length === 0) {
            setError('Необходимо добавить хотя бы одну связь');
            return;
        }

        setSaving(true);
        setError(null);
        const token = localStorage.getItem('accessToken');

        if (token) {
            try {
                // Подготавливаем данные для отправки
                const networkDataToSend = {
                    ...newNetwork,
                    network_class: newNetwork.network_class || null,
                    throughput: newNetwork.throughput ? Number(newNetwork.throughput) : null,
                };

                // Создаем сеть
                const createdNetwork = await dispatch(createNetwork({
                    token,
                    networkData: networkDataToSend
                })).unwrap();

                // Сохраняем членства
                const membershipsToSend = selectedConnections.map(conn => ({
                    division: parseInt(conn.division.id),
                    facility: parseInt(conn.facility.id),
                    equipment: parseInt(conn.equipment.id)
                }));

                const createdMemberships = await networksApi.bulkUpdateNetworkMemberships(
                    token,
                    createdNetwork.id,
                    membershipsToSend
                );

                // Сохраняем направления
                const directionsToSend = selectedDirections.map(direction => {
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

                if (directionsToSend.length > 0) {
                    await networksApi.bulkUpdateNetworkDirections(
                        token,
                        createdNetwork.id,
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
                console.error('Ошибка создания сети:', error);
                setError('Ошибка при создании сети');
                setSaving(false);
            }
        }
    };

    const handleCancel = () => {
        // Используем состояние навигации для возврата
        if (location.state?.from) {
            navigate(location.state.from);
        } else if (divisionId) {
            navigate(`/divisions/${divisionId}/networks`);
        } else {
            navigate('/networks');
        }
    };

    return (
        <div className="network-form-container">
            <NetworkHeader
                title="Создание новой сети"
                onCancel={handleCancel}
            />

            {error && <div className="network-form-error-message">{error}</div>}

            <form onSubmit={handleSubmit} className="network-form">
                <div className="network-form-sections">
                    <BasicInfoSection
                        currentNetwork={newNetwork}
                        onChange={handleChange}
                    />

                    <ClassificationSection
                        currentNetwork={newNetwork}
                        onChange={handleChange}
                    />

                    <TechnicalParamsSection
                        currentNetwork={newNetwork}
                        onChange={handleChange}
                    />
                </div>

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

                <ConnectionsDisplay
                    selectedConnections={selectedConnections}
                    selectedDirections={selectedDirections}
                    onRemoveConnection={handleRemoveConnection}
                    onRemoveDirection={handleRemoveDirection}
                />

                <NetworkActions
                    saving={saving}
                    onCancel={handleCancel}
                    submitText="Создать сеть"
                />
            </form>
        </div>
    );
};

export default CreateNetwork;