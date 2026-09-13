// EquipmentDetailsPage.tsx
import React, { useState, useEffect, useMemo } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { RootState } from '../../../store/store';
import { equipmentApi, authApi, divisionsApi, employeesApi } from '../../../api';
import { DisposalModal } from '../DisposalModal/DisposalModal';
import { Equipment, Division } from '../../../types';
import {
    Pencil,
    Trash2,
    Info,
    FileText,
    MessageSquare,
    Package,
    Network,
    Trash2 as TrashIcon,
    Save,
    X,
    Calendar,
    User,
    ClipboardList,
    Hash,
    RefreshCw,
} from 'lucide-react';
import { ConfirmationModal } from '../../modals/ConfirmationModal';
import { EquipmentSidebar } from './sections/EquipmentSidebar';
import { SearchBar } from '../../common/SearchBar';
import { useEquipmentFieldPermissions } from '../../../api/utils/useEquipmentFieldPermissions';

// Секции для просмотра
import { AssignmentInfo } from './sections/AssignmentInfo';
import { DatesInfo } from './sections/DatesInfo';
import { AdditionalInfo } from './sections/AdditionalInfo';
import { DocumentsInfo } from './sections/DocumentsInfo';
import { CommentsInfo } from './sections/CommentsInfo';
import { ProductStructureTable } from './sections/ProductStructureTable';
import { NetworkInfo } from './sections/NetworkInfo';
import { DisposalInfo } from './sections/DisposalInfo';
import { NetworkConfigBlock } from './sections/NetworkConfig/NetworkConfigBlock';

// Секции для редактирования
import { BasicInformation } from '../forms/EditEquipmentForm/sections/BasicInformation';
import { AssignmentInfo as EditAssignmentInfo } from '../forms/EditEquipmentForm/sections/AssignmentInfo';
import { IdentificationInfo as EditIdentificationInfo } from '../forms/EditEquipmentForm/sections/IdentificationInfo';
import { DatesInfo as EditDatesInfo } from '../forms/EditEquipmentForm/sections/DatesInfo';
import { AdditionalInfo as EditAdditionalInfo } from '../forms/EditEquipmentForm/sections/AdditionalInfo';
import { DocumentsInfo as EditDocumentsInfo } from '../forms/EditEquipmentForm/sections/DocumentsInfo';
import { EditCommentsCard } from '../forms/EditEquipmentForm/sections/EditCommentsCard';
import { ProductStructureEditor } from '../forms/EditEquipmentForm/sections/ProductStructureEditor';

import './EquipmentDetailsPage.css';

// Типы вкладок для просмотра
type ViewTabId =
    | 'assignment'
    | 'dates'
    | 'additional'
    | 'documents'
    | 'networks'
    | 'comments'
    | 'structure'
    | 'disposal';

// Типы вкладок для редактирования
type EditTabId =
    | 'basic'
    | 'identification'
    | 'assignment'
    | 'dates'
    | 'additional'
    | 'documents'
    | 'comments'
    | 'structure'
    | 'disposal';

// Маппинг вкладок просмотра → редактирования
const viewToEditMap: Record<ViewTabId, EditTabId> = {
    assignment: 'assignment',
    dates: 'dates',
    additional: 'additional',
    documents: 'documents',
    networks: 'basic',
    comments: 'comments',
    structure: 'structure',
    disposal: 'disposal',
};

/**
 * Состояние, которое передаётся со страницы архива списанной техники
 * в карточку техники. `fromState` — это исходный state самой страницы архива,
 * чтобы после возврата восстановить контекст (divisionId и т. п.).
 */
interface DetailsNavigationState {
    from?: 'equipment-section' | 'equipment-disposed' | 'global-equipment' | string;
    divisionId?: number | string;
    divisionName?: string;
    subdivisionId?: string;
    activeTab?: string;
    fromState?: {
        from?: string;
        divisionId?: number | string;
        divisionName?: string;
        subdivisionId?: string;
        activeTab?: string;
    };
}

/**
 * Проверяет, есть ли у техники непустые данные о списании.
 * Сериализатор отдаёт данные ТОЛЬКО через вложенный объект disposal_info.
 */
function hasDisposalData(equipment: Equipment | null): boolean {
    const d = equipment?.disposal_info;
    if (!d) return false;
    return Boolean(
        d.actNumber ||
        d.actDate ||
        d.disposalCertNumber ||
        d.disposalCertDate ||
        d.comments,
    );
}

export function EquipmentDetailsPage() {
    const { id } = useParams<{ id: string }>();
    const token = localStorage.getItem('accessToken') || '';
    const navigate = useNavigate();
    const location = useLocation();

    const [equipment, setEquipment] = useState<Equipment | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [activeViewTab, setActiveViewTab] = useState<ViewTabId>('assignment');
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [showRestoreModal, setShowRestoreModal] = useState(false);
    const [isRestoring, setIsRestoring] = useState(false);

    // === РЕДАКТИРОВАНИЕ НА МЕСТЕ ===
    const [isEditing, setIsEditing] = useState(false);
    const [editFormData, setEditFormData] = useState<Partial<Equipment> | null>(null);
    const [isSaving, setIsSaving] = useState(false);
    const [activeEditTab, setActiveEditTab] = useState<EditTabId>('basic');
    const [previousViewTab, setPreviousViewTab] = useState<ViewTabId>('assignment');
    const [showDisposalModal, setShowDisposalModal] = useState(false);

    // === ПОИСК ===
    const [searchTerm, setSearchTerm] = useState('');

    // === СПРАВОЧНИКИ ===
    const [divisions, setDivisions] = useState<Division[]>([]);
    const [personnel, setPersonnel] = useState<any[]>([]);
    const [categories, setCategories] = useState<any[]>([]);
    const [interestOrgans, setInterestOrgans] = useState<any[]>([]);

    const user = useSelector((state: RootState) => state.auth.user);
    const permissions = user?.permissions;
    const fieldPermissions = useEquipmentFieldPermissions();

    const canEditEquipment = useMemo(
        () => permissions?.models?.Equipment?.includes('change') ?? false,
        [permissions]
    );
    const canDeleteEquipment = useMemo(
        () => permissions?.models?.Equipment?.includes('delete') ?? false,
        [permissions]
    );
    const isGlobalView = authApi.getGlobalView();

    // Функция обработки списания
    const handleDispose = async (disposalInfo: any) => {
        try {
            await equipmentApi.disposeEquipment(token, equipment!.id, disposalInfo);
            const updated = await equipmentApi.getEquipmentById(token, id!);
            setEquipment(updated);
            setShowDisposalModal(false);
        } catch (error) {
            console.error('Ошибка списания:', error);
            setError('Не удалось списать технику');
        }
    };

    // Загрузка техники
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

    // Загрузка справочников
    useEffect(() => {
        const fetchDictionaries = async () => {
            if (!token) return;
            try {
                const [divisionsData, categoriesData] = await Promise.all([
                    divisionsApi.getDivisions(token),
                    equipmentApi.getEquipmentCategories(token),
                ]);
                setDivisions(divisionsData);
                setCategories(categoriesData);

                if (canEditEquipment) {
                    try {
                        const organsData = await equipmentApi.getInterestOrgans(token);
                        setInterestOrgans(organsData);
                    } catch (orgErr: any) {
                        if (orgErr?.response?.status === 403) {
                            console.warn('Доступ к списку органов ограничен');
                        } else {
                            console.error('Ошибка загрузки органов:', orgErr);
                        }
                        setInterestOrgans([]);
                    }
                } else {
                    setInterestOrgans([]);
                }
            } catch (err) {
                console.error('Ошибка загрузки справочников:', err);
            }
        };
        fetchDictionaries();
    }, [token, canEditEquipment]);

    // Загрузка персонала при редактировании
    useEffect(() => {
        const fetchPersonnel = async () => {
            if (!token || !editFormData?.division?.id) return;
            try {
                const data = await employeesApi.getPersonnel(token, { division: editFormData.division.id });
                setPersonnel(data);
            } catch (err) {
                console.error('Ошибка загрузки персонала:', err);
            }
        };
        if (isEditing) fetchPersonnel();
    }, [token, editFormData?.division?.id, isEditing]);

    const handleEditStart = () => {
        if (!equipment) return;
        setEditFormData({ ...equipment });
        setIsEditing(true);
        setPreviousViewTab(activeViewTab);
        const editTab = viewToEditMap[activeViewTab] || 'basic';
        setActiveEditTab(editTab);
    };

    const handleEditChange = (data: Partial<Equipment>) => {
        setEditFormData((prev) => ({ ...prev!, ...data }));
    };

    const handleSave = async () => {
        if (!editFormData || !token || !id) return;

        if (editFormData.is_free_use && !editFormData.free_use_act_number?.trim()) {
            setError('При выдаче в безвозмездное пользование необходимо указать номер акта');
            return;
        }

        setIsSaving(true);
        setError('');
        try {
            const dataToSend = {
                ...editFormData,
                category: editFormData.category
                    ? {
                        value: editFormData.category.value || editFormData.category,
                        name: editFormData.category.name || editFormData.category,
                    }
                    : null,
                division_id: editFormData.division?.id || null,
                subdivision_id: editFormData.subdivision?.id || null,
                facility_id: editFormData.facility?.id || null,
                assigned_to_id: editFormData.assigned_to?.id || null,
                interest_organ_id: editFormData.interest_organ?.id || editFormData.interest_organ_id || null,
                product_structures: editFormData.product_structures || [],
            };
            await equipmentApi.updateEquipment(token, id, dataToSend);
            const updated = await equipmentApi.getEquipmentById(token, id);
            setEquipment(updated);
            setIsEditing(false);
            setEditFormData(null);
            setActiveViewTab(previousViewTab);
        } catch (err: any) {
            console.error('Ошибка сохранения:', err);
            if (err?.response?.data?.free_use_act_number) {
                setError(err.response.data.free_use_act_number[0] || 'Ошибка валидации');
            } else {
                setError('Не удалось сохранить изменения. Проверьте подключение и попробуйте снова.');
            }
        } finally {
            setIsSaving(false);
        }
    };

    const handleCancelEdit = () => {
        setIsEditing(false);
        setEditFormData(null);
        setActiveViewTab(previousViewTab);
    };

    // === НАВИГАЦИЯ НАЗАД ===
    const handleBack = () => {
        if (isEditing) {
            handleCancelEdit();
            return;
        }

        const state = location.state as DetailsNavigationState | undefined;

        // 1) Пришли из архива списанной техники — возвращаемся туда,
        //    восстанавливая исходный state архива (divisionId, фильтры и т. п.).
        if (state?.from === 'equipment-disposed') {
            navigate('/equipment-disposed', {
                state: state.fromState ?? undefined,
            });
            return;
        }

        // 2) Пришли со страницы техники (общий/по подразделению список)
        if (state?.from === 'equipment-section') {
            let backUrl = state.divisionId
                ? `/divisions/${state.divisionId}/equipment`
                : `/equipment`;
            const params = new URLSearchParams();
            if (state.subdivisionId) params.append('subdivision', state.subdivisionId);
            const queryString = params.toString();
            if (queryString) backUrl += `?${queryString}`;
            navigate(backUrl, { state: { activeTab: state.activeTab || 'all' } });
            return;
        }

        // 3) Пришли с глобальной страницы техники
        if (state?.from === 'global-equipment') {
            navigate('/equipment', { state: { activeTab: state.activeTab || 'all' } });
            return;
        }

        // 4) Фолбэки: глобальный просмотр / известное подразделение / браузерный back
        if (isGlobalView) {
            navigate(`/equipment`, {
                state: { activeTab: state?.activeTab || 'all' },
            });
            return;
        }

        if (equipment?.division?.id) {
            let backUrl = `/divisions/${equipment.division.id}/equipment`;
            if (equipment.subdivision?.id) {
                backUrl += `?subdivision=${equipment.subdivision.id}`;
            }
            navigate(backUrl, {
                state: { activeTab: state?.activeTab || 'all' },
            });
            return;
        }

        navigate(-1);
    };

    // === УДАЛЕНИЕ ===
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

    // === ВОССТАНОВЛЕНИЕ ===
    const handleRestoreConfirm = async () => {
        if (!equipment || !token) return;
        setIsRestoring(true);
        setError('');
        try {
            await equipmentApi.restoreEquipment(token, equipment.id);
            setShowRestoreModal(false);
            // Возвращаемся в архив — там запись уже не будет отображаться,
            // т.к. статус сменился с 'disposed' на 'in-operation'.
            handleBack();
        } catch (error: any) {
            console.error('Ошибка восстановления техники:', error);
            setError(
                error?.response?.data?.error ||
                'Не удалось восстановить технику. Попробуйте ещё раз.',
            );
        } finally {
            setIsRestoring(false);
        }
    };

    // === ОПРЕДЕЛЕНИЕ ВИДИМОСТИ ВКЛАДОК ===
    const showDisposalTab = equipment?.status === 'disposed';
    const showNetworksTab =
        (equipment?.network_memberships?.length ?? 0) > 0 || equipment?.is_network;
    const showStructureTab = equipment?.product_structures && equipment.product_structures.length > 0;

    const showEditStructureTab = (editFormData?.product_structures?.length ?? 0) > 0;
    const showEditDisposalTab = editFormData?.status === 'disposed';

    const viewTabs: { id: ViewTabId; label: string; icon: React.ReactNode; show: boolean }[] = [
        { id: 'assignment', label: 'Принадлежность', icon: <User size={16} />, show: true },
        { id: 'dates', label: 'Даты', icon: <Calendar size={16} />, show: true },
        { id: 'documents', label: 'Документы', icon: <FileText size={16} />, show: true },
        { id: 'additional', label: 'Дополнительно', icon: <ClipboardList size={16} />, show: true },
        { id: 'networks', label: 'Сети', icon: <Network size={16} />, show: showNetworksTab },
        { id: 'comments', label: 'Комментарии', icon: <MessageSquare size={16} />, show: true },
        { id: 'structure', label: 'Состав', icon: <Package size={16} />, show: showStructureTab },
        { id: 'disposal', label: 'Списание', icon: <TrashIcon size={16} />, show: showDisposalTab },
    ];

    const editTabs: { id: EditTabId; label: string; icon: React.ReactNode; show: boolean }[] = [
        { id: 'basic', label: 'Основное', icon: <Info size={16} />, show: true },
        { id: 'identification', label: 'Идентификация', icon: <Hash size={16} />, show: true },
        { id: 'assignment', label: 'Принадлежность', icon: <User size={16} />, show: true },
        { id: 'dates', label: 'Даты', icon: <Calendar size={16} />, show: true },
        { id: 'documents', label: 'Документы', icon: <FileText size={16} />, show: true },
        { id: 'additional', label: 'Дополнительно', icon: <ClipboardList size={16} />, show: true },
        { id: 'comments', label: 'Комментарии', icon: <MessageSquare size={16} />, show: true },
        { id: 'structure', label: 'Состав', icon: <Package size={16} />, show: showEditStructureTab },
        { id: 'disposal', label: 'Списание', icon: <TrashIcon size={16} />, show: showEditDisposalTab },
    ];

    const renderViewTabContent = (tabId: ViewTabId) => {
        if (!equipment) return null;

        const renderEmpty = (message: string = 'Нет данных') => (
            <div className="equipment-empty-state">{message}</div>
        );

        switch (tabId) {
            case 'assignment':
                return <AssignmentInfo equipment={equipment} searchTerm={searchTerm} />;
            case 'dates':
                return <DatesInfo equipment={equipment} searchTerm={searchTerm} />;
            case 'additional': {
                const hasData =
                    equipment.interest_organ ||
                    equipment.secret_level ||
                    equipment.is_network ||
                    equipment.is_free_use ||
                    equipment.free_use_act_number ||
                    equipment.interest_organ_id;
                if (!hasData) return renderEmpty('Нет дополнительной информации');
                return <AdditionalInfo equipment={equipment} searchTerm={searchTerm} />;
            }
            case 'documents': {
                const hasDocuments = !!(equipment.first_invoice || equipment.material_invoice);
                if (!hasDocuments) return renderEmpty('Нет документов');
                return <DocumentsInfo equipment={equipment} searchTerm={searchTerm} />;
            }
            case 'networks': {
                const hasNetworks = equipment.network_memberships && equipment.network_memberships.length > 0;
                if (!hasNetworks) return renderEmpty('Нет сетевых подключений');
                return (
                    <>
                        <NetworkInfo equipment={equipment} searchTerm={searchTerm} />
                        {equipment.is_network && <NetworkConfigBlock equipment={equipment} token={token} />}
                    </>
                );
            }
            case 'comments': {
                const hasComments = equipment.comments && equipment.comments.trim() !== '';
                if (!hasComments) return renderEmpty('Нет комментариев');
                return <CommentsInfo equipment={equipment} searchTerm={searchTerm} />;
            }
            case 'structure': {
                const hasStructures = equipment.product_structures && equipment.product_structures.length > 0;
                if (!hasStructures) return renderEmpty('Нет данных о составе');
                return <ProductStructureTable equipment={equipment} searchTerm={searchTerm} />;
            }
            case 'disposal': {
                if (!hasDisposalData(equipment)) return renderEmpty('Нет данных о списании');
                return <DisposalInfo equipment={equipment} searchTerm={searchTerm} />;
            }
            default:
                return null;
        }
    };

    const renderEditTabContent = (tabId: EditTabId) => {
        if (!editFormData) return null;
        const renderPlaceholder = (message: string = 'Редактирование временно недоступно') => (
            <div className="equipment-details-edit-placeholder">{message}</div>
        );

        switch (tabId) {
            case 'basic':
                return (
                    <BasicInformation
                        formData={editFormData}
                        onChange={handleEditChange}
                        isClosedEquipment={editFormData.is_closed || false}
                        isDisposed={editFormData.status === 'disposed'}
                        equipmentCategories={categories}
                        permissions={fieldPermissions || undefined}
                    />
                );
            case 'identification':
                return (
                    <EditIdentificationInfo
                        formData={editFormData}
                        onChange={handleEditChange}
                        permissions={fieldPermissions || undefined}
                    />
                );
            case 'assignment':
                return (
                    <EditAssignmentInfo
                        formData={editFormData}
                        onChange={handleEditChange}
                        availableSubdivisions={
                            divisions.find((d) => d.id === editFormData.division?.id)?.subdivisions || []
                        }
                        availablePersonnel={personnel}
                        divisions={divisions}
                        isLoading={loading}
                        permissions={fieldPermissions || undefined}
                    />
                );
            case 'dates':
                return (
                    <EditDatesInfo
                        formData={editFormData}
                        onChange={handleEditChange}
                        serviceLife={editFormData.service_life}
                        onServiceLifeChange={(value) => handleEditChange({ service_life: value })}
                        isDisposed={editFormData.status === 'disposed'}
                        permissions={fieldPermissions || undefined}
                    />
                );
            case 'additional':
                return (
                    <EditAdditionalInfo
                        formData={editFormData}
                        onChange={handleEditChange}
                        interestOrgans={interestOrgans}
                        isDisposed={editFormData.status === 'disposed'}
                        permissions={fieldPermissions || undefined}
                    />
                );
            case 'documents':
                return (
                    <EditDocumentsInfo
                        formData={editFormData}
                        onChange={handleEditChange}
                        isDisposed={editFormData.status === 'disposed'}
                        permissions={fieldPermissions || undefined}
                    />
                );
            case 'comments':
                return (
                    <EditCommentsCard
                        comments={editFormData.comments || ''}
                        onChange={(value) => handleEditChange({ comments: value })}
                        permissions={fieldPermissions || undefined}
                    />
                );
            case 'structure':
                return (
                    <ProductStructureEditor
                        productStructures={editFormData.product_structures || []}
                        onChange={(structures) => handleEditChange({ product_structures: structures })}
                        isDisposed={editFormData.status === 'disposed'}
                        permissions={fieldPermissions || { canEditProductStructure: true } as any}
                    />
                );
            case 'disposal':
                return renderPlaceholder('Редактирование списания доступно в отдельном разделе');
            default:
                return null;
        }
    };

    if (loading) return <div className="equipment-loading">Загрузка...</div>;
    if (error && !isEditing) return <div className="equipment-error">{error}</div>;
    if (!equipment) return <div className="equipment-not-found">Техника не найдена</div>;

    return (
        <div className="equipment-details-container">
            <div className="equipment-details-layout">
                <div className="equipment-sidebar">
                    <EquipmentSidebar equipment={equipment} onBack={handleBack} />
                </div>

                <div className="equipment-main">
                    {!isEditing && (
                        <div className="equipment-details-search-container">
                            <SearchBar
                                searchTerm={searchTerm}
                                setSearchTerm={setSearchTerm}
                                placeholder="Поиск по данным техники..."
                            />
                        </div>
                    )}

                    {!isEditing ? (
                        <div className="equipment-details-tabs-container">
                            <div className="equipment-details-tabs-header">
                                <div className="equipment-details-tabs-list">
                                    {viewTabs
                                        .filter((tab) => tab.show)
                                        .map((tab) => (
                                            <button
                                                key={tab.id}
                                                className={`equipment-details-tab-button ${activeViewTab === tab.id ? 'active' : ''}`}
                                                onClick={() => setActiveViewTab(tab.id)}
                                            >
                                                {tab.icon}
                                                {tab.label}
                                            </button>
                                        ))}
                                </div>
                                <div className="equipment-details-tabs-actions">
                                    {canEditEquipment && activeViewTab !== 'networks' && (
                                        <button onClick={handleEditStart} className="equipment-btn equipment-btn--primary">
                                            <Pencil size={14} />
                                            Редактировать
                                        </button>
                                    )}

                                    {canDeleteEquipment && equipment.status === 'disposed' && (
                                        <>
                                            <button
                                                onClick={() => setShowRestoreModal(true)}
                                                className="equipment-btn equipment-btn--success"
                                                title="Восстановить технику"
                                            >
                                                <RefreshCw size={14} />
                                                Восстановить
                                            </button>
                                            <button
                                                onClick={() => setShowDeleteModal(true)}
                                                className="equipment-btn equipment-btn--danger"
                                                title="Удалить технику"
                                            >
                                                <Trash2 size={14} />
                                                Удалить
                                            </button>
                                        </>
                                    )}

                                    {canDeleteEquipment && equipment.status !== 'disposed' && (
                                        <button
                                            onClick={() => setShowDisposalModal(true)}
                                            className="equipment-btn equipment-btn--warning"
                                        >
                                            <Trash2 size={14} />
                                            Списать
                                        </button>
                                    )}

                                    {showDisposalModal && (
                                        <DisposalModal
                                            onConfirm={handleDispose}
                                            onCancel={() => setShowDisposalModal(false)}
                                        />
                                    )}
                                </div>
                            </div>
                            <div className="equipment-details-tab-content">
                                {renderViewTabContent(activeViewTab)}
                            </div>
                        </div>
                    ) : (
                        <div className="equipment-details-tabs-container editing">
                            <div className="equipment-details-tabs-header">
                                <div className="equipment-details-tabs-list">
                                    {editTabs
                                        .filter((tab) => tab.show)
                                        .map((tab) => (
                                            <button
                                                key={tab.id}
                                                className={`equipment-details-tab-button ${activeEditTab === tab.id ? 'active' : ''}`}
                                                onClick={() => setActiveEditTab(tab.id)}
                                            >
                                                {tab.icon}
                                                {tab.label}
                                            </button>
                                        ))}
                                </div>
                                <div className="equipment-details-tabs-actions">
                                    <button
                                        onClick={handleCancelEdit}
                                        className="equipment-btn equipment-btn--secondary"
                                        disabled={isSaving}
                                    >
                                        <X size={16} />
                                        Отмена
                                    </button>
                                    <button
                                        onClick={handleSave}
                                        className="equipment-btn equipment-btn--success"
                                        disabled={isSaving}
                                    >
                                        <Save size={16} />
                                        {isSaving ? 'Сохранение...' : 'Сохранить'}
                                    </button>
                                </div>
                            </div>
                            <div className="equipment-details-tab-content">
                                {renderEditTabContent(activeEditTab)}
                            </div>
                        </div>
                    )}
                    {error && isEditing && (
                        <div className="ep-error" style={{ marginTop: '1rem' }}>
                            {error}
                        </div>
                    )}
                </div>
            </div>

            {showDeleteModal && (
                <ConfirmationModal
                    type="delete"
                    title="Удаление техники"
                    message="Вы уверены, что хотите удалить эту технику? Это действие нельзя отменить."
                    onConfirm={handleDeleteConfirm}
                    onCancel={() => setShowDeleteModal(false)}
                />
            )}

            {showRestoreModal && (
                <ConfirmationModal
                    type="restore"
                    title="Восстановление техники"
                    message='Вы уверены, что хотите восстановить эту технику? Она вернётся в статус "В эксплуатации".'
                    onConfirm={handleRestoreConfirm}
                    onCancel={() => setShowRestoreModal(false)}
                />
            )}
        </div>
    );
}