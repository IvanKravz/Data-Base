import React, { useState } from 'react';
import { NetworkInterface } from '../../../../../../types';
import { networksApi } from '../../../../../../api/networksApi';
import { Button, Form, Input, Select, Switch, InputNumber, Tag, Modal } from 'antd';
import { Edit, Save, X } from 'lucide-react';

const { Option } = Select;

interface NetworkInterfaceCardProps {
  data: NetworkInterface;
  token: string;
  onUpdate: () => void;
}

export function NetworkInterfaceCard({ data, token, onUpdate }: NetworkInterfaceCardProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);

  const handleSave = async (values: any) => {
    try {
      setLoading(true);
      await networksApi.updateNetworkInterface(token, data.id, values);
      setIsEditing(false);
      onUpdate();
    } catch (error) {
      console.error('Ошибка обновления интерфейса:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    form.resetFields();
    setIsEditing(false);
  };

  const getStatusColor = (enabled: boolean) => enabled ? '#52c41a' : '#ff4d4f';
  const getTypeColor = (type: string) => {
    const colors: { [key: string]: string } = {
      physical: '#1890ff',
      vlan: '#722ed1',
      loopback: '#13c2c2',
      'port-channel': '#fa8c16',
      tunnel: '#fa541c',
      other: '#8c8c8c'
    };
    return colors[type] || '#8c8c8c';
  };

  const formatConnectedTo = (connectedTo: any) => {
    if (!connectedTo) return 'N/A';
    return `${connectedTo.equipment?.name || 'Unknown'} - ${connectedTo.name}`;
  };

  const formatConnectedDevice = (connectedDevice: any) => {
    if (!connectedDevice) return 'N/A';
    return connectedDevice.name;
  };

  return (
    <>
      <div className="net-interface-row">
        <div className="net-table-cell">
          <span className="net-interface-name">{data.name}</span>
        </div>
        
        <div className="net-table-cell">
          <Tag color={getTypeColor(data.interface_type)} style={{ margin: 0 }}>
            {data.interface_type}
          </Tag>
        </div>
        
        <div className="net-table-cell">
          <span className="net-port-number">{data.port_number || 'N/A'}</span>
        </div>
        
        <div className="net-table-cell">
          <span className="net-physical-type">{data.physical_type || 'N/A'}</span>
        </div>
        
        <div className="net-table-cell">
          <Tag color="blue">{data.mode || 'N/A'}</Tag>
        </div>
        
        <div className="net-table-cell">
          <span className="net-mac-address">{data.mac_address || 'N/A'}</span>
        </div>
        
        <div className="net-table-cell">
          <span className="net-mtu-value">{data.mtu}</span>
        </div>
        
        <div className="net-table-cell">
          <span className="net-speed-value">{data.speed || 'N/A'}</span>
        </div>
        
        <div className="net-table-cell">
          <span className="net-access-vlan">{data.access_vlan || 'N/A'}</span>
        </div>
        
        <div className="net-table-cell">
          <span className="net-connected-to">{formatConnectedTo(data.connected_to)}</span>
        </div>
        
        <div className="net-table-cell">
          <span className="net-connected-device">{formatConnectedDevice(data.connected_device)}</span>
        </div>
        
        <div className="net-table-cell">
          <div className="net-status-indicator">
            <div 
              className="net-status-dot" 
              style={{ backgroundColor: getStatusColor(data.enabled) }}
            />
            <span>{data.enabled ? 'Включен' : 'Выключен'}</span>
          </div>
        </div>
        
        <div className="net-table-cell">
          <div className="net-action-buttons">
            <Button 
              size="small" 
              icon={<Edit size={12} />}
              onClick={() => setIsEditing(true)}
            >
              Редакт.
            </Button>
          </div>
        </div>
      </div>

      <Modal
        title={`Редактирование интерфейса: ${data.name}`}
        open={isEditing}
        onCancel={handleCancel}
        footer={null}
        width={500}
      >
        <Form
          form={form}
          initialValues={data}
          onFinish={handleSave}
          layout="vertical"
          size="middle"
        >
          <Form.Item label="Название" name="name" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          
          <Form.Item label="Тип интерфейса" name="interface_type">
            <Select>
              <Option value="physical">Физический порт</Option>
              <Option value="vlan">VLAN Interface</Option>
              <Option value="loopback">Loopback</Option>
              <Option value="port-channel">Port-Channel</Option>
              <Option value="tunnel">Tunnel</Option>
              <Option value="other">Другой</Option>
            </Select>
          </Form.Item>

          <Form.Item label="Тип порта" name="physical_type">
            <Select>
              <Option value="rj45">RJ-45</Option>
              <Option value="sfp">SFP</Option>
              <Option value="sfp+">SFP+</Option>
              <Option value="qsfp">QSFP</Option>
              <Option value="console">Console</Option>
              <Option value="usb">USB</Option>
            </Select>
          </Form.Item>

          <Form.Item label="Номер порта" name="port_number">
            <InputNumber min={1} style={{ width: '100%' }} />
          </Form.Item>

          <Form.Item label="Режим порта" name="mode">
            <Select>
              <Option value="access">Access</Option>
              <Option value="trunk">Trunk</Option>
              <Option value="general">General</Option>
              <Option value="hybrid">Hybrid</Option>
            </Select>
          </Form.Item>

          <Form.Item label="MAC-адрес" name="mac_address">
            <Input placeholder="00:00:00:00:00:00" />
          </Form.Item>

          <Form.Item label="MTU" name="mtu">
            <InputNumber min={68} max={9000} style={{ width: '100%' }} />
          </Form.Item>

          <Form.Item label="Скорость" name="speed">
            <Input placeholder="1000 Mbps" />
          </Form.Item>

          <Form.Item label="Включен" name="enabled" valuePropName="checked">
            <Switch />
          </Form.Item>

          <Form.Item>
            <Button type="primary" htmlType="submit" loading={loading} icon={<Save size={14} />}>
              Сохранить
            </Button>
            <Button onClick={handleCancel} style={{ marginLeft: 8 }} icon={<X size={14} />}>
              Отмена
            </Button>
          </Form.Item>
        </Form>
      </Modal>
    </>
  );
}