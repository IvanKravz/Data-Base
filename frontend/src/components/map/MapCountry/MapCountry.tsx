import { useState, useRef, useEffect } from 'react';
import { RussiaMap } from './RussiaMap';
import { RegionModal } from './RegionModal';
import { officesApi } from '../../../api/offices';

interface OfficeData {
  id?: string;
  name: string;
  region: string;
  address: string;
  latitude: number;
  longitude: number;
  contact_phone: string;
  email: string;
  description: string;
}

export const MapCountry = () => {
    const [selectedRegion, setSelectedRegion] = useState<string | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [hoveredRegion, setHoveredRegion] = useState<string | null>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [editingData, setEditingData] = useState<OfficeData | null>(null);
    const [isEditing, setIsEditing] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [offices, setOffices] = useState<OfficeData[]>([]);

    // Загрузка данных органов при монтировании компонента
    useEffect(() => {
        console.log('Компонент MapCountry смонтирован');
        loadOffices();
    }, []);

    const loadOffices = async () => {
        try {
            console.log('Загрузка offices...');
            const token = localStorage.getItem('accessToken');
            if (token) {
                const data = await officesApi.getOffices(token);
                console.log('Получены offices:', data);
                setOffices(data.results || data);
            } else {
                console.warn('Токен не найден в localStorage');
            }
        } catch (error) {
            console.error('Ошибка загрузки органов:', error);
        }
    };

    const handleMouseEnter = (e: React.MouseEvent<SVGPathElement>) => {
        const regionName = e.currentTarget.getAttribute('name');
        console.log('Mouse enter:', regionName);
        setHoveredRegion(regionName);

        const elements = document.querySelectorAll(`path[name="${regionName}"]`);
        elements.forEach(el => {
            el.style.fill = '#4169E1';
            el.style.transition = '0.4s';
            el.style.cursor = 'pointer';
        });
    };

    const handleMouseLeave = (e: React.MouseEvent<SVGPathElement>) => {
        const regionName = e.currentTarget.getAttribute('name');
        console.log('Mouse leave:', regionName);
        setHoveredRegion(null);

        const elements = document.querySelectorAll(`path[name="${regionName}"]`);
        elements.forEach(el => {
            el.style.fill = '#c9dfec';
            el.style.transition = '0.4s';
        });
    };

    const handleClick = async (regionName: string) => {
        console.log('Клик по региону:', regionName);
        setSelectedRegion(regionName);
        setIsLoading(true);
        
        try {
            const token = localStorage.getItem('accessToken');
            
            if (token) {
                // Ищем существующий офис для региона
                const existingOffice = offices.find(office => 
                    office.region.toLowerCase() === regionName.toLowerCase()
                );
                console.log('offices', offices);
                console.log('Найден существующий офис:', existingOffice);

                if (existingOffice) {
                    // Если офис найден, используем данные из базы и сразу открываем модальное окно
                    setEditingData(existingOffice);
                    setIsModalOpen(true);
                } else {
                    // Если офис не найден, показываем сообщение
                    console.log('Данные для региона не найдены в базе данных');
                    alert(`Данные для региона "${regionName}" не найдены в базе данных`);
                }
            } else {
                console.warn('Токен отсутствует');
                alert('Необходима авторизация для просмотра данных');
            }
        } catch (error) {
            console.error('Ошибка обработки клика:', error);
            alert('Произошла ошибка при загрузке данных');
        } finally {
            setIsLoading(false);
            setIsEditing(false);
        }
    };

    const closeModal = () => {
        console.log('Закрытие модального окна');
        setIsModalOpen(false);
        setIsEditing(false);
        setEditingData(null);
        setSelectedRegion(null);
    };

    const handleEdit = () => {
        console.log('Редактирование данных');
        setIsEditing(true);
    };

    const handleSave = async () => {
        console.log('Сохранение данных:', editingData);
        if (selectedRegion && editingData) {
            setIsLoading(true);
            try {
                const token = localStorage.getItem('accessToken'); // Исправлено на accessToken
                if (token) {
                    let savedOffice;
                    
                    if (editingData.id) {
                        console.log('Обновление существующего офиса:', editingData.id);
                        savedOffice = await officesApi.updateOffice(editingData.id, editingData, token);
                        setOffices(prev => prev.map(office => 
                            office.id === editingData.id ? savedOffice : office
                        ));
                    } else {
                        console.log('Создание нового офиса');
                        savedOffice = await officesApi.createOffice(editingData, token);
                        setOffices(prev => [...prev, savedOffice]);
                    }
                    
                    setEditingData(savedOffice);
                    console.log('Данные сохранены:', savedOffice);
                } else {
                    console.warn('Токен отсутствует, сохранение невозможно');
                    alert('Необходима авторизация для сохранения данных');
                }
                setIsEditing(false);
            } catch (error) {
                console.error('Ошибка сохранения органа:', error);
                alert('Ошибка сохранения данных');
            } finally {
                setIsLoading(false);
            }
        }
    };

    const handleCancel = () => {
        console.log('Отмена редактирования');
        setIsEditing(false);
    };

    const handleInputChange = (field: keyof OfficeData, value: string) => {
        setEditingData(prev => prev ? { ...prev, [field]: value } : null);
    };

    const handleNumberInputChange = (field: 'latitude' | 'longitude', value: string) => {
        const numValue = parseFloat(value) || 0;
        setEditingData(prev => prev ? { ...prev, [field]: numValue } : null);
    };

    const searchRegion = () => {
        const allPaths = document.querySelectorAll('path.rus_zone');
        allPaths.forEach(path => {
            path.style.fill = '#c9dfec';
        });

        if (!searchQuery.trim()) return;

        const foundElements = document.querySelectorAll(`path[name]`);
        let found = false;

        foundElements.forEach(element => {
            const name = element.getAttribute('name');
            if (name && name.toLowerCase().includes(searchQuery.toLowerCase())) {
                element.style.fill = '#4169E1';
                element.style.transition = '0.4s';
                found = true;
            }
        });

        if (!found) {
            alert('Регион не найден');
        }
    };

    const handleKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            searchRegion();
        }
    };

    const handleSearchChange = (query: string) => {
        setSearchQuery(query);
    };

    console.log('Текущее состояние:', {
        isModalOpen,
        selectedRegion,
        editingData,
        officesCount: offices.length
    });

    return (
        <>
            <RussiaMap
                onRegionClick={handleClick}
                onRegionMouseEnter={handleMouseEnter}
                onRegionMouseLeave={handleMouseLeave}
                onSearchKeyPress={handleKeyPress}
                searchQuery={searchQuery}
                onSearchChange={handleSearchChange}
                onSearch={searchRegion}
                hoveredRegion={hoveredRegion}
            />

            <RegionModal
                isOpen={isModalOpen}
                onClose={closeModal}
                selectedRegion={selectedRegion}
                editingData={editingData}
                isEditing={isEditing}
                isLoading={isLoading}
                onEdit={handleEdit}
                onSave={handleSave}
                onCancel={handleCancel}
                onInputChange={handleInputChange}
                onNumberInputChange={handleNumberInputChange}
            />
        </>
    );
};