import React, { useState, useEffect, useMemo } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { RootState, AppDispatch } from '../../../store/store';
import { ArrowLeft } from 'lucide-react';
import { DeleteConfirmationModal } from '../../modals/DeleteConfirmationModal';
import { updateEquipment, deleteEquipmentThunk } from '../../../store/slices/equipmentSlice';
import { equipmentApi, authApi } from '../../../api';
import './style.css';
import {
  Header,
  BasicInfo,
  IdentificationInfo,
  DatesInfo,
  AssignmentInfo,
  DisposalInfo
} from './sections';
import { Equipment } from '../../../types';
import { CommentsInfo } from './sections/CommentsInfo';
import { DocumentsInfo } from './sections/DocumentsInfo';
import { ProductStructureTable } from './sections/ProductStructureTable';
import { EditEquipmentForm } from '../forms/EditEquipmentForm';
import { NetworkConfigBlock } from './sections/NetworkConfig/NetworkConfigBlock';
import { NetworkInfo } from './sections/NetworkInfo';
import { AdditionalInfo } from './sections/AdditionalInfo';

export function EquipmentDetailsPage() {
  const { id } = useParams<{ id: string }>();
  const token = localStorage.getItem('accessToken') || '';
  const navigate = useNavigate();
  const dispatch = useDispatch<AppDispatch>();
  const [isEditing, setIsEditing] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [equipment, setEquipment] = useState<Equipment | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const user = useSelector((state: RootState) => state.auth.user);
  const permissions = user?.permissions;

  const canEditEquipment = useMemo(() =>
    permissions?.models?.Equipment?.includes('change') ?? false, [permissions]);
  const canDeleteEquipment = useMemo(() =>
    permissions?.models?.Equipment?.includes('delete') ?? false, [permissions]);

  const isGlobalView = authApi.getGlobalView();
  const location = useLocation();

  useEffect(() => {
    const fetchEquipment = async () => {
      try {
        if (!id || !token) return;
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
      navigate(`/equipment`, { state: { activeTab: location.state?.activeTab || 'all' } });
    } else if (equipment?.division?.id) {
      let backUrl = `/divisions/${equipment.division.id}/equipment`;
      if (equipment.subdivision?.id) backUrl += `?subdivision=${equipment.subdivision.id}`;
      navigate(backUrl, { state: { activeTab: location.state?.activeTab || 'all' } });
    } else {
      navigate(-1);
    }
  };

  const handleUpdate = async (updatedEquipment: Partial<Equipment>) => {
    if (!equipment?.id || !token) return;
    try {
      setLoading(true);
      await equipmentApi.updateEquipment(token, equipment.id, updatedEquipment);
      const fullUpdatedData = await equipmentApi.getEquipmentById(token, equipment.id);
      dispatch(updateEquipment(fullUpdatedData));
      setEquipment(fullUpdatedData);
      setIsEditing(false);
    } catch (error) {
      console.error('Ошибка при обновлении техники:', error);
      setError('Не удалось обновить данные техники');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteConfirm = async () => {
    try {
      await dispatch(deleteEquipmentThunk(equipment!.id)).unwrap();
      handleBack();
    } catch (error) {
      console.error('Ошибка при удалении:', error);
      setError('Не удалось удалить технику');
    } finally {
      setShowDeleteModal(false);
    }
  };

  if (loading) return <div className="equipment-loading">Загрузка...</div>;
  if (error) return <div className="equipment-error">{error}</div>;
  if (!equipment) return <div className="equipment-not-found"><p>Техника не найдена</p></div>;

  if (isEditing) {
    return (
      <div className="equipment-details-container">
        <div className="page-header">
          <div className="equipment-header-left">
            <button onClick={() => setIsEditing(false)} className="equipment-btn--icon">
              <ArrowLeft size={20} />
            </button>
            <h2 className="equipment-edit-header-title">Редактирование техники</h2>
          </div>
        </div>
        <div className="equipment-card--edit">
          <EditEquipmentForm
            initialData={equipment}
            onSubmit={handleUpdate}
            onCancel={() => setIsEditing(false)}
            isClosedEquipment={equipment.is_closed}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="equipment-details-container">
      <Header
        equipment={equipment}
        onBack={handleBack}
        onEdit={() => setIsEditing(true)}
        onDelete={() => setShowDeleteModal(true)}
        canEditEquipment={canEditEquipment}
        canDeleteEquipment={canDeleteEquipment}
      />
      {equipment && (
        <div className="equipment-grid equipment-grid--2cols">
          <BasicInfo equipment={equipment} />
          <AssignmentInfo equipment={equipment} />
          <IdentificationInfo equipment={equipment} />
          <DatesInfo equipment={equipment} />
          <DocumentsInfo equipment={equipment} />
          <AdditionalInfo equipment={equipment} />
          <CommentsInfo equipment={equipment} />
          <ProductStructureTable equipment={equipment} />
        </div>
      )}

      {equipment.network_memberships.length > 0 && <NetworkInfo equipment={equipment} />}
      {equipment.is_network && (
        <NetworkConfigBlock equipment={equipment} token={token} />
      )}

      {equipment.status === 'disposed' && (
        <DisposalInfo
          disposalInfo={{
            actNumber: equipment.disposal_act_number,
            actDate: equipment.disposal_act_date,
            certNumber: equipment.disposal_cert_number,
            certDate: equipment.disposal_cert_date,
            comments: equipment.disposal_comments
          }}
        />
      )}

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