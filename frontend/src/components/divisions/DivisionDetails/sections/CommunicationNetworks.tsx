import React, { useState, useEffect } from 'react';
import './CommunicationNetworks.css';
import { Network } from '../../../../types';
import NetworksTable from '../../../networks/NetworksTable/NetworksTable';
import NetworkDetails from '../../../networks/NetworkDetails/NetworkDetails';
import NetworkVisualization from '../../../networks/NetworkVisualization/NetworkVisualization';
import { networksApi } from '../../../../api/networksApi';
import { Header } from '../../../networks/Header/Header';
// import LoadingSpinner from '../../../common/LoadingSpinner/LoadingSpinner';

const CommunicationNetworks: React.FC = () => {
  const token = localStorage.getItem('accessToken');
  const [selectedNetwork, setSelectedNetwork] = useState<Network | null>(null);
  const [highlightedNode, setHighlightedNode] = useState<string | null>(null);
  const [networks, setNetworks] = useState<Network[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchNetworks = async () => {
      try {
        const data = await networksApi.getNetworks(token!);
        setNetworks(data);
      } catch (err) {
        setError('Не удалось загрузить список сетей');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchNetworks();
  }, [token]);

  const handleCreateNetwork = async (networkData: Omit<Network, 'id'>) => {
    try {
      const newNetwork = await networksApi.createNetwork(token, networkData);
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

  // if (loading) return <LoadingSpinner />;
  if (error) return <div className="error-message">{error}</div>;

  return (
    <div className="communication-networks-container">
      <div className="communication-networks-main">
        <Header onCreateNetwork={handleCreateNetwork} />
        <div className="networks-content">
          <NetworksTable 
            networks={networks}
            onSelect={setSelectedNetwork} 
            selectedNetwork={selectedNetwork} 
          />
          {selectedNetwork && (
            <NetworkVisualization 
              network={selectedNetwork} 
              highlightedNode={highlightedNode}
            />
          )}
        </div>
      </div>
      
      <aside className="network-details-sidebar">
        <NetworkDetails 
          network={selectedNetwork} 
          onHighlightNode={handleHighlightNode}
          onClearHighlight={handleClearHighlight}
        />
      </aside>
    </div>
  );
};

export default CommunicationNetworks;