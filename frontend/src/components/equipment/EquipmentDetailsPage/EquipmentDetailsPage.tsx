// EquipmentDetailsPage.tsx
import React, { useState, useEffect, useMemo } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { RootState } from '../../../store/store';
import { equipmentApi, authApi } from '../../../api';
import { Equipment } from '../../../types';
import { getStatusColor, getStatusLabel } from '../../../utils/statusUtils';
import {
    Pencil,
    Trash2,
    Info,
    FileText,
    MessageSquare,
    Package,
    Network,
    Trash2 as TrashIcon,
} from 'lucide-react';
import { DeleteConfirmationModal } from '../../modals/DeleteConfirmationModal';
import { EquipmentSidebar } from './EquipmentSidebar';

// Секции
import { AssignmentInfo } from './sections/AssignmentInfo';
import { DatesInfo } from './sections/DatesInfo';
import { AdditionalInfo } from './sections/AdditionalInfo';
import { DocumentsInfo } from './sections/DocumentsInfo';
import { CommentsInfo } from './sections/CommentsInfo';
import { ProductStructureTable } from './sections/ProductStructureTable';
import { NetworkInfo } from './sections/NetworkInfo';
import { NetworkConfigBlock } from './sections/NetworkConfig/NetworkConfigBlock';
import { DisposalInfo } from './sections/DisposalInfo';

import './EquipmentDetailsPage.css';

type TabId = 'main' | 'documents' | 'comments' | 'structure' | 'networks' | 'disposal';
type SubTabId = 'assignment' | 'dates' | 'additional';

export function EquipmentDetailsPage() {
    const { id } = useParams<{ id: string }>();
    const token = localStorage.getItem('accessToken') || '';
    const navigate = useNavigate();
    const location = useLocation();

    const [equipment, setEquipment] = useState<Equipment | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [activeTab, setActiveTab] = useState<TabId>('main');
    const [activeSubTab, setActiveSubTab] = useState<SubTabId>('assignment');
    const [showDeleteModal, setShowDeleteModal] = useState(false);

    const user = useSelector((state: RootState) => state.auth.user);
    const permissions = user?.permissions;
    const canEditEquipment = useMemo(
        () => permissions?.models?.Equipment?.includes('change') ?? false,
        [permissions]
    );
    const canDeleteEquipment = useMemo(
        () => permissions?.models?.Equipment?.includes('delete') ?? false,
        [permissions]
    );
    const isGlobalView = authApi.getGlobalView();

    useEffect(() => {
        const fetchEquipment = async () => {
            if (!id || !token) return;
            try {
                const data = await equipmentApi.getEquipmentById(token, id);
                setEquipment(data);
            } catch (err) {
                setError('Не удалось загрузить данные техники');
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        fetchEquipment();
    }, [id, token]);

    // При смене основной вкладки сбрасываем подвкладку на первую
    useEffect(() => {
        if (activeTab === 'main') {
            setActiveSubTab('assignment');
        }
    }, [activeTab]);

    const handleBack = () => {
        const state = location.state;
        if (state?.from === 'equipment-section') {
            let backUrl = state.divisionId
                ? `/divisions/${state.divisionId}/equipment`
                : `/equipment`;
            const params = new URLSearchParams();
            if (state.subdivisionId) params.append('subdivision', state.subdivisionId);
            const queryString = params.toString();
            if (queryString) backUrl += `?${queryString}`;
            navigate(backUrl, { state: { activeTab: state.activeTab } });
        } else if (isGlobalView) {
            navigate(`/equipment`, {
                state: { activeTab: location.state?.activeTab || 'all' },
            });
        } else if (equipment?.division?.id) {
            let backUrl = `/divisions/${equipment.division.id}/equipment`;
            if (equipment.subdivision?.id)
                backUrl += `?subdivision=${equipment.subdivision.id}`;
            navigate(backUrl, {
                state: { activeTab: location.state?.activeTab || 'all' },
            });
        } else {
            navigate(-1);
        }
    };

    const handleDeleteConfirm = async () => {
        try {
            await equipmentApi.deleteEquipment(token, equipment!.id);
            handleBack();
        } catch (error) {
            console.error('Ошибка при удалении:', error);
            setError('Не удалось удалить технику');
        } finally {
            setShowDeleteModal(false);
        }
    };

    const handleEdit = () => {
        navigate(`/equipment/${id}/edit`, { state: { from: location.pathname } });
    };

    const showDisposalTab = equipment?.status === 'disposed';
    const showNetworksTab =
        (equipment?.network_memberships?.length ?? 0) > 0 || equipment?.is_network;
    const showStructureTab = equipment?.product_structure && equipment.product_structure.length > 0;

    const renderMainSubTabs = () => {
        if (!equipment) return null;

        const subTabs: { id: SubTabId; label: string; component: JSX.Element }[] = [
            {
                id: 'assignment',
                label: 'Назначение',
                component: <AssignmentInfo equipment={equipment} hideTitle />,
            },
            {
                id: 'dates',
                label: 'Даты',
                component: <DatesInfo equipment={equipment} hideTitle />,
            },
            {
                id: 'additional',
                label: 'Дополнительно',
                component: <AdditionalInfo equipment={equipment} hideTitle />,
            },
        ];

        return (
            <div className="equipment-sub-tabs-container">
                <div className="equipment-sub-tabs-list">
                    {subTabs.map((tab) => (
                        <button
                            key={tab.id}
                            className={`equipment-sub-tab-button ${activeSubTab === tab.id ? 'active' : ''}`}
                            onClick={() => setActiveSubTab(tab.id)}
                        >
                            {tab.label}
                        </button>
                    ))}
                </div>
                <div className="equipment-sub-tab-content">
                    {subTabs.find((t) => t.id === activeSubTab)?.component}
                </div>
            </div>
        );
    };

    const renderTabContent = () => {
        if (!equipment) return null;

        switch (activeTab) {
            case 'main':
                return renderMainSubTabs();
            case 'documents':
                return <DocumentsInfo equipment={equipment} />;
            case 'comments':
                return <CommentsInfo equipment={equipment} />;
            case 'structure':
                return <ProductStructureTable equipment={equipment} />;
            case 'networks':
                return (
                    <>
                        <NetworkInfo equipment={equipment} />
                        {equipment.is_network && (
                            <NetworkConfigBlock equipment={equipment} token={token} />
                        )}
                    </>
                );
            case 'disposal':
                return <DisposalInfo equipment={equipment} />;
            default:
                return null;
        }
    };

    if (loading) return <div className="equipment-loading">Загрузка...</div>;
    if (error) return <div className="equipment-error">{error}</div>;
    if (!equipment) return <div className="equipment-not-found">Техника не найдена</div>;

    return (
        <div className="equipment-details-container">
            <div className="equipment-details-layout">
                <div className="equipment-sidebar">
                    <EquipmentSidebar equipment={equipment} onBack={handleBack} />
                </div>

                <div className="equipment-main">
                    <div className="equipment-tabs-container">
                        <div className="equipment-tabs-header">
                            <div className="equipment-tabs-list">
                                <button
                                    className={`equipment-tab-button ${activeTab === 'main' ? 'active' : ''}`}
                                    onClick={() => setActiveTab('main')}
                                >
                                    <Info size={16} />
                                    Основное
                                </button>
                                <button
                                    className={`equipment-tab-button ${activeTab === 'documents' ? 'active' : ''}`}
                                    onClick={() => setActiveTab('documents')}
                                >
                                    <FileText size={16} />
                                    Документы
                                </button>
                                <button
                                    className={`equipment-tab-button ${activeTab === 'comments' ? 'active' : ''}`}
                                    onClick={() => setActiveTab('comments')}
                                >
                                    <MessageSquare size={16} />
                                    Комментарии
                                </button>
                                {showStructureTab && (
                                    <button
                                        className={`equipment-tab-button ${activeTab === 'structure' ? 'active' : ''}`}
                                        onClick={() => setActiveTab('structure')}
                                    >
                                        <Package size={16} />
                                        Состав
                                    </button>
                                )}
                                {showNetworksTab && (
                                    <button
                                        className={`equipment-tab-button ${activeTab === 'networks' ? 'active' : ''}`}
                                        onClick={() => setActiveTab('networks')}
                                    >
                                        <Network size={16} />
                                        Сети
                                    </button>
                                )}
                                {showDisposalTab && (
                                    <button
                                        className={`equipment-tab-button ${activeTab === 'disposal' ? 'active' : ''}`}
                                        onClick={() => setActiveTab('disposal')}
                                    >
                                        <TrashIcon size={16} />
                                        Списание
                                    </button>
                                )}
                            </div>
                            <div className="equipment-tabs-actions">
                                {canEditEquipment && (
                                    <button onClick={handleEdit} className="equipment-btn equipment-btn--primary">
                                        <Pencil size={16} />
                                        Редактировать
                                    </button>
                                )}
                                {canDeleteEquipment && (
                                    <button
                                        onClick={() => setShowDeleteModal(true)}
                                        className="equipment-btn equipment-btn--danger"
                                    >
                                        <Trash2 size={16} />
                                        Удалить
                                    </button>
                                )}
                            </div>
                        </div>
                        <div className="equipment-tab-content">{renderTabContent()}</div>
                    </div>
                </div>
            </div>

            {showDeleteModal && (
                <DeleteConfirmationModal
                    onConfirm={handleDeleteConfirm}
                    onCancel={() => setShowDeleteModal(false)}
                    title="Удаление техники"
                    message="Вы уверены, что хотите удалить эту технику? Это действие нельзя отменить."
                />
            )}
        </div>
    );
}