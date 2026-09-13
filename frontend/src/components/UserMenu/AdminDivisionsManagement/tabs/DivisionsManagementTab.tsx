import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  Plus,
  Pencil,
  Trash2,
  Building2,
  Users,
  FolderTree,
  UserCog,
  UserMinus,
  Search,
} from 'lucide-react';
import { Division, Subdivision, Employee } from '../../../../types';
import './DivisionsManagementTab.css';
import { divisionsApi } from '../../../../api';
import { employeesApi } from '../../../../api/employees';
import { Button } from '../../../common/Button/Button';
import { Modal } from '../../../common/Modal/Modal';
import { Select } from '../../../common/Select/Select';
import { DivisionForm } from '../components/DivisionForm';
import { SubdivisionForm } from '../components/SubdivisionForm';

export const DivisionsManagementTab: React.FC = () => {
  const [allDivisions, setAllDivisions] = useState<Division[]>([]);
  const [allSubdivisions, setAllSubdivisions] = useState<Subdivision[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingDivision, setEditingDivision] = useState<Division | null>(null);
  const [editingSubdivision, setEditingSubdivision] = useState<Subdivision | null>(
    null
  );
  const [modalType, setModalType] = useState<'division' | 'subdivision'>(
    'division'
  );
  const [newSubdivisionDivisionId, setNewSubdivisionDivisionId] = useState<
    number | undefined
  >(undefined);
  const [activeDivisionId, setActiveDivisionId] = useState<number | null>(null);
  const token = localStorage.getItem('accessToken') || '';

  const tabsRef = useRef<HTMLDivElement>(null);
  const [indicatorStyle, setIndicatorStyle] = useState<{
    left: number;
    width: number;
  }>({ left: 0, width: 0 });

  const loadData = async () => {
    setLoading(true);
    try {
      const [divs, subs, emps] = await Promise.all([
        divisionsApi.getDivisions(token),
        divisionsApi.getAllSubdivisions(token),
        employeesApi.getPersonnel(token, {}),
      ]);
      setAllDivisions(divs);
      setAllSubdivisions(subs);
      setEmployees(emps);
    } catch (error) {
      console.error('Ошибка загрузки данных', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Фильтрация подразделений по поисковому запросу
  const filteredDivisions = useMemo(() => {
    if (!searchQuery.trim()) return allDivisions;
    const query = searchQuery.trim().toLowerCase();
    return allDivisions.filter((div) =>
      div.name.toLowerCase().includes(query)
    );
  }, [allDivisions, searchQuery]);

  // Установка активного подразделения при загрузке или изменении фильтра
  useEffect(() => {
    if (filteredDivisions.length === 0) {
      setActiveDivisionId(null);
      return;
    }
    if (
      activeDivisionId === null ||
      !filteredDivisions.some((d) => d.id === activeDivisionId)
    ) {
      setActiveDivisionId(filteredDivisions[0].id);
    }
  }, [filteredDivisions, activeDivisionId]);

  // Обновление индикатора вкладок
  useEffect(() => {
    if (!tabsRef.current || activeDivisionId === null) return;
    const activeButton = tabsRef.current.querySelector(
      '.dm-division-tab-active'
    ) as HTMLElement;
    if (activeButton) {
      const { offsetLeft, offsetWidth } = activeButton;
      setIndicatorStyle({ left: offsetLeft, width: offsetWidth });
    }
  }, [activeDivisionId, filteredDivisions]);

  const currentDivision = useMemo(() => {
    return allDivisions.find((d) => d.id === activeDivisionId) || null;
  }, [allDivisions, activeDivisionId]);

  const subdivisionsByDivision = useMemo(() => {
    const map: Record<number, Subdivision[]> = {};
    allSubdivisions.forEach((sub) => {
      if (!map[sub.division]) map[sub.division] = [];
      map[sub.division].push(sub);
    });
    return map;
  }, [allSubdivisions]);

  const getEmployeesByDivision = (divisionId: number) => {
    return employees.filter((e) => e.division?.id === divisionId);
  };

  const getEmployeesBySubdivision = (subdivisionId: number) => {
    return employees.filter((e) => e.subdivision?.id === subdivisionId);
  };

  const parseSelectValue = (val: string | number | null): number | null => {
    if (val === null || val === '' || val === undefined) return null;
    const num = typeof val === 'string' ? parseInt(val, 10) : val;
    return isNaN(num) ? null : num;
  };

  const handleDivisionChange = async (
    id: number,
    field: 'head' | 'deputy_head',
    value: string | number | null
  ) => {
    const parsed = parseSelectValue(value);
    try {
      await divisionsApi.updateDivision(id, { [field]: parsed }, token);
      await loadData();
    } catch (error) {
      console.error('Ошибка обновления', error);
    }
  };

  const handleSubdivisionChange = async (
    id: number,
    field: 'head' | 'deputy_head',
    value: string | number | null
  ) => {
    const parsed = parseSelectValue(value);
    try {
      await divisionsApi.updateSubdivision(id, { [field]: parsed }, token);
      await loadData();
    } catch (error) {
      console.error('Ошибка обновления', error);
    }
  };

  const handleAddDivision = () => {
    setEditingDivision(null);
    setModalType('division');
    setModalOpen(true);
  };

  const handleEditDivision = (division: Division) => {
    setEditingDivision(division);
    setModalType('division');
    setModalOpen(true);
  };

  const handleDeleteDivision = async (id: number) => {
    if (
      window.confirm(
        'Удалить подразделение? Все отделения и связанные данные будут удалены.'
      )
    ) {
      await divisionsApi.deleteDivision(id, token);
      await loadData();
      if (activeDivisionId === id) {
        const remaining = allDivisions.filter((d) => d.id !== id);
        setActiveDivisionId(remaining.length > 0 ? remaining[0].id : null);
      }
    }
  };

  const openAddSubdivision = (divisionId: number) => {
    setNewSubdivisionDivisionId(divisionId);
    setEditingSubdivision(null);
    setModalType('subdivision');
    setModalOpen(true);
  };

  const handleEditSubdivision = (sub: Subdivision) => {
    setNewSubdivisionDivisionId(undefined);
    setEditingSubdivision(sub);
    setModalType('subdivision');
    setModalOpen(true);
  };

  const handleDeleteSubdivision = async (id: number) => {
    if (window.confirm('Удалить отделение?')) {
      await divisionsApi.deleteSubdivision(id, token);
      await loadData();
    }
  };

  const handleModalClose = () => {
    setModalOpen(false);
    setEditingDivision(null);
    setEditingSubdivision(null);
    setNewSubdivisionDivisionId(undefined);
  };

  const handleModalSuccess = () => {
    handleModalClose();
    loadData();
  };

  if (loading) {
    return <div className="dm-loading">Загрузка подразделений...</div>;
  }

  if (allDivisions.length === 0) {
    return (
      <div className="dm-empty-state">
        <Building2 size={48} className="dm-empty-state-icon" />
        <p>Нет подразделений</p>
        <Button onClick={handleAddDivision} variant="primary">
          <Plus size={16} /> Добавить подразделение
        </Button>
      </div>
    );
  }

  return (
    <div className="dm-divisions-management-tab">
      <div className="dm-toolbar">
        <Button onClick={handleAddDivision} variant="primary">
          <Plus size={16} /> Добавить подразделение
        </Button>
        <div className="dm-search-wrapper">
          <Search size={16} className="dm-search-icon" />
          <input
            type="text"
            placeholder="Поиск подразделений..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="dm-search-input"
          />
        </div>
      </div>

      {/* Вкладки подразделений */}
      <div className="dm-division-tabs" ref={tabsRef}>
        {filteredDivisions.map((div) => {
          return (
            <button
              key={div.id}
              className={`dm-division-tab ${
                activeDivisionId === div.id ? 'dm-division-tab-active' : ''
              }`}
              onClick={() => setActiveDivisionId(div.id)}
            >
              <span>{div.name}</span>
            </button>
          );
        })}
        <div
          className="dm-division-tabs-indicator"
          style={{
            left: `${indicatorStyle.left}px`,
            width: `${indicatorStyle.width}px`,
          }}
        />
      </div>

      {/* Содержимое активного подразделения */}
      {currentDivision && (
        <div className="dm-division-content">
          <div className="dm-division-card">
            <div className="dm-division-header">
              <div className="dm-division-title">
                <Building2 size={20} className="dm-title-icon" />
                <h3>{currentDivision.name}</h3>
              </div>
              <div className="dm-header-actions">
                <button
                  className="icon-action-btn"
                  onClick={() => handleEditDivision(currentDivision)}
                  aria-label="Редактировать подразделение"
                >
                  <Pencil size={16} strokeWidth={2} />
                </button>
                <button
                  className="icon-action-btn danger"
                  onClick={() => handleDeleteDivision(currentDivision.id)}
                  aria-label="Удалить подразделение"
                >
                  <Trash2 size={16} strokeWidth={2} />
                </button>
              </div>
            </div>

            <div className="dm-division-body">
              <div className="dm-division-leadership">
                <div className="dm-leadership-field">
                  <label className="dm-leadership-label">
                    <UserCog size={14} /> Начальник отдела
                  </label>
                  <Select
                    options={getEmployeesByDivision(currentDivision.id)
                      .filter((e) => e.position === 'Начальник отдела')
                      .map((e) => ({ value: e.id, label: e.full_name }))}
                    value={currentDivision.head?.id ?? null}
                    onChange={(val) =>
                      handleDivisionChange(currentDivision.id, 'head', val)
                    }
                    placeholder="Не назначен"
                    allowClear
                  />
                </div>
                <div className="dm-leadership-field">
                  <label className="dm-leadership-label">
                    <UserMinus size={14} /> Заместитель начальника отдела
                  </label>
                  <Select
                    options={getEmployeesByDivision(currentDivision.id)
                      .filter(
                        (e) => e.position === 'Заместитель начальника отдела'
                      )
                      .map((e) => ({ value: e.id, label: e.full_name }))}
                    value={currentDivision.deputy_head?.id ?? null}
                    onChange={(val) =>
                      handleDivisionChange(
                        currentDivision.id,
                        'deputy_head',
                        val
                      )
                    }
                    placeholder="Не назначен"
                    allowClear
                  />
                </div>
              </div>

              <div className="dm-division-subdivisions">
                <div className="dm-subdivisions-header">
                  <h4>Отделения</h4>
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => openAddSubdivision(currentDivision.id)}
                  >
                    <Plus size={14} /> Добавить
                  </Button>
                </div>
                {subdivisionsByDivision[currentDivision.id]?.length === 0 ? (
                  <div className="dm-empty-subdivisions">
                    <p>В этом подразделении пока нет отделений</p>
                    <Button
                      size="sm"
                      variant="primary"
                      onClick={() => openAddSubdivision(currentDivision.id)}
                    >
                      <Plus size={14} /> Добавить первое отделение
                    </Button>
                  </div>
                ) : (
                  subdivisionsByDivision[currentDivision.id]?.map((sub) => {
                    const subEmployees = getEmployeesBySubdivision(sub.id);
                    const subHeadCandidates = subEmployees.filter(
                      (e) => e.position === 'Начальник отделения'
                    );
                    const subDeputyCandidates = subEmployees.filter(
                      (e) => e.position === 'Заместитель начальника отделения'
                    );
                    return (
                      <div key={sub.id} className="dm-subdivision-item">
                        <div className="dm-subdivision-item-header">
                          <span>{sub.name}</span>
                          <div className="dm-subdivision-actions">
                            <button
                              className="icon-action-btn"
                              onClick={() => handleEditSubdivision(sub)}
                              aria-label="Редактировать отделение"
                            >
                              <Pencil size={16} strokeWidth={2} />
                            </button>
                            <button
                              className="icon-action-btn danger"
                              onClick={() => handleDeleteSubdivision(sub.id)}
                              aria-label="Удалить отделение"
                            >
                              <Trash2 size={16} strokeWidth={2} />
                            </button>
                          </div>
                        </div>
                        <div className="dm-subdivision-leadership">
                          <div className="dm-leadership-field">
                            <label className="dm-leadership-label">
                              <UserCog size={12} /> Начальник отделения
                            </label>
                            <Select
                              options={subHeadCandidates.map((e) => ({
                                value: e.id,
                                label: e.full_name,
                              }))}
                              value={sub.head?.id ?? null}
                              onChange={(val) =>
                                handleSubdivisionChange(sub.id, 'head', val)
                              }
                              placeholder="Не назначен"
                              allowClear
                            />
                          </div>
                          <div className="dm-leadership-field">
                            <label className="dm-leadership-label">
                              <UserMinus size={12} /> Заместитель начальника
                              отделения
                            </label>
                            <Select
                              options={subDeputyCandidates.map((e) => ({
                                value: e.id,
                                label: e.full_name,
                              }))}
                              value={sub.deputy_head?.id ?? null}
                              onChange={(val) =>
                                handleSubdivisionChange(
                                  sub.id,
                                  'deputy_head',
                                  val
                                )
                              }
                              placeholder="Не назначен"
                              allowClear
                            />
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      <Modal
        isOpen={modalOpen}
        onClose={handleModalClose}
        title={
          modalType === 'division'
            ? editingDivision
              ? 'Редактирование подразделения'
              : 'Новое подразделение'
            : editingSubdivision
            ? 'Редактирование отделения'
            : 'Новое отделение'
        }
      >
        {modalType === 'division' ? (
          <DivisionForm
            initialData={editingDivision}
            onSuccess={handleModalSuccess}
            onCancel={handleModalClose}
          />
        ) : (
          <SubdivisionForm
            divisionId={newSubdivisionDivisionId}
            initialData={editingSubdivision}
            onSuccess={handleModalSuccess}
            onCancel={handleModalClose}
          />
        )}
      </Modal>
    </div>
  );
};