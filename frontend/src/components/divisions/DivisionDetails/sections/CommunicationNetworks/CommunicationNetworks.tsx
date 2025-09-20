import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import './CommunicationNetworks.css';
import { Network } from '../../../../../types';
import NetworksTable from '../../../../networks/NetworksTable/NetworksTable';
import NetworkDetails from '../../../../networks/NetworkDetails/NetworkDetails';
import NetworkVisualization from '../../../../networks/NetworkVisualization/NetworkVisualization';
import { networksApi } from '../../../../../api/networksApi';
import { Header } from '../../../../networks/Header/Header';

const CommunicationNetworks: React.FC = () => {
  const { id } = useParams<{ id: string }>();
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

  useEffect(() => {
    const fetchNetworks = async () => {
      try {
        const data = await networksApi.getNetworks(token!, id!);
        setNetworks(data);
      } catch (err) {
        setError('Не удалось загрузить список сетей');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    if (token) {
      fetchNetworks();
    }
  }, [token, id]);

  // Загрузка членств и направлений при выборе сети
  useEffect(() => {
    const fetchNetworkData = async () => {
      if (!selectedNetwork || !token) return;

      try {
        // Загрузка членств сети
        const membershipsData = await networksApi.getNetworkMemberships(token, selectedNetwork.id.toString());
        setMemberships(membershipsData);

        // Загрузка направлений сети
        const directionsData = await networksApi.getNetworkDirections(token, selectedNetwork.id.toString());
        setDirections(directionsData);
      } catch (err) {
        console.error('Ошибка загрузки данных сети:', err);
        setError('Не удалось загрузить данные сети');
      }
    };

    fetchNetworkData();
  }, [selectedNetwork, token]);

  const handleHighlightNode = (nodeId: string) => {
    setHighlightedNode(nodeId);
  };

  const handleClearHighlight = () => {
    setHighlightedNode(null);
  };

  const handleNavigateToManagement = () => {
    navigate(`/divisions/${id}/networks/management`);
  };

  const handleNavigateToCreate = () => {
    navigate(`/divisions/${id}/networks/create`);
  };

  const handleNodeSelect = (nodeId: string) => {
    setSelectedNode(nodeId);
  };

  const handleClearSelection = () => {
    setSelectedNode(null);
  };

  if (error) return <div className="error-message">{error}</div>;

  return (
    <div className="communication-networks-container">
      <div className="communication-networks-main">
        <Header
          onNavigateToManagement={handleNavigateToManagement}
          onNavigateToCreate={handleNavigateToCreate}
          divisionId={id}
        />

        <div className="networks-content">
          <NetworksTable
            networks={networks}
            onSelect={setSelectedNetwork}
            selectedNetwork={selectedNetwork}
            divisionId={id}
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
          onNodeSelect={handleNodeSelect} // Передаем обработчик
          divisionId={id}
        />
      </aside>
    </div>
  );
};

export default CommunicationNetworks;