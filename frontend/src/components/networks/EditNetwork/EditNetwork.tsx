import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch, RootState } from '../../../store';
import { fetchNetwork, updateNetwork } from '../../../store/slices/networksSlice';
import { divisionsApi } from '../../../api/divisions';
import { facilitiesApi } from '../../../api/facilities';
import { equipmentApi } from '../../../api/equipment';
import { networksApi } from '../../../api/networksApi';
import { Network } from '../../../types';
import './EditNetwork.css';

interface SelectedItem {
    division: { id: string; name: string };
    facility: { id: string; name: string };
    equipment: { id: string; name: string; serial_number: string };
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

    const [currentDivision, setCurrentDivision] = useState<string>('');
    const [currentFacility, setCurrentFacility] = useState<string>('');
    const [currentEquipment, setCurrentEquipment] = useState<string>('');

    // Загрузка данных сети и подразделений при монтировании компонента
    useEffect(() => {
        const token = localStorage.getItem('accessToken');
        if (token && id) {
            dispatch(fetchNetwork({ token, id }));
            divisionsApi.getDivisions(token).then(setDivisions);
        }
    }, [id, dispatch]);

    // Загрузка членств сети
    useEffect(() => {
        const loadMemberships = async () => {
            const token = localStorage.getItem('accessToken');
            if (token && id) {
                try {
                    const memberships = await networksApi.getNetworkMemberships(token, id);
                    
                    // Преобразуем членства в selectedConnections
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
                } catch (error) {
                    console.error('Ошибка загрузки членств сети:', error);
                }
            }
        };

        if (currentNetwork) {
            loadMemberships();
        }
    }, [currentNetwork, id]);

    // Обработчик изменения выбранного подразделения
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

    // Обработчик изменения выбранного объекта
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

    // Добавление новой связи
    const handleAddItem = () => {
        if (!currentDivision || !currentFacility || !currentEquipment) {
            console.error('Не все поля выбраны');
            return;
        }

        // Находим выбранные элементы
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

            // Проверяем, нет ли уже такой связи
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

    // Удаление связи
    const handleRemoveConnection = (index: number) => {
        const newConnections = [...selectedConnections];
        newConnections.splice(index, 1);
        setSelectedConnections(newConnections);
    };

    // Отправка формы
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!currentNetwork) return;

        setSaving(true);
        const token = localStorage.getItem('accessToken');

        if (token) {
            try {
                // Формируем данные для отправки (без связей)
                const { memberships, ...networkData } = currentNetwork;
                const networkToUpdate = networkData;

                // Обновляем основную информацию сети
                await dispatch(updateNetwork({
                    token,
                    id: currentNetwork.id,
                    networkData: networkToUpdate
                })).unwrap();

                // Обновляем связи через отдельный API
                const membershipsToSend = selectedConnections.map(conn => ({
                    division: parseInt(conn.division.id),
                    facility: parseInt(conn.facility.id),
                    equipment: parseInt(conn.equipment.id)
                }));

                await networksApi.bulkUpdateNetworkMemberships(
                    token, 
                    currentNetwork.id, 
                    membershipsToSend
                );

                navigate(`/divisions/${divisionId}/networks`);
            } catch (error) {
                console.error('Ошибка обновления сети:', error);
                setSaving(false);
            }
        }
    };

    // Обработчик отмены
    const handleCancel = () => {
        navigate(`/divisions/${divisionId}/networks`);
    };

    // Обработчик изменения полей формы
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
            <div className="edit-network-header">
                <h1>Редактирование сети: {currentNetwork.name}</h1>
                <button
                    className="edit-network-back-button"
                    onClick={handleCancel}
                >
                    Назад к списку
                </button>
            </div>

            {error && <div className="edit-network-error-message">{error}</div>}

            <form onSubmit={handleSubmit} className="edit-network-form">
                <div className="edit-network-sections">
                    {/* Основная информация */}
                    <div className="edit-network-section">
                        <h3 className="edit-network-section-title">Основная информация</h3>
                        <div className="edit-network-form-group">
                            <label htmlFor="name" className="edit-network-label">Название сети</label>
                            <input
                                type="text"
                                id="name"
                                name="name"
                                value={currentNetwork.name}
                                onChange={handleChange}
                                className="edit-network-input"
                                required
                            />
                        </div>

                        <div className="edit-network-form-group">
                            <label htmlFor="description" className="edit-network-label">Описание</label>
                            <textarea
                                id="description"
                                name="description"
                                value={currentNetwork.description || ''}
                                onChange={handleChange}
                                rows={3}
                                className="edit-network-textarea"
                            />
                        </div>
                    </div>

                    {/* Классификация */}
                    <div className="edit-network-section">
                        <h3 className="edit-network-section-title">Классификация</h3>
                        <div className="edit-network-form-group">
                            <label htmlFor="network_class" className="edit-network-label">Класс сети</label>
                            <select
                                id="network_class"
                                name="network_class"
                                value={currentNetwork.network_class || ''}
                                onChange={handleChange}
                                className="edit-network-select"
                            >
                                <option value="">Выберите класс</option>
                                <option value="1">1 класс</option>
                                <option value="2">2 класс</option>
                            </select>
                        </div>

                        <div className="edit-network-form-group">
                            <label htmlFor="security_level" className="edit-network-label">Степень секретности</label>
                            <select
                                id="security_level"
                                name="security_level"
                                value={currentNetwork.security_level}
                                onChange={handleChange}
                                className="edit-network-select"
                                required
                            >
                                <option value="public">Открычная</option>
                                <option value="confidential">Конфиденциальная</option>
                                <option value="secret">Секретная</option>
                                <option value="top_secret">Совершенно секретная</option>
                            </select>
                        </div>
                    </div>

                    {/* Технические параметры */}
                    <div className="edit-network-section">
                        <h3 className="edit-network-section-title">Технические параметры</h3>
                        <div className="edit-network-form-group">
                            <label htmlFor="protocol" className="edit-network-label">Протокол связи</label>
                            <select
                                id="protocol"
                                name="protocol"
                                value={currentNetwork.protocol}
                                onChange={handleChange}
                                className="edit-network-select"
                            >
                                <option value="TCP/IP">TCP/IP</option>
                                <option value="UDP">UDP</option>
                                <option value="MPLS">MPLS</option>
                                <option value="Other">Другой</option>
                            </select>
                        </div>

                        <div className="edit-network-form-group">
                            <label htmlFor="ip_range" className="edit-network-label">IP диапазон</label>
                            <input
                                type="text"
                                id="ip_range"
                                name="ip_range"
                                value={currentNetwork.ip_range || ''}
                                onChange={handleChange}
                                placeholder="192.168.1.0/24"
                                className="edit-network-input"
                            />
                        </div>

                        <div className="edit-network-form-group">
                            <label htmlFor="throughput" className="edit-network-label">Пропускная способность (Mbps)</label>
                            <input
                                type="number"
                                id="throughput"
                                name="throughput"
                                value={currentNetwork.throughput || ''}
                                onChange={handleChange}
                                min="0"
                                className="edit-network-input"
                            />
                        </div>
                    </div>

                    {/* Принадлежность */}
                    <div className="edit-network-section">
                        <h3 className="edit-network-section-title">Принадлежность</h3>

                        <div className="edit-network-form-group">
                            <label className="edit-network-label">Выберите подразделение</label>
                            <select
                                value={currentDivision}
                                onChange={(e) => handleDivisionChange(e.target.value)}
                                className="edit-network-select"
                            >
                                <option value="">Выберите подразделение</option>
                                {divisions.map(division => (
                                    <option key={division.id} value={division.id.toString()}>
                                        {division.name}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {currentDivision && (
                            <div className="edit-network-form-group">
                                <label className="edit-network-label">Выберите объект</label>
                                <select
                                    value={currentFacility}
                                    onChange={(e) => handleFacilityChange(e.target.value)}
                                    className="edit-network-select"
                                >
                                    <option value="">Выберите объект</option>
                                    {facilities.map(facility => (
                                        <option key={facility.id} value={facility.id.toString()}>
                                            {facility.name}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        )}

                        {currentFacility && (
                            <div className="edit-network-form-group">
                                <label className="edit-network-label">Выберите технику (SHД)</label>
                                <select
                                    value={currentEquipment}
                                    onChange={(e) => setCurrentEquipment(e.target.value)}
                                    className="edit-network-select"
                                >
                                    <option value="">Выберите технику</option>
                                    {equipment.map(eq => (
                                        <option key={eq.id} value={eq.id.toString()}>
                                            {eq.name} ({eq.serial_number})
                                        </option>
                                    ))}
                                </select>
                            </div>
                        )}

                        {currentDivision && currentFacility && currentEquipment && (
                            <div className="edit-network-form-group">
                                <button
                                    type="button"
                                    onClick={handleAddItem}
                                    className="edit-network-add-button"
                                >
                                    Добавить
                                </button>
                            </div>
                        )}

                        {selectedConnections.length > 0 && (
                            <div className="edit-network-form-group">
                                <label className="edit-network-label">Добавленные связи:</label>
                                <div className="selected-items-list">
                                    {selectedConnections.map((item, index) => (
                                        <div key={index} className="selected-item">
                                            <span className="item-text">
                                                {item.division.name} - {item.facility.name} - {item.equipment.name} ({item.equipment.serial_number})
                                            </span>
                                            <button
                                                type="button"
                                                onClick={() => handleRemoveConnection(index)}
                                                className="remove-item-button"
                                            >
                                                ×
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                <div className="edit-network-actions">
                    <button
                        type="button"
                        className="edit-network-cancel-button"
                        onClick={handleCancel}
                    >
                        Отмена
                    </button>
                    <button
                        type="submit"
                        className="edit-network-save-button"
                        disabled={saving}
                    >
                        {saving ? 'Сохранение...' : 'Сохранить изменения'}
                    </button>
                </div>
            </form>
        </div>
    );
};

export default EditNetwork;