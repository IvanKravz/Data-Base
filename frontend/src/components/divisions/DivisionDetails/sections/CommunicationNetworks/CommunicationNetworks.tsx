// CommunicationNetworks.tsx
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useParams, useNavigate, useSearchParams, useLocation } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { RootState } from '../../../../../store/store';
import './CommunicationNetworks.css';
import { Network } from '../../../../../types';
import NetworksTable from '../../../../networks/NetworksTable/NetworksTable';
import NetworkDetails from '../../../../networks/NetworkDetails/NetworkDetails';
import { networksApi } from '../../../../../api/networksApi';
import { Header } from '../../../../networks/Header/Header';
import { divisionsApi } from '../../../../../api/divisions';
import NetworkVisualizationWithTabs from '../../../../networks/NetworkVisualization/components/NetworkVisualizationWithTabs';
// import NetworkVisualizationWithTabs from '../../../../networks/NetworkVisualization/NetworkVisualization';

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
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [division, setDivision] = useState<any>(null);

  const user = useSelector((state: RootState) => state.auth.user);
  const permissions = user?.permissions;

  // Проверка прав
  const canEditNetworks = useMemo(() =>
    permissions?.models?.CommunicationNetwork?.includes('change') ?? false, [permissions]);
  const canCreateNetworks = useMemo(() =>
    permissions?.models?.CommunicationNetwork?.includes('add') ?? false, [permissions]);

  const isExploitationUser = useMemo(() =>
    user?.roles?.includes('exploitation_chief') || user?.roles?.includes('exploitation_employee'), [user]);
  const isChief = useMemo(() => user?.roles?.includes('exploitation_chief'), [user]);

  const isGlobalView = useMemo(() => !id && !isExploitationUser, [id, isExploitationUser]);

  const userDivisionId = useMemo(() => user?.division_info?.id ?? null, [user]);

  // Функция загрузки данных
  const fetchData = useCallback(async () => {
    if (!token) return;

    try {
      setLoading(true);
      setError(null);

      if (isGlobalView) {
        const allNetworks = await networksApi.getNetworks(token);
        setNetworks(allNetworks);
      } else if (isExploitationUser) {
        if (!userDivisionId) {
          setError('У вашей учетной записи не назначено подразделение');
          return;
        }
        const divisionData = await divisionsApi.getDivisionById(userDivisionId, token);
        setDivision(divisionData);
        const divisionNetworks = await networksApi.getNetworks(token, userDivisionId);
        setNetworks(divisionNetworks);
      } else {
        if (!id) return;
        const divisionData = await divisionsApi.getDivisionById(id, token);
        setDivision(divisionData);
        const divisionNetworks = await networksApi.getNetworks(token, id);
        setNetworks(divisionNetworks);
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

  // Загрузка членств и направлений при выборе сети
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
    <div className="communication-networks-container">
      <div className="communication-networks-main">
        <Header
          onNavigateToManagement={handleNavigateToManagement}
          onNavigateToCreate={handleNavigateToCreate}
          divisionId={id}
          divisionName={divisionName}
          canCreateNetworks={canCreateNetworks}
        />

        <div className="networks-content">
          <NetworksTable
            networks={networks}
            onSelect={setSelectedNetwork}
            selectedNetwork={selectedNetwork}
            divisionId={targetDivisionId}
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