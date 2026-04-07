import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { NetworkInterface, Equipment, VLAN } from '../../../types';
import './Modal.css';

interface InterfaceModalProps {
  interface: NetworkInterface | null;
  equipmentList: Equipment[];
  vlanList: VLAN[];
  onSave: (interfaceData: Omit<NetworkInterface, 'id'>) => void;
  onClose: () => void;
}

const InterfaceModal: React.FC<InterfaceModalProps> = ({
  interface: intf,
  equipmentList,
  vlanList,
  onSave,
  onClose
}) => {
  const [name, setName] = useState('');
  const [interfaceType, setInterfaceType] = useState('physical');
  const [physicalType, setPhysicalType] = useState('');
  const [portNumber, setPortNumber] = useState('');
  const [slot, setSlot] = useState('');
  const [module, setModule] = useState('');
  const [enabled, setEnabled] = useState(true);
  const [macAddress, setMacAddress] = useState('');
  const [mtu, setMtu] = useState('1500');
  const [speed, setSpeed] = useState('');
  const [vlanId, setVlanId] = useState('');
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
      setVlanId(intf.vlan?.id || '');
      setIsTrunk(intf.is_trunk);
      setNativeVlanId(intf.native_vlan?.id || '');
      setEquipmentId(intf.equipment?.id || '');
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
      setVlanId('');
      setIsTrunk(false);
      setNativeVlanId('');
      setEquipmentId('');
    }
  }, [intf]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !equipmentId) {
      alert('Пожалуйста, заполните обязательные поля');
      return;
    }
    onSave({
      name,
      interface_type: interfaceType,
      physical_type: physicalType || null,
      port_number: portNumber ? parseInt(portNumber) : null,
      slot: slot ? parseInt(slot) : null,
      module: module ? parseInt(module) : null,
      enabled,
      mac_address: macAddress,
      mtu: parseInt(mtu),
      speed: speed || null,
      vlan: vlanId || null,
      is_trunk: isTrunk,
      native_vlan: nativeVlanId || null,
      equipment: equipmentId
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
            <label htmlFor="equipment">Оборудование *</label>
            <select
              id="equipment"
              value={equipmentId}
              onChange={(e) => setEquipmentId(e.target.value)}
              required
            >
              <option value="">Выберите оборудование</option>
              {equipmentList.map(equip => (
                <option key={equip.id} value={equip.id}>{equip.name}</option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="name">Название *</label>
            <input
              type="text"
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="interfaceType">Тип интерфейса</label>
            <select
              id="interfaceType"
              value={interfaceType}
              onChange={(e) => setInterfaceType(e.target.value)}
            >
              <option value="physical">Физический порт</option>
              <option value="vlan">VLAN Interface</option>
              <option value="loopback">Loopback</option>
              <option value="port-channel">Port-Channel</option>
              <option value="tunnel">Tunnel</option>
              <option value="other">Другой</option>
            </select>
          </div>

          {interfaceType === 'physical' && (
            <>
              <div className="form-group">
                <label htmlFor="physicalType">Тип порта</label>
                <select
                  id="physicalType"
                  value={physicalType}
                  onChange={(e) => setPhysicalType(e.target.value)}
                >
                  <option value="">Выберите тип порта</option>
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
                  <label htmlFor="slot">Слот</label>
                  <input
                    type="number"
                    id="slot"
                    value={slot}
                    onChange={(e) => setSlot(e.target.value)}
                    min="0"
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="module">Модуль</label>
                  <input
                    type="number"
                    id="module"
                    value={module}
                    onChange={(e) => setModule(e.target.value)}
                    min="0"
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="portNumber">Номер порта</label>
                  <input
                    type="number"
                    id="portNumber"
                    value={portNumber}
                    onChange={(e) => setPortNumber(e.target.value)}
                    min="1"
                  />
                </div>
              </div>
            </>
          )}

          <div className="form-group">
            <label htmlFor="speed">Скорость</label>
            <input
              type="text"
              id="speed"
              value={speed}
              onChange={(e) => setSpeed(e.target.value)}
              placeholder="например, 1Gbps"
            />
          </div>

          <div className="form-group">
            <label htmlFor="mtu">MTU</label>
            <input
              type="number"
              id="mtu"
              value={mtu}
              onChange={(e) => setMtu(e.target.value)}
              min="68"
              max="9000"
            />
          </div>

          <div className="form-group">
            <label htmlFor="macAddress">MAC-адрес</label>
            <input
              type="text"
              id="macAddress"
              value={macAddress}
              onChange={(e) => setMacAddress(e.target.value)}
              placeholder="например, 00:1A:2B:3C:4D:5E"
            />
          </div>

          <div className="form-group">
            <label>
              <input
                type="checkbox"
                checked={enabled}
                onChange={(e) => setEnabled(e.target.checked)}
              />
              Включен
            </label>
          </div>

          <div className="form-group">
            <label htmlFor="vlan">VLAN</label>
            <select
              id="vlan"
              value={vlanId}
              onChange={(e) => setVlanId(e.target.value)}
            >
              <option value="">Выберите VLAN</option>
              {vlanList.map(vlan => (
                <option key={vlan.id} value={vlan.id}>{vlan.name} (VLAN {vlan.vlan_id})</option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label>
              <input
                type="checkbox"
                checked={isTrunk}
                onChange={(e) => setIsTrunk(e.target.checked)}
              />
              Trunk порт
            </label>
          </div>

          {isTrunk && (
            <div className="form-group">
              <label htmlFor="nativeVlan">Native VLAN</label>
              <select
                id="nativeVlan"
                value={nativeVlanId}
                onChange={(e) => setNativeVlanId(e.target.value)}
              >
                <option value="">Выберите Native VLAN</option>
                {vlanList.map(vlan => (
                  <option key={vlan.id} value={vlan.id}>{vlan.name} (VLAN {vlan.vlan_id})</option>
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
    document.body
  );
};

export default InterfaceModal;