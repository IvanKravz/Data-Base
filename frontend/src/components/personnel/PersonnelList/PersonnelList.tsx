// PersonnelList.tsx
import React, { useState, useEffect, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Division, Employee } from '../../../types';
import { TableView } from './views/TableView';
import { DeleteConfirmationModal } from '../../modals/DeleteConfirmationModal';
import { ExportButton } from '../../common/ExportButton';
import { exportPersonnelToExcel } from '../../../utils/exportToExcel';
import { deletePersonAsync } from '../../../store/slices/personnelSlice';
import { employeesApi, divisionsApi } from '../../../api';
import { setEmployee } from '../../../store/slices/personnelSlice';
import { Filters } from './Filters';
import './style.css';

interface PersonnelListProps {
  selectedDivision?: string;
  selectedCategory?: 'all' | 'mol' | 'sha';
  selectedAccessClass?: 'all' | '1' | '2';
  searchTerm?: string;
  division?: Division;
  personnel?: Employee[];
  loading?: boolean;
  divisionId?: string;
  subdivisionId?: string;
  advancedFilters?: {
    ranks: string[];
    positions: string[];
    divisions: string[];
    networkClasses: string[];
    gtForms: string[];
  };
}

interface StaffCounts {
  all: number;
  management: number;
  officers: number;
  warrant_officers: number;
  civilian: number;
}

export function PersonnelList({
  selectedDivision = 'all',
  selectedCategory = 'all',
  searchTerm = '',
  division,
  personnel: externalPersonnel,
  loading = false,
  divisionId,
  subdivisionId,
  advancedFilters = {
    ranks: [],
    positions: [],
    divisions: [],
    networkClasses: [],
    gtForms: []
  }
}: PersonnelListProps) {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [allPersonnel, setAllPersonnel] = useState<Employee[]>([]);
  const [allDivisions, setAllDivisions] = useState<Division[]>([]);
  const [globalStaffCounts, setGlobalStaffCounts] = useState<StaffCounts>({
    all: 0,
    management: 0,
    officers: 0,
    warrant_officers: 0,
    civilian: 0
  });
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [personToDelete, setPersonToDelete] = useState<string | null>(null);
  const [activeFilter, setActiveFilter] = useState<'all' | 'management' | 'officers' | 'warrantOfficers' | 'civilian' | 'mol' | 'sha'>('all');
  const [showShaFilters, setShowShaFilters] = useState(false);
  const [showOfficerFilters, setShowOfficerFilters] = useState(false);
  const [selectedOfficerFilter, setSelectedOfficerFilter] = useState<'all' | 'with_management' | 'without_management'>('all');
  const [selectedAccessClass, setSelectedAccessClass] = useState<'all' | '1' | '2'>('all');
  const [searchParams] = useSearchParams();

  const token = localStorage.getItem('accessToken');
  const [error, setError] = useState<string | null>(null);
  const [internalLoading, setInternalLoading] = useState(true);
  const isGlobalView = !division;

  // Функция для сортировки сотрудников по приоритету
  const sortEmployeesByPriority = (employees: Employee[]): Employee[] => {
    return [...employees].sort((a, b) => {
      if (a.priority !== b.priority) {
        return a.priority - b.priority;
      }
      return a.full_name.localeCompare(b.full_name);
    });
  };

  // Используем externalPersonnel если передан, иначе allPersonnel
  const basePersonnel = useMemo(() => {
    if (externalPersonnel) {
      return sortEmployeesByPriority(externalPersonnel);
    }
    return sortEmployeesByPriority(allPersonnel);
  }, [externalPersonnel, allPersonnel]);

  // Функция для расчета глобальной штатной численности
  const calculateGlobalStaffCounts = (divisions: Division[]): StaffCounts => {
    return divisions.reduce((acc, division) => ({
      all: acc.all + (division.staff_planned_total || 0),
      management: acc.management + (division.staff_planned_management || 0),
      officers: acc.officers + (division.staff_planned_officers || 0),
      warrant_officers: acc.warrant_officers + (division.staff_planned_warrant_officers || 0),
      civilian: acc.civilian + (division.staff_planned_civilian || 0)
    }), {
      all: 0,
      management: 0,
      officers: 0,
      warrant_officers: 0,
      civilian: 0
    });
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        setInternalLoading(true);

        if (!division && !externalPersonnel) {
          const [personnelData, divisionsData] = await Promise.all([
            employeesApi.getPersonnel(token, {}),
            divisionsApi.getDivisions(token)
          ]);

          const sortedData = sortEmployeesByPriority(personnelData);
          setAllPersonnel(sortedData);
          setAllDivisions(divisionsData);
          dispatch(setEmployee(sortedData));

          const counts = calculateGlobalStaffCounts(divisionsData);
          setGlobalStaffCounts(counts);
        }
        else if (!division && externalPersonnel) {
          const divisionsData = await divisionsApi.getDivisions(token);
          setAllDivisions(divisionsData);

          const counts = calculateGlobalStaffCounts(divisionsData);
          setGlobalStaffCounts(counts);
        }
        else {
          setInternalLoading(false);
        }

      } catch (err) {
        setError('Не удалось загрузить данные');
        console.error(err);
      } finally {
        setInternalLoading(false);
      }
    };

    fetchData();
  }, [division, token, externalPersonnel, dispatch]);

  // УБИРАЕМ ВСЮ ДУБЛИРУЮЩУЮ ФИЛЬТРАЦИЮ - оставляем только фильтрацию по категориям
  const filteredPersonnel = useMemo(() => {
    const filtered = basePersonnel.filter(person => {
      // ТОЛЬКО фильтры по категориям (вкладкам)
      let matchesCategory = true;
      
      switch (activeFilter) {
        case 'management':
          matchesCategory = person.category === 'management';
          break;
        case 'officers':
          if (selectedOfficerFilter === 'with_management') {
            matchesCategory = person.category === 'officer' || person.category === 'management';
          } else if (selectedOfficerFilter === 'without_management') {
            matchesCategory = person.category === 'officer';
          } else {
            matchesCategory = person.category === 'officer' || person.category === 'management';
          }
          break;
        case 'warrantOfficers':
          matchesCategory = person.category === 'warrant_officer';
          break;
        case 'civilian':
          matchesCategory = person.category === 'civilian';
          break;
        case 'mol':
          matchesCategory = person.is_material_responsible;
          break;
        case 'sha':
          matchesCategory = person.is_sha_worker;
          if (matchesCategory && selectedAccessClass !== 'all') {
            matchesCategory = person.sha_details?.access_level === selectedAccessClass;
          }
          break;
        case 'all':
        default:
          matchesCategory = true;
          break;
      }

      return matchesCategory;
    });

    // Сортируем отфильтрованный список
    return sortEmployeesByPriority(filtered);
  }, [
    basePersonnel,
    activeFilter,
    selectedOfficerFilter,
    selectedAccessClass
    // УБРАНЫ: searchTerm, advancedFilters
  ]);

  // Функция для получения данных о штатной численности
  const getStaffCount = (staffType: 'all' | 'management' | 'officers' | 'warrantOfficers' | 'civilian' | 'mol' | 'sha') => {
    // В глобальном режиме показываем общую штатную численность и фактическое количество
    if (isGlobalView) {
      const counts = {
        all: {
          staffCount: globalStaffCounts.all,
          actualCount: basePersonnel.length
        },
        management: {
          staffCount: globalStaffCounts.management,
          actualCount: basePersonnel.filter(person => person.category === 'management').length
        },
        officers: {
          staffCount: globalStaffCounts.officers,
          actualCount: basePersonnel.filter(person => {
            if (selectedOfficerFilter === 'with_management') {
              return person.category === 'officer' || person.category === 'management';
            } else if (selectedOfficerFilter === 'without_management') {
              return person.category === 'officer';
            } else {
              return person.category === 'officer' || person.category === 'management';
            }
          }).length
        },
        warrantOfficers: {
          staffCount: globalStaffCounts.warrant_officers,
          actualCount: basePersonnel.filter(person => person.category === 'warrant_officer').length
        },
        civilian: {
          staffCount: globalStaffCounts.civilian,
          actualCount: basePersonnel.filter(person => person.category === 'civilian').length
        },
        mol: {
          staffCount: 0,
          actualCount: basePersonnel.filter(person => person.is_material_responsible).length
        },
        sha: {
          staffCount: 0,
          actualCount: basePersonnel.filter(person => person.is_sha_worker).length
        }
      };
      return counts[staffType];
    }

    // Режим подразделения
    if (!division) return { staffCount: 0, actualCount: 0 };

    const filteredPersonnel = subdivisionId
      ? basePersonnel.filter(person => person.subdivision?.id == subdivisionId)
      : basePersonnel;

    const selectedSubdivision = subdivisionId && division.subdivisions
      ? division.subdivisions.find(sub => sub.id == subdivisionId)
      : null;

    const counts = {
      all: {
        staffCount: selectedSubdivision?.staff_planned_total || division.staff_planned_total || 0,
        actualCount: filteredPersonnel.length
      },
      management: {
        staffCount: selectedSubdivision?.staff_planned_management || division.staff_planned_management || 0,
        actualCount: filteredPersonnel.filter(person => person.category === 'management').length
      },
      officers: {
        staffCount: selectedSubdivision?.staff_planned_officers || division.staff_planned_officers || 0,
        actualCount: filteredPersonnel.filter(person => {
          if (selectedOfficerFilter === 'with_management') {
            return person.category === 'officer' || person.category === 'management';
          } else if (selectedOfficerFilter === 'without_management') {
            return person.category === 'officer';
          } else {
            return person.category === 'officer' || person.category === 'management';
          }
        }).length
      },
      warrantOfficers: {
        staffCount: selectedSubdivision?.staff_planned_warrant_officers || division.staff_planned_warrant_officers || 0,
        actualCount: filteredPersonnel.filter(person => person.category === 'warrant_officer').length
      },
      civilian: {
        staffCount: selectedSubdivision?.staff_planned_civilian || division.staff_planned_civilian || 0,
        actualCount: filteredPersonnel.filter(person => person.category === 'civilian').length
      },
      mol: {
        staffCount: 0,
        actualCount: filteredPersonnel.filter(person => person.is_material_responsible).length
      },
      sha: {
        staffCount: 0,
        actualCount: filteredPersonnel.filter(person => person.is_sha_worker).length
      }
    };

    return counts[staffType];
  };

  const handleDelete = (id: string) => {
    setPersonToDelete(id);
    setShowDeleteModal(true);
  };

  const handleConfirmDelete = () => {
    if (personToDelete && token) {
      dispatch(deletePersonAsync({ token, id: personToDelete }))
        .unwrap()
        .then(() => {
          setAllPersonnel(prevPersonnel =>
            sortEmployeesByPriority(prevPersonnel.filter(person => person.id !== personToDelete))
          );
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
    navigate(`/personnel/${person.id}`, {
      state: {
        from: location.pathname + location.search,
        divisionId: divisionId,
        subdivisionId: subdivisionId,
        activeFilter: activeFilter,
        searchTerm: searchTerm
      }
    });
  };

  const handleFilterClick = (filter: 'all' | 'management' | 'officers' | 'warrantOfficers' | 'civilian' | 'mol' | 'sha') => {
    setActiveFilter(filter);
    if (filter === 'sha') {
      setShowShaFilters(true);
      setShowOfficerFilters(false);
    } else if (filter === 'officers') {
      setShowOfficerFilters(true);
      setShowShaFilters(false);
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

  const staffData = getStaffCount(activeFilter);

  if (internalLoading) {
    return <div className="flex justify-center py-12">Загрузка сотрудников...</div>;
  }

  if (error) {
    return <div className="error-message">{error}</div>;
  }

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

        {/* Показываем штатную информацию всегда */}
        <div className="selected-subdivision-title">
          <div className="title-row">
            <div className="staff-info">
              {activeFilter !== 'mol' && activeFilter !== 'sha' && (
                <span>По штату: {staffData.staffCount}</span>
              )}
              <span>По списку: {staffData.actualCount}</span>
            </div>
          </div>
        </div>

        <TableView
          divisionName={selectedDivision}
          personnel={filteredPersonnel}
          onPersonClick={handlePersonClick}
          onDelete={handleDelete}
        />

        {filteredPersonnel.length === 0 && (
          <div className="personnel-list-empty-message">
            {activeFilter !== 'all'
              ? `Нет сотрудников в категории "${activeFilter}"`
              : 'Нет сотрудников для отображения'}
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