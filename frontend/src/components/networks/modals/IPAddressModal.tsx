import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { IPAddress, NetworkInterface } from '../../../types';
import './Modal.css';

interface IPAddressModalProps {
  ipAddress: IPAddress | null;
  interfaces: NetworkInterface[];
  onSave: (ipData: Omit<IPAddress, 'id'>) => void;
  onClose: () => void;
}

const IPAddressModal: React.FC<IPAddressModalProps> = ({
  ipAddress,
  interfaces,
  onSave,
  onClose
}) => {
  const [address, setAddress] = useState('');
  const [netmask, setNetmask] = useState('');
  const [version, setVersion] = useState('IPv4');
  const [isPrimary, setIsPrimary] = useState(false);
  const [gateway, setGateway] = useState('');
  const [dnsServers, setDnsServers] = useState('');
  const [description, setDescription] = useState('');
  const [interfaceId, setInterfaceId] = useState('');

  useEffect(() => {
    if (ipAddress) {
      setAddress(ipAddress.address);
      setNetmask(ipAddress.netmask);
      setVersion(ipAddress.version);
      setIsPrimary(ipAddress.is_primary);
      setGateway(ipAddress.gateway || '');
      setDnsServers(ipAddress.dns_servers || '');
      setDescription(ipAddress.description || '');
      setInterfaceId(ipAddress.interface?.id || '');
    } else {
      setAddress('');
      setNetmask('');
      setVersion('IPv4');
      setIsPrimary(false);
      setGateway('');
      setDnsServers('');
      setDescription('');
      setInterfaceId('');
    }
  }, [ipAddress]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!address || !netmask || !interfaceId) {
      alert('Пожалуйста, заполните обязательные поля');
      return;
    }
    onSave({
      address,
      netmask,
      version,
      is_primary: isPrimary,
      gateway: gateway || null,
      dns_servers: dnsServers || null,
      description: description || null,
      interface: interfaceId
    });
  };

  return createPortal(
    <div className="modal-overlay">
      <div className="modal">
        <div className="modal-header">
          <h2>{ipAddress ? 'Редактировать IP-адрес' : 'Добавить IP-адрес'}</h2>
          <button className="close-button" onClick={onClose}>×</button>
        </div>
        <form onSubmit={handleSubmit} className="modal-form">
          <div className="form-group">
            <label htmlFor="interface">Интерфейс *</label>
            <select
              id="interface"
              value={interfaceId}
              onChange={(e) => setInterfaceId(e.target.value)}
              required
            >
              <option value="">Выберите интерфейс</option>
              {interfaces.map(intf => (
                <option key={intf.id} value={intf.id}>
                  {intf.name} ({intf.equipment?.name})
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="version">Версия IP</label>
            <select
              id="version"
              value={version}
              onChange={(e) => setVersion(e.target.value)}
            >
              <option value="IPv4">IPv4</option>
              <option value="IPv6">IPv6</option>
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="address">IP-адрес *</label>
            <input
              type="text"
              id="address"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder={version === 'IPv4' ? '192.168.1.1' : '2001:db8::1'}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="netmask">Маска/префикс *</label>
            <input
              type="text"
              id="netmask"
              value={netmask}
              onChange={(e) => setNetmask(e.target.value)}
              placeholder={version === 'IPv4' ? '255.255.255.0 или /24' : '/64'}
              required
            />
          </div>

          <div className="form-group">
            <label>
              <input
                type="checkbox"
                checked={isPrimary}
                onChange={(e) => setIsPrimary(e.target.checked)}
              />
              Основной адрес
            </label>
          </div>

          <div className="form-group">
            <label htmlFor="gateway">Шлюз</label>
            <input
              type="text"
              id="gateway"
              value={gateway}
              onChange={(e) => setGateway(e.target.value)}
              placeholder={version === 'IPv4' ? '192.168.1.254' : '2001:db8::ffff'}
            />
          </div>

          <div className="form-group">
            <label htmlFor="dnsServers">DNS-серверы</label>
            <textarea
              id="dnsServers"
              value={dnsServers}
              onChange={(e) => setDnsServers(e.target.value)}
              placeholder="Укажите DNS-серверы через запятую"
              rows={2}
            />
          </div>

          <div className="form-group">
            <label htmlFor="description">Описание</label>
            <textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
            />
          </div>

          <div className="modal-actions">
            <button type="button" onClick={onClose}>Отмена</button>
            <button type="submit">Сохранить</button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
};

export default IPAddressModal;