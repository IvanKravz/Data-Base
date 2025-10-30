// CommunicationNetworks.tsx
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import './CommunicationNetworks.css';
import { Network } from '../../../../../types';
import NetworksTable from '../../../../networks/NetworksTable/NetworksTable';
import NetworkDetails from '../../../../networks/NetworkDetails/NetworkDetails';
import NetworkVisualization from '../../../../networks/NetworkVisualization/NetworkVisualization';
import { networksApi } from '../../../../../api/networksApi';
import { Header } from '../../../../networks/Header/Header';
import { isExploitationChief, isExploitationEmployee, getCurrentUser, getPermissions } from '../../../../../api/utils/permissions';
import { divisionsApi } from '../../../../../api/divisions';

const CommunicationNetworks: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
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

  // Получаем данные текущего пользователя
  const currentUser = getCurrentUser();

  // Мемоизируем вычисления типов пользователей
  const isExploitationUser = useMemo(() => isExploitationChief() || isExploitationEmployee(), []);
  const isChief = useMemo(() => isExploitationChief(), []);

  // Для эксплуатационных пользователей отключаем глобальный режим
  const isGlobalView = useMemo(() => !id && !isExploitationUser, [id, isExploitationUser]);

  // Получаем ID подразделения пользователя
  const userDivisionId = useMemo(() => {
    if (!currentUser?.division_info) return null;
    return currentUser.division_info.id;
  }, [currentUser]);

  // Проверка прав доступа для редактирования сетей
  const canEditNetworks = useMemo(() => {
    const permissions = getPermissions();
    if (permissions && permissions.networks) {
      return permissions.networks.can_edit;
    }
    if (permissions && permissions.employees) {
      return permissions.employees.can_edit;
    }
    return false;
  }, []);

  // Проверка прав доступа для создания сетей
  const canCreateNetworks = useMemo(() => {
    const permissions = getPermissions();
    if (permissions && permissions.employees) {
      return permissions.employees.can_edit;
    }
    return false;
  }, []);

  // Функция загрузки данных
  const fetchData = useCallback(async () => {
    if (!token) return;

    try {
      setLoading(true);
      setError(null);

      if (isGlobalView) {
        // Глобальный режим - загружаем все сети
        const allNetworks = await networksApi.getNetworks(token);
        setNetworks(allNetworks);
      } else if (isExploitationUser) {
        // Режим для эксплуатационных пользователей - загружаем все сети подразделения
        if (!userDivisionId) {
          setError('У вашей учетной записи не назначено подразделение');
          return;
        }

        const divisionData = await divisionsApi.getDivisionById(userDivisionId, token);
        setDivision(divisionData);

        // Загружаем все сети подразделения (без фильтрации по отделению)
        const divisionNetworks = await networksApi.getNetworks(token, userDivisionId);
        setNetworks(divisionNetworks);
      } else {
        // Стандартный режим подразделения
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

  // Основной эффект загрузки данных
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

  // Обработчик удаления сети
  const handleDeleteNetwork = async (networkId: string) => {
    if (!token) return;

    if (window.confirm('Вы уверены, что хотите удалить эту сеть? Это действие нельзя отменить.')) {
      try {
        await networksApi.deleteNetwork(token, networkId);
        // Обновляем список сетей после удаления
        fetchData();
        // Если удаленная сеть была выбрана, сбрасываем выбор
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
      navigate('/networks/management');
    } else if (isExploitationUser && userDivisionId) {
      navigate(`/divisions/${userDivisionId}/networks/management`);
    } else if (id) {
      navigate(`/divisions/${id}/networks/management`);
    }
  };

  const handleNavigateToCreate = () => {
    if (isGlobalView) {
      navigate('/networks/create');
    } else if (isExploitationUser && userDivisionId) {
      navigate(`/divisions/${userDivisionId}/networks/create`);
    } else if (id) {
      navigate(`/divisions/${id}/networks/create`);
    }
  };

  const handleNodeSelect = (nodeId: string) => {
    setSelectedNode(nodeId);
  };

  const handleClearSelection = () => {
    setSelectedNode(null);
  };

  // Определяем divisionName для заголовка
  const divisionName = useMemo(() => {
    if (isGlobalView) {
      return null;
    }

    if (isExploitationUser) {
      return currentUser?.division_info?.name || 'Ваше подразделение';
    }

    return division?.name || '';
  }, [isGlobalView, isExploitationUser, currentUser, division]);

  // Определяем ID подразделения для передачи в дочерние компоненты
  const targetDivisionId = useMemo(() => {
    if (isGlobalView) {
      return undefined;
    }
    
    if (isExploitationUser) {
      return userDivisionId;
    }
    
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
          divisionId={targetDivisionId}
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
            <NetworkVisualization
              network={selectedNetwork}
              memberships={memberships}
              directions={directions}
              highlightedNode={highlightedNode}
              selectedNode={selectedNode}
              onNodeSelect={handleNodeSelect}
              onClearSelection={handleClearSelection}
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