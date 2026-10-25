// src/components/networks/modals/SubnetModal.tsx
import React, { useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { Subnet, CommunicationNetwork, VLAN } from '../../../types';
import { networksApi } from '../../../api/networksApi';
import './Modal.css';

interface Props {
  token: string;
  subnet: Subnet | null;
  networkId?: string;
  onSaved: (createdId?: string) => void;
  onClose: () => void;
}

const PREFIXES = Array.from({ length: 31 - 24 + 1 }, (_, i) => 24 + i);

const SubnetModal: React.FC<Props> = ({ token, subnet, networkId, onSaved, onClose }) => {
  const [networkAddr, setNetworkAddr] = useState('');
  const [prefix, setPrefix] = useState<number>(24);
  const [vlanId, setVlanId] = useState('');
  const [purpose, setPurpose] = useState('');
  const [gateway, setGateway] = useState('');
  const [description, setDescription] = useState('');
  const [network, setNetwork] = useState<string>(networkId || '');
  const [dhcpEnabled, setDhcpEnabled] = useState(false);
  const [dhcpStart, setDhcpStart] = useState('');
  const [dhcpEnd, setDhcpEnd] = useState('');

  const [networks, setNetworks] = useState<CommunicationNetwork[]>([]);
  const [vlans, setVlans] = useState<VLAN[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([networksApi.getNetworks(token), networksApi.getVlans(token)])
      .then(([nets, vs]) => {
        setNetworks(nets);
        setVlans(vs);
        if (!network && nets.length === 1) setNetwork(String(nets[0].id));
      })
      .catch(() => { /* игнорируем — ошибка попадёт в сохранение */ });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  useEffect(() => {
    if (subnet) {
      setNetworkAddr(subnet.network_address);
      setPrefix(subnet.prefix_length);
      setVlanId(subnet.vlan || '');
      setPurpose(subnet.purpose);
      setGateway(subnet.gateway || '');
      setDescription(subnet.description);
      setNetwork(subnet.network);
      setDhcpEnabled(subnet.dhcp_enabled);
      setDhcpStart(subnet.dhcp_pool_start || '');
      setDhcpEnd(subnet.dhcp_pool_end || '');
    }
  }, [subnet]);

  const preview = useMemo(() => {
    try {
      const parts = networkAddr.split('.').map(n => parseInt(n, 10));
      if (parts.length !== 4 || parts.some(isNaN)) return null;
      const [a, b, c, d] = parts;
      const ipNum = ((a << 24) | (b << 16) | (c << 8) | d) >>> 0;
      const mask = prefix === 0 ? 0 : (~0 << (32 - prefix)) >>> 0;
      const netNum = (ipNum & mask) >>> 0;
      const bcast = (netNum | (~mask >>> 0)) >>> 0;
      const fmt = (n: number) =>
        [n >>> 24, (n >>> 16) & 255, (n >>> 8) & 255, n & 255].join('.');
      const hosts = prefix === 31 ? 2 : Math.max((bcast - netNum - 1) >>> 0, 0);
      return {
        netmask: fmt(mask),
        network: fmt(netNum),
        broadcast: fmt(bcast),
        hosts,
        isNetwork: netNum === ipNum,
      };
    } catch {
      return null;
    }
  }, [networkAddr, prefix]);

  const handleSave = async () => {
    if (!networkAddr || !network) {
      setError('Укажите адрес сети и выберите сеть связи');
      return;
    }
    setSaving(true);
    setError(null);
    try {
      // Если адрес не сетевой — используем вычисленный сетевой адрес
      const effectiveAddr = preview?.network ?? networkAddr;

      const payload = {
        network,
        network_address: effectiveAddr,
        prefix_length: prefix,
        vlan: vlanId || null,
        purpose: purpose || '',
        gateway: gateway || null,
        description: description || '',
        dhcp_enabled: dhcpEnabled,
        dhcp_pool_start: dhcpEnabled ? dhcpStart || null : null,
        dhcp_pool_end: dhcpEnabled ? dhcpEnd || null : null,
      };

      let savedId: string | undefined;
      if (subnet) {
        await networksApi.updateSubnet(token, subnet.id, payload);
        savedId = subnet.id;
      } else {
        const created = await networksApi.createSubnet(token, payload);
        savedId = String(created.id);
      }
      onSaved(savedId);
    } catch (e: any) {
      const data = e?.response?.data;
      setError(
        data
          ? typeof data === 'string'
            ? data
            : Object.entries(data)
                .map(([k, v]) => `${k}: ${JSON.stringify(v)}`)
                .join('; ')
          : 'Ошибка сохранения',
      );
    } finally {
      setSaving(false);
    }
  };

  return createPortal(
    <div className="modal-overlay">
      <div className="modal" style={{ width: 640, maxWidth: '95vw' }}>
        <div className="modal-header">
          <h2>{subnet ? `Изменить подсеть ${subnet.cidr}` : 'Новая подсеть'}</h2>
          <button className="close-button" onClick={onClose}>×</button>
        </div>
        <div className="modal-form">
          <div className="form-group">
            <label>Сеть связи *</label>
            <select value={network} onChange={e => setNetwork(e.target.value)} required>
              <option value="">— выберите сеть —</option>
              {networks.map(n => (
                <option key={n.id} value={n.id}>{n.name}</option>
              ))}
            </select>
          </div>

          <div className="form-row">
            <div className="form-group" style={{ flex: 3 }}>
              <label>Адрес сети *</label>
              <input
                value={networkAddr}
                onChange={e => setNetworkAddr(e.target.value)}
                placeholder="192.168.10.0"
              />
            </div>
            <div className="form-group" style={{ flex: 1, maxWidth: 120 }}>
              <label>Маска</label>
              <select value={prefix} onChange={e => setPrefix(Number(e.target.value))}>
                {PREFIXES.map(p => (
                  <option key={p} value={p}>/{p}</option>
                ))}
              </select>
            </div>
          </div>

          {preview && (
            <div className="subnet-preview">
              <div>Маска: <b>{preview.netmask}</b></div>
              <div>Сеть: <b>{preview.network}</b></div>
              <div>Broadcast: <b>{preview.broadcast}</b></div>
              <div>Хостов: <b>{preview.hosts}</b></div>
              {!preview.isNetwork && (
                <div className="subnet-preview-warn">
                  Адрес не является сетевым — будет сохранён как {preview.network}
                </div>
              )}
            </div>
          )}

          <div className="form-group">
            <label>VLAN</label>
            <select value={vlanId} onChange={e => setVlanId(e.target.value)}>
              <option value="">— не указан —</option>
              {vlans.map(v => (
                <option key={v.id} value={v.id}>
                  {v.name} (VLAN {v.vlan_id})
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label>Назначение</label>
            <input
              value={purpose}
              onChange={e => setPurpose(e.target.value)}
              placeholder="Пользовательская / DMZ / CCTV…"
            />
          </div>

          <div className="form-group">
            <label>Шлюз</label>
            <input
              value={gateway}
              onChange={e => setGateway(e.target.value)}
              placeholder="192.168.10.1"
            />
          </div>

          <div className="form-group">
            <label>
              <input
                type="checkbox"
                checked={dhcpEnabled}
                onChange={e => setDhcpEnabled(e.target.checked)}
              />{' '}
              DHCP включён
            </label>
          </div>

          {dhcpEnabled && (
            <div className="form-row">
              <div className="form-group">
                <label>DHCP: начало</label>
                <input value={dhcpStart} onChange={e => setDhcpStart(e.target.value)} />
              </div>
              <div className="form-group">
                <label>DHCP: конец</label>
                <input value={dhcpEnd} onChange={e => setDhcpEnd(e.target.value)} />
              </div>
            </div>
          )}

          <div className="form-group">
            <label>Описание</label>
            <textarea
              value={description}
              onChange={e => setDescription(e.target.value)}
              rows={3}
            />
          </div>

          {error && <div className="error">{error}</div>}

          <div className="modal-actions">
            <button type="button" onClick={onClose}>Отмена</button>
            <button type="button" disabled={saving} onClick={handleSave}>
              {saving ? 'Сохранение…' : 'Сохранить'}
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body,
  );
};

export default SubnetModal;