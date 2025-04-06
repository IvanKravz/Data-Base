import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '../../../store/store';
import { ArrowLeft } from 'lucide-react';
import { DeleteConfirmationModal } from '../../modals/DeleteConfirmationModal';
import { EquipmentForm } from '../forms/EquipmentForm';
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

  const handleUpdate = (updatedEquipment: Partial<Equipment>) => {
    if (!equipment?.id) return;
    
    dispatch(updateEquipment({ ...updatedEquipment, id: equipment.id }));
    setIsEditing(false);
  };

  if (isEditing) {
    return (
      <div className="equipment-details-container">
        <div className="equipment-flex equipment-items-center equipment-gap-md">
          <button
            onClick={() => setIsEditing(false)}
            className="equipment-btn equipment-btn--icon"
          >
            <ArrowLeft size={20} />
          </button>
          <h1 className="equipment-header__title">Редактирование техники</h1>
        </div>
  
        <div className="equipment-card equipment-card--editing">
          <EquipmentForm
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
        <IdentificationInfo equipment={equipment} />
        <DatesInfo equipment={equipment} />
        <AssignmentInfo equipment={equipment} />
      </div>

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