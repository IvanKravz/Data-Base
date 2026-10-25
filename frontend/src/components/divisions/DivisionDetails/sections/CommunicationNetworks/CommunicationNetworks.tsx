// CommunicationNetworks.tsx
import React, { useState, useEffect, useLayoutEffect, useCallback, useMemo, useRef } from 'react';
import { useParams, useNavigate, useSearchParams, useLocation } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { List, FolderTree } from 'lucide-react';
import { RootState } from '../../../../../store/store';
import './CommunicationNetworks.css';
import { Network } from '../../../../../types';
import NetworksTable from '../../../../networks/NetworksTable/NetworksTable';
import NetworkDetails from '../../../../networks/NetworkDetails/NetworkDetails';
import { networksApi } from '../../../../../api/networksApi';
import { Header } from '../../../../networks/Header/Header';
import { divisionsApi } from '../../../../../api/divisions';
import NetworkVisualizationWithTabs from '../../../../networks/NetworkVisualization/components/NetworkVisualizationWithTabs';

interface TabItem {
  id: string;
  name: string;
  count: number;
  order: number;
}

const CommunicationNetworks: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const location = useLocation();
  const token = localStorage.getItem('accessToken');
  const [selectedNetwork, setSelectedNetwork] = useState<Network | null>(null);
  const [memberships, setMemberships] = useState<any[]>([]);
  const [directions, setDirections] = useState<any[]>([]);
  const [highlightedNode, setHighlightedNode] = useState<string | null>(null);
  const [selectedNode, setSelectedNode] = useState<string | null>(null);
  const [networks, setNetworks] = useState<Network[]>([]);
  const [allDivisions, setAllDivisions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [division, setDivision] = useState<any>(null);

  const [activeDivisionTab, setActiveDivisionTab] = useState<string>('all');
  const [activeSubdivisionTab, setActiveSubdivisionTab] = useState<string>('all');

  // Переключатель вида
  const [viewMode, setViewMode] = useState<'flat' | 'grouped'>(() => {
    const saved = localStorage.getItem('networks_view_mode');
    return (saved === 'flat' || saved === 'grouped') ? saved : 'grouped';
  });

  const divisionTabsRef = useRef<HTMLDivElement | null>(null);
  const subdivisionTabsRef = useRef<HTMLDivElement | null>(null);
  const [divisionIndicatorStyle, setDivisionIndicatorStyle] = useState({ left: 0, width: 0, top: 0 });
  const [subdivisionIndicatorStyle, setSubdivisionIndicatorStyle] = useState({ left: 0, width: 0, top: 0 });

  const user = useSelector((state: RootState) => state.auth.user);
  const permissions = user?.permissions;

  const canEditNetworks = useMemo(() =>
    permissions?.models?.CommunicationNetwork?.includes('change') ?? false, [permissions]);
  const canCreateNetworks = useMemo(() =>
    permissions?.models?.CommunicationNetwork?.includes('add') ?? false, [permissions]);

  const isExploitationUser = useMemo(() =>
    user?.roles?.includes('exploitation_chief') || user?.roles?.includes('exploitation_employee'), [user]);
  const isChief = useMemo(() => user?.roles?.includes('exploitation_chief'), [user]);

  const isGlobalView = useMemo(() => !id && !isExploitationUser, [id, isExploitationUser]);

  const userDivisionId = useMemo(() => user?.division_info?.id ?? null, [user]);

  const handleViewModeChange = useCallback((mode: 'flat' | 'grouped') => {
    setViewMode(mode);
    localStorage.setItem('networks_view_mode', mode);
  }, []);

  const fetchData = useCallback(async () => {
    if (!token) return;

    try {
      setLoading(true);
      setError(null);

      const loadDivisions = async (): Promise<any[]> => {
        try {
          const data = await divisionsApi.getDivisions(token);
          if (import.meta.env.DEV) {
            // eslint-disable-next-line no-console
            console.log('[Networks] getDivisions raw:', data);
          }
          return Array.isArray(data) ? data : [];
        } catch (e) {
          // eslint-disable-next-line no-console
          console.error('[Networks] getDivisions failed:', e);
          return [];
        }
      };

      if (isGlobalView) {
        const [allNetworks, divisions] = await Promise.all([
          networksApi.getNetworks(token),
          loadDivisions(),
        ]);
        if (import.meta.env.DEV) {
          // eslint-disable-next-line no-console
          console.log('[Networks] getNetworks raw:', allNetworks);
        }
        setNetworks(allNetworks || []);
        setAllDivisions(divisions);
      } else if (isExploitationUser) {
        if (!userDivisionId) {
          setError('У вашей учетной записи не назначено подразделение');
          return;
        }
        const divisionData = await divisionsApi.getDivisionById(userDivisionId, token);
        setDivision(divisionData);
        setAllDivisions(divisionData ? [divisionData] : []);
        const divisionNetworks = await networksApi.getNetworks(token, userDivisionId);
        if (import.meta.env.DEV) {
          // eslint-disable-next-line no-console
          console.log('[Networks] getNetworks (exploitation) raw:', divisionNetworks);
        }
        setNetworks(divisionNetworks || []);
      } else {
        if (!id) return;
        const divisionData = await divisionsApi.getDivisionById(id, token);
        setDivision(divisionData);
        setAllDivisions(divisionData ? [divisionData] : []);
        const divisionNetworks = await networksApi.getNetworks(token, id);
        if (import.meta.env.DEV) {
          // eslint-disable-next-line no-console
          console.log('[Networks] getNetworks (division) raw:', divisionNetworks);
        }
        setNetworks(divisionNetworks || []);
      }
    } catch (err) {
      console.error('Error fetching data:', err);
      setError('Не удалось загрузить данные сетей связи');
    } finally {
      setLoading(false);
    }
  }, [token, isGlobalView, isExploitationUser, userDivisionId, id]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    const fetchNetworkData = async () => {
      if (!selectedNetwork || !token) return;

      try {
        const membershipsData = await networksApi.getNetworkMemberships(token, selectedNetwork.id.toString());
        setMemberships(membershipsData);

        const directionsData = await networksApi.getNetworkDirections(token, selectedNetwork.id.toString());
        setDirections(directionsData);
      } catch (err) {
        console.error('Ошибка загрузки данных сети:', err);
        setError('Не удалось загрузить данные сети');
      }
    };

    fetchNetworkData();
  }, [selectedNetwork, token]);

  // ===== Хелперы: сеть связана с подразделениями/отделениями через memberships =====
  const getNetworkDivisionIds = useCallback((n: any): string[] => {
    if (!Array.isArray(n?.memberships)) return [];
    const set = new Set<string>();
    n.memberships.forEach((m: any) => {
      const divId = m?.division?.id ?? m?.division_id ?? m?.facility?.division?.id ?? m?.equipment?.division?.id;
      if (divId != null) set.add(String(divId));
    });
    return Array.from(set);
  }, []);

  const getNetworkSubdivisionIds = useCallback((n: any): string[] => {
    if (!Array.isArray(n?.memberships)) return [];
    const set = new Set<string>();
    n.memberships.forEach((m: any) => {
      const subId =
        m?.facility?.subdivision?.id ??
        m?.facility?.subdivision_id ??
        m?.equipment?.subdivision?.id ??
        m?.equipment?.subdivision_id;
      if (subId != null) set.add(String(subId));
    });
    return Array.from(set);
  }, []);

  // ===== Вкладки подразделений =====
  // Показываем только подразделения, в которых есть хотя бы одна сеть.
  // «Все подразделения» добавляем только если реальных табов ≥ 2.
  const divisionTabs = useMemo<TabItem[]>(() => {
    if (viewMode !== 'grouped') return [];
    if (!isGlobalView) return [];
    if (id) return [];

    const countMap = new Map<string, number>();
    let noDivCount = 0;
    networks.forEach((n: any) => {
      const divIds = getNetworkDivisionIds(n);
      if (divIds.length === 0) {
        noDivCount++;
        return;
      }
      divIds.forEach(divId => {
        countMap.set(divId, (countMap.get(divId) || 0) + 1);
      });
    });

    const tabs: TabItem[] = [];

    if (allDivisions.length > 0) {
      allDivisions.forEach((d: any) => {
        const divId = String(d.id);
        const count = countMap.get(divId) ?? 0;
        if (count === 0) return;
        tabs.push({
          id: divId,
          name: d.name || `Подразделение ${divId}`,
          count,
          order: d.order ?? 9999,
        });
      });
    } else {
      countMap.forEach((count, divId) => {
        tabs.push({
          id: divId,
          name: `Подразделение ${divId}`,
          count,
          order: 9999,
        });
      });
    }

    tabs.sort((a, b) => a.order - b.order);

    if (noDivCount > 0) {
      tabs.push({
        id: 'no-division',
        name: 'Без подразделения',
        count: noDivCount,
        order: 99999,
      });
    }

    if (tabs.length < 2) return [];

    return [
      {
        id: 'all',
        name: 'Все подразделения',
        count: networks.length,
        order: 0,
      },
      ...tabs,
    ];
  }, [viewMode, isGlobalView, id, networks, allDivisions, getNetworkDivisionIds]);

  // ===== Вкладки отделений =====
  // Показываем ВСЕ отделения из справочника подразделения — даже пустые,
  // чтобы было видно, к какому отделению привязана сеть.
  //
  // «Все отделения» добавляем только если реальных табов ≥ 2.
  // Если отделение одно — показываем только его, без «Все отделения».
  const subdivisionTabs = useMemo<TabItem[]>(() => {
    if (viewMode !== 'grouped') return [];

    const scopeDivisionId = id
      ? String(id)
      : isExploitationUser
        ? (userDivisionId ? String(userDivisionId) : null)
        : activeDivisionTab !== 'all' && activeDivisionTab !== 'no-division'
          ? activeDivisionTab
          : null;

    if (!scopeDivisionId) return [];

    const scopeDivision = allDivisions.find((d: any) => String(d.id) === scopeDivisionId);

    const networkInDiv = networks.filter(
      (n: any) => getNetworkDivisionIds(n).includes(scopeDivisionId),
    );

    const countMap = new Map<string, number>();
    let noSubCount = 0;
    networkInDiv.forEach((n: any) => {
      const subIds = getNetworkSubdivisionIds(n);
      if (subIds.length === 0) {
        noSubCount++;
        return;
      }
      subIds.forEach(subId => {
        countMap.set(subId, (countMap.get(subId) || 0) + 1);
      });
    });

    const tabs: TabItem[] = [];

    const subdivisionsFromDict: any[] = Array.isArray(scopeDivision?.subdivisions)
      ? scopeDivision.subdivisions
      : [];

    if (subdivisionsFromDict.length > 0) {
      // Показываем все отделения из справочника (включая пустые — для контекста).
      subdivisionsFromDict.forEach((s: any) => {
        const subId = String(s.id);
        tabs.push({
          id: subId,
          name: s.name || `Отделение ${subId}`,
          count: countMap.get(subId) ?? 0,
          order: s.order ?? 9999,
        });
      });
    } else {
      countMap.forEach((count, subId) => {
        tabs.push({
          id: subId,
          name: `Отделение ${subId}`,
          count,
          order: 9999,
        });
      });
    }

    tabs.sort((a, b) => a.order - b.order);

    if (noSubCount > 0) {
      tabs.push({
        id: 'no-subdivision',
        name: 'Без отделения',
        count: noSubCount,
        order: 99999,
      });
    }

    if (tabs.length === 0) return [];

    // Одно отделение — показываем только его, без «Все отделения»
    if (tabs.length === 1) {
      return tabs;
    }

    // 2+ отделений — «Все отделения» + все остальные
    return [
      {
        id: 'all',
        name: 'Все отделения',
        count: networkInDiv.length,
        order: 0,
      },
      ...tabs,
    ];
  }, [viewMode, id, isExploitationUser, userDivisionId, activeDivisionTab, networks, allDivisions, getNetworkDivisionIds, getNetworkSubdivisionIds]);

  // Показываем вкладки отделений, если есть хотя бы один таб
  const showDivisionTabs = viewMode === 'grouped' && divisionTabs.length > 1;
  const showSubdivisionTabs = viewMode === 'grouped' && subdivisionTabs.length > 0;

  // Автовыбор единственного отделения:
  // если вкладка «Все отделения» отсутствует (1 отделение) и текущий active = 'all' —
  // переключаемся на это отделение, иначе ни одна вкладка не была бы активна.
  useEffect(() => {
    if (viewMode !== 'grouped') return;
    if (subdivisionTabs.length !== 1) return;
    if (activeSubdivisionTab === subdivisionTabs[0].id) return;
    // Если текущий active не входит в список — переключаемся на единственный.
    if (!subdivisionTabs.some(t => t.id === activeSubdivisionTab)) {
      setActiveSubdivisionTab(subdivisionTabs[0].id);
    }
  }, [viewMode, subdivisionTabs, activeSubdivisionTab]);

  // Защита: активной вкладки больше нет в списке — сбрасываем на 'all' (или на единственную)
  useEffect(() => {
    if (activeSubdivisionTab === 'all') return;
    if (!subdivisionTabs.some(t => t.id === activeSubdivisionTab)) {
      if (subdivisionTabs.length === 1) {
        setActiveSubdivisionTab(subdivisionTabs[0].id);
      } else {
        setActiveSubdivisionTab('all');
      }
    }
  }, [subdivisionTabs, activeSubdivisionTab]);

  useEffect(() => {
    if (activeDivisionTab === 'all') return;
    if (!divisionTabs.some(t => t.id === activeDivisionTab)) {
      setActiveDivisionTab('all');
    }
  }, [divisionTabs, activeDivisionTab]);

  // Индикаторы (top учитывает flex-wrap)
  useLayoutEffect(() => {
    if (!divisionTabsRef.current) return;
    const btn = divisionTabsRef.current.querySelector('.cn-division-tab.active') as HTMLElement | null;
    if (btn) {
      setDivisionIndicatorStyle({
        left: btn.offsetLeft,
        width: btn.offsetWidth,
        top: btn.offsetTop + btn.offsetHeight - 2,
      });
    } else {
      setDivisionIndicatorStyle({ left: 0, width: 0, top: 0 });
    }
  }, [activeDivisionTab, divisionTabs]);

  useLayoutEffect(() => {
    if (!subdivisionTabsRef.current) return;
    const btn = subdivisionTabsRef.current.querySelector('.cn-subdivision-tab.active') as HTMLElement | null;
    if (btn) {
      setSubdivisionIndicatorStyle({
        left: btn.offsetLeft,
        width: btn.offsetWidth,
        top: btn.offsetTop + btn.offsetHeight - 2,
      });
    } else {
      setSubdivisionIndicatorStyle({ left: 0, width: 0, top: 0 });
    }
  }, [activeSubdivisionTab, subdivisionTabs]);

  useEffect(() => {
    const onResize = () => {
      if (divisionTabsRef.current) {
        const btn = divisionTabsRef.current.querySelector('.cn-division-tab.active') as HTMLElement | null;
        if (btn) {
          setDivisionIndicatorStyle({
            left: btn.offsetLeft,
            width: btn.offsetWidth,
            top: btn.offsetTop + btn.offsetHeight - 2,
          });
        }
      }
      if (subdivisionTabsRef.current) {
        const btn = subdivisionTabsRef.current.querySelector('.cn-subdivision-tab.active') as HTMLElement | null;
        if (btn) {
          setSubdivisionIndicatorStyle({
            left: btn.offsetLeft,
            width: btn.offsetWidth,
            top: btn.offsetTop + btn.offsetHeight - 2,
          });
        }
      }
    };
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  const handleDivisionChange = useCallback((divId: string) => {
    setActiveDivisionTab(divId);
    setActiveSubdivisionTab('all');
  }, []);

  const handleSubdivisionChange = useCallback((subId: string) => {
    setActiveSubdivisionTab(subId);
  }, []);

  // ===== Финальный набор для таблицы =====
  const filteredNetworks = useMemo(() => {
    if (viewMode !== 'grouped') return networks;

    let result = networks;

    if (isGlobalView && !id) {
      if (activeDivisionTab === 'no-division') {
        result = result.filter((n: any) => getNetworkDivisionIds(n).length === 0);
      } else if (activeDivisionTab !== 'all') {
        result = result.filter((n: any) => getNetworkDivisionIds(n).includes(activeDivisionTab));
      }
    }

    if (activeSubdivisionTab === 'no-subdivision') {
      result = result.filter((n: any) => getNetworkSubdivisionIds(n).length === 0);
    } else if (activeSubdivisionTab !== 'all') {
      result = result.filter((n: any) => getNetworkSubdivisionIds(n).includes(activeSubdivisionTab));
    }

    return result;
  }, [networks, viewMode, isGlobalView, id, activeDivisionTab, activeSubdivisionTab, getNetworkDivisionIds, getNetworkSubdivisionIds]);

  const handleDeleteNetwork = async (networkId: string) => {
    if (!token) return;

    if (window.confirm('Вы уверены, что хотите удалить эту сеть? Это действие нельзя отменить.')) {
      try {
        await networksApi.deleteNetwork(token, networkId);
        fetchData();
        if (selectedNetwork?.id === networkId) {
          setSelectedNetwork(null);
        }
      } catch (err) {
        console.error('Ошибка удаления сети:', err);
        setError('Не удалось удалить сеть');
      }
    }
  };

  const handleHighlightNode = (nodeId: string) => {
    setHighlightedNode(nodeId);
  };

  const handleClearHighlight = () => {
    setHighlightedNode(null);
  };

  const handleNavigateToManagement = () => {
    if (isGlobalView) {
      navigate('/networks/management', {
        state: { from: location.pathname, divisionId: undefined }
      });
    } else if (isExploitationUser && userDivisionId) {
      navigate(`/divisions/${userDivisionId}/networks/management`, {
        state: { from: location.pathname, divisionId: userDivisionId }
      });
    } else if (id) {
      navigate(`/divisions/${id}/networks/management`, {
        state: { from: location.pathname, divisionId: id }
      });
    }
  };

  const handleNavigateToCreate = () => {
    if (isGlobalView) {
      navigate('/networks/create', { state: { from: location.pathname, divisionId: undefined } });
    } else if (isExploitationUser && userDivisionId) {
      navigate(`/divisions/${userDivisionId}/networks/create`, { state: { from: location.pathname, divisionId: userDivisionId } });
    } else if (id) {
      navigate(`/divisions/${id}/networks/create`, { state: { from: location.pathname, divisionId: id } });
    }
  };

  const handleNodeSelect = (nodeId: string) => {
    setSelectedNode(nodeId);
  };

  const handleClearSelection = () => {
    setSelectedNode(null);
  };

  const divisionName = useMemo(() => {
    if (isGlobalView) return null;
    if (isExploitationUser) return user?.division_info?.name || 'Ваше подразделение';
    return division?.name || '';
  }, [isGlobalView, isExploitationUser, user, division]);

  const targetDivisionId = useMemo(() => {
    if (isGlobalView) return undefined;
    if (isExploitationUser) return userDivisionId;
    return id;
  }, [isGlobalView, isExploitationUser, userDivisionId, id]);

  if (error) return <div className="error-message">{error}</div>;
  if (loading) return <div className="loading">Загрузка сетей связи...</div>;

  return (
    <div className="communication-networks-container page-fade-in">
      <div className="communication-networks-main">
        <Header
          onNavigateToManagement={handleNavigateToManagement}
          onNavigateToCreate={handleNavigateToCreate}
          divisionId={id}
          divisionName={divisionName}
          canCreateNetworks={canCreateNetworks}
        />

        {/* Переключатель вида */}
        <div className="cn-view-mode-toggle">
          <button
            type="button"
            className={`cn-view-mode-btn ${viewMode === 'flat' ? 'active' : ''}`}
            onClick={() => handleViewModeChange('flat')}
          >
            <List size={16} /> Список
          </button>
          <button
            type="button"
            className={`cn-view-mode-btn ${viewMode === 'grouped' ? 'active' : ''}`}
            onClick={() => handleViewModeChange('grouped')}
          >
            <FolderTree size={16} /> По подразделениям
          </button>
        </div>

        {showDivisionTabs && (
          <div className="cn-division-tabs" ref={divisionTabsRef}>
            {divisionTabs.map(tab => (
              <button
                key={tab.id}
                type="button"
                className={`cn-division-tab ${activeDivisionTab === tab.id ? 'active' : ''}`}
                onClick={() => handleDivisionChange(tab.id)}
              >
                <span>{tab.name}</span>
                <span className="cn-division-tab-count">{tab.count}</span>
              </button>
            ))}
            <div
              className="cn-division-tabs-indicator"
              style={{
                left: `${divisionIndicatorStyle.left}px`,
                width: `${divisionIndicatorStyle.width}px`,
                top: `${divisionIndicatorStyle.top}px`,
              }}
            />
          </div>
        )}

        {showSubdivisionTabs && (
          <div className="cn-subdivision-tabs" ref={subdivisionTabsRef}>
            {subdivisionTabs.map(tab => (
              <button
                key={tab.id}
                type="button"
                className={`cn-subdivision-tab ${activeSubdivisionTab === tab.id ? 'active' : ''}`}
                onClick={() => handleSubdivisionChange(tab.id)}
              >
                <span>{tab.name}</span>
                <span className="cn-subdivision-tab-count">{tab.count}</span>
              </button>
            ))}
            <div
              className="cn-subdivision-tabs-indicator"
              style={{
                left: `${subdivisionIndicatorStyle.left}px`,
                width: `${subdivisionIndicatorStyle.width}px`,
                top: `${subdivisionIndicatorStyle.top}px`,
              }}
            />
          </div>
        )}

        <div className="networks-content">
          <NetworksTable
            networks={filteredNetworks}
            onSelect={setSelectedNetwork}
            selectedNetwork={selectedNetwork}
            divisionId={targetDivisionId}
            divisions={[]}
            onDelete={handleDeleteNetwork}
            canEdit={canEditNetworks}
          />
          {selectedNetwork && (
            <NetworkVisualizationWithTabs
              network={selectedNetwork}
              memberships={memberships}
              directions={directions}
              highlightedNode={highlightedNode}
              selectedNode={selectedNode}
              onNodeSelect={handleNodeSelect}
              onClearSelection={handleClearSelection}
              onNodeHover={handleHighlightNode}
            />
          )}
        </div>
      </div>

      <aside className="network-details-sidebar">
        <NetworkDetails
          network={selectedNetwork}
          onHighlightNode={handleHighlightNode}
          onClearHighlight={handleClearHighlight}
          onNodeSelect={handleNodeSelect}
          divisionId={targetDivisionId}
        />
      </aside>
    </div>
  );
};

export default CommunicationNetworks;