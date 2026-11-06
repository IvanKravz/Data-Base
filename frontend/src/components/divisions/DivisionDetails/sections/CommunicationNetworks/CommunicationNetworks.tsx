// CommunicationNetworks.tsx
import React, {
  useState, useEffect, useLayoutEffect, useCallback, useMemo, useRef,
} from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { useSelector } from 'react-redux';
import {
  List, FolderTree, Network as SchemaIcon,
  Cpu, Layers, Box,
} from 'lucide-react';
import { RootState } from '../../../../../store/store';
import './CommunicationNetworks.css';
import { Network } from '../../../../../types';
import NetworksTable from '../../../../networks/NetworksTable/NetworksTable';
import { networksApi } from '../../../../../api/networksApi';
import { Header } from '../../../../networks/Header/Header';
import { divisionsApi } from '../../../../../api/divisions';

import { SchemaEditor } from '../../../../networks/SchemaEditor/SchemaEditor';
import { useNetworkSchema } from '../../../../networks/SchemaEditor/useNetworkSchema';
import {
  ObjectDrawer,
  DrawerObjectType,
} from '../../../../networks/EditableDrawer/ObjectDrawer';
import { InterfacesTable } from '../../../../networks/InterfacesTable/InterfacesTable';
import { IpamView } from '../../../../networks/IpamView/IpamView';
import NetworkVisualization from '../../../../networks/NetworkVisualization/NetworkVisualization';
import NetworkHierarchy from '../../../../networks/NetworkVisualization/components/NetworkHierarchy/NetworkHierarchy';

interface TabItem {
  id: string;
  name: string;
  count: number;
  order: number;
}

type VisualTab = 'schema' | 'interfaces' | 'ipam' | '3d';

interface SelectedObject {
  type: DrawerObjectType;
  data: any;
}

const CommunicationNetworks: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const token = localStorage.getItem('accessToken');

  const [networks, setNetworks] = useState<Network[]>([]);
  const [allDivisions, setAllDivisions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [division, setDivision] = useState<any>(null);

  const [expandedNetworkId, setExpandedNetworkId] = useState<string | null>(null);
  const [renderedNetworkId, setRenderedNetworkId] = useState<string | null>(null);

  const [visualTab, setVisualTab] = useState<VisualTab>('schema');
  const [highlightedNode, setHighlightedNode] = useState<string | null>(null);
  const [selectedNode, setSelectedNode] = useState<string | null>(null);
  const [selectedEdgeId, setSelectedEdgeId] = useState<string | null>(null);

  const [activeDivisionTab, setActiveDivisionTab] = useState<string>('all');
  const [activeSubdivisionTab, setActiveSubdivisionTab] = useState<string>('all');

  const [viewMode, setViewMode] = useState<'flat' | 'grouped'>(() => {
    const saved = localStorage.getItem('networks_view_mode');
    return (saved === 'flat' || saved === 'grouped') ? saved : 'grouped';
  });

  const divisionTabsRef = useRef<HTMLDivElement | null>(null);
  const subdivisionTabsRef = useRef<HTMLDivElement | null>(null);
  const [divisionIndicatorStyle, setDivisionIndicatorStyle] =
    useState({ left: 0, width: 0, top: 0 });
  const [subdivisionIndicatorStyle, setSubdivisionIndicatorStyle] =
    useState({ left: 0, width: 0, top: 0 });

  const user = useSelector((state: RootState) => state.auth.user);
  const permissions = user?.permissions;

  const isAdminUser = useMemo(() => {
    if (!user) return false;
    if ((user as any).is_superuser) return true;
    return Array.isArray(user.roles) && user.roles.includes('admin');
  }, [user]);

  const canEditNetworks = useMemo(() =>
    isAdminUser ||
    (permissions?.models?.CommunicationNetwork?.includes('change') ?? false),
    [isAdminUser, permissions]);

  const canCreateNetworks = useMemo(() =>
    isAdminUser ||
    (permissions?.models?.CommunicationNetwork?.includes('add') ?? false),
    [isAdminUser, permissions]);

  const canEditInterfaces = useMemo(() =>
    isAdminUser ||
    (permissions?.models?.NetworkInterface?.includes('change') ?? false),
    [isAdminUser, permissions]);

  // ⚠️ ВАЖНО: этот useEffect должен идти ПОСЛЕ useMemo с canEditInterfaces.
  // Иначе — ReferenceError: Cannot access 'canEditInterfaces' before initialization.
  useEffect(() => {
    if (!canEditInterfaces && visualTab !== '3d') {
      setVisualTab('3d');
    }
  }, [canEditInterfaces]);   // eslint-disable-line react-hooks/exhaustive-deps

  const isExploitationUser = useMemo(() =>
    user?.roles?.includes('exploitation_chief') ||
    user?.roles?.includes('exploitation_employee'), [user]);
  const isGlobalView = useMemo(() => !id && !isExploitationUser, [id, isExploitationUser]);
  const userDivisionId = useMemo(() => user?.division_info?.id ?? null, [user]);

  const renderedNetwork = useMemo<Network | null>(() => {
    if (!renderedNetworkId) return null;
    return networks.find((n: any) => String(n.id) === String(renderedNetworkId)) ?? null;
  }, [renderedNetworkId, networks]);

  const {
    data: schemaPayload,
    loading: schemaLoading,
    refreshing: schemaRefreshing,
    error: schemaError,
    reload: reloadSchema,
    patchPositions,
  } = useNetworkSchema(token, renderedNetwork?.id?.toString());

  const selectedObject = useMemo<SelectedObject | null>(() => {
    if (!schemaPayload) return null;

    if (selectedEdgeId) {
      const m = selectedEdgeId.match(/^dir-(\d+)$/);
      if (m) {
        const dirId = Number(m[1]);
        const dir = schemaPayload.directions.find((d: any) => d.id === dirId);
        if (dir) return { type: 'edge', data: dir };
      }
      return null;
    }

    if (!selectedNode) return null;
    const parts = selectedNode.split('-');
    if (parts.length < 2) return null;
    const type = parts[0];
    const numId = Number(parts[1]);
    if (!Number.isFinite(numId)) return null;

    if (type === 'equipment') {
      const data = schemaPayload.memberships.find(
        (m: any) => m.equipment?.id === numId,
      )?.equipment;
      return data ? { type: 'equipment', data } : null;
    }
    if (type === 'facility') {
      const data = schemaPayload.memberships.find(
        (m: any) => m.facility?.id === numId,
      )?.facility;
      return data ? { type: 'facility', data } : null;
    }
    if (type === 'division') {
      const data = schemaPayload.memberships.find(
        (m: any) => m.division?.id === numId,
      )?.division;
      return data ? { type: 'division', data } : null;
    }
    return null;
  }, [selectedNode, selectedEdgeId, schemaPayload]);

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
          return Array.isArray(data) ? data : [];
        } catch {
          return [];
        }
      };

      if (isGlobalView) {
        const [allNetworks, divisions] = await Promise.all([
          networksApi.getNetworks(token),
          loadDivisions(),
        ]);
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
        setNetworks((await networksApi.getNetworks(token, userDivisionId)) || []);
      } else {
        if (!id) return;
        const divisionData = await divisionsApi.getDivisionById(id, token);
        setDivision(divisionData);
        setAllDivisions(divisionData ? [divisionData] : []);
        setNetworks((await networksApi.getNetworks(token, id)) || []);
      }
    } catch (err) {
      console.error('Error fetching data:', err);
      setError('Не удалось загрузить данные сетей связи');
    } finally {
      setLoading(false);
    }
  }, [token, isGlobalView, isExploitationUser, userDivisionId, id]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const getNetworkDivisionIds = useCallback((n: any): string[] => {
    if (!Array.isArray(n?.memberships)) return [];
    const set = new Set<string>();
    n.memberships.forEach((m: any) => {
      const divId = m?.division?.id ?? m?.division_id ??
        m?.facility?.division?.id ?? m?.equipment?.division?.id;
      if (divId != null) set.add(String(divId));
    });
    return Array.from(set);
  }, []);

  const getNetworkSubdivisionIds = useCallback((n: any): string[] => {
    if (!Array.isArray(n?.memberships)) return [];
    const set = new Set<string>();
    n.memberships.forEach((m: any) => {
      const subId = m?.facility?.subdivision?.id ?? m?.facility?.subdivision_id ??
        m?.equipment?.subdivision?.id ?? m?.equipment?.subdivision_id;
      if (subId != null) set.add(String(subId));
    });
    return Array.from(set);
  }, []);

  const getSubdivisionIdsForDivision = useCallback(
    (n: any, divisionId: string): string[] => {
      if (!Array.isArray(n?.memberships)) return [];
      const set = new Set<string>();
      n.memberships.forEach((m: any) => {
        const memberDivId =
          m?.division?.id ?? m?.division_id ??
          m?.facility?.division?.id ?? m?.facility?.division_id ??
          m?.equipment?.division?.id ?? m?.equipment?.division_id;
        if (memberDivId == null || String(memberDivId) !== divisionId) return;

        const subId =
          m?.facility?.subdivision?.id ?? m?.facility?.subdivision_id ??
          m?.equipment?.subdivision?.id ?? m?.equipment?.subdivision_id;
        if (subId != null) set.add(String(subId));
      });
      return Array.from(set);
    },
    [],
  );

  const scopeDivisionId = useMemo<string | null>(() => {
    if (id) return String(id);
    if (isExploitationUser) return userDivisionId ? String(userDivisionId) : null;
    if (activeDivisionTab !== 'all' && activeDivisionTab !== 'no-division') {
      return activeDivisionTab;
    }
    return null;
  }, [id, isExploitationUser, userDivisionId, activeDivisionTab]);

  const divisionTabs = useMemo<TabItem[]>(() => {
    if (viewMode !== 'grouped' || !isGlobalView || id) return [];
    const countMap = new Map<string, number>();
    let noDivCount = 0;
    networks.forEach((n: any) => {
      const divIds = getNetworkDivisionIds(n);
      if (divIds.length === 0) { noDivCount++; return; }
      divIds.forEach(d => countMap.set(d, (countMap.get(d) || 0) + 1));
    });
    const tabs: TabItem[] = [];
    if (allDivisions.length > 0) {
      allDivisions.forEach((d: any) => {
        const divId = String(d.id);
        const count = countMap.get(divId) ?? 0;
        if (count === 0) return;
        tabs.push({
          id: divId, name: d.name || `Подразделение ${divId}`,
          count, order: d.order ?? 9999,
        });
      });
    } else {
      countMap.forEach((count, divId) =>
        tabs.push({ id: divId, name: `Подразделение ${divId}`, count, order: 9999 }));
    }
    tabs.sort((a, b) => a.order - b.order);
    if (noDivCount > 0) {
      tabs.push({ id: 'no-division', name: 'Без подразделения', count: noDivCount, order: 99999 });
    }
    if (tabs.length < 2) return [];
    return [{ id: 'all', name: 'Все подразделения', count: networks.length, order: 0 }, ...tabs];
  }, [viewMode, isGlobalView, id, networks, allDivisions, getNetworkDivisionIds]);

  const subdivisionTabs = useMemo<TabItem[]>(() => {
    if (viewMode !== 'grouped') return [];
    if (!scopeDivisionId) return [];

    const scopeDivision = allDivisions.find((d: any) => String(d.id) === scopeDivisionId);
    const networkInDiv = networks.filter(
      (n: any) => getNetworkDivisionIds(n).includes(scopeDivisionId),
    );

    if (networkInDiv.length === 0) return [];

    const countMap = new Map<string, number>();
    networkInDiv.forEach((n: any) => {
      const subIds = getSubdivisionIdsForDivision(n, scopeDivisionId);
      subIds.forEach(s => countMap.set(s, (countMap.get(s) || 0) + 1));
    });

    const tabs: TabItem[] = [];
    const subsFromDict = Array.isArray(scopeDivision?.subdivisions)
      ? scopeDivision.subdivisions
      : [];

    if (subsFromDict.length > 0) {
      subsFromDict.forEach((s: any) => {
        const count = countMap.get(String(s.id)) ?? 0;
        if (count === 0) return;
        tabs.push({
          id: String(s.id), name: s.name || `Отделение ${s.id}`,
          count, order: s.order ?? 9999,
        });
      });
    } else {
      countMap.forEach((count, s) => {
        if (count === 0) return;
        tabs.push({ id: s, name: `Отделение ${s}`, count, order: 9999 });
      });
    }

    tabs.sort((a, b) => a.order - b.order);
    if (tabs.length === 0) return [];
    if (tabs.length === 1) return tabs;
    return [{ id: 'all', name: 'Все отделения', count: networkInDiv.length, order: 0 }, ...tabs];
  }, [
    viewMode, scopeDivisionId, networks, allDivisions,
    getNetworkDivisionIds, getSubdivisionIdsForDivision,
  ]);

  const showDivisionTabs = viewMode === 'grouped' && divisionTabs.length > 1;
  const showSubdivisionTabs = viewMode === 'grouped' && subdivisionTabs.length > 0;

  useEffect(() => {
    if (viewMode !== 'grouped' || subdivisionTabs.length !== 1) return;
    if (activeSubdivisionTab === subdivisionTabs[0].id) return;
    if (!subdivisionTabs.some(t => t.id === activeSubdivisionTab)) {
      setActiveSubdivisionTab(subdivisionTabs[0].id);
    }
  }, [viewMode, subdivisionTabs, activeSubdivisionTab]);

  useEffect(() => {
    if (activeSubdivisionTab === 'all') return;
    if (!subdivisionTabs.some(t => t.id === activeSubdivisionTab)) {
      setActiveSubdivisionTab(subdivisionTabs.length === 1 ? subdivisionTabs[0].id : 'all');
    }
  }, [subdivisionTabs, activeSubdivisionTab]);

  useEffect(() => {
    if (activeDivisionTab === 'all') return;
    if (!divisionTabs.some(t => t.id === activeDivisionTab)) setActiveDivisionTab('all');
  }, [divisionTabs, activeDivisionTab]);

  useLayoutEffect(() => {
    if (!divisionTabsRef.current) return;
    const btn = divisionTabsRef.current.querySelector('.cn-division-tab.active') as HTMLElement | null;
    if (btn) {
      setDivisionIndicatorStyle({
        left: btn.offsetLeft, width: btn.offsetWidth,
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
        left: btn.offsetLeft, width: btn.offsetWidth,
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
        if (btn) setDivisionIndicatorStyle({
          left: btn.offsetLeft, width: btn.offsetWidth,
          top: btn.offsetTop + btn.offsetHeight - 2,
        });
      }
      if (subdivisionTabsRef.current) {
        const btn = subdivisionTabsRef.current.querySelector('.cn-subdivision-tab.active') as HTMLElement | null;
        if (btn) setSubdivisionIndicatorStyle({
          left: btn.offsetLeft, width: btn.offsetWidth,
          top: btn.offsetTop + btn.offsetHeight - 2,
        });
      }
    };
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  const handleDivisionChange = useCallback((divId: string) => {
    setActiveDivisionTab(divId);
    setActiveSubdivisionTab('all');
  }, []);
  const handleSubdivisionChange = useCallback(
    (subId: string) => setActiveSubdivisionTab(subId), [],
  );

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

    if (activeSubdivisionTab !== 'all') {
      result = result.filter((n: any) =>
        scopeDivisionId
          ? getSubdivisionIdsForDivision(n, scopeDivisionId).includes(activeSubdivisionTab)
          : getNetworkSubdivisionIds(n).includes(activeSubdivisionTab),
      );
    }

    return result;
  }, [
    networks, viewMode, isGlobalView, id, activeDivisionTab, activeSubdivisionTab,
    scopeDivisionId, getNetworkDivisionIds, getNetworkSubdivisionIds,
    getSubdivisionIdsForDivision,
  ]);

  const handleExpandedNetworkChange = useCallback((networkId: string | null) => {
    const normalized = networkId == null ? null : String(networkId);
    setExpandedNetworkId(normalized);
    if (normalized) setRenderedNetworkId(normalized);
    setVisualTab(canEditInterfaces ? 'schema' : '3d');
    setSelectedNode(null);
    setSelectedEdgeId(null);
    setHighlightedNode(null);
  }, [canEditInterfaces]);

  useEffect(() => {
    if (!expandedNetworkId && renderedNetworkId) {
      const timer = window.setTimeout(() => setRenderedNetworkId(null), 350);
      return () => window.clearTimeout(timer);
    }
  }, [expandedNetworkId, renderedNetworkId]);

  useEffect(() => {
    if (!expandedNetworkId) return;
    const stillExists = networks.some(
      (n: any) => String(n.id) === String(expandedNetworkId),
    );
    if (!stillExists) setExpandedNetworkId(null);
  }, [networks, expandedNetworkId]);

  const handleDeleteNetwork = async (networkId: string) => {
    if (!token) return;
    if (!window.confirm('Вы уверены, что хотите удалить эту сеть? Это действие нельзя отменить.')) return;
    try {
      await networksApi.deleteNetwork(token, networkId);
      await fetchData();
      if (String(expandedNetworkId) === String(networkId)) {
        setExpandedNetworkId(null);
        setSelectedNode(null);
        setSelectedEdgeId(null);
        setHighlightedNode(null);
      }
    } catch (err) {
      console.error('Ошибка удаления сети:', err);
      setError('Не удалось удалить сеть');
    }
  };

  const handleNodeSelect = useCallback((nodeId: string) => {
    setSelectedNode(nodeId);
    setSelectedEdgeId(null);
  }, []);

  const handleEdgeSelect = useCallback((edgeId: string | null) => {
    setSelectedEdgeId(edgeId);
    if (edgeId) setSelectedNode(null);
  }, []);

  const closeDrawer = useCallback(() => {
    setSelectedNode(null);
    setSelectedEdgeId(null);
  }, []);

  useEffect(() => {
    setSelectedNode(null);
    setSelectedEdgeId(null);
    setHighlightedNode(null);
  }, [visualTab]);

  const handleDeleteObject = useCallback(async (
    type: DrawerObjectType,
    obj: any,
  ) => {
    if (!token || !renderedNetwork || !schemaPayload) return;
    if (type === 'edge') return;

    const objId = Number(obj?.id);
    if (!objId) return;

    let memberships: any[] = [];
    if (type === 'division') {
      memberships = schemaPayload.memberships.filter((m: any) => m.division?.id === objId);
    } else if (type === 'facility') {
      memberships = schemaPayload.memberships.filter((m: any) => m.facility?.id === objId);
    } else if (type === 'equipment') {
      memberships = schemaPayload.memberships.filter((m: any) => m.equipment?.id === objId);
    }

    const label = type === 'equipment'
      ? 'оборудование'
      : type === 'facility' ? 'объект' : 'подразделение';

    const extra = type === 'equipment'
      ? ' Сама техника останется в базе.'
      : memberships.length > 0
        ? ` Вместе с ним из сети будет удалено ${memberships.length} ед. техники (сама техника останется в базе).`
        : '';

    if (!window.confirm(`Удалить ${label} из схемы?${extra}`)) return;

    try {
      for (const m of memberships) {
        await networksApi.deleteNetworkMembership(token, m.id);
      }
      await networksApi.deleteNodePosition(
        token,
        renderedNetwork.id.toString(),
        type,
        objId,
      ).catch(() => { /* позиции могло не быть */ });

      closeDrawer();
      reloadSchema();
    } catch (e) {
      console.error('[CommunicationNetworks] delete object failed:', e);
      alert('Не удалось удалить из схемы');
    }
  }, [token, renderedNetwork, schemaPayload, closeDrawer, reloadSchema]);

  const handleNavigateToManagement = () => {
    if (isGlobalView) {
      navigate('/networks/management', { state: { from: location.pathname } });
    } else if (isExploitationUser && userDivisionId) {
      navigate(`/divisions/${userDivisionId}/networks/management`, {
        state: { from: location.pathname, divisionId: userDivisionId },
      });
    } else if (id) {
      navigate(`/divisions/${id}/networks/management`, {
        state: { from: location.pathname, divisionId: id },
      });
    }
  };
  const handleNavigateToCreate = () => {
    if (isGlobalView) {
      navigate('/networks/create', { state: { from: location.pathname } });
    } else if (isExploitationUser && userDivisionId) {
      navigate(`/divisions/${userDivisionId}/networks/create`, {
        state: { from: location.pathname, divisionId: userDivisionId },
      });
    } else if (id) {
      navigate(`/divisions/${id}/networks/create`, {
        state: { from: location.pathname, divisionId: id },
      });
    }
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

  if (error) return <div className="cn-error-message">{error}</div>;
  if (loading) return <div className="loading">Загрузка сетей связи...</div>;

  return (
    <div className="cn-page-container cn-fade-in">
      <div className="cn-main">
        <Header
          onNavigateToManagement={handleNavigateToManagement}
          onNavigateToCreate={handleNavigateToCreate}
          divisionId={id}
          divisionName={divisionName}
          canCreateNetworks={canCreateNetworks}
        />

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

        <div className="cn-content">
          <NetworksTable
            networks={filteredNetworks}
            expandedNetworkId={expandedNetworkId}
            renderedNetworkId={renderedNetworkId}
            onExpandedNetworkChange={handleExpandedNetworkChange}
            divisionId={targetDivisionId}
            divisions={[]}
            onDelete={handleDeleteNetwork}
            canEdit={canEditNetworks}
            renderExpanded={(network) => {
              return (
                <div className="cn-visual-area">
                  <div className="cn-visual-main">
                    <div className="cn-visual-tabs">
                      {canEditInterfaces && (
                        <>
                          <button
                            type="button"
                            className={`cn-visual-tab ${visualTab === 'schema' ? 'active' : ''}`}
                            onClick={() => setVisualTab('schema')}
                          >
                            <SchemaIcon size={16} /> Схема
                          </button>
                          <button
                            type="button"
                            className={`cn-visual-tab ${visualTab === 'interfaces' ? 'active' : ''}`}
                            onClick={() => setVisualTab('interfaces')}
                          >
                            <Cpu size={16} /> Интерфейсы
                          </button>
                          <button
                            type="button"
                            className={`cn-visual-tab ${visualTab === 'ipam' ? 'active' : ''}`}
                            onClick={() => setVisualTab('ipam')}
                          >
                            <Layers size={16} /> IPAM
                          </button>
                        </>
                      )}

                      <button
                        type="button"
                        className={`cn-visual-tab ${visualTab === '3d' ? 'active' : ''}`}
                        onClick={() => setVisualTab('3d')}
                      >
                        <Box size={16} /> Структурная схема
                      </button>
                    </div>

                    {schemaRefreshing && !schemaLoading && (
                      <div className="cn-visual-refreshing" aria-live="polite">
                        <span className="cn-visual-refreshing__dot" />
                        Обновление…
                      </div>
                    )}

                    <div className="cn-visual-content">
                      {schemaLoading && (
                        <div className="cn-visual-loading">Загрузка схемы сети…</div>
                      )}
                      {schemaError && !schemaLoading && (
                        <div className="cn-error-message">{schemaError}</div>
                      )}

                      {!schemaLoading && !schemaError && visualTab === 'schema' && (
                        <SchemaEditor
                          token={token}
                          networkId={network.id.toString()}
                          payload={schemaPayload}
                          highlightedNode={highlightedNode}
                          selectedNode={selectedNode}
                          selectedEdgeId={selectedEdgeId}
                          onNodeSelect={handleNodeSelect}
                          onNodeHover={setHighlightedNode}
                          onEdgeSelect={handleEdgeSelect}
                          onPositionsSaved={patchPositions}
                          onSchemaChanged={reloadSchema}
                          drawerOpen={!!selectedObject}
                        />
                      )}

                      {visualTab === 'interfaces' && schemaPayload && (
                        <InterfacesTable
                          token={token}
                          schemaPayload={schemaPayload}
                          canEdit={canEditInterfaces}
                          onOpenDrawer={(eq) => {
                            setSelectedEdgeId(null);
                            setSelectedNode(`equipment-${eq.id}`);
                          }}
                          onChanged={reloadSchema}
                        />
                      )}

                      {visualTab === 'ipam' && (
                        <IpamView
                          token={token}
                          networkId={network.id.toString()}
                        />
                      )}

                      {visualTab === '3d' && schemaPayload && (
                        <NetworkVisualization
                          network={network}
                          memberships={schemaPayload.memberships}
                          directions={schemaPayload.directions}
                          highlightedNode={highlightedNode}
                          selectedNode={selectedNode}
                          onNodeSelect={handleNodeSelect}
                          onClearSelection={() => setSelectedNode(null)}
                        />
                      )}

                      {(visualTab === 'schema' || visualTab === '3d') && schemaPayload && (
                        <NetworkHierarchy
                          memberships={schemaPayload.memberships}
                          selectedNode={selectedNode}
                          onNodeSelect={handleNodeSelect}
                          onClearSelection={() => setSelectedNode(null)}
                        />
                      )}
                    </div>
                  </div>

                  <ObjectDrawer
                    open={!!selectedObject}
                    objectType={selectedObject?.type ?? null}
                    object={selectedObject?.data ?? null}
                    token={token}
                    networkId={network.id.toString()}
                    canEdit={canEditInterfaces}
                    onClose={closeDrawer}
                    onChanged={reloadSchema}
                    onDelete={canEditInterfaces ? handleDeleteObject : undefined}
                  />
                </div>
              );
            }}
          />
        </div>
      </div>
    </div>
  );
};

export default CommunicationNetworks;