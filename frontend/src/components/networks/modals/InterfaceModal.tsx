// src/components/networks/modals/InterfaceModal.tsx
import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { NetworkInterface, NetworkInterfaceInput, Equipment, VLAN } from '../../../types';
import './Modal.css';

interface Props {
  interface: NetworkInterface | null;
  equipmentList: Equipment[];
  vlanList: VLAN[];
  onSave: (data: NetworkInterfaceInput) => void;
  onClose: () => void;
}

const InterfaceModal: React.FC<Props> = ({
  interface: intf,
  equipmentList,
  vlanList,
  onSave,
  onClose,
}) => {
  const [name, setName] = useState('');
  const [interfaceType, setInterfaceType] = useState<NetworkInterfaceInput['interface_type']>('physical');
  const [physicalType, setPhysicalType] = useState('');
  const [portNumber, setPortNumber] = useState('');
  const [slot, setSlot] = useState('');
  const [module, setModule] = useState('');
  const [enabled, setEnabled] = useState(true);
  const [macAddress, setMacAddress] = useState('');
  const [mtu, setMtu] = useState('1500');
  const [speed, setSpeed] = useState('');
  const [accessVlanId, setAccessVlanId] = useState('');
  const [isTrunk, setIsTrunk] = useState(false);
  const [nativeVlanId, setNativeVlanId] = useState('');
  const [equipmentId, setEquipmentId] = useState('');

  useEffect(() => {
    if (intf) {
      setName(intf.name);
      setInterfaceType(intf.interface_type);
      setPhysicalType(intf.physical_type || '');
      setPortNumber(intf.port_number?.toString() || '');
      setSlot(intf.slot?.toString() || '');
      setModule(intf.module?.toString() || '');
      setEnabled(intf.enabled);
      setMacAddress(intf.mac_address || '');
      setMtu(intf.mtu?.toString() || '1500');
      setSpeed(intf.speed || '');
      setAccessVlanId(intf.access_vlan || '');
      setIsTrunk(intf.is_trunk);
      setNativeVlanId(intf.native_vlan || '');
      setEquipmentId(intf.equipment || '');
    } else {
      setName('');
      setInterfaceType('physical');
      setPhysicalType('');
      setPortNumber('');
      setSlot('');
      setModule('');
      setEnabled(true);
      setMacAddress('');
      setMtu('1500');
      setSpeed('');
      setAccessVlanId('');
      setIsTrunk(false);
      setNativeVlanId('');
      setEquipmentId('');
    }
  }, [intf]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !equipmentId) {
      alert('Заполните обязательные поля: Оборудование и Название');
      return;
    }
    onSave({
      equipment: equipmentId,
      name,
      interface_type: interfaceType,
      physical_type: (physicalType || null) as any,
      port_number: portNumber ? parseInt(portNumber) : null,
      slot: slot ? parseInt(slot) : null,
      module: module ? parseInt(module) : null,
      enabled,
      mac_address: macAddress,
      mtu: parseInt(mtu),
      speed,
      access_vlan: accessVlanId || null,
      is_trunk: isTrunk,
      native_vlan: nativeVlanId || null,
      connected_to: intf?.connected_to ?? null,
      mode: intf?.mode ?? 'access',
    });
  };

  return createPortal(
    <div className="modal-overlay">
      <div className="modal">
        <div className="modal-header">
          <h2>{intf ? 'Редактировать интерфейс' : 'Добавить интерфейс'}</h2>
          <button className="close-button" onClick={onClose}>×</button>
        </div>
        <form onSubmit={handleSubmit} className="modal-form">
          <div className="form-group">
            <label>Оборудование *</label>
            <select value={equipmentId} onChange={e => setEquipmentId(e.target.value)} required>
              <option value="">— выберите —</option>
              {equipmentList.map(eq => (
                <option key={eq.id} value={eq.id}>{eq.name}</option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label>Название *</label>
            <input value={name} onChange={e => setName(e.target.value)} required />
          </div>

          <div className="form-group">
            <label>Тип интерфейса</label>
            <select
              value={interfaceType}
              onChange={e => setInterfaceType(e.target.value as any)}
            >
              <option value="physical">Физический порт</option>
              <option value="bond">Bond / LAG</option>
              <option value="bridge">Bridge</option>
              <option value="vlan">VLAN Interface</option>
              <option value="loopback">Loopback</option>
              <option value="port-channel">Port-Channel</option>
              <option value="tunnel">Tunnel</option>
              <option value="virtual">Виртуальный</option>
              <option value="other">Другой</option>
            </select>
          </div>

          {interfaceType === 'physical' && (
            <>
              <div className="form-group">
                <label>Тип порта</label>
                <select value={physicalType} onChange={e => setPhysicalType(e.target.value)}>
                  <option value="">— не выбран —</option>
                  <option value="rj45">RJ-45</option>
                  <option value="sfp">SFP</option>
                  <option value="sfp+">SFP+</option>
                  <option value="qsfp">QSFP</option>
                  <option value="console">Console</option>
                  <option value="usb">USB</option>
                </select>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Слот</label>
                  <input type="number" value={slot} onChange={e => setSlot(e.target.value)} min="0" />
                </div>
                <div className="form-group">
                  <label>Модуль</label>
                  <input type="number" value={module} onChange={e => setModule(e.target.value)} min="0" />
                </div>
                <div className="form-group">
                  <label>Номер порта</label>
                  <input type="number" value={portNumber} onChange={e => setPortNumber(e.target.value)} min="1" />
                </div>
              </div>
            </>
          )}

          <div className="form-row">
            <div className="form-group">
              <label>Скорость</label>
              <input
                value={speed}
                onChange={e => setSpeed(e.target.value)}
                placeholder="например, 1Gbps"
              />
            </div>
            <div className="form-group">
              <label>MTU</label>
              <input
                type="number"
                value={mtu}
                onChange={e => setMtu(e.target.value)}
                min="68"
                max="9000"
              />
            </div>
          </div>

          <div className="form-group">
            <label>MAC-адрес</label>
            <input
              value={macAddress}
              onChange={e => setMacAddress(e.target.value)}
              placeholder="00:1A:2B:3C:4D:5E"
            />
          </div>

          <div className="form-group">
            <label>
              <input type="checkbox" checked={enabled} onChange={e => setEnabled(e.target.checked)} />{' '}
              Включен
            </label>
          </div>

          <div className="form-group">
            <label>Access VLAN</label>
            <select value={accessVlanId} onChange={e => setAccessVlanId(e.target.value)}>
              <option value="">— не указан —</option>
              {vlanList.map(v => (
                <option key={v.id} value={v.id}>
                  {v.name} (VLAN {v.vlan_id})
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label>
              <input type="checkbox" checked={isTrunk} onChange={e => setIsTrunk(e.target.checked)} />{' '}
              Trunk порт
            </label>
          </div>

          {isTrunk && (
            <div className="form-group">
              <label>Native VLAN</label>
              <select value={nativeVlanId} onChange={e => setNativeVlanId(e.target.value)}>
                <option value="">— не указан —</option>
                {vlanList.map(v => (
                  <option key={v.id} value={v.id}>
                    {v.name} (VLAN {v.vlan_id})
                  </option>
                ))}
              </select>
            </div>
          )}

          <div className="modal-actions">
            <button type="button" onClick={onClose}>Отмена</button>
            <button type="submit">Сохранить</button>
          </div>
        </form>
      </div>
    </div>,
    document.body,
  );
};

export default InterfaceModal;