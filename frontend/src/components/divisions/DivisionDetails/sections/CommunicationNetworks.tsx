import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import './CommunicationNetworks.css';
import { Network } from '../../../../types';
import NetworksTable from '../../../networks/NetworksTable/NetworksTable';
import NetworkDetails from '../../../networks/NetworkDetails/NetworkDetails';
import NetworkVisualization from '../../../networks/NetworkVisualization/NetworkVisualization';
import { networksApi } from '../../../../api/networksApi';
import { Header } from '../../../networks/Header/Header';
import NetworkTabs from '../../../networks/NetworkTabs/NetworkTabs';

const CommunicationNetworks: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const token = localStorage.getItem('accessToken');
  const [selectedNetwork, setSelectedNetwork] = useState<Network | null>(null);
  const [memberships, setMemberships] = useState<any[]>([]);
  const [directions, setDirections] = useState<any[]>([]);
  const [highlightedNode, setHighlightedNode] = useState<string | null>(null);
  const [networks, setNetworks] = useState<Network[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeView, setActiveView] = useState('networks'); // 'networks' или 'management'

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

    if (token && activeView === 'networks') {
      fetchNetworks();
    }
  }, [token, activeView, id]);

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

  const handleCreateNetwork = async (networkData: Omit<Network, 'id'>) => {
    try {
      const newNetwork = await networksApi.createNetwork(token!, networkData);
      setNetworks(prev => [...prev, newNetwork]);
    } catch (err) {
      setError('Ошибка при создании сети');
      console.error(err);
    }
  };

  const handleHighlightNode = (nodeId: string) => {
    setHighlightedNode(nodeId);
  };

  const handleClearHighlight = () => {
    setHighlightedNode(null);
  };

  const toggleView = () => {
    setActiveView(activeView === 'networks' ? 'management' : 'networks');
  };

  if (error) return <div className="error-message">{error}</div>;

  return (
    <div className="communication-networks-container">
      <div className="communication-networks-main">
        <Header
          onCreateNetwork={handleCreateNetwork}
          onToggleView={toggleView}
          viewMode={activeView}
          divisionId={id}
        />

        {activeView === 'networks' ? (
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
              />
            )}
          </div>
        ) : (
          <NetworkTabs token={token} />
        )}
      </div>

      {activeView === 'networks' && (
        <aside className="network-details-sidebar">
          <NetworkDetails
            network={selectedNetwork}
            onHighlightNode={handleHighlightNode}
            onClearHighlight={handleClearHighlight}
            divisionId={id}
          />
        </aside>
      )}
    </div>
  );
};

export default CommunicationNetworks;