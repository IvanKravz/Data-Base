import React, { useState, useEffect } from 'react';
import { Equipment } from '../../../../../types';
import { equipmentApi } from '../../../../../api/equipment';
import {
  NetworkInterface,
  VLAN,
  IPAddress,
  ACL,
  RoutingTable
} from '../../../../../types';
import { Card, Button, Spin, Empty } from 'antd';
import { Plus, RefreshCw } from 'lucide-react';
import './style.css'
import { NetworkInterfaceCard } from './sections/NetworkInterfaceCard';
import { VLANCard } from './sections/VLANCard';
import { IPAddressCard } from './sections/IPAddressCard';
import { RouteCard } from './sections/RouteCard';
import { ACLCard } from './sections/ACLCard';

const { Meta } = Card;

interface NetworkConfigBlockProps {
  equipment: Equipment;
  token: string;
}

export function NetworkConfigBlock({ equipment, token }: NetworkConfigBlockProps) {
  const [interfaces, setInterfaces] = useState<NetworkInterface[]>([]);
  const [vlans, setVlans] = useState<VLAN[]>([]);
  const [ipAddresses, setIpAddresses] = useState<IPAddress[]>([]);
  const [acls, setAcls] = useState<ACL[]>([]);
  const [routingTable, setRoutingTable] = useState<RoutingTable[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    if (equipment.is_network) {
      loadNetworkConfig();
    }
  }, [equipment.id]);

  const loadNetworkConfig = async () => {
    try {
      setRefreshing(true);
      const config = await equipmentApi.getNetworkConfig(token, equipment.id);
      setInterfaces(config.interfaces || []);
      setVlans(config.vlans || []);
      setIpAddresses(config.ip_addresses || []);
      setAcls(config.acls || []);
      setRoutingTable(config.routing_table || []);
    } catch (error) {
      console.error('Ошибка загрузки сетевой конфигурации:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  if (!equipment.is_network) return null;

  const renderSection = (title: string, items: any[], Component: React.ComponentType<any>, emptyText: string) => (
    <div className="net-config-section">
      <div className="net-section-header">
        <h3>{title}</h3>
        <Button type="primary" size="small" icon={<Plus size={14} />}>
          Добавить
        </Button>
      </div>
      {items.length === 0 ? (
        <Empty description={emptyText} image={Empty.PRESENTED_IMAGE_SIMPLE} />
      ) : (
        <div className="net-items-container">
          {items.map((item) => (
            <Component
              key={item.id}
              data={item}
              token={token}
              onUpdate={loadNetworkConfig}
            />
          ))}
        </div>
      )}
    </div>
  );

  return (
    <Card
      className="net-config-block"
      styles={{
        body: {
          padding: '24px',
          background: 'linear-gradient(135deg, #fafafa 0%, #ffffff 100%)'
        }
      }}
      title={
        <div className="net-config-header">
          <span className="net-config-title">Сетевая конфигурация</span>
          <Meta description="Настройки сетевых интерфейсов, VLAN, IP-адресов и маршрутизации" />
        </div>
      }
    >


      <div className="net-config-sections">
        <div className="net-config-section">
          {loading &&
            <div className="net-config-loading">
              <Spin size="large" />
              <div className="net-loading-text">Загрузка сетевой конфигурации...</div>
            </div>
          }
          <div className="net-section-header">
            <h3>Сетевые интерфейсы</h3>
            <Button type="primary" size="small" icon={<Plus size={14} />}>
              Добавить
            </Button>
          </div>
          {interfaces.length === 0 ? (
            <Empty description="Нет сетевых интерфейсов" image={Empty.PRESENTED_IMAGE_SIMPLE} />
          ) : (
            <div className="net-interfaces-container">
              <div className="net-interfaces-table">
                <div className="net-table-header">
                  <div className="net-table-cell">Интерфейс</div>
                  <div className="net-table-cell">Тип</div>
                  <div className="net-table-cell">Порт</div>
                  <div className="net-table-cell">Тип порта</div>
                  <div className="net-table-cell">Режим порта</div>
                  <div className="net-table-cell">MAC-адрес</div>
                  <div className="net-table-cell">MTU</div>
                  <div className="net-table-cell">Скорость</div>
                  <div className="net-table-cell">Access VLAN</div>
                  <div className="net-table-cell">Подключен к</div>
                  <div className="net-table-cell">Устройство</div>
                  <div className="net-table-cell">Статус</div>
                  <div className="net-table-cell">Действия</div>
                </div>
                {interfaces.map((item) => (
                  <NetworkInterfaceCard
                    key={item.id}
                    data={item}
                    token={token}
                    onUpdate={loadNetworkConfig}
                  />
                ))}
              </div>
            </div>
          )}
        </div>

        {renderSection(
          "VLANы",
          vlans,
          VLANCard,
          "Нет VLAN"
        )}

        {renderSection(
          "IP-адреса",
          ipAddresses,
          IPAddressCard,
          "Нет IP-адресов"
        )}

        {renderSection(
          "Таблица маршрутизации",
          routingTable,
          RouteCard,
          "Нет записей маршрутизации"
        )}

        {renderSection(
          "ACL (Access Control Lists)",
          acls,
          ACLCard,
          "Нет ACL правил"
        )}
      </div>
    </Card>
  );
}