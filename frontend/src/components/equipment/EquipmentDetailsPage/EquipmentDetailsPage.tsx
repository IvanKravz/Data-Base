import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '../../../store/store';
import { ArrowLeft } from 'lucide-react';
import { DeleteConfirmationModal } from '../../modals/DeleteConfirmationModal';
import { updateEquipment, deleteEquipment } from '../../../store/slices/equipmentSlice';
import { equipmentApi } from '../../../api';
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
  const dispatch = useDispatch();
  const [isEditing, setIsEditing] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [equipment, setEquipment] = useState<Equipment | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

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

  if (loading) {
    return <div className="equipment-loading">Загрузка...</div>;
  }

  if (error) {
    return <div className="equipment-error">{error}</div>;
  }

  if (!equipment) {
    return (
      <div className="equipment-not-found">
        <p>Техника не найдена</p>
      </div>
    );
  }

  const handleBack = () => {
    navigate(-1);
  };

  const handleUpdate = async (updatedEquipment: Partial<Equipment>) => {
    if (!equipment?.id || !token) return;

    try {
      setLoading(true);
      console.log('Обновляемые данные:', updatedEquipment);

      // Нормализуем данные перед отправкой
      const updatedData = await equipmentApi.updateEquipment(token, equipment.id, updatedEquipment);

      // Обновляем локальное состояние с учетом полных объектов
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

  if (isEditing) {
    return (
      <div className="equipment-details-container">
        <div className="equipment-edit-header">
          <div className="equipment-header-left">
            <button
              onClick={() => setIsEditing(false)}
              className="equipment-btn--icon"
            >
              <ArrowLeft size={20} />
            </button>
            <h1 className="equipment-edit-header-title">
              Редактирование техники
            </h1>
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
      />

      <div className="equipment-grid equipment-grid--2cols">
        <BasicInfo equipment={equipment} />
        <DocumentsInfo equipment={equipment} />
        <IdentificationInfo equipment={equipment} />
        <DatesInfo equipment={equipment} />
        <AdditionalInfo equipment={equipment} />
        <AssignmentInfo equipment={equipment} />
        <CommentsInfo equipment={equipment} />
        <ProductStructureTable equipment={equipment} />
      </div>

      {equipment.network_memberships.length > 0 && <NetworkInfo equipment={equipment} />}
      {equipment.is_network && (
        <NetworkConfigBlock
          equipment={equipment}
          token={token}
        />
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

      {showDeleteModal && <DeleteConfirmationModal
        isOpen={showDeleteModal}
        onConfirm={() => {
          dispatch(deleteEquipment(equipment.id));
          handleBack();
        }}
        onCancel={() => setShowDeleteModal(false)}
        title="Удаление техники"
        message="Вы уверены, что хотите удалить эту технику? Это действие нельзя отменить."
      />}
    </div>
  );
}