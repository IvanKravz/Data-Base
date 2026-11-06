// components/networks/NetworkVisualization/NetworkHierarchy.tsx
import React, { useMemo, useState } from 'react';
import {
  ChevronRight, ChevronDown, Building2, Server, HardDrive, Search,
} from 'lucide-react';
import './NetworkHierarchy.css';

interface NetworkHierarchyProps {
  memberships: any[];
  selectedNode?: string | null;
  onNodeSelect?: (nodeId: string) => void;
  onClearSelection?: () => void;
}

interface EquipmentLeaf { id: number; name: string; type: string; }
interface FacilityNode { id: number; name: string; type: string; equipment: EquipmentLeaf[]; }
interface DivisionNode { id: number; name: string; type: string; facilities: FacilityNode[]; }

const UNASSIGNED_ID = 0;

const pickLabel = (...vals: any[]): string => {
  for (const v of vals) {
    if (typeof v === 'string' && v.trim()) return v;
    if (v && typeof v === 'object' && typeof v.name === 'string' && v.name.trim()) return v.name;
  }
  return '';
};

const NetworkHierarchy: React.FC<NetworkHierarchyProps> = ({
  memberships,
  selectedNode,
  onNodeSelect,
  onClearSelection,
}) => {
  const hierarchy = useMemo<DivisionNode[]>(() => {
    const divs = new Map<number, DivisionNode>();
    const facs = new Map<number, FacilityNode>();

    memberships.forEach(m => {
      if (!m.facility) return;

      const divId = m.division?.id ?? UNASSIGNED_ID;
      if (!divs.has(divId)) {
        divs.set(divId, {
          id: divId,
          name: m.division?.name || 'Без подразделения',
          type: m.division
            ? pickLabel(
                m.division.division_type_display,
                m.division.type_display,
                m.division.division_type,
                m.division.type,
              )
            : '',
          facilities: [],
        });
      }

      if (!facs.has(m.facility.id)) {
        const fac: FacilityNode = {
          id: m.facility.id,
          name: m.facility.name || 'Объект',
          type: pickLabel(
            m.facility.facility_type_display,
            m.facility.type_display,
            m.facility.category,
            m.facility.facility_type,
            m.facility.type,
          ),
          equipment: [],
        };
        facs.set(m.facility.id, fac);
        divs.get(divId)!.facilities.push(fac);
      }

      if (m.equipment) {
        const fac = facs.get(m.facility.id);
        if (fac && !fac.equipment.some(e => e.id === m.equipment.id)) {
          fac.equipment.push({
            id: m.equipment.id,
            name: m.equipment.name || 'Оборудование',
            type: pickLabel(
              m.equipment.device_type_display,
              m.equipment.category,
              m.equipment.device_type,
            ),
          });
        }
      }
    });

    return Array.from(divs.values()).sort((a, b) => {
      if (a.id === UNASSIGNED_ID) return 1;
      if (b.id === UNASSIGNED_ID) return -1;
      return a.name.localeCompare(b.name);
    });
  }, [memberships]);

  const [expandedDivs, setExpandedDivs] = useState<Set<number>>(
    () => new Set(hierarchy.map(d => d.id)),
  );
  const [expandedFacs, setExpandedFacs] = useState<Set<number>>(new Set());
  const [search, setSearch] = useState('');

  const totalDivs = hierarchy.length;
  const totalFacs = hierarchy.reduce((s, d) => s + d.facilities.length, 0);
  const totalEq = hierarchy.reduce(
    (s, d) => s + d.facilities.reduce((ss, f) => ss + f.equipment.length, 0),
    0,
  );

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return hierarchy;

    return hierarchy
      .map(div => {
        const divMatch = div.name.toLowerCase().includes(q);
        const filteredFacs = div.facilities
          .map(fac => {
            const facMatch = fac.name.toLowerCase().includes(q);
            const filteredEq = fac.equipment.filter(eq =>
              eq.name.toLowerCase().includes(q),
            );
            const includeFac = divMatch || facMatch || filteredEq.length > 0;
            if (!includeFac) return null;
            return {
              ...fac,
              equipment: facMatch || divMatch ? fac.equipment : filteredEq,
            };
          })
          .filter(Boolean) as FacilityNode[];

        if (divMatch || filteredFacs.length > 0) {
          return { ...div, facilities: filteredFacs };
        }
        return null;
      })
      .filter(Boolean) as DivisionNode[];
  }, [hierarchy, search]);

  const toggleDiv = (id: number) =>
    setExpandedDivs(prev => {
      const n = new Set(prev);
      n.has(id) ? n.delete(id) : n.add(id);
      return n;
    });

  const toggleFac = (id: number) =>
    setExpandedFacs(prev => {
      const n = new Set(prev);
      n.has(id) ? n.delete(id) : n.add(id);
      return n;
    });

  const handleSelect = (nodeId: string) => {
    if (selectedNode === nodeId) onClearSelection?.();
    else onNodeSelect?.(nodeId);
  };

  if (!hierarchy.length) {
    return (
      <section className="network-hierarchy network-hierarchy--empty">
        Нет данных о структуре сети
      </section>
    );
  }

  const isSearching = search.trim().length > 0;

  return (
    <section className="network-hierarchy">
      <header className="network-hierarchy__header">
        <div className="network-hierarchy__title">
          <span className="network-hierarchy__title-label">Структура сети</span>
          <span className="network-hierarchy__title-name">Иерархия объектов</span>
        </div>

        <div className="network-hierarchy__stats">
          <span className="network-hierarchy__stat nh-stat--division">
            <i className="viz-dot viz-dot--division" />
            <b>{totalDivs}</b><em>подразд.</em>
          </span>
          <span className="network-hierarchy__stat nh-stat--facility">
            <i className="viz-dot viz-dot--facility" />
            <b>{totalFacs}</b><em>объект.</em>
          </span>
          <span className="network-hierarchy__stat nh-stat--equipment">
            <i className="viz-dot viz-dot--equipment" />
            <b>{totalEq}</b><em>ед. об.</em>
          </span>
        </div>

        <label className="network-hierarchy__search">
          <Search size={14} />
          <input
            type="text"
            placeholder="Поиск по структуре…"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </label>
      </header>

      <div className="network-hierarchy__body">
        {filtered.length === 0 && isSearching && (
          <div className="network-hierarchy__empty">Ничего не найдено</div>
        )}

        {filtered.map(div => {
          const divNodeId = `division-${div.id}`;
          const isDivSelected = selectedNode === divNodeId;
          const isDivOpen = isSearching || expandedDivs.has(div.id);

          return (
            <div key={div.id} className="nh-group">
              <div
                className={`nh-row nh-row--division ${isDivSelected ? 'is-selected' : ''}`}
                onClick={() => handleSelect(divNodeId)}
              >
                <button
                  type="button"
                  className="nh-toggle"
                  onClick={e => { e.stopPropagation(); toggleDiv(div.id); }}
                  aria-label={isDivOpen ? 'Свернуть' : 'Развернуть'}
                >
                  {isDivOpen ? <ChevronDown size={15} /> : <ChevronRight size={15} />}
                </button>
                <Building2 size={16} className="nh-icon nh-icon--division" />
                <div className="nh-content">
                  <div className="nh-name">{div.name}</div>
                  {div.type && <div className="nh-type">{div.type}</div>}
                </div>
                <span className="nh-count" title="Объектов">{div.facilities.length}</span>
              </div>

              {isDivOpen && (
                <div className="nh-children">
                  {div.facilities.length === 0 && (
                    <div className="nh-leaf-empty">Нет объектов</div>
                  )}
                  {div.facilities.map(fac => {
                    const facNodeId = `facility-${fac.id}`;
                    const isFacSelected = selectedNode === facNodeId;
                    const isFacOpen = isSearching || expandedFacs.has(fac.id);

                    return (
                      <div key={fac.id} className="nh-group">
                        <div
                          className={`nh-row nh-row--facility ${isFacSelected ? 'is-selected' : ''}`}
                          onClick={() => handleSelect(facNodeId)}
                        >
                          <button
                            type="button"
                            className="nh-toggle"
                            onClick={e => { e.stopPropagation(); toggleFac(fac.id); }}
                            aria-label={isFacOpen ? 'Свернуть' : 'Развернуть'}
                          >
                            {isFacOpen ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                          </button>
                          <Server size={14} className="nh-icon nh-icon--facility" />
                          <div className="nh-content">
                            <div className="nh-name">{fac.name}</div>
                            {fac.type && <div className="nh-type">{fac.type}</div>}
                          </div>
                          <span className="nh-count" title="Единиц оборудования">
                            {fac.equipment.length}
                          </span>
                        </div>

                        {isFacOpen && (
                          <div className="nh-children nh-children--equipment">
                            {fac.equipment.length === 0 && (
                              <div className="nh-leaf-empty">Нет оборудования</div>
                            )}
                            {fac.equipment.map(eq => {
                              const eqNodeId = `equipment-${eq.id}`;
                              const isEqSelected = selectedNode === eqNodeId;
                              return (
                                <div
                                  key={eq.id}
                                  className={`nh-row nh-row--equipment ${isEqSelected ? 'is-selected' : ''}`}
                                  onClick={() => handleSelect(eqNodeId)}
                                >
                                  <span className="nh-bullet nh-bullet--equipment" />
                                  <HardDrive size={12} className="nh-icon nh-icon--equipment" />
                                  <div className="nh-content">
                                    <div className="nh-name">{eq.name}</div>
                                    {eq.type && <div className="nh-type">{eq.type}</div>}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
};

export default NetworkHierarchy;