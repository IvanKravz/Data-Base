import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { Division, Employee } from '../../../types';
import { TableView } from './views/TableView';
import { DeleteConfirmationModal } from '../../modals/DeleteConfirmationModal';
import { ExportButton } from '../../common/ExportButton';
import { exportPersonnelToExcel } from '../../../utils/exportToExcel';
import { deletePersonAsync } from '../../../store/slices/personnelSlice';
import { employeesApi } from '../../../api';
import { setEmployee } from '../../../store/slices/personnelSlice';
import { Filters } from './Filters';
import './style.css';

interface PersonnelListProps {
  selectedDivision?: string;
  selectedCategory?: 'all' | 'mol' | 'sha';
  selectedAccessClass?: 'all' | '1' | '2';
  searchTerm?: string;
  division: Division;
}

export function PersonnelList({
  selectedDivision = 'all',
  selectedCategory = 'all',
  // selectedAccessClass = 'all',
  searchTerm = '',
  division
}: PersonnelListProps) {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [allPersonnel, getAllPersonnel] = useState<Employee[]>([]);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [personToDelete, setPersonToDelete] = useState<string | null>(null);
  const [activeFilter, setActiveFilter] = useState<'all' | 'management' | 'officers' | 'warrantOfficers' | 'civilian' | 'mol' | 'sha'>('all');
  const [showShaFilters, setShowShaFilters] = useState(false);
  const [showOfficerFilters, setShowOfficerFilters] = useState(false); // Состояние для отображения кнопок офицеров
  const [selectedOfficerFilter, setSelectedOfficerFilter] = useState<'all' | 'with_management' | 'without_management'>('all'); // Состояние для фильтрации офицеров
  const [selectedAccessClass, setSelectedAccessClass] = useState<'all' | '1' | '2'>('all');

  const token = localStorage.getItem('accessToken');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    if (!division) {
      return;
    }

    const params = {
      division: division.id,
    };

    const fetchPersonnel = async () => {
      try {
        const data = await employeesApi.getPersonnel(token, params);
        const filteredData = data.filter(person => {
          // Проверяем, что division существует и имеет id
          return person.division?.id?.toString() === division.id.toString();
        });

        const sortedData = [...filteredData].sort((a, b) => a.priority - b.priority);
        getAllPersonnel(sortedData);
        dispatch(setEmployee(sortedData));
      } catch (err) {
        setError('Не удалось загрузить подразделения');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchPersonnel();
  }, [division, token]);


  const filteredPersonnel = allPersonnel.filter(person => {
    let matchesCategory = true;
    if (activeFilter === 'management') {
      matchesCategory = person.category === 'management';
    } else if (activeFilter === 'officers') {
      if (selectedOfficerFilter === 'with_management') {
        matchesCategory = person.category === 'officer' || person.category === 'management';
      } else if (selectedOfficerFilter === 'without_management') {
        matchesCategory = person.category === 'officer';
      } else {
        matchesCategory = person.category === 'officer' || person.category === 'management';
      }
    } else if (activeFilter === 'warrantOfficers') {
      matchesCategory = person.category === 'warrant_officer';
    } else if (activeFilter === 'civilian') {
      matchesCategory = person.category === 'civilian';
    } else if (activeFilter === 'mol') {
      matchesCategory = person.is_material_responsible;
    } else if (activeFilter === 'sha') {
      matchesCategory = person.is_sha_worker;
      if (matchesCategory && selectedAccessClass !== 'all') {
        matchesCategory = person.sha_details?.access_level === selectedAccessClass;
      }
    }

    const searchLower = searchTerm.toLowerCase();
    const matchesSearch = !searchTerm ||
      person.full_name?.toLowerCase().includes(searchLower) ||
      person.position?.toLowerCase().includes(searchLower) ||
      person.work_phone?.toLowerCase().includes(searchLower) ||
      person.personal_phone?.toLowerCase().includes(searchLower) ||
      person.rank?.toLowerCase().includes(searchLower) ||
      person.subdivision?.name.toLowerCase().includes(searchLower);

    return matchesCategory && matchesSearch;
  });

  const handleDelete = (id: string) => {
    setPersonToDelete(id);
    setShowDeleteModal(true);
  };

  const handleConfirmDelete = () => {
    if (personToDelete && token) {
      dispatch(deletePersonAsync({ token, id: personToDelete }))
        .unwrap()
        .then(() => {
          getAllPersonnel(prevPersonnel => prevPersonnel.filter(person => person.id !== personToDelete));
          setShowDeleteModal(false);
          setPersonToDelete(null);
        })
        .catch((err) => {
          setError('Не удалось удалить сотрудника');
          console.error(err);
        });
    }
  };

  const handlePersonClick = (person: Employee) => {
    navigate(`/personnel/${person.id}`);
  };

  const handleFilterClick = (filter: 'all' | 'management' | 'officers' | 'warrantOfficers' | 'civilian' | 'mol' | 'sha') => {
    setActiveFilter(filter);
    if (filter === 'sha') {
      setShowShaFilters(true);
      setShowOfficerFilters(false); // Скрываем кнопки офицеров при выборе Шаработников
    } else if (filter === 'officers') {
      setShowOfficerFilters(true); // Показываем кнопки офицеров
      setShowShaFilters(false); // Скрываем кнопки Шаработников
    } else {
      setShowShaFilters(false);
      setShowOfficerFilters(false);
    }
  };

  const handleShaFilterClick = (accessClass: 'all' | '1' | '2') => {
    setSelectedAccessClass(accessClass);
    setActiveFilter('sha');
  };

  const handleOfficerFilterClick = (filter: 'all' | 'with_management' | 'without_management') => {
    setSelectedOfficerFilter(filter);
    setActiveFilter('officers');
  };

  const getStaffCount = (staffType: 'all' | 'management' | 'officers' | 'warrantOfficers' | 'civilian' | 'mol' | 'sha') => {
    if (!division) return { staffCount: 0, actualCount: 0 };

    const counts = {
      all: {
        staffCount: division.staff_planned_total || 0,
        actualCount: allPersonnel.length
      },
      management: {
        staffCount: division.staff_planned_management || 0,
        actualCount: allPersonnel.filter(person => person.category === 'management').length
      },
      officers: {
        staffCount: division.staff_planned_officers || 0,
        actualCount: allPersonnel.filter(person => person.category === 'officer' || person.category === 'management').length
      },
      warrantOfficers: {
        staffCount: division.staff_planned_warrant_officers || 0,
        actualCount: allPersonnel.filter(person => person.category === 'warrant_officer').length
      },
      civilian: {
        staffCount: division.staff_planned_civilian || 0,
        actualCount: allPersonnel.filter(person => person.category === 'civilian').length
      },
      mol: {
        staffCount: 0, // Typically MOL is a subset, not a separate staff count
        actualCount: allPersonnel.filter(person => person.is_material_responsible).length
      },
      sha: {
        staffCount: 0, // Typically SHA is a subset, not a separate staff count
        actualCount: allPersonnel.filter(person => person.is_sha_worker).length
      },
      shaOneClass: {
        staffCount: 0, // Typically SHA is a subset, not a separate staff count
        actualCount: allPersonnel.filter(person => person.sha_details?.access_level === '1').length
      },
      shaTwoClass: {
        staffCount: 0, // Typically SHA is a subset, not a separate staff count
        actualCount: allPersonnel.filter(person => person.sha_details?.access_level === '2').length
      }
    };

    return counts[staffType];
  };

  return (
    <>
      <div className="personnel-list-header">
        <Filters
          activeFilter={activeFilter}
          showShaFilters={showShaFilters}
          showOfficerFilters={showOfficerFilters}
          selectedAccessClass={selectedAccessClass}
          selectedOfficerFilter={selectedOfficerFilter}
          onFilterClick={handleFilterClick}
          onShaFilterClick={handleShaFilterClick}
          onOfficerFilterClick={handleOfficerFilterClick}
          getStaffCount={getStaffCount}
        />

      </div>

      <div className="personnel-list-content">
        <div className="personnel-list-export-button">
          <ExportButton
            onClick={() => exportPersonnelToExcel(filteredPersonnel)}
            label="Экспорт сотрудников"
          />
        </div>
        <TableView
          divisionName={selectedDivision}
          personnel={filteredPersonnel}
          onPersonClick={handlePersonClick}
          onDelete={handleDelete}
        />

        {filteredPersonnel.length === 0 && (
          <div className="personnel-list-empty-message">
            {searchTerm
              ? 'Нет сотрудников, соответствующих поиску'
              : selectedCategory !== 'all'
                ? `Нет ${selectedCategory === 'mol' ? 'материально ответственных лиц' : 'ШаРаботников'}`
                : 'Нет сотрудников'}
          </div>
        )}
      </div>

      {showDeleteModal && (
        <DeleteConfirmationModal
          title="Удаление сотрудника"
          message="Вы уверены, что хотите удалить этого сотрудника? Это действие нельзя отменить."
          onConfirm={handleConfirmDelete}
          onCancel={() => {
            setShowDeleteModal(false);
            setPersonToDelete(null);
          }}
        />
      )}
    </>
  );
}